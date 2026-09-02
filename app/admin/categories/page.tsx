import React from "react";
import { getCurrentAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import CategoriesManagerClient from "./CategoriesManagerClient";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const user = await getCurrentAdminUser();
  if (!user || !["SUPER_ADMIN", "ADMIN"].includes(user.role)) {
    redirect("/admin/login");
  }

  const categories = await prisma.category.findMany({
    where: {
      NOT: [
        { slug: { contains: "cpm" } },
        { name: { contains: "CPM" } },
        { name: { contains: "cpm" } },
      ],
    },
    orderBy: { order: "asc" },
    include: {
      _count: {
        select: { products: true },
      },
    },
  });

  return (
    <div className="space-y-6 text-right">
      <div className="space-y-1 border-b border-gray-800 pb-4">
        <span className="text-xs font-mono font-bold text-orange-500 uppercase">
          Dynamic Taxonomy
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-white">
          إدارة الأقسام والتصنيفات
        </h1>
        <p className="text-xs text-gray-400">
          إضافة وتعديل أقسام المتجر بشكل ديناميكي لتوسيع المتجر مستقبلاً.
        </p>
      </div>

      <CategoriesManagerClient initialCategories={categories} />
    </div>
  );
}
