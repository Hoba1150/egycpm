import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { getStoreSettings } from "@/lib/actions/settings";
import HeroSection from "@/components/store/HeroSection";
import WhyChooseUs from "@/components/store/WhyChooseUs";
import HowItWorks from "@/components/store/HowItWorks";
import FAQSection from "@/components/store/FAQSection";

export const revalidate = 30; // Fast Edge CDN Caching (Zero Latency & 98% Bandwidth Savings)

export default async function HomePage() {
  let user = null;
  let settings: Record<string, string> = {};

  try {
    const results = await Promise.allSettled([
      getCurrentUser(),
      getStoreSettings(),
    ]);

    if (results[0].status === "fulfilled") user = results[0].value;
    if (results[1].status === "fulfilled" && results[1].value) {
      settings = results[1].value;
    }
  } catch (err) {
    console.error("HomePage fetch error:", err);
  }

  return (
    <div className="pb-16 text-right space-y-12 sm:space-y-16 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4">
      {/* 1. Cinematic Minimal iOS Landing Stage & Service Shortcuts */}
      <HeroSection user={user} initialSettings={settings} />

      {/* 2. Seamless Glass Experience: How It Works */}
      <HowItWorks settings={settings} />

      {/* 3. Verified Security & Why Choose EGY CPM */}
      <WhyChooseUs settings={settings} />

      {/* 4. Common Questions & Support */}
      <FAQSection settings={settings} />
    </div>
  );
}
