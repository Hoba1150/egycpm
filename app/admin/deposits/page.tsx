import React from "react";
import { getCurrentAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import DepositQueueClient from "./DepositQueueClient";

export const dynamic = "force-dynamic";

export default async function AdminDepositsPage() {
  const user = await getCurrentAdminUser();
  if (!user || !["SUPER_ADMIN", "ADMIN"].includes(user.role)) {
    redirect("/admin/login");
  }

  const deposits = await prisma.depositRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: { id: true, name: true, email: true, image: true },
      },
    },
    take: 100,
  });

  return (
    <div className="space-y-6 text-right">
      <div className="space-y-1 border-b border-gray-800 pb-4">
        <span className="text-xs font-mono font-bold text-green-400 uppercase">
          Deposit Verification Queue
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-white">
          مراجعة واعتماد طلبات الإيداع والشحن
        </h1>
        <p className="text-xs text-gray-400">
          تحقق من سكرين شوت التحويل وأضف الرصيد لمحفظة العميل بنقرة واحدة بأمان تام.
        </p>
      </div>

      <DepositQueueClient initialDeposits={deposits} />
    </div>
  );
}
