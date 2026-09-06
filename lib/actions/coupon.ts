"use server";

import { prisma } from "@/lib/prisma";
import { requireAdminRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";

/**
 * Validate Coupon Code for Checkout
 */
/**
 * Validate Coupon Code for Checkout
 */
export async function validateCouponCode(code: string, currentTotal: number, currentStarsTotal?: number) {
  if (!code || !code.trim()) {
    return { valid: false, message: "يرجى إدخال كود الكوبون." };
  }

  const cleanCode = code.trim().toUpperCase();
  const coupon = await prisma.coupon.findUnique({
    where: { code: cleanCode },
  });

  if (!coupon || !coupon.isActive) {
    return { valid: false, message: "كود الكوبون غير صالح أو تم إيقافه." };
  }

  const now = new Date();
  if (coupon.startDate && coupon.startDate > now) {
    return { valid: false, message: "هذا الكوبون لم يبدأ بعد." };
  }

  if (coupon.expiresAt && coupon.expiresAt < now) {
    return { valid: false, message: "عذراً، لقد انتهت صلاحية هذا الكوبون." };
  }

  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
    return { valid: false, message: "لقد تم استنفاد الحد الأقصى لاستخدام هذا الكوبون." };
  }

  if (coupon.minOrderValue && currentTotal < coupon.minOrderValue) {
    return {
      valid: false,
      message: `الحد الأدنى للاستفادة من هذا الكوبون هو ${coupon.minOrderValue} ج.م.`,
    };
  }

  // Calculate EGP discount
  let discountAmount = 0;
  if (coupon.discountType === "PERCENTAGE") {
    discountAmount = (currentTotal * coupon.discountValue) / 100;
    if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
      discountAmount = coupon.maxDiscount;
    }
  } else {
    discountAmount = Math.min(coupon.discountValue, currentTotal);
  }

  // Calculate Stars discount (independent or fallback)
  const starsTotal = currentStarsTotal || 0;
  let starsDiscountAmount = 0;
  const starsType = coupon.starsDiscountType || coupon.discountType;

  if (coupon.starsDiscountValue !== null && coupon.starsDiscountValue !== undefined && coupon.starsDiscountValue > 0) {
    if (starsType === "PERCENTAGE") {
      let sd = (starsTotal * coupon.starsDiscountValue) / 100;
      if (coupon.starsMaxDiscount && sd > coupon.starsMaxDiscount) {
        sd = coupon.starsMaxDiscount;
      }
      starsDiscountAmount = Math.floor(sd);
    } else {
      starsDiscountAmount = Math.min(Math.floor(coupon.starsDiscountValue), starsTotal);
    }
  } else {
    // Fallback: use main discount rule proportionally
    if (coupon.discountType === "PERCENTAGE") {
      starsDiscountAmount = Math.floor((starsTotal * coupon.discountValue) / 100);
    } else {
      const ratio = currentTotal > 0 ? Math.min(discountAmount / currentTotal, 1) : 0;
      starsDiscountAmount = Math.floor(starsTotal * ratio);
    }
  }

  return {
    valid: true,
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    discountAmount,
    starsDiscountType: coupon.starsDiscountType || null,
    starsDiscountValue: coupon.starsDiscountValue ?? null,
    starsDiscountAmount,
    message: `تم تطبيق كود الخصم "${coupon.code}" بنجاح!`,
  };
}

/**
 * Admin: Create Coupon
 */
export async function createCoupon(data: {
  code: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  minOrderValue?: number;
  maxDiscount?: number;
  starsDiscountType?: "PERCENTAGE" | "FIXED";
  starsDiscountValue?: number;
  starsMinOrderValue?: number;
  starsMaxDiscount?: number;
  maxUses?: number;
  expiresAt?: string;
  categoryId?: string;
  productId?: string;
}) {
  const admin = await requireAdminRole(["SUPER_ADMIN", "ADMIN"]);

  const cleanCode = data.code.trim().toUpperCase();

  const coupon = await prisma.coupon.create({
    data: {
      code: cleanCode,
      discountType: data.discountType,
      discountValue: Number(data.discountValue),
      minOrderValue: data.minOrderValue ? Number(data.minOrderValue) : 0,
      maxDiscount: data.maxDiscount ? Number(data.maxDiscount) : null,
      starsDiscountType: data.starsDiscountType || null,
      starsDiscountValue: data.starsDiscountValue ? Number(data.starsDiscountValue) : null,
      starsMinOrderValue: data.starsMinOrderValue ? Number(data.starsMinOrderValue) : null,
      starsMaxDiscount: data.starsMaxDiscount ? Number(data.starsMaxDiscount) : null,
      maxUses: data.maxUses ? Number(data.maxUses) : 100,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      categoryId: data.categoryId || null,
      productId: data.productId || null,
      isActive: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      adminId: admin.id,
      adminEmail: admin.email,
      action: "CREATE_COUPON",
      targetType: "COUPON",
      targetId: coupon.id,
      afterValue: JSON.stringify(coupon),
    },
  });

  revalidatePath("/admin/coupons");
  return { success: true, coupon };
}

/**
 * Admin: Toggle Coupon Status
 */
export async function toggleCouponStatus(id: string, isActive: boolean) {
  await requireAdminRole(["SUPER_ADMIN", "ADMIN"]);

  const updated = await prisma.coupon.update({
    where: { id },
    data: { isActive },
  });

  revalidatePath("/admin/coupons");
  return { success: true, coupon: updated };
}

/**
 * Admin: Delete Coupon
 */
export async function deleteCoupon(id: string) {
  await requireAdminRole(["SUPER_ADMIN", "ADMIN"]);

  await prisma.coupon.delete({ where: { id } });

  revalidatePath("/admin/coupons");
  return { success: true };
}
