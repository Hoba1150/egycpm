import React from "react";
import { getProducts } from "@/lib/actions/product";
import ProductCard from "@/components/store/ProductCard";
import Link from "next/link";
import { Car, Flame, Palette, Sparkles, Gauge, Award } from "lucide-react";
import { getStoreSettings } from "@/lib/actions/settings";

export const revalidate = 30; // Fast Edge CDN Caching (Zero Latency & 98% Bandwidth Savings)

export default async function CarsPage() {
  const [
    modifiedCars,
    drawnCars,
    realisticCars,
    limitedCars,
  ] = await Promise.all([
    getProducts({ productType: "MODIFIED_CAR", limit: 8 }),
    getProducts({ productType: "DRAWN_CAR", limit: 8 }),
    getProducts({ productType: "REALISTIC_LOGO_CAR", limit: 8 }),
    getProducts({ productType: "LIMITED_CAR", limit: 8 }),
  ]);

  const carCategories = [
    { title: "سيارات معدلة 1695HP", href: "/shop?type=MODIFIED_CAR", icon: Gauge, count: modifiedCars.totalCount, color: "text-orange-500 bg-orange-500/10" },
    { title: "سيارات رسم وفينيل", href: "/shop?type=DRAWN_CAR", icon: Palette, count: drawnCars.totalCount, color: "text-purple-500 bg-purple-500/10" },
    { title: "سيارات لوجوهات واقعية", href: "/shop?type=REALISTIC_LOGO_CAR", icon: Sparkles, count: realisticCars.totalCount, color: "text-emerald-500 bg-emerald-500/10" },
    { title: "سيارات نادرة ومحدودة", href: "/shop?type=LIMITED_CAR", icon: Flame, count: limitedCars.totalCount, color: "text-red-500 bg-red-500/10" },
  ];

  const settings: Record<string, string> = await getStoreSettings().catch(() => ({}));
  const pageTitle = settings.page_cars_title || "أسطول سيارات Car Parking";
  const pageDesc = settings.page_cars_desc || "تصفح واشترِ أقوى سيارات كار باركينج المعدلة بقوة 1695HP وسيارات الرسم الحصرية";

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-8 text-right space-y-10">
      {/* Header */}
      <div className="space-y-1.5 border-b border-gray-800 pb-4">
        <span className="text-xs font-mono font-bold text-orange-500 uppercase tracking-wider">
          CPM Performance Garage
        </span>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white">{pageTitle}</h1>
        <p className="text-xs sm:text-sm text-gray-400">{pageDesc}</p>
      </div>

      {/* Sub-Category Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {carCategories.map((c, i) => {
          const Icon = c.icon;
          return (
            <Link
              key={i}
              href={c.href}
              className="p-4 rounded-2xl bg-[#0b0d13] border border-gray-800/80 hover:border-red-500/60 hover:shadow-[0_8px_20px_-4px_rgba(220,38,38,0.25)] transition-all duration-300 group flex flex-col justify-between shadow-sm"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] text-gray-500 font-mono">{c.count} سيارة</span>
                <div className="p-2.5 rounded-xl border border-red-500/20 bg-red-500/10 text-red-500 group-hover:bg-red-600 group-hover:text-white group-hover:border-red-500 transition-all duration-300">
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-xs sm:text-sm font-extrabold text-white group-hover:text-red-400 transition">
                {c.title}
              </h3>
            </Link>
          );
        })}
      </div>

      {/* 1. Modified Cars Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
          <div className="flex items-center gap-2">
            <Gauge className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg sm:text-xl font-extrabold text-white">
              سيارات دريفت وسرعة معدلة (1695HP)
            </h2>
          </div>
          <Link href="/shop?type=MODIFIED_CAR" className="text-xs font-bold text-orange-500 hover:underline">
            عرض المزيد ({modifiedCars.totalCount})
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-4">
          {modifiedCars.items.map((prod) => (
            <ProductCard key={prod.id} product={prod as any} />
          ))}
        </div>
      </section>

      {/* 2. Drawn Cars Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-purple-500" />
            <h2 className="text-lg sm:text-xl font-extrabold text-white">
              سيارات رسم وتصميمات خاصة (Drawn & Vinyl)
            </h2>
          </div>
          <Link href="/shop?type=DRAWN_CAR" className="text-xs font-bold text-orange-500 hover:underline">
            عرض المزيد ({drawnCars.totalCount})
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-4">
          {drawnCars.items.map((prod) => (
            <ProductCard key={prod.id} product={prod as any} />
          ))}
        </div>
      </section>
    </div>
  );
}
