"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { generateOrderNumber } from "@/lib/utils";
import { encryptData } from "@/lib/encryption";
import { createStarsInvoiceLink, getTelegramBotUsername } from "@/lib/telegram";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

/**
 * 1. Generate One-Time Telegram Account Linking Deep Link
 */
export async function generateTelegramLinkToken() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("يجب تسجيل الدخول أولاً لربط حساب Telegram.");
  }

  const token = `cpm_${crypto.randomBytes(12).toString("hex")}`;
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
}

/**
 * 4. Create Order & Generate Telegram Stars Invoice Link (Server-Side Price Trust Only)
 */
export async function createTelegramStarsOrder(input: CreateStarsOrderInput) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("يجب تسجيل الدخول لإتمام عملية الشراء.");
  }

  if (!input.items || input.items.length === 0) {
    throw new Error("سلة الشراء فارغة.");
  }

  // Verify Telegram is linked
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, telegramUserId: true, telegramUsername: true },
  });

  if (!dbUser?.telegramUserId) {
    throw new Error("يجب ربط حساب Telegram بحسابك أولاً قبل الدفع بنجوم تيليجرام.");
  }

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

    // Determine Stars price for item:
    // If starsPrice is explicitly configured on the product, use it.
    // Otherwise fallback to 1 Star per 2 EGP (e.g. Math.ceil(price / 2)) or equivalent.
    const unitStars = prod.starsPrice && prod.starsPrice > 0
      ? prod.starsPrice
      : Math.max(1, Math.ceil(prod.price / 2));

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

  const orderNumber = generateOrderNumber();
  const encryptedPassword = input.gamePassword ? encryptData(input.gamePassword) : null;

  // Check if any product is a game account
  const hasGameAccount = dbProducts.some(
    (p) => p.productType === "GAME_ACCOUNT" || p.productType === "ACCOUNT" || Boolean(p.accountDetailsEncrypted)
  );

  const initialTimeline = JSON.stringify([
    {
      status: "PENDING_PAYMENT",
      title: "تم إنشاء فاتورة Telegram Stars ⭐",
      description: `بانتظار إتمام دفع ${starsTotal} نجمة عبر تيليجرام`,
      timestamp: new Date().toISOString(),
    },
  ]);

  // 2. Create Order in DB in PENDING_PAYMENT status
  const order = await prisma.order.create({
    data: {
      orderNumber,
      userId: user.id,
      subtotal,
      discount: 0,
      total: subtotal,
      starsTotal,
      status: "PENDING_PAYMENT",
      paymentMethod: "TELEGRAM_STARS",
      telegramUserId: dbUser.telegramUserId,
      fulfillmentType: hasGameAccount ? "INSTANT_GAME_ACCOUNT" : (input.fulfillmentType || "EXISTING_ACCOUNT"),
      gameUsername: input.gameUsername || null,
      gamePasswordEncrypted: encryptedPassword,
      gamePlayerId: input.gamePlayerId || null,
      customerNotes: input.customerNotes || null,
      timeline: initialTimeline,
      items: {
        create: orderItemsData,
      },
    },
    include: {
      items: true,
    },
  });

  // 3. Create Telegram Invoice Link
  const invoicePayload = `CPM_ORDER_${order.id}`;
  const productTitle = dbProducts.length === 1 ? dbProducts[0].name : `طلب متجر EgyCPM (${dbProducts.length} عناصر)`;
  const productDesc = `طلب رقم #${orderNumber} - دفع فوري آمن بنجوم تيليجرام ⭐`;

  let primaryImage: string | undefined = undefined;
  try {
    const parsedImgs = JSON.parse(dbProducts[0]?.images || "[]");
    if (Array.isArray(parsedImgs) && parsedImgs[0]?.startsWith("http")) {
      primaryImage = parsedImgs[0];
    }
  } catch {}

  const invoiceUrl = await createStarsInvoiceLink({
    title: productTitle,
    description: productDesc,
    payload: invoicePayload,
    starsAmount: starsTotal,
    photoUrl: primaryImage,
  });

  return {
    success: true,
    orderNumber: order.orderNumber,
    orderId: order.id,
    starsTotal,
    invoiceUrl,
  };
}

/**
 * 5. Check Order Payment Status (for frontend polling during payment)
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
