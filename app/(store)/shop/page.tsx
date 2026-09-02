import React from "react";
import { getProducts, getCategories } from "@/lib/actions/product";
import ProductCard from "@/components/store/ProductCard";
import Link from "next/link";
import { Search, Car, Zap, Key, Flame, Sparkles, Filter, RefreshCw } from "lucide-react";

import ModernCategoryNav from "@/components/store/ModernCategoryNav";

export const revalidate = 30; // Fast Edge CDN Caching (Zero Latency & 98% Bandwidth Savings)

interface ShopPageProps {
  searchParams: {
    category?: string;
    type?: string;
    search?: string;
    sortBy?: "newest" | "price_asc" | "price_desc" | "sales" | "discount";
    minPrice?: string;
    maxPrice?: string;
    inStock?: string;
    page?: string;
  };
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const currentPage = Number(searchParams.page) || 1;

  const [productsRes, categories] = await Promise.all([
    getProducts({
      categorySlug: searchParams.category,
      productType: searchParams.type,
      search: searchParams.search,
      sortBy: searchParams.sortBy || "newest",
      minPrice: searchParams.minPrice ? Number(searchParams.minPrice) : undefined,
      maxPrice: searchParams.maxPrice ? Number(searchParams.maxPrice) : undefined,
      inStockOnly: searchParams.inStock === "true",
      page: currentPage,
      limit: 24,
    }),
    getCategories(),
  ]);

  const productTypeTabs = [
    { label: "جميع الأقسام", value: undefined, icon: Sparkles },
    { label: "سيارات معدلة 1695HP", value: "MODIFIED_CAR", icon: Car },
    { label: "سيارات رسم وفينيل", value: "DRAWN_CAR", icon: Flame },
    { label: "خدمات الشحن والكاش", value: "SERVICE", icon: Zap },
    { label: "حسابات جاهزة VIP", value: "ACCOUNT", icon: Key },
  ];

  const sortOptions = [
    { label: "الأحدث إضافة", value: "newest" },
    { label: "الأكثر مبيعاً", value: "sales" },
    { label: "أعلى نسبة خصم", value: "discount" },
    { label: "السعر: من الأقل للأعلى", value: "price_asc" },
    { label: "السعر: من الأعلى للأقل", value: "price_desc" },
  ];

  const activeType = searchParams.type;
  const activeCategory = searchParams.category;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 text-right space-y-6">
      {/* Header Title */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
          متجر السيارات والخدمات والحسابات
        </h1>
        <p className="text-xs sm:text-sm text-gray-400">
          تصفح كافة السيارات المعدلة وخدمات الشحن والحسابات الجاهزة بتسليم فوري وضمان كامل.
        </p>
      </div>

      {/* Main Unified Product Type Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {productTypeTabs.map((tab, idx) => {
          const Icon = tab.icon;
          const isSelected = activeType === tab.value;
          const href = tab.value ? `/shop?type=${tab.value}` : "/shop";

          return (
            <Link
              key={idx}
              href={href}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 shrink-0 ${
                isSelected
                  ? "bg-red-600 text-white shadow-[0_0_12px_rgba(220,38,38,0.4)] border border-red-500"
                  : "bg-[#0f1218] text-gray-300 border border-gray-800 hover:border-red-500/50 hover:text-white"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Search & Filter Compact Bar */}
      <div className="p-3.5 rounded-2xl bg-[#0f1218] border border-gray-800 space-y-3 shadow-sm">
        <form method="GET" className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* Preserve Type in Search */}
          {activeType && <input type="hidden" name="type" value={activeType} />}

          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              name="search"
              defaultValue={searchParams.search || ""}
              placeholder="ابحث عن سيارة أو خدمة أو حساب..."
              className="w-full pl-3 pr-9 py-2 bg-[#161b24] border border-gray-700 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-500 text-right"
            />
            <Search className="w-4 h-4 absolute right-3 top-2.5 text-gray-400" />
          </div>

          {/* Category Dropdown */}
          <div>
            <select
              name="category"
              defaultValue={searchParams.category || "all"}
              className="w-full px-3 py-2 bg-[#161b24] border border-gray-700 rounded-xl text-xs text-white text-right focus:border-red-500"
            >
              <option value="all">جميع التصنيفات</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By Dropdown & Submit */}
          <div className="flex items-center gap-2">
            <select
              name="sortBy"
              defaultValue={searchParams.sortBy || "newest"}
              className="w-full px-3 py-2 bg-[#161b24] border border-gray-700 rounded-xl text-xs text-white text-right focus:border-red-500"
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="py-2 px-5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs shrink-0 transition shadow-[0_0_12px_rgba(220,38,38,0.3)]"
            >
              تصفية
            </button>
          </div>
        </form>
      </div>

      {/* Modern Interactive Category Navigation Bar (Cockpit HUD Style - No Images) */}
      <div className="space-y-2">
        <ModernCategoryNav 
          categories={categories}
          activeCategory={activeCategory}
          activeType={activeType}
          totalProductsCount={productsRes.totalCount}
        />
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-xs text-gray-400 px-1">
        <span>عرض {productsRes.items.length} من أصل {productsRes.totalCount} منتج متاح</span>
        {(searchParams.search || searchParams.category || searchParams.type) && (
          <Link href="/shop" className="text-red-500 hover:text-red-400 hover:underline flex items-center gap-1 font-bold">
            <RefreshCw className="w-3 h-3" />
            <span>إعادة ضبط الفلاتر</span>
          </Link>
        )}
      </div>

      {/* Products Grid: 2 columns on Mobile, 3 on Tablet, 4-5 on Desktop */}
      {productsRes.items.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-[#0f1218] border border-gray-800 space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-[#161b24] mx-auto flex items-center justify-center text-gray-400">
            <Car className="w-7 h-7 text-red-500" />
          </div>
          <div className="space-y-1">
            <p className="text-base font-bold text-white">
              لا توجد منتجات مطابقة لخيارات البحث
            </p>
            <p className="text-xs text-gray-400">جرب تغيير كلمات البحث أو تصفح جميع الأقسام.</p>
          </div>
          <Link
            href="/shop"
            className="inline-block px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow-[0_0_12px_rgba(220,38,38,0.3)]"
          >
            عرض جميع المنتجات
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-4">
          {productsRes.items.map((prod) => (
            <ProductCard key={prod.id} product={prod as any} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {productsRes.totalPages > 1 && (
        <div className="mt-8 flex justify-center items-center gap-1.5">
          {Array.from({ length: productsRes.totalPages }, (_, i) => i + 1).map((pageNum) => {
            const queryObj: any = { ...searchParams, page: String(pageNum) };
            const queryString = new URLSearchParams(queryObj).toString();

            return (
              <Link
                key={pageNum}
                href={`/shop?${queryString}`}
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs transition ${
                  currentPage === pageNum
                    ? "bg-red-600 text-white font-extrabold shadow-[0_0_10px_rgba(220,38,38,0.4)] border border-red-500"
                    : "bg-[#0f1218] border border-gray-800 text-gray-300 hover:text-white"
                }`}
              >
                {pageNum}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
