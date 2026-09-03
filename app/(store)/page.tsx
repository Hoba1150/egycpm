import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { getRandomProducts } from "@/lib/actions/product";
import { getStoreSettings } from "@/lib/actions/settings";
import HeroSection from "@/components/store/HeroSection";
import HomeProductSlider from "@/components/store/HomeProductSlider";
import WhyChooseUs from "@/components/store/WhyChooseUs";
import FAQSection from "@/components/store/FAQSection";

// Edge CDN Caching (60 seconds ISR): Serves static HTML directly from Vercel Edge Cache with 0 DB queries on visits
export const revalidate = 60;

export default async function HomePage() {
  let user = null;
  let showcaseProducts: any[] = [];
  let settings: Record<string, string> = {};

  try {
    const results = await Promise.allSettled([
      getCurrentUser(),
      getRandomProducts(10),
      getStoreSettings(),
    ]);

    if (results[0].status === "fulfilled") user = results[0].value;
    if (results[1].status === "fulfilled" && Array.isArray(results[1].value)) {
      showcaseProducts = results[1].value;
    }
    if (results[2].status === "fulfilled" && results[2].value) {
      settings = results[2].value;
    }
  } catch (err) {
    console.error("HomePage fetch error:", err);
  }

  return (
    <div className="pb-12 text-right space-y-6 sm:space-y-8">
      {/* 1. Top Section: Wallet Balance + Hero + Image Slideshow */}
      <HeroSection user={user} initialSettings={settings} />

      {/* 2. Product Showcase Carousel Slider (View Only) */}
      {showcaseProducts.length > 0 && (
        <HomeProductSlider products={showcaseProducts} />
      )}

      {/* 3. Bottom Information (3 Concise Features & FAQ) */}
      <WhyChooseUs settings={settings} />
      <FAQSection settings={settings} />
    </div>
  );
}


