import React from "react";
import { getCurrentAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { decryptData } from "@/lib/encryption";
import OrderPipelineClient from "./OrderPipelineClient";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const user = await getCurrentAdminUser();
  if (!user || !["SUPER_ADMIN", "ADMIN", "SUPPORT", "ORDER_MANAGER"].includes(user.role)) {
    redirect("/admin/login");
  }

  const rawOrders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
      items: true,
    },
    take: 100,
  });

  const orders = rawOrders.map((o) => ({
    ...o,
    decryptedPassword: o.gamePasswordEncrypted ? decryptData(o.gamePasswordEncrypted) : null,
    decryptedDeliveredPassword: o.deliveredAccountPasswordEncrypted ? decryptData(o.deliveredAccountPasswordEncrypted) : null,
  }));

  return (
    <div className="space-y-6 text-right">
      <div className="space-y-1 border-b border-gray-800 pb-4">
        <span className="text-xs font-mono font-bold text-orange-500 uppercase">
          Order Pipeline & Fulfillment
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-white">
          إدارة وتنفيذ طلبات العملاء
        </h1>
        <p className="text-xs text-gray-400">
          متابعة مراحل التسليم، الاطلاع الآمن على بيانات حسابات الألعاب، وتحديث حالات الطلبات أو الاسترجاع المالي.
        </p>
      </div>

      <OrderPipelineClient initialOrders={orders} />
    </div>
  );
}
