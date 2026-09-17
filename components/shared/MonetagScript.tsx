"use client";

import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSettings } from "@/lib/context/SettingsContext";

export default function MonetagScript() {
  const pathname = usePathname();
  const settings = useSettings();

  // Do NOT render Monetag ads in admin dashboard or API routes
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/api")) {
    return null;
  }

  const isEnabled = settings.monetag_enabled !== "false";
  const customTagCode = (settings.monetag_tag_code || "").trim();
  const zoneId = settings.monetag_zone_id || "11823951";

  useEffect(() => {
    if (!isEnabled || typeof window === "undefined") return;

    // Register Service Worker for Monetag push & caching
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    // Check if script already loaded to avoid duplicate tags on client navigations
    const existingScript = document.querySelector(`script[data-zone="${zoneId}"]`);
    if (existingScript) return;

    // Dynamically inject Monetag In-Page Push / MultiTag script
    try {
      const script = document.createElement("script");
      script.dataset.zone = zoneId;
      
      // Extract custom script src if provided, otherwise use official high-speed CDN
      let scriptSrc = "https://nap5k.com/tag.min.js";
      if (customTagCode) {
        const srcMatch = customTagCode.match(/src=["']([^"']+)["']/i);
        if (srcMatch && srcMatch[1]) {
          scriptSrc = srcMatch[1];
        } else if (customTagCode.startsWith("http") || customTagCode.startsWith("//")) {
          scriptSrc = customTagCode;
        }
      }

      script.src = scriptSrc;
      script.async = true;
      (document.documentElement || document.body).appendChild(script);
    } catch (e) {
      console.error("Monetag ad script load error:", e);
    }
  }, [isEnabled, customTagCode, zoneId, pathname]);

  if (!isEnabled) {
    return null;
  }

  return (
    <>
      {/* Mobile-First Ad Spacing & Alignment Styles */}
      <style jsx global>{`
        /* Keep mobile bottom navigation accessible when In-Page Push appears */
        @media (max-width: 768px) {
          div[class*="in-page-push"],
          div[class*="inpage_push"],
          div[id*="inpage_push"],
          div[class*="monetag"] {
            bottom: 64px !important;
            z-index: 25 !important;
            max-width: 94vw !important;
            margin: 0 auto !important;
          }
        }
      `}</style>
    </>
  );
}


