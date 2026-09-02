import React from "react";
import { getCurrentAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import CouponsManagerClient from "./CouponsManagerClient";

export const dynamic = "force-dynamic";

export default async function AdminCouponsPage() {
  const user = await getCurrentAdminUser();
  if (!user || !["SUPER_ADMIN", "ADMIN"].includes(user.role)) {
    redirect("/admin/login");
  }

  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { usages: true },
      },
    },
  });

  return (
    <div className="space-y-6 text-right">
      <div className="space-y-1 border-b border-gray-800 pb-4">
        <span className="text-xs font-mono font-bold text-orange-500 uppercase">
          Promotions & Discount Engine
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-white">
          إدارة كوبونات الخصم والعروض
        </h1>
        <p className="text-xs text-gray-400">
          إنشاء كوبونات خصم بنسبة مئوية أو مبلغ ثابت، وتحديد الحد الأدنى والحد الأقصى للاستخدام.
        </p>
      </div>

      <CouponsManagerClient initialCoupons={coupons} />
    </div>
  );
}
