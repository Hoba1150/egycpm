import React from "react";
import { getCurrentAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ReviewsModeratorClient from "./ReviewsModeratorClient";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  const user = await getCurrentAdminUser();
  if (!user || !["SUPER_ADMIN", "ADMIN"].includes(user.role)) {
    redirect("/admin/login");
  }

  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true, image: true } },
      product: { select: { name: true, slug: true } },
    },
    take: 100,
  });

  return (
    <div className="space-y-6 text-right">
      <div className="space-y-1 border-b border-gray-800 pb-4">
        <span className="text-xs font-mono font-bold text-yellow-400 uppercase">
          Social Proof & Review Moderation
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-white">
          إدارة وتقييمات العملاء
        </h1>
        <p className="text-xs text-gray-400">
          مراجعة تقييمات اللاعبين على السيارات والخدمات، وإخفاء أو حذف أي تقييم مخالف.
        </p>
      </div>

      <ReviewsModeratorClient initialReviews={reviews} />
    </div>
  );
}
