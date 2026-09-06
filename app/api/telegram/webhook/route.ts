import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { decryptData, encryptData } from "@/lib/encryption";
import {
  answerPreCheckoutQuery,
  getTelegramWebhookSecret,
  sendTelegramMessage,
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
    // EVENT 3: Text Messages — /start, /start <token>, menu callbacks
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
              `🎉 <b>تم ربط حسابك بنجاح!</b>`,
              ``,
              `مرحباً <b>${fromUser.first_name || "عزيزي العميل"}</b> 👋`,
              `حسابك في <b>متجر EgyCPM</b> مرتبط الآن بتيليجرام وجاهز للدفع بنجوم تيليجرام ⭐`,
              ``,
              `اضغط الزر أدناه للعودة إلى المتجر وإتمام عمليتك:`,
            ].join("\n"),
            parseMode: "HTML",
            replyMarkup: {
              inline_keyboard: [
                [{ text: returnPath === "/checkout" ? "🛒 إتمام الدفع الآن" : "🏠 العودة للمتجر", url: returnUrl }],
                [{ text: "📋 طلباتي", url: `${siteUrl}/orders` }, { text: "👤 ملفي الشخصي", url: `${siteUrl}/profile` }],
              ],
            },
          });
        } else {
          await sendTelegramMessage({
            chatId,
            text: [
              `⚠️ <b>رابط الربط غير صالح أو انتهت مدته (15 دقيقة)</b>`,
              ``,
              `للحصول على رابط جديد، ارجع للمتجر واضغط زر <b>"ربط Telegram"</b> مرة أخرى.`,
            ].join("\n"),
            parseMode: "HTML",
            replyMarkup: {
              inline_keyboard: [[{ text: "🛒 فتح المتجر", url: siteUrl }]],
            },
          });
        }

        return NextResponse.json({ ok: true });
      }

      // ── /start (no token) — Welcome Screen ───────────────────────────────
      if (text === "/start" || text.startsWith("/start ")) {
        // Check if this Telegram user is linked to an EgyCPM account
        const linkedUser = await prisma.user.findUnique({
          where: { telegramUserId: String(fromUser.id) },
          select: { name: true, email: true },
        });

        const greeting = linkedUser
          ? [
              `🏎️ <b>مرحباً مجدداً ${linkedUser.name || fromUser.first_name || "عزيزي العميل"}!</b>`,
              ``,
              `أنت متصل بمتجر <b>EgyCPM</b> بحساب: <code>${linkedUser.email}</code>`,
              `اختر ما تريد من القائمة أدناه:`,
            ].join("\n")
          : [
              `🏎️ <b>مرحباً بك في بوت متجر EgyCPM الرسمي!</b>`,
              ``,
              `المتجر الأول والأكبر لخدمات وتعديل سيارات لعبة <b>Car Parking Multiplayer</b> في مصر والوطن العربي.`,
              ``,
              `🔗 لربط حسابك وتفعيل الدفع بنجوم تيليجرام، اضغط زر <b>"ربط حسابي"</b> من الملف الشخصي في الموقع.`,
            ].join("\n");

        const keyboard = linkedUser
          ? [
              [{ text: "📦 طلباتي", url: `${siteUrl}/orders` }, { text: "👤 حسابي", url: `${siteUrl}/profile` }],
              [{ text: "🛒 المتجر الرئيسي", url: `${siteUrl}/shop` }, { text: "🚗 قسم CPM2", url: `${siteUrl}/cpm2` }],
              [{ text: "💬 الدعم الفني", url: `${siteUrl}/support` }, { text: "🏠 الصفحة الرئيسية", url: siteUrl }],
            ]
          : [
              [{ text: "🛒 تصفح المتجر", url: `${siteUrl}/shop` }, { text: "🚗 قسم CPM2", url: `${siteUrl}/cpm2` }],
              [{ text: "🔗 ربط حسابي الآن", url: `${siteUrl}/profile` }],
              [{ text: "💬 الدعم الفني", url: `${siteUrl}/support` }],
            ];

        await sendTelegramMessage({
          chatId,
          text: greeting,
          parseMode: "HTML",
          replyMarkup: { inline_keyboard: keyboard },
        });

        return NextResponse.json({ ok: true });
      }

      // ── /orders command ───────────────────────────────────────────────────
      if (text === "/orders" || text === "/طلباتي") {
        const linkedUser = await prisma.user.findUnique({
          where: { telegramUserId: String(fromUser.id) },
          select: { name: true, orders: { take: 5, orderBy: { createdAt: "desc" }, select: { orderNumber: true, status: true, createdAt: true } } },
        });

        if (!linkedUser) {
          await sendTelegramMessage({
            chatId,
            text: `⚠️ <b>لم يتم ربط حسابك بعد.</b>\n\nاضغط زر "ربط حسابي" من صفحة الملف الشخصي في الموقع.`,
            parseMode: "HTML",
            replyMarkup: { inline_keyboard: [[{ text: "🔗 ربط حسابي", url: `${siteUrl}/profile` }]] },
          });
        } else if (!linkedUser.orders.length) {
          await sendTelegramMessage({
            chatId,
            text: `📦 <b>لا توجد طلبات بعد.</b>\n\nتصفح المتجر وابدأ أول طلب لك!`,
            parseMode: "HTML",
            replyMarkup: { inline_keyboard: [[{ text: "🛒 تصفح المتجر", url: `${siteUrl}/shop` }]] },
          });
        } else {
          const STATUS_EMOJI: Record<string, string> = {
            PENDING: "⏳", PAID: "✅", PROCESSING: "🔄", IN_PROGRESS: "⚙️",
            COMPLETED: "🎉", CANCELLED: "❌", REJECTED: "🚫", PENDING_PAYMENT: "⭐",
          };
          const lines = linkedUser.orders.map((o) => {
            const emoji = STATUS_EMOJI[o.status] || "📦";
            return `${emoji} <b>#${o.orderNumber}</b> — ${o.status}`;
          });
          await sendTelegramMessage({
            chatId,
            text: [`📦 <b>آخر طلباتك:</b>`, ``, ...lines].join("\n"),
            parseMode: "HTML",
            replyMarkup: { inline_keyboard: [[{ text: "📋 عرض كل الطلبات", url: `${siteUrl}/orders` }]] },
          });
        }

        return NextResponse.json({ ok: true });
      }

      // ── /help command ─────────────────────────────────────────────────────
      if (text === "/help" || text === "/مساعدة") {
        await sendTelegramMessage({
          chatId,
          text: [
            `ℹ️ <b>مساعدة — بوت EgyCPM</b>`,
            ``,
            `الأوامر المتاحة:`,
            `🔹 /start — الصفحة الرئيسية`,
            `🔹 /orders — آخر طلباتك`,
            `🔹 /help — هذه الرسالة`,
            ``,
            `📱 للمزيد من الخيارات استخدم الأزرار التفاعلية أسفل الرسائل.`,
          ].join("\n"),
          parseMode: "HTML",
          replyMarkup: {
            inline_keyboard: [
              [{ text: "🛒 المتجر", url: `${siteUrl}/shop` }, { text: "💬 الدعم", url: `${siteUrl}/support` }],
            ],
          },
        });
        return NextResponse.json({ ok: true });
      }

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Telegram Webhook Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

