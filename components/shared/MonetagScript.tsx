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
      {/* Universal Multi-Platform Responsive Ad Styling (Mobile / Tablet / Desktop) */}
      <style jsx global>{`
        /* --- 1. MOBILE PHONES (Up to 640px) --- */
        @media (max-width: 640px) {
          div[class*="in-page-push"],
          div[class*="inpage_push"],
          div[id*="inpage_push"],
          div[class*="monetag"],
          div[class*="notif-wrapper"] {
            bottom: 66px !important;
            right: 0 !important;
            left: 0 !important;
            margin-left: auto !important;
            margin-right: auto !important;
            max-width: 94vw !important;
            width: auto !important;
            z-index: 35 !important;
            border-radius: 14px !important;
            box-shadow: 0 12px 30px rgba(0, 0, 0, 0.75) !important;
            direction: rtl !important;
          }
        }

        /* --- 2. TABLETS (641px to 1024px) --- */
        @media (min-width: 641px) and (max-width: 1024px) {
          div[class*="in-page-push"],
          div[class*="inpage_push"],
          div[id*="inpage_push"],
          div[class*="monetag"],
          div[class*="notif-wrapper"] {
            bottom: 24px !important;
            right: 20px !important;
            left: auto !important;
            max-width: 380px !important;
            width: auto !important;
            z-index: 35 !important;
            border-radius: 16px !important;
            box-shadow: 0 14px 35px rgba(0, 0, 0, 0.6) !important;
            direction: rtl !important;
          }
        }

        /* --- 3. DESKTOP / PC (1025px and up) --- */
        @media (min-width: 1025px) {
          div[class*="in-page-push"],
          div[class*="inpage_push"],
          div[id*="inpage_push"],
          div[class*="monetag"],
          div[class*="notif-wrapper"] {
            bottom: 28px !important;
            right: 28px !important;
            left: auto !important;
            max-width: 420px !important;
            width: auto !important;
            z-index: 35 !important;
            border-radius: 16px !important;
            box-shadow: 0 16px 40px rgba(0, 0, 0, 0.5) !important;
            direction: rtl !important;
            transition: transform 0.2s ease, box-shadow 0.2s ease !important;
          }
        }
      `}</style>
    </>
  );
}


