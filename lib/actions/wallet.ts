"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireAdminRole } from "@/lib/auth";
import { generateDepositNumber } from "@/lib/utils";
import { revalidatePath } from "next/cache";

/**
 * Get current user wallet details + transaction history
 */
export async function getMyWallet() {
  const user = await getCurrentUser();
  if (!user) return null;

  let wallet = await prisma.wallet.findUnique({
    where: { userId: user.id },
    include: {
      transactions: {
        orderBy: { createdAt: "desc" },
        take: 50,
      },
    },
  });

  if (!wallet) {
    wallet = await prisma.wallet.create({
      data: {
        userId: user.id,
        balance: 0.0,
        giftBalance: 0.0,
        totalDeposited: 0.0,
        totalSpent: 0.0,
      },
      include: {
        transactions: true,
      },
    });
  }

  // Get deposit requests
  const depositRequests = await prisma.depositRequest.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return {
    wallet,
    depositRequests,
  };
}

/**
 * Submit a new Wallet Deposit Request
 */
export async function submitDepositRequest(data: {
  method: "VODAFONE_CASH" | "ORANGE_CASH" | "ETISALAT_CASH" | "WE_PAY";
  senderPhone: string;
  senderName: string;
  amount: number;
  screenshotUrl: string;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("يجب تسجيل الدخول لإتمام عملية الشحن.");

  if (!data.senderPhone || data.senderPhone.trim().length < 11) {
    throw new Error("يرجى إدخال رقم هاتف تحويل صحيح مكون من 11 رقم.");
  }

  if (!data.senderName || data.senderName.trim().length < 3) {
    throw new Error("يرجى إدخال اسم الراسل بالكامل.");
  }

  if (!data.amount || data.amount < 50) {
    throw new Error("الحد الأدنى للشحن هو 50 ج.م.");
  }

  if (!data.screenshotUrl) {
    throw new Error("يرجى إرفاق صورة إثبات التحويل (Screenshot).");
  }

  const requestNumber = generateDepositNumber();

  const deposit = await prisma.depositRequest.create({
    data: {
      requestNumber,
      userId: user.id,
      method: data.method,
      senderPhone: data.senderPhone.trim(),
      senderName: data.senderName.trim(),
      amount: Number(data.amount),
      screenshotUrl: data.screenshotUrl,
      status: "PENDING",
    },
  });

  // Create user notification
  await prisma.notification.create({
    data: {
      userId: user.id,
      title: "تم استلام طلب الشحن بنجاح ⏳",
      message: `طلب شحن بقيمة ${data.amount} ج.م (رقم الطلب: ${requestNumber}) قيد المراجعة حالياً من قبل الإدارة.`,
      type: "SYSTEM",
      link: "/wallet",
    },
  });

  revalidatePath("/wallet");
  revalidatePath("/admin/deposits");

  return { success: true, deposit };
}

/**
 * Admin: Approve Deposit Request
 */
export async function approveDeposit(depositId: string, adminNotes?: string) {
  const admin = await requireAdminRole(["SUPER_ADMIN", "ADMIN"]);

  const deposit = await prisma.depositRequest.findUnique({
    where: { id: depositId },
    include: { user: { include: { wallet: true } } },
  });

  if (!deposit) throw new Error("طلب الإيداع غير موجود.");
  if (deposit.status !== "PENDING") throw new Error("تمت معالجة هذا الطلب مسبقاً.");

  const targetUserId = deposit.userId;
  const depositAmount = deposit.amount;

  // Execute Atomic Transaction
  const result = await prisma.$transaction(async (tx) => {
    // 1. Ensure or find user wallet
    let wallet = await tx.wallet.findUnique({ where: { userId: targetUserId } });
    if (!wallet) {
      wallet = await tx.wallet.create({
        data: {
          userId: targetUserId,
          balance: 0.0,
          giftBalance: 0.0,
          totalDeposited: 0.0,
          totalSpent: 0.0,
        },
      });
    }

    const beforeBalance = wallet.balance;
    const afterBalance = beforeBalance + depositAmount;

    // 2. Update wallet balance
    const updatedWallet = await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: afterBalance,
        totalDeposited: wallet.totalDeposited + depositAmount,
      },
    });

    // 3. Update deposit request status
    const updatedDeposit = await tx.depositRequest.update({
      where: { id: depositId },
      data: {
        status: "APPROVED",
        adminNotes: adminNotes || "تم التأكيد وقبول التحويل بنجاح",
        reviewedById: admin.id,
        reviewedAt: new Date(),
      },
    });

    // 4. Create Transaction Record
    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: "DEPOSIT",
        amount: depositAmount,
        beforeBalance,
        afterBalance,
        beforeGiftBalance: wallet.giftBalance,
        afterGiftBalance: wallet.giftBalance,
        description: `إيداع مؤكد (${deposit.method}) - طلب رقم ${deposit.requestNumber}`,
        referenceId: deposit.requestNumber,
      },
    });

    // 5. Notify customer
    await tx.notification.create({
      data: {
        userId: targetUserId,
        title: "تم شحن محفظتك بنجاح! 💰",
        message: `تم قبول طلب الإيداع وإضافة ${depositAmount} ج.م إلى رصيد محفظتك. استمتع بالتسوق الآن!`,
        type: "DEPOSIT_APPROVED",
        link: "/wallet",
      },
    });

    // 6. Record Audit Log
    await tx.auditLog.create({
      data: {
        adminId: admin.id,
        adminEmail: admin.email,
        action: "APPROVE_DEPOSIT",
        targetType: "DEPOSIT",
        targetId: depositId,
        beforeValue: JSON.stringify({ status: "PENDING", amount: depositAmount }),
        afterValue: JSON.stringify({ status: "APPROVED", walletBefore: beforeBalance, walletAfter: afterBalance }),
      },
    });

    return { updatedWallet, updatedDeposit };
  });

  revalidatePath("/wallet");
  revalidatePath("/admin/deposits");
  revalidatePath("/admin/customers");
  return { success: true, result };
}

/**
 * Admin: Reject Deposit Request
 */
export async function rejectDeposit(depositId: string, reason: string) {
  const admin = await requireAdminRole(["SUPER_ADMIN", "ADMIN"]);

  const deposit = await prisma.depositRequest.findUnique({
    where: { id: depositId },
  });

  if (!deposit) throw new Error("طلب الإيداع غير موجود.");
  if (deposit.status !== "PENDING") throw new Error("تمت معالجة هذا الطلب مسبقاً.");

  const updatedDeposit = await prisma.$transaction(async (tx) => {
    const res = await tx.depositRequest.update({
      where: { id: depositId },
      data: {
        status: "REJECTED",
        adminNotes: reason || "لم يتم العثور على التحويل أو البيانات غير متطابقة",
        reviewedById: admin.id,
        reviewedAt: new Date(),
      },
    });

    await tx.notification.create({
      data: {
        userId: deposit.userId,
        title: "تم رفض طلب الشحن ❌",
        message: `نأسف، تم رفض طلب الشحن رقم ${deposit.requestNumber}. السبب: ${reason || "البيانات غير مطابقة"}. يرجى التواصل مع الدعم الفني.`,
        type: "DEPOSIT_REJECTED",
        link: "/support",
      },
    });

    await tx.auditLog.create({
      data: {
        adminId: admin.id,
        adminEmail: admin.email,
        action: "REJECT_DEPOSIT",
        targetType: "DEPOSIT",
        targetId: depositId,
        beforeValue: JSON.stringify({ status: "PENDING" }),
        afterValue: JSON.stringify({ status: "REJECTED", reason }),
      },
    });

    return res;
  });

  revalidatePath("/admin/deposits");
  revalidatePath("/wallet");
  return { success: true, updatedDeposit };
}

/**
 * Admin: Grant Gift Balance to Customer
 */
export async function grantGiftBalance(data: {
  userId: string;
  amount: number;
  reason: string;
}) {
  const admin = await requireAdminRole(["SUPER_ADMIN", "ADMIN"]);

  if (!data.amount || data.amount <= 0) {
    throw new Error("يرجى إدخال مبلغ هدية صالح.");
  }

  const result = await prisma.$transaction(async (tx) => {
    let wallet = await tx.wallet.findUnique({ where: { userId: data.userId } });
    if (!wallet) {
      wallet = await tx.wallet.create({
        data: {
          userId: data.userId,
          balance: 0.0,
          giftBalance: 0.0,
          totalDeposited: 0.0,
          totalSpent: 0.0,
        },
      });
    }

    const beforeGift = wallet.giftBalance;
    const afterGift = beforeGift + Number(data.amount);

    const updatedWallet = await tx.wallet.update({
      where: { id: wallet.id },
      data: { giftBalance: afterGift },
    });

    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: "GIFT",
        amount: Number(data.amount),
        beforeBalance: wallet.balance,
        afterBalance: wallet.balance,
        beforeGiftBalance: beforeGift,
        afterGiftBalance: afterGift,
        description: `رصيد هدية من الإدارة: ${data.reason || "مكافأة خاصة"} 🎁`,
        referenceId: `GIFT-${Date.now()}`,
      },
    });

    await tx.notification.create({
      data: {
        userId: data.userId,
        title: "مبروك! حصلت على رصيد هدية 🎁",
        message: `تمت إضافة رصيد هدية بقيمة ${data.amount} ج.م إلى محفظتك. السبب: ${data.reason || "هدية خاصة من إدارة المتجر"}.`,
        type: "GIFT_RECEIVED",
        link: "/wallet",
      },
    });

    await tx.auditLog.create({
      data: {
        adminId: admin.id,
        adminEmail: admin.email,
        action: "GRANT_GIFT_BALANCE",
        targetType: "USER",
        targetId: data.userId,
        afterValue: JSON.stringify({ amount: data.amount, reason: data.reason, beforeGift, afterGift }),
      },
    });

    return updatedWallet;
  });

  revalidatePath("/admin/customers");
  revalidatePath("/wallet");
  return { success: true, result };
}

/**
 * Admin: Manual Credit or Deduction
 */
export async function manualBalanceAdjustment(data: {
  userId: string;
  type: "MANUAL_CREDIT" | "MANUAL_DEDUCTION";
  amount: number;
  reason: string;
}) {
  const admin = await requireAdminRole(["SUPER_ADMIN"]);

  if (!data.amount || data.amount <= 0) {
    throw new Error("يرجى إدخال مبلغ صالح.");
  }

  const result = await prisma.$transaction(async (tx) => {
    let wallet = await tx.wallet.findUnique({ where: { userId: data.userId } });
    if (!wallet) {
      wallet = await tx.wallet.create({
        data: {
          userId: data.userId,
          balance: 0.0,
          giftBalance: 0.0,
          totalDeposited: 0.0,
          totalSpent: 0.0,
        },
      });
    }

    const beforeBalance = wallet.balance;
    let afterBalance = beforeBalance;

    if (data.type === "MANUAL_CREDIT") {
      afterBalance = beforeBalance + Number(data.amount);
    } else {
      if (beforeBalance < Number(data.amount)) {
        throw new Error("رصيد العميل الحالي أقل من المبلغ المطلوب خصمه.");
      }
      afterBalance = beforeBalance - Number(data.amount);
    }

    const updatedWallet = await tx.wallet.update({
      where: { id: wallet.id },
      data: { balance: afterBalance },
    });

    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: data.type,
        amount: Number(data.amount),
        beforeBalance,
        afterBalance,
        beforeGiftBalance: wallet.giftBalance,
        afterGiftBalance: wallet.giftBalance,
        description: `تعديل يدوي من الإدارة (${data.type === "MANUAL_CREDIT" ? "إضافة" : "خصم"}): ${data.reason}`,
        referenceId: `ADJ-${Date.now()}`,
      },
    });

    await tx.notification.create({
      data: {
        userId: data.userId,
        title: data.type === "MANUAL_CREDIT" ? "تعديل رصيد: إضافة" : "تعديل رصيد: خصم",
        message: `تم ${data.type === "MANUAL_CREDIT" ? "إضافة" : "خصم"} ${data.amount} ج.م في محفظتك. السبب: ${data.reason}.`,
        type: "SYSTEM",
        link: "/wallet",
      },
    });

    await tx.auditLog.create({
      data: {
        adminId: admin.id,
        adminEmail: admin.email,
        action: data.type,
        targetType: "USER",
        targetId: data.userId,
        beforeValue: JSON.stringify({ balance: beforeBalance }),
        afterValue: JSON.stringify({ balance: afterBalance, amount: data.amount, reason: data.reason }),
      },
    });

    return updatedWallet;
  });

  revalidatePath("/admin/customers");
  revalidatePath("/wallet");
  return { success: true, result };
}

/**
 * Admin: Update Customer Password
 */
export async function adminUpdateCustomerPassword(userId: string, newPassword: string) {
  const admin = await requireAdminRole(["SUPER_ADMIN", "ADMIN"]);

  if (!newPassword || newPassword.length < 5) {
    throw new Error("كلمة المرور يجب ألا تقل عن 5 أحرف.");
  }

  const bcrypt = await import("bcryptjs");
  const { encryptData } = await import("@/lib/encryption");

  const passwordHash = await bcrypt.default.hash(newPassword, 10);
  const plainPasswordEncrypted = encryptData(newPassword);

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash,
      plainPasswordEncrypted,
    },
  });

  await prisma.auditLog.create({
    data: {
      adminId: admin.id,
      adminEmail: admin.email,
      action: "ADMIN_UPDATE_CUSTOMER_PASSWORD",
      targetType: "USER",
      targetId: userId,
      afterValue: JSON.stringify({ targetEmail: updatedUser.email, timestamp: new Date().toISOString() }),
    },
  });

  revalidatePath("/admin/customers");
  return { success: true };
}

/**
 * Admin: Delete Customer Account Completely
 */
export async function adminDeleteCustomer(userId: string) {
  const admin = await requireAdminRole(["SUPER_ADMIN", "ADMIN"]);

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, role: true },
  });

  if (!targetUser) {
    throw new Error("المستخدم غير موجود.");
  }

  if (targetUser.role === "SUPER_ADMIN") {
    throw new Error("لا يمكن حذف حساب المالك الرئيسي (Super Admin).");
  }

  // Delete customer (Cascades to Wallet, Orders, Reviews, Tickets, Notifications)
  await prisma.user.delete({
    where: { id: userId },
  });

  // Log in AuditLog
  await prisma.auditLog.create({
    data: {
      adminId: admin.id,
      adminEmail: admin.email,
      action: "ADMIN_DELETE_CUSTOMER",
      targetType: "USER",
      targetId: userId,
      beforeValue: JSON.stringify({ email: targetUser.email, name: targetUser.name, role: targetUser.role }),
    },
  });

  revalidatePath("/admin/customers");
  revalidatePath("/admin");
  return { success: true };
}

/**
 * Admin: Change User Role (CUSTOMER, ADMIN, SUPER_ADMIN, ORDER_MANAGER, SUPPORT)
 */
export async function adminUpdateUserRole(userId: string, newRole: string) {
  const admin = await requireAdminRole(["SUPER_ADMIN"]);

  const validRoles = ["SUPER_ADMIN", "ADMIN", "ORDER_MANAGER", "SUPPORT", "CUSTOMER"];
  if (!validRoles.includes(newRole)) {
    throw new Error("نوع الرتبة غير صالح.");
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, role: true },
  });

  if (!targetUser) {
    throw new Error("المستخدم غير موجود.");
  }

  if (targetUser.id === admin.id && newRole !== "SUPER_ADMIN") {
    throw new Error("لا يمكنك تقليل رتبة حسابك أنت كمدير عام رئيسي.");
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { role: newRole },
  });

  // Log in AuditLog
  await prisma.auditLog.create({
    data: {
      adminId: admin.id,
      adminEmail: admin.email,
      action: "ADMIN_CHANGE_USER_ROLE",
      targetType: "USER",
      targetId: userId,
      beforeValue: JSON.stringify({ oldRole: targetUser.role }),
      afterValue: JSON.stringify({ newRole: updatedUser.role, email: updatedUser.email }),
    },
  });

  revalidatePath("/admin/customers");
  revalidatePath("/admin");
  return { success: true, user: updatedUser };
}



