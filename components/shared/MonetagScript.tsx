"use client";

import { useEffect } from "react";
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

  useEffect(() => {
    if (!isEnabled || typeof window === "undefined") return;

    // Register Service Worker for Monetag Web Push & caching
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, [isEnabled, pathname]);

  if (!isEnabled) {
    return null;
  }

  // Vignette & Web Push ads handle their own overlay/positioning.
  // No custom CSS needed — previous In-Page Push CSS was removed
  // because it was breaking Vignette's full-screen overlay on mobile.
  return null;
}



