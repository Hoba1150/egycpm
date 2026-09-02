"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireAdminRole } from "@/lib/auth";
import { generateOrderNumber } from "@/lib/utils";
import { encryptData, decryptData } from "@/lib/encryption";
import { revalidatePath } from "next/cache";

interface CheckoutItemInput {
  productId: string;
  quantity: number;
}

interface CreateOrderInput {
  items: CheckoutItemInput[];
  couponCode?: string | null;
  fulfillmentType?: string | null; // "EXISTING_ACCOUNT" | "NEW_ACCOUNT_CUSTOM" | "NEW_ACCOUNT_AUTO"
  gameUsername?: string | null;
  gamePassword?: string | null;
  gamePlayerId?: string | null;
  customerNotes?: string | null;
}

/**
 * Create Order with Atomic Wallet Payment & Cryptographic Security
 */
export async function createOrder(input: CreateOrderInput) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("يجب تسجيل الدخول لإتمام عملية الشراء.");
  }

  if (!input.items || input.items.length === 0) {
    throw new Error("سلة الشراء فارغة.");
  }

  // 1. Fetch fresh products from database (Zero client trust)
  const productIds = input.items.map((i) => i.productId);
  const dbProducts = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true },
  });

  if (dbProducts.length !== input.items.length) {
    throw new Error("بعض المنتجات المطلوبة غير متوفرة أو تم إيقافها.");
  }

  // Check stock & calculate subtotal
  let subtotal = 0;
  const orderItemsData: {
    productId: string;
    productName: string;
    productPrice: number;
    quantity: number;
    total: number;
    deliveredDataEncrypted?: string | null;
  }[] = [];

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

  // 2. Validate Coupon if provided
  let discount = 0;
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

      if (!isExpired && !isMaxed && meetsMin) {
        if (coupon.discountType === "PERCENTAGE") {
          let calculated = (subtotal * coupon.discountValue) / 100;
          if (coupon.maxDiscount && calculated > coupon.maxDiscount) {
            calculated = coupon.maxDiscount;
          }
          discount = calculated;
        } else {
          discount = Math.min(coupon.discountValue, subtotal);
        }
        validatedCoupon = coupon;
      }
    }
  }

  const finalTotal = Math.max(0, subtotal - discount);

  // 3. Encrypt game credentials if provided
  const encryptedPassword = input.gamePassword ? encryptData(input.gamePassword) : null;
  const orderNumber = generateOrderNumber();

  // 4. Execute ATOMIC PRISMA TRANSACTION (Zero double-spending)
  const result = await prisma.$transaction(async (tx) => {
    // A. Fetch current user wallet with lock
    const wallet = await tx.wallet.findUnique({
      where: { userId: user.id },
    });

    if (!wallet) {
      throw new Error("لم يتم العثور على محفظتك. يرجى إعادة تسجيل الدخول.");
    }

    const totalAvailable = wallet.balance + wallet.giftBalance;
    if (totalAvailable < finalTotal) {
      throw new Error("رصيد المحفظة غير كافٍ لإتمام عملية الشراء. يرجى شحن محفظتك أولاً.");
    }

    // Deduct from gift balance first, then main balance
    let giftDeduction = 0;
    let mainDeduction = 0;

    if (wallet.giftBalance >= finalTotal) {
      giftDeduction = finalTotal;
      mainDeduction = 0;
    } else {
      giftDeduction = wallet.giftBalance;
      mainDeduction = finalTotal - giftDeduction;
    }

    const beforeBalance = wallet.balance;
    const afterBalance = beforeBalance - mainDeduction;
    const beforeGift = wallet.giftBalance;
    const afterGift = beforeGift - giftDeduction;

    // B. Update Wallet
    await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: afterBalance,
        giftBalance: afterGift,
        totalSpent: wallet.totalSpent + finalTotal,
      },
    });

    // C. Check for Game Accounts and Process Instant Delivery
    let hasGameAccount = false;
    let deliveredAccountEmail: string | null = null;
    let deliveredAccountPasswordEncrypted: string | null = null;
    let deliveredAccountNotes: string | null = null;

    // E. Decrement Stock, Update Product, and Deliver Account
    for (const item of input.items) {
      // Re-fetch product inside transaction to guarantee atomic lock
      const prod = await tx.product.findUnique({
        where: { id: item.productId },
      });

      if (!prod || !prod.isActive) {
        throw new Error(`عذراً، المنتج "${prod?.name || "المطلوب"}" غير متاح أو تم بيعه مسبقاً.`);
      }

      const isGameAccount = prod.productType === "GAME_ACCOUNT" || prod.productType === "ACCOUNT" || Boolean(prod.accountDetailsEncrypted);

      let newStock = prod.stockQuantity;
      let newActive = prod.isActive;

      if (isGameAccount) {
        if (prod.stockQuantity <= 0) {
          throw new Error(`عذراً، حساب "${prod.name}" تم شراؤه مسبقاً بواسطة عميل آخر.`);
        }
        hasGameAccount = true;
        newStock = 0;
        newActive = false; // Immediately marked sold out

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

      // Update product with atomic check
      await tx.product.update({
        where: { id: prod.id },
        data: {
          stockQuantity: newStock,
          isActive: newActive,
          totalSales: prod.totalSales + item.quantity,
        },
      });
    }

    // F. Create Initial Timeline & Order Status
    const orderStatus = hasGameAccount ? "COMPLETED" : "PROCESSING";
    const initialTimeline = JSON.stringify([
      {
        status: "PAID",
        title: "تم إنشاء الطلب وتأكيد الدفع",
        description: `تم دفع ${finalTotal} ج.م من رصيد المحفظة بنجاح`,
        timestamp: new Date().toISOString(),
      },
      ...(hasGameAccount
        ? [
            {
              status: "COMPLETED",
              title: "تم تسليم بيانات الحساب تلقائياً 🎮",
              description: "تم تسليم بيانات الحساب وإرسالها في إشعار خاص إلى حسابك",
              timestamp: new Date().toISOString(),
            },
          ]
        : [
            {
              status: "PROCESSING",
              title: "جاري تجهيز الطلب",
              description: "تم تحويل الطلب لفريق العمل للتنفيذ",
              timestamp: new Date().toISOString(),
            },
          ]),
    ]);

    // G. Create Order
    const order = await tx.order.create({
      data: {
        orderNumber,
        userId: user.id,
        subtotal,
        discount,
        couponCode: validatedCoupon ? validatedCoupon.code : null,
        total: finalTotal,
        status: orderStatus,
        paymentMethod: "WALLET",
        fulfillmentType: hasGameAccount ? "INSTANT_GAME_ACCOUNT" : (input.fulfillmentType || "EXISTING_ACCOUNT"),
        gameUsername: input.gameUsername || null,
        gamePasswordEncrypted: encryptedPassword,
        gamePlayerId: input.gamePlayerId || null,
        customerNotes: input.customerNotes || null,
        deliveredAccountEmail,
        deliveredAccountPasswordEncrypted,
        deliveredAccountNotes,
        timeline: initialTimeline,
        items: {
          create: orderItemsData,
        },
      },
      include: {
        items: true,
      },
    });

    // H. Record Coupon Usage
    if (validatedCoupon) {
      await tx.coupon.update({
        where: { id: validatedCoupon.id },
        data: { usedCount: validatedCoupon.usedCount + 1 },
      });

      await tx.couponUsage.create({
        data: {
          couponId: validatedCoupon.id,
          userId: user.id,
          orderId: order.id,
          discountAmount: discount,
        },
      });
    }

    // I. Create Transaction Record
    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: "PURCHASE",
        amount: finalTotal,
        beforeBalance,
        afterBalance,
        beforeGiftBalance: beforeGift,
        afterGiftBalance: afterGift,
        description: hasGameAccount
          ? `شراء حساب لعبة #${orderNumber}`
          : `شراء طلب جديد #${orderNumber} (${orderItemsData.length} عناصر)`,
        referenceId: orderNumber,
      },
    });

    // J. Create Notification
    if (hasGameAccount) {
      const decryptedPass = deliveredAccountPasswordEncrypted
        ? decryptData(deliveredAccountPasswordEncrypted)
        : "";
      const notificationMsg = `🎉 مبروك! تم شراء الحساب بنجاح برقم طلب #${orderNumber}.\n\n📧 البريد / اسم المستخدم: ${deliveredAccountEmail || "موضح في الملاحظات"}\n🔑 كلمة المرور: ${decryptedPass || "لا توجد"}\n${deliveredAccountNotes ? `📝 ملاحظات الحساب: ${deliveredAccountNotes}\n` : ""}\nبياناتك محفوظة وآمنة، ويمكنك مراجعتها في أي وقت من تفاصيل الطلب.`;

      await tx.notification.create({
        data: {
          userId: user.id,
          title: "🎮 تم استلام بيانات حسابك بنجاح!",
          message: notificationMsg,
          type: "CREDENTIALS_DELIVERED",
          link: `/orders/${orderNumber}`,
        },
      });
    } else {
      await tx.notification.create({
        data: {
          userId: user.id,
          title: "تم إنشاء طلبك بنجاح! 🚀",
          message: `تم استلام طلبك رقم ${orderNumber} بمبلغ ${finalTotal} ج.م وجاري تنفيذه من قبل المتخصصين.`,
          type: "ORDER_STATUS",
          link: `/orders/${orderNumber}`,
        },
      });
    }

    return order;
  });

  revalidatePath("/wallet");
  revalidatePath("/orders");
  revalidatePath("/notifications");
  revalidatePath("/admin/orders");
  revalidatePath("/shop");
  revalidatePath("/cpm2");

  return { success: true, order: result };
}

/**
 * Delete a customer's own notification securely
 */
export async function deleteNotification(notificationId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("يجب تسجيل الدخول.");

  await prisma.notification.deleteMany({
    where: {
      id: notificationId,
      userId: user.id,
    },
  });

  revalidatePath("/notifications");
  return { success: true };
}


/**
 * Get Orders for Customer
 */
export async function getMyOrders() {
  const user = await getCurrentUser();
  if (!user) return [];

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    include: {
      items: {
        include: {
          product: {
            select: { slug: true, images: true, productType: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return orders;
}

/**
 * Get Single Order by Order Number (with security check)
 */
export async function getOrderByNumber(orderNumber: string) {
  const user = await getCurrentUser();
  if (!user) return null;

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: {
      items: {
        include: {
          product: true,
        },
      },
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  if (!order) return null;

  // Only the owner or Admins can view the order
  const isAdmin = ["SUPER_ADMIN", "ADMIN", "SUPPORT", "ORDER_MANAGER"].includes(user.role);
  if (order.userId !== user.id && !isAdmin) {
    throw new Error("غير مصرح لك بمشاهدة هذا الطلب.");
  }

  // Decrypt delivered data or password for authorized viewing
  let decryptedGamePassword = null;
  if ((isAdmin || order.userId === user.id) && order.gamePasswordEncrypted) {
    decryptedGamePassword = decryptData(order.gamePasswordEncrypted);
  }

  let decryptedDeliveredPassword = null;
  if (order.deliveredAccountPasswordEncrypted) {
    decryptedDeliveredPassword = decryptData(order.deliveredAccountPasswordEncrypted);
  }

  return {
    ...order,
    decryptedGamePassword,
    decryptedDeliveredPassword,
  };
}

/**
 * Admin: Deliver New Account Credentials & Notify Customer
 */
export async function deliverOrderCredentials(data: {
  orderId: string;
  email?: string;
  password?: string;
  notes?: string;
}) {
  const admin = await requireAdminRole(["SUPER_ADMIN", "ADMIN", "ORDER_MANAGER"]);

  const order = await prisma.order.findUnique({
    where: { id: data.orderId },
  });

  if (!order) throw new Error("الطلب غير موجود.");

  const encryptedPassword = data.password ? encryptData(data.password) : null;

  let timelineArray: any[] = [];
  try {
    timelineArray = JSON.parse(order.timeline || "[]");
  } catch {
    timelineArray = [];
  }

  timelineArray.push({
    status: "COMPLETED",
    title: "تم تسليم بيانات الحساب الجديد بنجاح ✅",
    description: data.notes ? `تم تسليم البيانات: ${data.notes}` : "تم تجهيز حساب اللعبة وبيانات الدخول الخاصة بك، يمكنك الاطلاع عليها ونسخها الآن بأمان.",
    timestamp: new Date().toISOString(),
  });

  const updatedOrder = await prisma.order.update({
    where: { id: data.orderId },
    data: {
      status: "COMPLETED",
      deliveredAccountEmail: data.email || null,
      deliveredAccountPasswordEncrypted: encryptedPassword,
      deliveredAccountNotes: data.notes || null,
      timeline: JSON.stringify(timelineArray),
    },
  });

  // Build detailed credentials notification message for customer
  let notifMessage = `تم تسليم بيانات حساب اللعبة الخاص بطلبك رقم #${order.orderNumber} بنجاح!\n`;
  if (data.email) notifMessage += `📧 البريد: ${data.email}\n`;
  if (data.password) notifMessage += `🔑 كلمة السر: ${data.password}\n`;
  if (data.notes) notifMessage += `📝 ملاحظات: ${data.notes}\n`;
  notifMessage += `تفضل بالدخول لصفحة تتبع الطلب لنسخ البيانات وتأمين حسابك.`;

  // Create Notification for Customer
  await prisma.notification.create({
    data: {
      userId: order.userId,
      title: "تم تسليم بيانات حسابك الجديد! 🔑",
      message: notifMessage,
      type: "CREDENTIALS_DELIVERED",
      link: `/orders/${order.orderNumber}`,
    },
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      adminId: admin.id,
      adminEmail: admin.email,
      action: "DELIVER_ACCOUNT_CREDENTIALS",
      targetType: "ORDER",
      targetId: order.id,
      afterValue: JSON.stringify({ email: data.email, notes: data.notes }),
    },
  });

  revalidatePath(`/orders/${order.orderNumber}`);
  revalidatePath("/admin/orders");
  return { success: true, order: updatedOrder };
}

/**
 * Admin: Update Order Status & Progress Timeline
 */
export async function updateOrderStatus(data: {
  orderId: string;
  status: "PENDING" | "PAID" | "PROCESSING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "REJECTED";
  adminNotes?: string;
  customStepTitle?: string;
  deliveredEmail?: string;
  deliveredPassword?: string;
  deliveredNotes?: string;
}) {
  const admin = await requireAdminRole(["SUPER_ADMIN", "ADMIN", "ORDER_MANAGER"]);

  const order = await prisma.order.findUnique({
    where: { id: data.orderId },
  });

  if (!order) throw new Error("الطلب غير موجود.");

  let timelineArray: any[] = [];
  try {
    timelineArray = JSON.parse(order.timeline || "[]");
  } catch {
    timelineArray = [];
  }

  const statusTitles: Record<string, string> = {
    PROCESSING: "جاري تجهيز الطلب",
    IN_PROGRESS: "جاري تنفيذ الخدمة داخل اللعبة",
    COMPLETED: "تم إكمال وتسليم الطلب بنجاح ✅",
    CANCELLED: "تم إلغاء الطلب",
    REJECTED: "تم رفض الطلب",
  };

  timelineArray.push({
    status: data.status,
    title: data.customStepTitle || statusTitles[data.status] || data.status,
    description: data.adminNotes || `تحديث حالة الطلب إلى ${data.status}`,
    timestamp: new Date().toISOString(),
  });

  const updatePayload: any = {
    status: data.status,
    adminNotes: data.adminNotes || order.adminNotes,
    timeline: JSON.stringify(timelineArray),
  };

  if (data.deliveredEmail !== undefined && data.deliveredEmail.trim()) {
    updatePayload.deliveredAccountEmail = data.deliveredEmail.trim();
  }
  if (data.deliveredPassword !== undefined && data.deliveredPassword.trim()) {
    updatePayload.deliveredAccountPasswordEncrypted = encryptData(data.deliveredPassword.trim());
  }
  if (data.deliveredNotes !== undefined) {
    updatePayload.deliveredAccountNotes = data.deliveredNotes.trim() || null;
  }

  const updatedOrder = await prisma.order.update({
    where: { id: data.orderId },
    data: updatePayload,
  });

  // Prepare detailed notification message
  let notifTitle = data.status === "COMPLETED" ? "اكتمل طلبك بنجاح! 🎉" : "تحديث في حالة طلبك 🔔";
  let notifType = "ORDER_STATUS";
  let notifMessage = `تم تحديث حالة طلبك رقم #${order.orderNumber} إلى: ${statusTitles[data.status] || data.status}.`;

  if (data.status === "COMPLETED" && (data.deliveredEmail || order.deliveredAccountEmail)) {
    notifTitle = "تم تسليم بيانات حسابك واكتمال طلبك! 🔑";
    notifType = "CREDENTIALS_DELIVERED";
    const emailToUse = data.deliveredEmail || order.deliveredAccountEmail;
    const passToUse = data.deliveredPassword || (order.deliveredAccountPasswordEncrypted ? decryptData(order.deliveredAccountPasswordEncrypted) : null);
    
    notifMessage = `تم تسليم طلبك رقم #${order.orderNumber} بنجاح!\n`;
    if (emailToUse) notifMessage += `📧 البريد: ${emailToUse}\n`;
    if (passToUse) notifMessage += `🔑 كلمة السر: ${passToUse}\n`;
    if (data.deliveredNotes || order.deliveredAccountNotes) notifMessage += `📝 ملاحظات: ${data.deliveredNotes || order.deliveredAccountNotes}\n`;
    notifMessage += `تفضل بالدخول لصفحة تتبع الطلب لنسخ البيانات وتأمين حسابك.`;
  }

  // Send Notification to customer
  await prisma.notification.create({
    data: {
      userId: order.userId,
      title: notifTitle,
      message: notifMessage,
      type: notifType,
      link: `/orders/${order.orderNumber}`,
    },
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      adminId: admin.id,
      adminEmail: admin.email,
      action: "UPDATE_ORDER_STATUS",
      targetType: "ORDER",
      targetId: order.id,
      beforeValue: JSON.stringify({ status: order.status }),
      afterValue: JSON.stringify({ status: data.status, notes: data.adminNotes, deliveredEmail: data.deliveredEmail }),
    },
  });

  revalidatePath(`/orders/${order.orderNumber}`);
  revalidatePath("/admin/orders");
  return { success: true, order: updatedOrder };
}

/**
 * Admin: 1-Click Order Refund back to Customer Wallet
 */
export async function refundOrder(orderId: string, reason: string, customAmount?: number) {
  const admin = await requireAdminRole(["SUPER_ADMIN", "ADMIN"]);

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: { include: { wallet: true } } },
  });

  if (!order) throw new Error("الطلب غير موجود.");
  if (order.status === "REFUNDED") throw new Error("تم استرجاع هذا الطلب مسبقاً.");

  const refundAmount = customAmount !== undefined && customAmount > 0 ? customAmount : order.total;

  const result = await prisma.$transaction(async (tx) => {
    // 1. Get or create wallet
    let wallet = await tx.wallet.findUnique({ where: { userId: order.userId } });
    if (!wallet) {
      wallet = await tx.wallet.create({
        data: {
          userId: order.userId,
          balance: 0.0,
          giftBalance: 0.0,
          totalDeposited: 0.0,
          totalSpent: 0.0,
        },
      });
    }

    const beforeBalance = wallet.balance;
    const afterBalance = beforeBalance + refundAmount;

    // 2. Return funds to wallet
    const updatedWallet = await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: afterBalance,
        totalSpent: Math.max(0, wallet.totalSpent - refundAmount),
      },
    });

    // 3. Update timeline
    let timelineArray: any[] = [];
    try {
      timelineArray = JSON.parse(order.timeline || "[]");
    } catch {
      timelineArray = [];
    }

    timelineArray.push({
      status: "REFUNDED",
      title: "تم استرجاع مبلغ الطلب للمحفظة 💰",
      description: `تم رد مبلغ ${refundAmount} ج.م إلى رصيد محفظتك. السبب: ${reason || "استرجاع من الإدارة"}`,
      timestamp: new Date().toISOString(),
    });

    // 4. Update order
    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: {
        status: "REFUNDED",
        refundedAmount: refundAmount,
        adminNotes: `تم الاسترجاع: ${reason}`,
        timeline: JSON.stringify(timelineArray),
      },
    });

    // 5. Create REFUND Transaction
    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: "REFUND",
        amount: refundAmount,
        beforeBalance,
        afterBalance,
        beforeGiftBalance: wallet.giftBalance,
        afterGiftBalance: wallet.giftBalance,
        description: `استرجاع مالي للطلب #${order.orderNumber} - ${reason || "بواسطة الإدارة"}`,
        referenceId: order.orderNumber,
      },
    });

    // 6. Notify customer
    await tx.notification.create({
      data: {
        userId: order.userId,
        title: "تم استرجاع المبلغ لمحفظتك 💰",
        message: `تم رد مبلغ ${refundAmount} ج.م للطلب رقم ${order.orderNumber} إلى رصيد محفظتك بنجاح.`,
        type: "SYSTEM",
        link: "/wallet",
      },
    });

    // 7. Audit log
    await tx.auditLog.create({
      data: {
        adminId: admin.id,
        adminEmail: admin.email,
        action: "REFUND_ORDER",
        targetType: "ORDER",
        targetId: order.id,
        beforeValue: JSON.stringify({ status: order.status, total: order.total }),
        afterValue: JSON.stringify({ status: "REFUNDED", refundAmount, reason }),
      },
    });

    return { updatedOrder, updatedWallet };
  });

  revalidatePath(`/orders/${order.orderNumber}`);
  revalidatePath("/admin/orders");
  revalidatePath("/wallet");
  return { success: true, result };
}

/**
 * Admin: Permanently Delete Order
 */
export async function deleteOrder(orderId: string) {
  const admin = await requireAdminRole(["SUPER_ADMIN", "ADMIN"]);

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) throw new Error("الطلب غير موجود.");

  // Delete associated items and coupon usages first if any, then delete order
  await prisma.$transaction(async (tx) => {
    await tx.orderItem.deleteMany({ where: { orderId } });
    await tx.couponUsage.deleteMany({ where: { orderId } });
    await tx.order.delete({ where: { id: orderId } });

    await tx.auditLog.create({
      data: {
        adminId: admin.id,
        adminEmail: admin.email,
        action: "DELETE_ORDER",
        targetType: "ORDER",
        targetId: orderId,
        beforeValue: JSON.stringify({
          orderNumber: order.orderNumber,
          total: order.total,
          status: order.status,
          userId: order.userId,
        }),
      },
    });
  });

  revalidatePath("/admin/orders");
  revalidatePath("/orders");
  return { success: true };
}

