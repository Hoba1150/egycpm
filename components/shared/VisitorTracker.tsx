"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export default function VisitorTracker() {
  const pathname = usePathname();
  const lastTracked = useRef<string>("");

  useEffect(() => {
    if (!pathname) return;

    // Ignore admin pages & api routes
    if (pathname.startsWith("/admin") || pathname.startsWith("/api")) {
      return;
    }

    // Avoid duplicate tracking for the same path in rapid succession
    if (lastTracked.current === pathname) {
      return;
    }
    lastTracked.current = pathname;

    // Small timeout (300ms) to ensure page loads completely before sending beacon
    const timeout = setTimeout(() => {
      try {
        const payload = JSON.stringify({
          path: pathname,
          referrer: typeof document !== "undefined" ? document.referrer : "",
        });

        if (typeof navigator !== "undefined" && navigator.sendBeacon) {
          navigator.sendBeacon("/api/track", payload);
        } else {
          fetch("/api/track", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: payload,
            keepalive: true,
          }).catch(() => {});
        }
      } catch {
        // Silent failure - never disturb customer experience
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [pathname]);

  return null;
}
