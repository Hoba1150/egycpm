import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { getRandomProducts, getCategories } from "@/lib/actions/product";
import { getStoreSettings } from "@/lib/actions/settings";
import HeroSection from "@/components/store/HeroSection";
import HomeShowcaseCard from "@/components/store/HomeShowcaseCard";
import LiveStatsTicker from "@/components/store/LiveStatsTicker";
import HomeCategoryShowcase from "@/components/store/HomeCategoryShowcase";
import WhyChooseUs from "@/components/store/WhyChooseUs";
import FAQSection from "@/components/store/FAQSection";
import Link from "next/link";
import { ArrowLeft, Sparkles, Store, ShoppingBag } from "lucide-react";

// Edge CDN Caching (60 seconds ISR): Serves static HTML directly from Vercel Edge Cache with 0 DB queries on visits
export const revalidate = 60;

export default async function HomePage() {
  let user = null;
  let showcaseProducts: any[] = [];
  let settings: Record<string, string> = {};
  let categories: any[] = [];

  try {
    const results = await Promise.allSettled([
      getCurrentUser(),
      getRandomProducts(8),
      getStoreSettings(),
      getCategories(),
    ]);

    if (results[0].status === "fulfilled") user = results[0].value;
    if (results[1].status === "fulfilled" && Array.isArray(results[1].value)) {
      showcaseProducts = results[1].value;
    }
    if (results[2].status === "fulfilled" && results[2].value) {
      settings = results[2].value;
    }
    if (results[3].status === "fulfilled" && results[3].value) {
      categories = results[3].value;
    }
  } catch (err) {
    console.error("HomePage fetch error:", err);
  }

  return (
    <div className="pb-12 text-right space-y-6 sm:space-y-10">
      {/* 1. Fast Action Hero with Wallet Balance & Cinematic Showcase */}
      <HeroSection user={user} initialSettings={settings} />

      {/* 2. Compact Live Numbers & Trust Metrics */}
      <LiveStatsTicker settings={settings} />

      {/* 3. Modern Clean Categories Grid (No Images, pure fast vector tiles) */}
      {categories.length > 0 && (
        <HomeCategoryShowcase categories={categories} />
      )}

      {/* 4. Random Product Showcase (View Only — Forces entry to full store) */}
      {showcaseProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-4">
          <div className="flex items-center justify-between">
            <Link
              href="/shop"
              className="px-3.5 py-1.5 rounded-xl bg-red-600/10 hover:bg-red-600/20 text-red-500 hover:text-red-400 border border-red-500/30 text-xs font-bold flex items-center gap-1.5 transition group"
            >
              <span>فتح المتجر الكامل</span>
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            </Link>
            <div>
              <span className="text-[11px] text-red-500 font-mono font-bold block">
                معاينة عشوائية
              </span>
              <h2 className="text-base sm:text-xl font-black text-white">
                نماذج من سيارات وخدمات المتجر
              </h2>
            </div>
          </div>

          {/* Random products grid with View-Only Cards (No direct buy buttons) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-4">
            {showcaseProducts.map((product) => (
              <HomeShowcaseCard key={product.id} product={product} />
            ))}
          </div>

          {/* Full Store Entry Callout Banner */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-red-950/40 via-[#0d1017] to-black border border-red-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-right shadow-lg">
            <div className="space-y-0.5">
              <h3 className="text-sm sm:text-base font-black text-white">
                هل تبحث عن سيارة أو تعديل معين؟
              </h3>
              <p className="text-xs text-gray-400">
                تصفح قائمة المتجر الكاملة مع إمكانية الفلترة والبحث والإضافة الفورية للسلة.
              </p>
            </div>
            <Link
              href="/shop"
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-black text-xs hover:from-red-500 hover:to-red-600 transition shadow-[0_0_15px_rgba(220,38,38,0.4)] flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>تصفح وشراء من المتجر</span>
            </Link>
          </div>
        </section>
      )}

      {/* 5. Why Choose Us (Lightweight & Compact) */}
      <WhyChooseUs settings={settings} />

      {/* 6. FAQ */}
      <FAQSection settings={settings} />
    </div>
  );
}

