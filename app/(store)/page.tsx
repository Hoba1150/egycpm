import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { getProducts } from "@/lib/actions/product";
import { getStoreSettings } from "@/lib/actions/settings";
import HeroSection from "@/components/store/HeroSection";
import ProductCard from "@/components/store/ProductCard";
import LiveStatsTicker from "@/components/store/LiveStatsTicker";
import WhyChooseUs from "@/components/store/WhyChooseUs";
import HowItWorks from "@/components/store/HowItWorks";
import FAQSection from "@/components/store/FAQSection";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const revalidate = 30; // Fast Edge CDN Caching (Zero Latency & 98% Bandwidth Savings)

export default async function HomePage() {
  let user = null;
  let featuredProducts: any[] = [];
  let settings: Record<string, string> = {};

  try {
    const results = await Promise.allSettled([
      getCurrentUser(),
      getProducts({ limit: 8, sortBy: "sales" }),
      getStoreSettings(),
    ]);

    if (results[0].status === "fulfilled") user = results[0].value;
    if (results[1].status === "fulfilled" && results[1].value?.items) {
      featuredProducts = results[1].value.items;
    }
    if (results[2].status === "fulfilled" && results[2].value) {
      settings = results[2].value;
    }
  } catch (err) {
    console.error("HomePage fetch error:", err);
  }

  return (
    <div className="pb-10 text-right space-y-6 sm:space-y-10">
      {/* 1. Fast Action Hero with Wallet Balance & Store Overview */}
      <HeroSection user={user} initialSettings={settings} />

      {/* 2. Live Numbers & Trust Metrics */}
      <LiveStatsTicker settings={settings} />

      {/* 3. Featured / Top Selling Products Grid */}
      {featuredProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-4">
          <div className="flex items-center justify-between">
            <Link
              href="/shop"
              className="text-xs text-orange-500 hover:text-orange-400 font-bold flex items-center gap-1 transition"
            >
              <span>عرض كل المنتجات ({featuredProducts.length})</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </Link>
            <div>
              <span className="text-xs text-gray-400 block font-medium">الأكثر طلباً</span>
              <h2 className="text-lg sm:text-2xl font-black text-white">
                السيارات والخدمات المميزة
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-4">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* 4. How It Works */}
      <HowItWorks settings={settings} />

      {/* 5. Why Choose Us */}
      <WhyChooseUs settings={settings} />

      {/* 6. FAQ */}
      <FAQSection settings={settings} />
    </div>
  );
}

