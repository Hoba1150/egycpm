import React from "react";
import { prisma } from "@/lib/prisma";
import { getProducts } from "@/lib/actions/product";
import ProductCard from "@/components/store/ProductCard";
import Link from "next/link";
import { Sparkles, Car, Zap, Key, Flame, ArrowLeft, ShieldCheck, FolderTree } from "lucide-react";

export const dynamic = "force-dynamic";

interface CPM2PageProps {
  searchParams: {
    cat?: string;
    search?: string;
    sortBy?: "newest" | "price_asc" | "price_desc" | "sales" | "discount";
  };
}

export default async function CPM2Page({ searchParams }: CPM2PageProps) {
  // Fetch all CPM2 categories from database dynamically
  const allCategories = await prisma.category.findMany({
    where: {
      isActive: true,
      OR: [
        { slug: { contains: "cpm" } },
        { name: { contains: "CPM" } },
        { name: { contains: "cpm" } },
      ],
    },
    orderBy: { order: "asc" },
    include: { _count: { select: { products: true } } },
  });

  // Fetch products: by selected category or all CPM2 products
  let products: any[] = [];

  if (searchParams.cat) {
    // Show products of selected category
    const res = await getProducts({
      categorySlug: searchParams.cat,
      isCpm2: true,
      sortBy: searchParams.sortBy || "newest",
      search: searchParams.search,
      limit: 60,
    });
    products = res.items;
  } else {
    // Show ALL CPM2 products across all CPM categories + productType=CPM2
    const cpmCategoryIds = allCategories.map((c) => c.id);

    const allCpmProducts = await prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { productType: "CPM2" },
          ...(cpmCategoryIds.length > 0
            ? [{ categoryId: { in: cpmCategoryIds } }]
            : []),
        ],
      },
      orderBy:
        searchParams.sortBy === "price_asc"
          ? { price: "asc" }
          : searchParams.sortBy === "price_desc"
          ? { price: "desc" }
          : searchParams.sortBy === "sales"
          ? { totalSales: "desc" }
          : { createdAt: "desc" },
      include: { category: true },
      take: 60,
    });

    // Parse images for each product
    products = allCpmProducts.map((p) => {
      let imagesArray: string[] = [];
      try {
        imagesArray = JSON.parse(p.images || "[]");
        if (!Array.isArray(imagesArray)) imagesArray = [p.images];
      } catch {
        imagesArray = [p.images];
      }
      return { ...p, imagesArray };
    });
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 text-right space-y-6">
      {/* CPM 2 Hero Header */}
      <div className="relative rounded-3xl bg-gradient-to-r from-[#121624] via-[#10141f] to-[#0c0e14] border border-orange-500/40 p-6 sm:p-8 overflow-hidden shadow-2xl card-drift-accent">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-black font-mono">
            <Flame className="w-3.5 h-3.5 animate-pulse text-orange-500" />
            <span>CAR PARKING MULTIPLAYER 2</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight">
            قسم سيارات وحسابات <span className="text-orange-500">CPM 2</span> الحصرية
          </h1>

          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
            استكشف أحدث سيارات وتعديلات وكوينز وحسابات لعبة Car Parking Multiplayer 2 الجديدة. تسليم فوري مع ضمان الحماية ضد الباند 100%.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
            <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-xl">
              <ShieldCheck className="w-4 h-4" />
              <span>تسليم مباشر لحسابك أو حساب جديد</span>
            </div>
            <div className="flex items-center gap-1.5 text-orange-400 bg-orange-500/10 border border-orange-500/20 px-3 py-1 rounded-xl">
              <Zap className="w-4 h-4" />
              <span>دعم كامل لكافة نسخ اللعبة</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Category Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {/* All tab - always first */}
        <Link
          href="/cpm2"
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition border ${
            !searchParams.cat
              ? "bg-orange-500 text-black border-orange-500 shadow-md"
              : "bg-[#0f1218] border-gray-800 text-gray-300 hover:border-orange-500/50 hover:text-white"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>جميع عروض CPM 2</span>
        </Link>

        {/* Dynamic categories from DB */}
        {allCategories.map((cat) => (
          <Link
            key={cat.id}
            href={`/cpm2?cat=${cat.slug}`}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition border ${
              searchParams.cat === cat.slug
                ? "bg-orange-500 text-black border-orange-500 shadow-md"
                : "bg-[#0f1218] border-gray-800 text-gray-300 hover:border-orange-500/50 hover:text-white"
            }`}
          >
            <FolderTree className="w-3.5 h-3.5" />
            <span>{cat.name}</span>
            {cat._count.products > 0 && (
              <span className="text-[10px] opacity-70">({cat._count.products})</span>
            )}
          </Link>
        ))}
      </div>

      {/* Products Grid */}
      {products.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#0f1218] border border-gray-800 space-y-3">
          <Car className="w-12 h-12 text-gray-600 mx-auto" />
          <h3 className="text-base font-bold text-white">
            {searchParams.cat
              ? `لا توجد منتجات في هذا القسم بعد`
              : "جاري إضافة أسطول منتجات CPM 2"}
          </h3>
          <p className="text-xs text-gray-400">
            يمكنك تصفح باقي أقسام المتجر أو التواصل مع الدعم الفني لطلب سيارة مخصصة.
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500 text-black font-bold text-xs hover:bg-orange-600 transition"
          >
            <span>تصفح المتجر بالكامل</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p as any} />
          ))}
        </div>
      )}
    </div>
  );
}

