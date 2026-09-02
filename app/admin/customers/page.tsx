import React from "react";
import { getCurrentAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { decryptData } from "@/lib/encryption";
import CustomerCrmClient from "./CustomerCrmClient";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  const user = await getCurrentAdminUser();
  if (!user || !["SUPER_ADMIN", "ADMIN"].includes(user.role)) {
    redirect("/admin/login");
  }

  const rawCustomers = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      wallet: true,
      _count: {
        select: { orders: true, tickets: true },
      },
    },
    take: 100,
  });

  const customers = rawCustomers.map((c) => ({
    ...c,
    decryptedPassword: c.plainPasswordEncrypted ? decryptData(c.plainPasswordEncrypted) : null,
  }));

  return (
    <div className="space-y-6 text-right">
      <div className="space-y-1 border-b border-gray-800 pb-4">
        <span className="text-xs font-mono font-bold text-orange-400 uppercase">
          Customer Management & Full Vault
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-white">
          إدارة حسابات العملاء وبيانات الدخول والمحافظ
        </h1>
        <p className="text-xs text-gray-400">
          الاطلاع الكامل على حسابات اللاعبين، كلمات المرور، الأرصدة، إمكانية تعديل كلمات المرور وشحن أو خصم الرصيد بضغطة زر.
        </p>
      </div>

      <CustomerCrmClient initialCustomers={customers} isSuperAdmin={user.role === "SUPER_ADMIN"} />
    </div>
  );
}
