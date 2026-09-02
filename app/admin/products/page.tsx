import React from "react";
import { getCurrentAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ProductManagerClient from "./ProductManagerClient";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const user = await getCurrentAdminUser();
  if (!user || !["SUPER_ADMIN", "ADMIN", "ORDER_MANAGER"].includes(user.role)) {
    redirect("/admin/login");
  }

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: {
        NOT: [
          { productType: "CPM2" },
          { category: { slug: { contains: "cpm" } } },
          { category: { name: { contains: "CPM" } } },
          { category: { name: { contains: "cpm" } } },
        ],
      },
      orderBy: { createdAt: "desc" },
      include: { category: true },
    }),
    prisma.category.findMany({
      where: {
        NOT: [
          { slug: { contains: "cpm" } },
          { name: { contains: "CPM" } },
          { name: { contains: "cpm" } },
        ],
      },
      orderBy: { order: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6 text-right">
      <div className="space-y-1 border-b border-gray-800 pb-4">
        <span className="text-xs font-mono font-bold text-neon-cyan uppercase">
          Inventory & Fleet Manager
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-white">
          إدارة أسطول السيارات والخدمات
        </h1>
        <p className="text-xs text-gray-400">
          إضافة سيارات معدلة جديدة، تعديل الأسعار، الخصومات، والتحكم بالمخزون.
        </p>
      </div>

      <ProductManagerClient initialProducts={products} categories={categories} />
    </div>
  );
}
