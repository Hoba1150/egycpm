import React from "react";
import { getCurrentAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Cpm2AdminClient from "./Cpm2AdminClient";

export const dynamic = "force-dynamic";

export default async function AdminCpm2Page() {
  const user = await getCurrentAdminUser();
  if (!user || !["SUPER_ADMIN", "ADMIN", "ORDER_MANAGER"].includes(user.role)) {
    redirect("/admin/login");
  }

  // Get CPM2 categories only (slug starts with cpm or contains cpm-2)
  const allCategories = await prisma.category.findMany({
    orderBy: { order: "asc" },
    include: {
      _count: { select: { products: true } },
    },
  });

  // CPM2 categories: slug contains "cpm"
  const cpm2Categories = allCategories.filter(
    (c) => c.slug.includes("cpm") || c.name.toLowerCase().includes("cpm")
  );

  // CPM2 products: productType = CPM2 or in a cpm category
  const cpm2CategoryIds = cpm2Categories.map((c) => c.id);
  const products = await prisma.product.findMany({
    where: {
      OR: [
        { productType: "CPM2" },
        { categoryId: { in: cpm2CategoryIds.length > 0 ? cpm2CategoryIds : ["__none__"] } },
      ],
    },
    orderBy: { createdAt: "desc" },
    include: { category: true },
  });

  return (
    <div className="space-y-6 text-right">
      <div className="space-y-1 border-b border-gray-800 pb-4">
        <span className="text-xs font-mono font-bold text-purple-400 uppercase">
          CPM 2 — Exclusive Management Panel
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-white">
          إدارة قسم CPM 2 المستقل
        </h1>
        <p className="text-xs text-gray-400">
          إدارة منتجات وأقسام وتصنيفات CPM 2 بشكل مستقل تمامًا عن المتجر الأساسي.
        </p>
      </div>

      <Cpm2AdminClient
        initialProducts={products}
        allCategories={allCategories}
        cpm2Categories={cpm2Categories}
      />
    </div>
  );
}
