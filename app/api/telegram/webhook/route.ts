import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { decryptData, encryptData } from "@/lib/encryption";
import {
  answerPreCheckoutQuery,
  getTelegramWebhookSecret,
  sendTelegramMessage,
  editTelegramMessage,
  answerCallbackQuery,
} from "@/lib/telegram";

export const dynamic = "force-dynamic";

/**
 * Health check & status endpoint for webhook verification
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "EgyCPM Telegram Stars Webhook",
    timestamp: new Date().toISOString(),
  });
}

/**
 * Telegram Bot Webhook Endpoint
 * Handles:
 * 1. Account linking via /start <token>
 * 2. Pre-checkout queries validation (pre_checkout_query)
 * 3. Successful payment processing (successful_payment) with atomic fulfillment
 */
export async function POST(req: Request) {
  try {
    // 1. Verify Secret Token Header (if configured)
    const secretHeader = req.headers.get("x-telegram-bot-api-secret-token");
    const expectedSecret = getTelegramWebhookSecret();

    if (expectedSecret && secretHeader && secretHeader !== expectedSecret) {
      console.warn("⚠️ Unauthorized telegram webhook request: Secret mismatch.");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const update = await req.json();

    // =========================================================================
    // EVENT 1: Pre-Checkout Query (Must be responded to within 10 seconds)
    // =========================================================================
    if (update.pre_checkout_query) {
      const pcq = update.pre_checkout_query;
      const queryId = pcq.id;
      const payload = pcq.invoice_payload || "";
      const currency = pcq.currency;
      const totalAmount = pcq.total_amount;
      const fromId = String(pcq.from.id);

      if (!payload.startsWith("CPM_ORDER_")) {
        await answerPreCheckoutQuery({
          preCheckoutQueryId: queryId,
          ok: false,
          errorMessage: "بيانات الفاتورة غير صالحة.",
        });
        return NextResponse.json({ ok: true });
      }

      const orderId = payload.replace("CPM_ORDER_", "").trim();

      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: { include: { product: true } },
          user: true,
        },
      });

      if (!order) {
        await answerPreCheckoutQuery({
          preCheckoutQueryId: queryId,
          ok: false,
          errorMessage: "لم يتم العثور على الطلب المرتبط بالفاتورة.",
        });
        return NextResponse.json({ ok: true });
      }

      if (order.status !== "PENDING_PAYMENT") {
        await answerPreCheckoutQuery({
          preCheckoutQueryId: queryId,
          ok: false,
          errorMessage: "تمت معالجة هذا الطلب مسبقاً أو تم إلغاؤه.",
        });
        return NextResponse.json({ ok: true });
      }

      // Verify Currency
      if (currency !== "XTR") {
        await answerPreCheckoutQuery({
          preCheckoutQueryId: queryId,
          ok: false,
          errorMessage: "العملة المطلوبة يجب أن تكون نجوم تيليجرام (XTR).",
        });
        return NextResponse.json({ ok: true });
      }

      // Verify Total Amount
      if (order.starsTotal !== totalAmount) {
        await answerPreCheckoutQuery({
          preCheckoutQueryId: queryId,
          ok: false,
          errorMessage: "مبلغ النجوم لا يطابق إجمالي الطلب في النظام.",
        });
        return NextResponse.json({ ok: true });
      }

      // Verify Linked User
      const userTelegramId = order.telegramUserId || order.user.telegramUserId;
      if (userTelegramId && userTelegramId !== fromId) {
        await answerPreCheckoutQuery({
          preCheckoutQueryId: queryId,
          ok: false,
          errorMessage: "حساب تيليجرام الذي يقوم بالدفع لا يطابق الحساب المرتبط بالمشتري.",
        });
        return NextResponse.json({ ok: true });
      }

      // Verify Product Stocks
      for (const item of order.items) {
        if (!item.product.isActive) {
          await answerPreCheckoutQuery({
            preCheckoutQueryId: queryId,
            ok: false,
            errorMessage: `المنتج "${item.name}" لم يعد متاحاً بالمخزون.`,
          });
          return NextResponse.json({ ok: true });
        }
        if (
          (item.product.stockType === "UNIQUE_DIGITAL" || item.product.stockType === "ONE_OF_ONE") &&
          item.product.stockQuantity <= 0
        ) {
          await answerPreCheckoutQuery({
            preCheckoutQueryId: queryId,
            ok: false,
            errorMessage: `عذراً، المنتج "${item.name}" تم شراؤه مسبقاً.`,
          });
          return NextResponse.json({ ok: true });
        }
      }

      // All validations passed!
      await answerPreCheckoutQuery({
        preCheckoutQueryId: queryId,
        ok: true,
      });

      return NextResponse.json({ ok: true });
    }

    // =========================================================================
    // EVENT 2: Successful Payment Handling
    // =========================================================================
    if (update.message?.successful_payment) {
      const sp = update.message.successful_payment;
      const chargeId = sp.telegram_payment_charge_id;
      const payload = sp.invoice_payload || "";
      const starsAmount = sp.total_amount;
      const fromUser = update.message.from;
      const chatId = update.message.chat.id;

      if (!payload.startsWith("CPM_ORDER_")) {
        return NextResponse.json({ ok: true });
      }

      const orderId = payload.replace("CPM_ORDER_", "").trim();

      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: { include: { product: true } },
          user: true,
        },
      });

      if (!order) {
        console.error("Order not found on successful_payment:", orderId);
        return NextResponse.json({ ok: true });
      }

      // Idempotency: Prevent duplicate processing
      if (order.status !== "PENDING_PAYMENT" || order.telegramPaymentChargeId === chargeId) {
        console.log("Order already processed:", order.orderNumber);
        return NextResponse.json({ ok: true });
      }

      // Execute Atomic Fulfillment Transaction
      await prisma.$transaction(async (tx) => {
        let hasGameAccount = false;
        let deliveredAccountEmail: string | null = null;
        let deliveredAccountPasswordEncrypted: string | null = null;
        let deliveredAccountNotes: string | null = null;

        // 1. Decrement Stock and Process Instant Account Delivery
        for (const item of order.items) {
          const prod = await tx.product.findUnique({ where: { id: item.productId } });
          if (!prod) continue;

          const isGameAccount =
            prod.productType === "GAME_ACCOUNT" ||
            prod.productType === "ACCOUNT" ||
            Boolean(prod.accountDetailsEncrypted);

          let newStock = prod.stockQuantity;
          let newActive = prod.isActive;

          if (isGameAccount) {
            hasGameAccount = true;
            newStock = 0;
            newActive = false; // Mark sold out immediately

            if (prod.accountDetailsEncrypted) {
              const decryptedRaw = decryptData(prod.accountDetailsEncrypted);
              if (decryptedRaw) {
                try {
                  const parsed = JSON.parse(decryptedRaw);
                  deliveredAccountEmail = parsed.email || null;
                  deliveredAccountPasswordEncrypted = parsed.password ? encryptData(parsed.password) : null;
                  deliveredAccountNotes = parsed.notes || null;
                } catch {
                  deliveredAccountNotes = decryptedRaw;
                }
              }
            }
          } else if (prod.stockType === "ONE_OF_ONE" || prod.stockType === "UNIQUE_DIGITAL") {
            newStock = 0;
            newActive = false;
          } else if (prod.stockType === "QUANTITY" || prod.stockType === "LIMITED") {
            newStock = Math.max(0, prod.stockQuantity - item.quantity);
            if (newStock === 0) newActive = false;
          }

          await tx.product.update({
            where: { id: prod.id },
            data: {
              stockQuantity: newStock,
              isActive: newActive,
              totalSales: prod.totalSales + item.quantity,
            },
          });
        }

        // 2. Timeline Update
        let timelineArray: any[] = [];
        try {
          timelineArray = JSON.parse(order.timeline || "[]");
        } catch {
          timelineArray = [];
        }

        timelineArray.push({
          status: "PAID",
          title: "تم تأكيد دفع Telegram Stars ⭐",
          description: `تم تأكيد دفع ${starsAmount} نجمة بنجاح (معرف الدفع: ${chargeId})`,
          timestamp: new Date().toISOString(),
        });

        if (hasGameAccount) {
          timelineArray.push({
            status: "COMPLETED",
            title: "تم تسليم بيانات الحساب تلقائياً 🎮",
            description: "تم تسليم بيانات الحساب وإرسالها في إشعار خاص إلى حسابك",
            timestamp: new Date().toISOString(),
          });
        } else {
          timelineArray.push({
            status: "PROCESSING",
            title: "جاري تجهيز الطلب",
            description: "تم تحويل الطلب لفريق العمل للتنفيذ داخل اللعبة",
            timestamp: new Date().toISOString(),
          });
        }

        const finalStatus = hasGameAccount ? "COMPLETED" : "PROCESSING";

        // 3. Update Order
        await tx.order.update({
          where: { id: order.id },
          data: {
            status: finalStatus,
            telegramPaymentChargeId: chargeId,
            telegramUserId: String(fromUser.id),
            deliveredAccountEmail,
            deliveredAccountPasswordEncrypted,
            deliveredAccountNotes,
            timeline: JSON.stringify(timelineArray),
          },
        });

        // 3.5. Record Coupon Usage if coupon was applied
        if (order.couponCode) {
          try {
            const coupon = await tx.coupon.findUnique({ where: { code: order.couponCode } });
            if (coupon) {
              await tx.coupon.update({
                where: { id: coupon.id },
                data: { usedCount: coupon.usedCount + 1 },
              });
              await tx.couponUsage.create({
                data: {
                  couponId: coupon.id,
                  userId: order.userId,
                  orderId: order.id,
                  discountAmount: order.discount,
                },
              });
            }
          } catch (couponErr) {
            console.warn("Failed to record coupon usage on telegram stars order:", couponErr);
          }
        }

        // 4. Create Web Store Notification
        if (hasGameAccount) {
          const decryptedPass = deliveredAccountPasswordEncrypted
            ? decryptData(deliveredAccountPasswordEncrypted)
            : "";
          const notificationMsg = `🎉 مبروك! تم شراء الحساب بنجاح ودفع ${starsAmount} نجمة تيليجرام ⭐ (طلب #${order.orderNumber}).\n\n📧 البريد / اسم المستخدم: ${deliveredAccountEmail || "موضح في تفاصيل الطلب"}\n🔑 كلمة المرور: ${decryptedPass || "لا توجد"}\n${deliveredAccountNotes ? `📝 ملاحظات: ${deliveredAccountNotes}\n` : ""}\nبياناتك محفوظة وآمنة، ويمكنك مراجعتها في أي وقت.`;

          await tx.notification.create({
            data: {
              userId: order.userId,
              title: "🎮 تم استلام بيانات حسابك بنجاح!",
              message: notificationMsg,
              type: "CREDENTIALS_DELIVERED",
              link: `/orders/${order.orderNumber}`,
            },
          });
        } else {
          await tx.notification.create({
            data: {
              userId: order.userId,
              title: "تم دفع وتأكيد طلبك بنجوم تيليجرام ⭐",
              message: `تم تأكيد طلبك رقم ${order.orderNumber} بمبلغ ${starsAmount} نجمة وجاري تنفيذه فوراً.`,
              type: "ORDER_STATUS",
              link: `/orders/${order.orderNumber}`,
            },
          });
        }
      });

      // 5. Send Direct Confirmation on Telegram to the User
      const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://egycpm.vercel.app").replace(/\/$/, "");
      const orderLink = `${siteUrl}/orders/${order.orderNumber}`;

      const telegramMsg = `✅ <b>تم استلام وتأكيد دفعتك بنجاح!</b> ⭐\n\n📦 <b>رقم الطلب:</b> #${order.orderNumber}\n⭐ <b>المبلغ المدفوع:</b> ${starsAmount} Telegram Stars\n\nشكراً لتسوقك من <b>EgyCPM</b>! 🏎️\nاضغط على الزر أدناه لمشاهدة تفاصيل طلبك واستلام حسابك أو بيانات التنفيذ:`;

      await sendTelegramMessage({
        chatId,
        text: telegramMsg,
        parseMode: "HTML",
        replyMarkup: {
          inline_keyboard: [
            [
              {
                text: "📋 عرض تفاصيل الطلب واستلام الحساب 🚀",
                url: orderLink,
              },
            ],
            [
              {
                text: "🛒 العودة إلى المتجر",
                url: siteUrl,
              },
            ],
          ],
        },
      });

      return NextResponse.json({ ok: true });
    }

    // =========================================================================
    // EVENT 3: Callback Queries (Interactive button navigation without chat clutter)
    // =========================================================================
    if (update.callback_query) {
      const cq = update.callback_query;
      const callbackId = cq.id;
      const data = cq.data || "";
      const message = cq.message;
      const fromUser = cq.from;
      const chatId = message?.chat?.id || fromUser.id;
      const messageId = message?.message_id;
      const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://egycpm.vercel.app").replace(/\/$/, "");

      // Immediately answer callback query to remove Telegram loading spinner
      await answerCallbackQuery({ callbackQueryId: callbackId });

      const user = await getTelegramUserWithDetails(String(fromUser.id));

      let view: { text: string; keyboard: any[][] } | null = null;

      if (data === "menu_main") {
        view = buildMainMenu(user, fromUser, siteUrl);
      } else if (data === "menu_balance") {
        view = buildBalanceMenu(user, siteUrl);
      } else if (data === "menu_orders") {
        view = buildOrdersMenu(user, siteUrl);
      } else if (data === "menu_account") {
        view = buildAccountMenu(user, fromUser, siteUrl);
      } else if (data === "menu_support") {
        view = buildSupportMenu(siteUrl);
      }

      if (view && messageId) {
        await editTelegramMessage({
          chatId,
          messageId,
          text: view.text,
          parseMode: "HTML",
          replyMarkup: { inline_keyboard: view.keyboard },
        });
      }

      return NextResponse.json({ ok: true });
    }

    // =========================================================================
    // EVENT 4: Text Messages — /start, /start <token>, commands
    // =========================================================================
    if (update.message?.text) {
      const text = update.message.text.trim();
      const chatId = update.message.chat.id;
      const fromUser = update.message.from;
      const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://egycpm.vercel.app").replace(/\/$/, "");

      // ── /start <cpm_token> — Account Linking ──────────────────────────────
      if (text.startsWith("/start cpm_") || /^\/start\s+cpm_/i.test(text)) {
        const rawToken = text.replace(/^\/start\s+/i, "").trim();

        // Extract optional return destination embedded in token as suffix __ret_<slug>
        // e.g. cpm_abc123__ret_checkout  → baseToken = cpm_abc123, returnSlug = checkout
        let baseToken = rawToken;
        let returnPath = "/checkout"; // default
        const retSep = rawToken.indexOf("__ret_");
        if (retSep !== -1) {
          baseToken = rawToken.slice(0, retSep);
          const slug = rawToken.slice(retSep + 6).toLowerCase();
          // Whitelist: only known safe paths
          const ALLOWED_RETURNS: Record<string, string> = {
            checkout: "/checkout",
            profile:  "/profile",
            orders:   "/orders",
          };
          returnPath = ALLOWED_RETURNS[slug] ?? "/checkout";
        }

        const now = new Date();
        const userToLink = await prisma.user.findFirst({
          where: {
            OR: [
              { telegramLinkToken: rawToken },
              { telegramLinkToken: baseToken },
            ],
            telegramLinkExpires: { gt: now },
          },
        });

        if (userToLink) {
          // Ensure uniqueness: unlink from any previous account
          const existingTgUser = await prisma.user.findUnique({
            where: { telegramUserId: String(fromUser.id) },
          });
          if (existingTgUser && existingTgUser.id !== userToLink.id) {
            await prisma.user.update({
              where: { id: existingTgUser.id },
              data: { telegramUserId: null, telegramUsername: null },
            });
          }

          await prisma.user.update({
            where: { id: userToLink.id },
            data: {
              telegramUserId: String(fromUser.id),
              telegramUsername: fromUser.username ? `@${fromUser.username}` : null,
              telegramLinkToken: null,
              telegramLinkExpires: null,
            },
          });

          const returnUrl = `${siteUrl}${returnPath}`;

          await sendTelegramMessage({
            chatId,
            text: [
              `🎉 <b>تم ربط وتوثيق حسابك بنجاح!</b> 🏎️`,
              ``,
              `مرحباً بك <b>${fromUser.first_name || "عزيزي العميل"}</b> 👋`,
              `حسابك في <b>متجر EgyCPM</b> مرتبط الآن بحساب تيليجرام وجاهز للشراء والدفع بنجوم تيليجرام ⭐ واستلام الإشعارات.`,
              ``,
              `اضغط الزر أدناه للعودة إلى المتجر ومتابعة طلبك:`,
            ].join("\n"),
            parseMode: "HTML",
            replyMarkup: {
              inline_keyboard: [
                [{ text: returnPath === "/checkout" ? "🛒 إتمام عملية الدفع الآن" : "🏠 العودة إلى المتجر", url: returnUrl }],
                [
                  { text: "📦 طلباتي", callback_data: "menu_orders" },
                  { text: "💰 رصيدي", callback_data: "menu_balance" },
                ],
                [{ text: "🏠 القائمة الرئيسية للبوت", callback_data: "menu_main" }],
              ],
            },
          });
        } else {
          await sendTelegramMessage({
            chatId,
            text: [
              `⚠️ <b>رابط الربط غير صالح أو انتهت مدته (15 دقيقة)</b>`,
              ``,
              `للحصول على رابط جديد، يرجى العودة للمتجر والضغط على زر <b>"ربط Telegram"</b> مرة أخرى.`,
            ].join("\n"),
            parseMode: "HTML",
            replyMarkup: {
              inline_keyboard: [[{ text: "🛒 فتح المتجر", url: siteUrl }]],
            },
          });
        }

        return NextResponse.json({ ok: true });
      }

      // Fetch user details for text commands
      const user = await getTelegramUserWithDetails(String(fromUser.id));

      // ── /start or /menu — Welcome & Main Menu ─────────────────────────────
      if (text === "/start" || text.startsWith("/start ") || text === "/menu" || text === "/القائمة") {
        const view = buildMainMenu(user, fromUser, siteUrl);
        await sendTelegramMessage({
          chatId,
          text: view.text,
          parseMode: "HTML",
          replyMarkup: { inline_keyboard: view.keyboard },
        });
        return NextResponse.json({ ok: true });
      }

      // ── /balance or /رصيدي ────────────────────────────────────────────────
      if (text === "/balance" || text === "/رصيدي" || text === "/المحفظة") {
        const view = buildBalanceMenu(user, siteUrl);
        await sendTelegramMessage({
          chatId,
          text: view.text,
          parseMode: "HTML",
          replyMarkup: { inline_keyboard: view.keyboard },
        });
        return NextResponse.json({ ok: true });
      }

      // ── /orders or /طلباتي ────────────────────────────────────────────────
      if (text === "/orders" || text === "/طلباتي") {
        const view = buildOrdersMenu(user, siteUrl);
        await sendTelegramMessage({
          chatId,
          text: view.text,
          parseMode: "HTML",
          replyMarkup: { inline_keyboard: view.keyboard },
        });
        return NextResponse.json({ ok: true });
      }

      // ── /account or /حسابي ────────────────────────────────────────────────
      if (text === "/account" || text === "/حسابي" || text === "/الربط") {
        const view = buildAccountMenu(user, fromUser, siteUrl);
        await sendTelegramMessage({
          chatId,
          text: view.text,
          parseMode: "HTML",
          replyMarkup: { inline_keyboard: view.keyboard },
        });
        return NextResponse.json({ ok: true });
      }

      // ── /support or /help or /مساعدة ──────────────────────────────────────
      if (text === "/support" || text === "/help" || text === "/مساعدة" || text === "/الدعم") {
        const view = buildSupportMenu(siteUrl);
        await sendTelegramMessage({
          chatId,
          text: view.text,
          parseMode: "HTML",
          replyMarkup: { inline_keyboard: view.keyboard },
        });
        return NextResponse.json({ ok: true });
      }

      // Fallback: Show Main Menu
      const defaultView = buildMainMenu(user, fromUser, siteUrl);
      await sendTelegramMessage({
        chatId,
        text: defaultView.text,
        parseMode: "HTML",
        replyMarkup: { inline_keyboard: defaultView.keyboard },
      });

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Telegram Webhook Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Bot UI Builders & Helpers (EgyCPM Brand Theme & Experience)
// ─────────────────────────────────────────────────────────────────────────────

async function getTelegramUserWithDetails(telegramUserId: string) {
  return await prisma.user.findUnique({
    where: { telegramUserId },
    include: {
      wallet: true,
      orders: {
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { items: true },
      },
      _count: {
        select: { orders: true },
      },
    },
  });
}

function buildMainMenu(user: any, fromUser: any, siteUrl: string) {
  if (user) {
    const totalBal = ((user.wallet?.balance || 0) + (user.wallet?.giftBalance || 0)).toLocaleString();
    const ordersCount = user._count?.orders || user.orders?.length || 0;
    const text = [
      `🏎️ <b>متجر EgyCPM | Car Parking Multiplayer</b> ⚡`,
      `<i>البوت الرسمي المعتمد للمتجر الأول في الوطن العربي</i>`,
      ``,
      `👋 مرحباً بك يا كابتن <b>${user.name || fromUser.first_name || ""}</b>`,
      `🟢 <b>حالة الحساب:</b> مرتبط وموثق بنجاح`,
      `📧 <b>البريد:</b> <code>${user.email}</code>`,
      `💰 <b>الرصيد المتاح:</b> <b>${totalBal} ج.م</b>`,
      `📦 <b>عدد طلباتك:</b> ${ordersCount} طلب`,
      ``,
      `اختر من القائمة التفاعلية أدناه للتحكم السريع:`,
    ].join("\n");

    const keyboard = [
      [
        { text: "🛒 فتح المتجر", url: `${siteUrl}/shop` },
        { text: "🚗 قسم CPM2", url: `${siteUrl}/cpm2` },
      ],
      [
        { text: "📦 طلباتي الأخيرة", callback_data: "menu_orders" },
        { text: "💰 رصيدي ومحفظتي", callback_data: "menu_balance" },
      ],
      [
        { text: "🔗 إدارة الربط والحساب", callback_data: "menu_account" },
        { text: "💬 الدعم الفني", callback_data: "menu_support" },
      ],
    ];

    return { text, keyboard };
  }

  const text = [
    `🏎️ <b>أهلاً بك في بوت متجر EgyCPM الرسمي!</b> ⚡`,
    `<i>المتجر الأول المتخصص في سيارات وخدمات Car Parking Multiplayer</i>`,
    ``,
    `👋 مرحباً بك <b>${fromUser.first_name || "يا كابتن"}</b>`,
    `🔴 <b>حالة الحساب:</b> غير مرتبط بحسابك في المتجر`,
    ``,
    `💡 <b>اربط حسابك الآن لتتمكن من:</b>`,
    `• متابعة رصيد محفظتك وشحنها بضغطة زر`,
    `• تتبع طلباتك واستلام بيانات الحسابات فورياً`,
    `• الدفع المباشر بنجوم تيليجرام (Telegram Stars ⭐)`,
  ].join("\n");

  const keyboard = [
    [
      { text: "🛒 تصفح المتجر", url: `${siteUrl}/shop` },
      { text: "🚗 قسم CPM2", url: `${siteUrl}/cpm2` },
    ],
    [
      { text: "🔗 ربط حسابي بالمتجر الآن", url: `${siteUrl}/profile` },
    ],
    [
      { text: "💬 الدعم الفني والمساعدة", callback_data: "menu_support" },
    ],
  ];

  return { text, keyboard };
}

function buildBalanceMenu(user: any, siteUrl: string) {
  if (user) {
    const bal = (user.wallet?.balance || 0).toLocaleString();
    const gift = (user.wallet?.giftBalance || 0).toLocaleString();
    const total = ((user.wallet?.balance || 0) + (user.wallet?.giftBalance || 0)).toLocaleString();

    const text = [
      `💰 <b>محفظتك المالية في متجر EgyCPM</b> 🏎️`,
      ``,
      `💳 <b>الرصيد الأساسي:</b> ${bal} ج.م`,
      `🎁 <b>رصيد الهدايا والمكافآت:</b> ${gift} ج.م`,
      `💎 <b>الإجمالي الكلي القابل للاستخدام:</b> <b>${total} ج.م</b>`,
      ``,
      `⭐ <b>دفع نجوم تيليجرام:</b> مفعل ومتاح لحسابك مباشرة أثناء إتمام الشراء!`,
      ``,
      `💡 <i>يمكنك شحن رصيدك عبر فودافون كاش، إنستاباي، أو المحافظ الإلكترونية واستخدامه في الشراء الفوري داخل المتجر.</i>`,
    ].join("\n");

    const keyboard = [
      [
        { text: "➕ شحن رصيد الآن", url: `${siteUrl}/deposit` },
        { text: "🛒 تسوق الآن", url: `${siteUrl}/shop` },
      ],
      [
        { text: "🔄 تحديث الرصيد", callback_data: "menu_balance" },
        { text: "🔙 القائمة الرئيسية", callback_data: "menu_main" },
      ],
    ];

    return { text, keyboard };
  }

  const text = [
    `💰 <b>محفظة متجر EgyCPM</b>`,
    ``,
    `⚠️ <b>حساب تيليجرام غير مرتبط</b>`,
    `اربط حسابك في المتجر لتتمكن من فحص رصيد محفظتك، شحنه، ومتابعة العمليات المالية.`,
  ].join("\n");

  const keyboard = [
    [{ text: "🔗 ربط حسابي الآن", url: `${siteUrl}/profile` }],
    [{ text: "🔙 القائمة الرئيسية", callback_data: "menu_main" }],
  ];

  return { text, keyboard };
}

function buildOrdersMenu(user: any, siteUrl: string) {
  if (user) {
    const orders = user.orders || [];
    if (orders.length === 0) {
      const text = [
        `📦 <b>سجل طلباتك في EgyCPM</b>`,
        ``,
        `لا توجد لديك طلبات سابقة حتى الآن!`,
        `تصفح أحدث سيارات وخدمات Car Parking واستمتع بأفضل الأسعار.`,
      ].join("\n");

      const keyboard = [
        [{ text: "🛒 تصفح المتجر واطلب الآن", url: `${siteUrl}/shop` }],
        [{ text: "🔙 القائمة الرئيسية", callback_data: "menu_main" }],
      ];

      return { text, keyboard };
    }

    const STATUS_MAP: Record<string, { label: string; emoji: string }> = {
      PENDING: { label: "بانتظار المراجعة", emoji: "⏳" },
      PAID: { label: "مدفوع", emoji: "✅" },
      PROCESSING: { label: "جاري التجهيز", emoji: "🔄" },
      IN_PROGRESS: { label: "قيد التنفيذ باللعبة", emoji: "⚙️" },
      COMPLETED: { label: "مكتمل وتم التسليم", emoji: "🎉" },
      CANCELLED: { label: "ملغي", emoji: "❌" },
      REJECTED: { label: "مرفوض", emoji: "🚫" },
      REFUNDED: { label: "مسترجع", emoji: "💸" },
      PENDING_PAYMENT: { label: "بانتظار دفع النجوم", emoji: "⭐" },
    };

    const orderLines = orders.map((o: any, idx: number) => {
      const st = STATUS_MAP[o.status] || { label: o.status, emoji: "📦" };
      const amount = o.starsTotal ? `${o.starsTotal} ⭐` : `${o.total} ج.م`;
      const itemsList = (o.items || []).map((i: any) => i.name).slice(0, 2).join(" + ") +
        ((o.items || []).length > 2 ? ` (+${(o.items || []).length - 2})` : "");

      return [
        `<b>${idx + 1}. طلب #${o.orderNumber}</b> ${st.emoji}`,
        `   🔹 الحالة: <b>${st.label}</b>`,
        `   💵 الإجمالي: ${amount}`,
        itemsList ? `   🚗 العناصر: ${itemsList}` : null,
        `   🔗 <a href="${siteUrl}/orders/${o.orderNumber}">تفاصيل الطلب والتسليم</a>`,
      ].filter(Boolean).join("\n");
    }).join("\n\n");

    const text = [
      `📦 <b>سجل طلباتك الأخيرة (${orders.length})</b> 🏎️`,
      ``,
      orderLines,
    ].join("\n");

    const keyboard = [
      [{ text: "📋 عرض جميع الطلبات في الموقع", url: `${siteUrl}/orders` }],
      [
        { text: "🔄 تحديث الطلبات", callback_data: "menu_orders" },
        { text: "🛒 طلب جديد", url: `${siteUrl}/shop` },
      ],
      [{ text: "🔙 القائمة الرئيسية", callback_data: "menu_main" }],
    ];

    return { text, keyboard };
  }

  const text = [
    `📦 <b>طلباتك في متجر EgyCPM</b>`,
    ``,
    `⚠️ <b>لم يتم ربط حسابك بعد</b>`,
    `يرجى ربط حساب تيليجرام بحسابك في المتجر لتتمكن من متابعة حالة طلباتك واستلام بيانات التسليم فوراً.`,
  ].join("\n");

  const keyboard = [
    [{ text: "🔗 ربط حسابي الآن", url: `${siteUrl}/profile` }],
    [{ text: "🔙 القائمة الرئيسية", callback_data: "menu_main" }],
  ];

  return { text, keyboard };
}

function buildAccountMenu(user: any, fromUser: any, siteUrl: string) {
  if (user) {
    const joinDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString("ar-EG") : "";
    const text = [
      `👤 <b>معلومات حسابك المرتبط في EgyCPM</b> 🟢`,
      ``,
      `✅ <b>حالة الحساب:</b> موثق ومتصل بالمتجر`,
      `👤 <b>الاسم:</b> ${user.name}`,
      `📧 <b>البريد الإلكتروني:</b> <code>${user.email}</code>`,
      `🆔 <b>معرف Telegram:</b> <code>${fromUser.id}</code>`,
      `📱 <b>اسم المستخدم:</b> ${fromUser.username ? `@${fromUser.username}` : "لا يوجد"}`,
      joinDate ? `📅 <b>تاريخ الانضمام:</b> ${joinDate}` : "",
      ``,
      `⭐ <i>حسابك جاهز لاستلام الإشعارات التلقائية الفورية والدفع بنجوم تيليجرام.</i>`,
    ].filter(Boolean).join("\n");

    const keyboard = [
      [{ text: "⚙️ فتح الملف الشخصي بالموقع", url: `${siteUrl}/profile` }],
      [{ text: "🔙 القائمة الرئيسية", callback_data: "menu_main" }],
    ];

    return { text, keyboard };
  }

  const text = [
    `🔗 <b>ربط حساب Telegram بمتجر EgyCPM</b> 🔴`,
    ``,
    `حسابك غير مرتبط حالياً.`,
    ``,
    `<b>خطوات الربط في ثوانٍ معدودة:</b>`,
    `1️⃣ افتح موقع المتجر وسجل دخولك`,
    `2️⃣ توجه إلى صفحة <b>الملف الشخصي</b> أو صفحة <b>إتمام الدفع</b>`,
    `3️⃣ اضغط زر <b>"ربط Telegram"</b> وسيتم ربط وتوثيق حسابك تلقائياً!`,
  ].join("\n");

  const keyboard = [
    [{ text: "🔗 الذهاب لصفحة الربط بالمتجر", url: `${siteUrl}/profile` }],
    [{ text: "🔙 القائمة الرئيسية", callback_data: "menu_main" }],
  ];

  return { text, keyboard };
}

function buildSupportMenu(siteUrl: string) {
  const text = [
    `💬 <b>مركز الدعم الفني والمساعدة | EgyCPM</b> 🏎️`,
    ``,
    `فريق دعم EgyCPM متواجد لخدمتك ومساعدتك في:`,
    `• تجهيز وتسليم سيارات وحسابات CPM`,
    `• مشاكل شحن الرصيد والدفع بالنجوم`,
    `• الاستفسارات العامة وطلبات التعديل الخاصة`,
    ``,
    `⚡ <b>سرعة الرد:</b> خلال دقائق معدودة`,
    `⏰ <b>التواجد:</b> على مدار الساعة لخدمتكم`,
  ].join("\n");

  const keyboard = [
    [
      { text: "🎫 فتح تذكرة دعم فني", url: `${siteUrl}/support` },
      { text: "❓ الأسئلة الشائعة (FAQ)", url: `${siteUrl}/faq` },
    ],
    [
      { text: "🛒 تصفح المتجر", url: `${siteUrl}/shop` },
      { text: "🔙 القائمة الرئيسية", callback_data: "menu_main" },
    ],
  ];

  return { text, keyboard };
}


