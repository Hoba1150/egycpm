"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireAdminRole } from "@/lib/auth";
import { generateOrderNumber } from "@/lib/utils";
import { encryptData, decryptData } from "@/lib/encryption";
import { getTelegramBotUsername, sendOrderNotification, sendTelegramMessage } from "@/lib/telegram";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

/**
 * 1. Generate One-Time Telegram Account Linking Deep Link
 * @param returnSlug - optional: "checkout" | "profile" | "orders" — embedded safely in token
 */
export async function generateTelegramLinkToken(returnSlug?: string) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("يجب تسجيل الدخول أولاً لربط حساب Telegram.");
  }

  const baseToken = `cpm_${crypto.randomBytes(12).toString("hex")}`;
  // Embed return slug in token string so webhook can whitelist-validate it
  const ALLOWED_SLUGS = ["checkout", "profile", "orders"];
  const safeSlug = returnSlug && ALLOWED_SLUGS.includes(returnSlug) ? returnSlug : null;
  const token = safeSlug ? `${baseToken}__ret_${safeSlug}` : baseToken;

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes validity

  await prisma.user.update({
    where: { id: user.id },
    data: {
      telegramLinkToken: token,
      telegramLinkExpires: expiresAt,
    },
  });

  const botUsername = getTelegramBotUsername();
  const link = `https://t.me/${botUsername}?start=${token}`;

  return {
    success: true,
    link,
    token,
    expiresAt,
  };
}


/**
 * 2. Get Telegram Account Linking Status for Current User
 */
export async function getTelegramAccountStatus() {
  const user = await getCurrentUser();
  if (!user) {
    return { isLinked: false, telegramUserId: null, telegramUsername: null };
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      telegramUserId: true,
      telegramUsername: true,
    },
  });

  return {
    isLinked: Boolean(dbUser?.telegramUserId),
    telegramUserId: dbUser?.telegramUserId || null,
    telegramUsername: dbUser?.telegramUsername || null,
  };
}

/**
 * 3. Unlink Telegram Account
 */
export async function unlinkTelegramAccount() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("يجب تسجيل الدخول.");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      telegramUserId: null,
      telegramUsername: null,
      telegramLinkToken: null,
      telegramLinkExpires: null,
    },
  });

  revalidatePath("/profile");
  revalidatePath("/checkout");
  return { success: true };
}

interface CreateStarsOrderInput {
  items: { productId: string; quantity: number }[];
  couponCode?: string | null;
  fulfillmentType?: string | null;
  gameUsername?: string | null;
  gamePassword?: string | null;
  gamePlayerId?: string | null;
  customerNotes?: string | null;
  customerTelegramUsername?: string | null;
  screenshotUrl?: string | null;
}

/**
 * 4. Create Order for Direct Telegram Stars / Gift Payment
 * Creates the order in PENDING_PAYMENT status awaiting Admin manual verification.
 * Zero-trust: No automated fulfillment occurs until Admin verifies the stars in Telegram.
 */
export async function createTelegramStarsOrder(input: CreateStarsOrderInput) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("يجب تسجيل الدخول لإتمام عملية الشراء.");
  }

  if (!input.items || input.items.length === 0) {
    throw new Error("سلة الشراء فارغة.");
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, telegramUserId: true, telegramUsername: true, name: true, email: true },
  });

  // 1. Fetch fresh products from database (Zero client trust)
  const productIds = input.items.map((i) => i.productId);
  const dbProducts = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true },
  });

  if (dbProducts.length !== input.items.length) {
    throw new Error("بعض المنتجات المطلوبة غير متوفرة أو تم إيقافها.");
  }

  // Check stock & calculate subtotal and starsTotal
  let subtotal = 0;
  let starsTotal = 0;
  const orderItemsData: any[] = [];

  for (const item of input.items) {
    const prod = dbProducts.find((p) => p.id === item.productId);
    if (!prod) throw new Error("منتج غير صالح.");

    // Check unique digital stock
    if (prod.stockType === "UNIQUE_DIGITAL" && prod.stockQuantity <= 0) {
      throw new Error(`المنتج "${prod.name}" تم بيعه بالفعل وغير متوفر.`);
    }

    if (prod.stockType === "QUANTITY" && prod.stockQuantity < item.quantity) {
      throw new Error(`الكمية المطلوبة من "${prod.name}" غير متوفرة بالمخزون.`);
    }

    const itemTotal = prod.price * item.quantity;
    subtotal += itemTotal;

    // Strict Server-Side Validation: Product MUST have an explicit, valid starsPrice > 0 in PostgreSQL
    if (!prod.starsPrice || prod.starsPrice <= 0) {
      throw new Error(`عذراً، المنتج "${prod.name}" غير متاح للشراء عبر نجوم تيليجرام (Telegram Stars).`);
    }

    const unitStars = Math.floor(prod.starsPrice);
    starsTotal += unitStars * item.quantity;

    orderItemsData.push({
      productId: prod.id,
      name: prod.name,
      price: prod.price,
      quantity: item.quantity,
      productType: prod.productType,
      productName: prod.name,
      productPrice: prod.price,
      total: itemTotal,
      serviceRequirements: prod.serviceRequirements || null,
      deliveredDataEncrypted: prod.accountDetailsEncrypted || null,
    });
  }

  if (starsTotal <= 0) {
    throw new Error("إجمالي النجوم غير صالح.");
  }

  // 2. Validate Coupon if provided
  let discount = 0;
  let starsDiscount = 0;
  let validatedCoupon: any = null;

  if (input.couponCode && input.couponCode.trim()) {
    const code = input.couponCode.trim().toUpperCase();
    const coupon = await prisma.coupon.findUnique({
      where: { code, isActive: true },
    });

    if (coupon) {
      const now = new Date();
      const isExpired = coupon.expiresAt && coupon.expiresAt < now;
      const isMaxed = coupon.maxUses && coupon.usedCount >= coupon.maxUses;
      const meetsMin = !coupon.minOrderValue || subtotal >= coupon.minOrderValue;
      const meetsStarsMin = !coupon.starsMinOrderValue || starsTotal >= coupon.starsMinOrderValue;

      if (!isExpired && !isMaxed && meetsMin && meetsStarsMin) {
        const starsType = coupon.starsDiscountType || coupon.discountType;
        if (coupon.starsDiscountValue !== null && coupon.starsDiscountValue !== undefined && coupon.starsDiscountValue > 0) {
          if (starsType === "PERCENTAGE") {
            let sd = (starsTotal * coupon.starsDiscountValue) / 100;
            if (coupon.starsMaxDiscount && sd > coupon.starsMaxDiscount) sd = coupon.starsMaxDiscount;
            starsDiscount = Math.floor(sd);
          } else {
            starsDiscount = Math.min(Math.floor(coupon.starsDiscountValue), starsTotal);
          }
        } else {
          if (coupon.discountType === "PERCENTAGE") {
            starsDiscount = Math.floor((starsTotal * coupon.discountValue) / 100);
          } else {
            const ratio = subtotal > 0 ? Math.min(coupon.discountValue / subtotal, 1) : 0;
            starsDiscount = Math.floor(starsTotal * ratio);
          }
        }
        validatedCoupon = coupon;
      }
    }
  }

  const finalStarsTotal = Math.max(1, starsTotal - starsDiscount);
  const orderNumber = generateOrderNumber();
  const encryptedPassword = input.gamePassword ? encryptData(input.gamePassword) : null;

  const hasGameAccount = dbProducts.some(
    (p) => p.productType === "GAME_ACCOUNT" || p.productType === "ACCOUNT" || Boolean(p.accountDetailsEncrypted)
  );

  const customerTg = input.customerTelegramUsername?.trim() || dbUser?.telegramUsername || null;

  const initialTimeline = JSON.stringify([
    {
      status: "PENDING_PAYMENT",
      title: "تم إنشاء الطلب بانتظار إرسال النجوم ⭐",
      description: `بانتظار إرسال ${finalStarsTotal} نجمة كـ هدية/تحويل لحساب الإدارة${customerTg ? ` من حساب: @${customerTg.replace("@", "")}` : ""}${starsDiscount > 0 ? ` (تم تطبيق خصم ${starsDiscount} ⭐)` : ""}`,
      timestamp: new Date().toISOString(),
      ...(input.screenshotUrl ? { screenshotUrl: input.screenshotUrl } : {}),
    },
  ]);

  let formattedNotes = input.customerNotes || "";
  if (customerTg) {
    formattedNotes = formattedNotes
      ? `حساب تيليجرام: @${customerTg.replace("@", "")} | ${formattedNotes}`
      : `حساب تيليجرام: @${customerTg.replace("@", "")}`;
  }
  if (input.screenshotUrl) {
    formattedNotes = formattedNotes
      ? `${formattedNotes}\n[رابط سكرين شوت التحويل: ${input.screenshotUrl}]`
      : `[رابط سكرين شوت التحويل: ${input.screenshotUrl}]`;
  }

  // 3. Create Order in DB in PENDING_PAYMENT status
  const order = await prisma.order.create({
    data: {
      orderNumber,
      userId: user.id,
      subtotal,
      discount: starsDiscount,
      total: subtotal,
      starsTotal: finalStarsTotal,
      couponCode: validatedCoupon?.code || null,
      status: "PENDING_PAYMENT",
      paymentMethod: "TELEGRAM_STARS",
      telegramUserId: dbUser?.telegramUserId || null,
      fulfillmentType: hasGameAccount ? "INSTANT_GAME_ACCOUNT" : (input.fulfillmentType || "EXISTING_ACCOUNT"),
      gameUsername: input.gameUsername || null,
      gamePasswordEncrypted: encryptedPassword,
      gamePlayerId: input.gamePlayerId || null,
      customerNotes: formattedNotes || null,
      notes: input.screenshotUrl ? `SCREENSHOT:${input.screenshotUrl}` : null,
      timeline: initialTimeline,
      items: {
        create: orderItemsData,
      },
    },
    include: {
      items: true,
    },
  });

  if (customerTg && !dbUser?.telegramUsername) {
    await prisma.user.update({
      where: { id: user.id },
      data: { telegramUsername: customerTg.replace("@", "").trim() },
    }).catch(() => {});
  }

  const itemsListFormatted = dbProducts
    .map((p) => {
      const it = input.items.find((i) => i.productId === p.id);
      const qty = it ? it.quantity : 1;
      const stars = Math.floor(p.starsPrice || 0) * qty;
      return `• <b>${p.name}</b> (x${qty}) - ${stars} ⭐`;
    })
    .join("\n");

  if (dbUser?.telegramUserId) {
    sendOrderNotification({
      telegramUserId: dbUser.telegramUserId,
      orderNumber: order.orderNumber,
      status: "PENDING_PAYMENT",
      amount: finalStarsTotal,
      starsTotal: finalStarsTotal,
      paymentMethod: "⭐ نجوم تيليجرام (إرسال هدية)",
      productsList: itemsListFormatted,
      gameUsername: input.gameUsername || undefined,
      isAdmin: false,
      extraLines: [
        `⭐ <b>المطلوب إرساله:</b> ${finalStarsTotal} نجمة تيليجرام كهدية`,
        `👤 <b>حساب المشتري:</b> ${customerTg ? `@${customerTg.replace("@", "")}` : "غير محدد"}`,
        `⏳ بانتظار مراجعة وتأكيد الإدارة`,
      ],
    }).catch(() => {});
  }

  revalidatePath("/orders");
  revalidatePath("/admin/orders");

  return {
    success: true,
    orderNumber: order.orderNumber,
    orderId: order.id,
    starsTotal: finalStarsTotal,
  };
}

/**
 * 5. Admin: Confirm Manual Telegram Stars Payment
 * Only Admin can execute this after manually checking their personal Telegram account.
 */
export async function confirmTelegramStarsPayment(orderId: string, adminNotes?: string) {
  const admin = await requireAdminRole(["SUPER_ADMIN", "ADMIN", "ORDER_MANAGER"]);

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: { include: { product: true } },
      user: true,
    },
  });

  if (!order) {
    throw new Error("لم يتم العثور على الطلب.");
  }

  if (order.status !== "PENDING_PAYMENT") {
    throw new Error("هذا الطلب ليس في حالة انتظار دفع النجوم.");
  }

  let timelineArr: any[] = [];
  try {
    timelineArr = JSON.parse(order.timeline || "[]");
  } catch {
    timelineArr = [];
  }

  timelineArr.push({
    status: "PROCESSING",
    title: "تم تأكيد استلام النجوم من الإدارة ✅",
    description: `قام المشرف (${admin.email}) بتأكيد استلام ${order.starsTotal || 0} ⭐ في حساب تيليجرام وبدء التجهيز.`,
    timestamp: new Date().toISOString(),
  });

  let finalStatus = "PROCESSING";
  let deliveredEmail: string | null = null;
  let deliveredPassEncrypted: string | null = null;
  let deliveredNotes: string | null = null;

  for (const it of order.items) {
    if (it.product && it.product.productType === "GAME_ACCOUNT" && it.product.accountDetailsEncrypted) {
      try {
        const decryptedJson = decryptData(it.product.accountDetailsEncrypted);
        if (decryptedJson) {
          const parsed = JSON.parse(decryptedJson);
          if (parsed.email && parsed.password) {
            deliveredEmail = parsed.email;
            deliveredPassEncrypted = encryptData(parsed.password);
            deliveredNotes = parsed.notes || "حساب لعبة جاهز تم شراؤه وتفعيله بنجوم تيليجرام.";
            finalStatus = "COMPLETED";

            if (it.product.stockType === "UNIQUE_DIGITAL") {
              await prisma.product.update({
                where: { id: it.productId },
                data: { stockQuantity: 0, isActive: false },
              });
            }
          }
        }
      } catch (err) {
        console.error("Failed to auto-deliver game account on stars confirmation:", err);
      }
    }
  }

  if (finalStatus === "COMPLETED") {
    timelineArr.push({
      status: "COMPLETED",
      title: "تم تسليم الطلب تلقائياً 🚀",
      description: "تم تسليم بيانات الحساب المشفرة للمشتري بنجاح.",
      timestamp: new Date().toISOString(),
    });
  }

  await prisma.order.update({
    where: { id: order.id },
    data: {
      status: finalStatus,
      timeline: JSON.stringify(timelineArr),
      adminNotes: adminNotes || order.adminNotes,
      deliveredAccountEmail: deliveredEmail || order.deliveredAccountEmail,
      deliveredAccountPasswordEncrypted: deliveredPassEncrypted || order.deliveredAccountPasswordEncrypted,
      deliveredAccountNotes: deliveredNotes || order.deliveredAccountNotes,
    },
  });

  await prisma.notification.create({
    data: {
      userId: order.userId,
      title: `تم تأكيد دفع النجوم للطلب #${order.orderNumber} ⭐`,
      message: finalStatus === "COMPLETED"
        ? `تم تأكيد استلام النجوم وتسليم بيانات طلبك #${order.orderNumber} بنجاح!`
        : `تم تأكيد استلام النجوم وجاري تجهيز طلبك #${order.orderNumber} الآن.`,
      link: `/orders/${order.orderNumber}`,
      type: "ORDER",
    },
  }).catch(() => {});

  if (order.telegramUserId) {
    sendTelegramMessage({
      chatId: order.telegramUserId,
      text: `✅ <b>تم تأكيد استلام النجوم بنجاح!</b> ⭐\n\n📦 <b>رقم الطلب:</b> #${order.orderNumber}\n⭐ <b>المبلغ:</b> ${order.starsTotal || 0} Stars\n📌 <b>الحالة:</b> ${finalStatus === "COMPLETED" ? "مكتمل وتم التسليم" : "جاري التجهيز والبدء في التنفيذ"}`,
    }).catch(() => {});
  }

  await prisma.auditLog.create({
    data: {
      adminId: admin.id,
      adminEmail: admin.email,
      action: "CONFIRM_TELEGRAM_STARS_PAYMENT",
      targetType: "ORDER",
      targetId: order.id,
      afterValue: JSON.stringify({ starsTotal: order.starsTotal, status: finalStatus }),
    },
  }).catch(() => {});

  revalidatePath("/admin/orders");
  revalidatePath(`/orders/${order.orderNumber}`);

  return { success: true, status: finalStatus };
}

/**
 * 6. Check Order Payment Status (for frontend polling during payment)
 */
export async function checkOrderStatus(orderNumber: string) {
  const user = await getCurrentUser();
  if (!user) return null;

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      paymentMethod: true,
      starsTotal: true,
      telegramPaymentChargeId: true,
      createdAt: true,
    },
  });

  if (!order) return null;

  return {
    orderNumber: order.orderNumber,
    status: order.status,
    isPaid: order.status !== "PENDING_PAYMENT" && order.status !== "CANCELLED" && order.status !== "REJECTED",
  };
}

/**
 * 7. Customer: Attach Transfer Proof Screenshot for Telegram Stars Order
 */
export async function attachTelegramStarsProof(orderNumber: string, screenshotUrl: string) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("يجب تسجيل الدخول لإرفاق إثبات الدفع.");
  }

  if (!screenshotUrl || !screenshotUrl.trim()) {
    throw new Error("يرجى اختيار صورة إثبات صالحة.");
  }

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { user: true },
  });

  if (!order) {
    throw new Error("الطلب غير موجود.");
  }

  // Allow order owner or admin
  const isOwner = order.userId === user.id;
  const isAdmin = user.role === "SUPER_ADMIN" || user.role === "ADMIN";
  if (!isOwner && !isAdmin) {
    throw new Error("غير مصرح لك بتعديل هذا الطلب.");
  }

  let timelineArr: any[] = [];
  try {
    timelineArr = JSON.parse(order.timeline || "[]");
  } catch {
    timelineArr = [];
  }

  timelineArr.push({
    status: "PENDING_PAYMENT",
    title: "تم إرفاق سكرين شوت تحويل النجوم 📷",
    description: "قام العميل برفع صورة إثبات تحويل النجوم وبانتظار مراجعة وتأكيد الإدارة.",
    screenshotUrl: screenshotUrl.trim(),
    timestamp: new Date().toISOString(),
  });

  let existingNotes = order.customerNotes || "";
  if (!existingNotes.includes(screenshotUrl)) {
    existingNotes = existingNotes
      ? `${existingNotes}\n[رابط سكرين شوت التحويل: ${screenshotUrl.trim()}]`
      : `[رابط سكرين شوت التحويل: ${screenshotUrl.trim()}]`;
  }

  await prisma.order.update({
    where: { id: order.id },
    data: {
      notes: `SCREENSHOT:${screenshotUrl.trim()}`,
      customerNotes: existingNotes,
      timeline: JSON.stringify(timelineArr),
    },
  });

  revalidatePath(`/orders/${orderNumber}`);
  revalidatePath("/admin/orders");

  return { success: true };
}
