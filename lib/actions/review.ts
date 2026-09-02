"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireAdminRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";

/**
 * Customer: Submit Product Review
 */
export async function submitProductReview(data: {
  productId: string;
  rating: number;
  comment?: string;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("يجب تسجيل الدخول لإضافة تقييم.");

  const rating = Math.round(Number(data.rating));
  if (!rating || rating < 1 || rating > 5) {
    throw new Error("يرجى تحديد تقييم صالح من 1 إلى 5 نجوم.");
  }

  // Check if product exists
  const product = await prisma.product.findUnique({ where: { id: data.productId } });
  if (!product) throw new Error("المنتج غير موجود.");

  // Check if user has purchased this product
  const purchasedOrder = await prisma.order.findFirst({
    where: {
      userId: user.id,
      status: { in: ["PAID", "PROCESSING", "IN_PROGRESS", "COMPLETED"] },
      items: {
        some: {
          productId: data.productId,
        },
      },
    },
  });

  const isVerifiedPurchase = Boolean(purchasedOrder);

  // Check if user already reviewed this product, update if exists, otherwise create
  const existingReview = await prisma.review.findFirst({
    where: {
      productId: data.productId,
      userId: user.id,
    },
  });

  let review;
  if (existingReview) {
    review = await prisma.review.update({
      where: { id: existingReview.id },
      data: {
        rating,
        comment: data.comment?.trim() || null,
        isVerifiedPurchase,
        isHidden: false,
        isApproved: true,
      },
    });
  } else {
    review = await prisma.review.create({
      data: {
        userId: user.id,
        productId: data.productId,
        rating,
        comment: data.comment?.trim() || null,
        isVerifiedPurchase,
        isStoreReview: false,
        isApproved: true,
        isHidden: false,
      },
    });
  }

  revalidatePath(`/product/${product.slug}`);
  revalidatePath("/admin/reviews");
  return { success: true, review, isVerifiedPurchase };
}

/**
 * Customer: Submit General Store Review
 */
export async function submitStoreReview(data: {
  rating: number;
  comment?: string;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("يجب تسجيل الدخول لإضافة تقييم.");

  const rating = Math.round(Number(data.rating));
  if (!rating || rating < 1 || rating > 5) {
    throw new Error("يرجى تحديد تقييم من 1 إلى 5 نجوم.");
  }

  // Check if user has completed orders in store
  const customerOrdersCount = await prisma.order.count({
    where: {
      userId: user.id,
      status: { in: ["PAID", "PROCESSING", "IN_PROGRESS", "COMPLETED"] },
    },
  });

  const isVerifiedPurchase = customerOrdersCount > 0;

  const review = await prisma.review.create({
    data: {
      userId: user.id,
      rating,
      comment: data.comment?.trim() || null,
      isStoreReview: true,
      isVerifiedPurchase,
      isApproved: true,
      isHidden: false,
    },
  });

  revalidatePath("/");
  revalidatePath("/admin/reviews");
  return { success: true, review };
}

/**
 * Public: Get Product Reviews & Average Ratings
 */
export async function getProductReviews(productId: string) {
  const reviews = await prisma.review.findMany({
    where: {
      productId,
      isApproved: true,
      isHidden: false,
    },
    include: {
      user: {
        select: { id: true, name: true, image: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const totalReviews = reviews.length;
  const averageRating =
    totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 5.0;

  return {
    reviews,
    totalReviews,
    averageRating: Number(averageRating.toFixed(1)),
  };
}

/**
 * Public: Get Store Reviews
 */
export async function getStoreReviews(limit = 12) {
  const reviews = await prisma.review.findMany({
    where: {
      isStoreReview: true,
      isApproved: true,
      isHidden: false,
    },
    include: {
      user: {
        select: { id: true, name: true, image: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return reviews;
}

/**
 * Admin: Moderate Review (Hide / Unhide / Delete)
 */
export async function moderateReview(reviewId: string, action: "HIDE" | "UNHIDE" | "DELETE") {
  await requireAdminRole(["SUPER_ADMIN", "ADMIN"]);

  if (action === "DELETE") {
    await prisma.review.delete({ where: { id: reviewId } });
  } else {
    await prisma.review.update({
      where: { id: reviewId },
      data: { isHidden: action === "HIDE" },
    });
  }

  revalidatePath("/admin/reviews");
  return { success: true };
}
