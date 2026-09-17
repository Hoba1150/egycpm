"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useSettings } from "@/lib/context/SettingsContext";
import Script from "next/script";

export default function MonetagScript() {
  const pathname = usePathname();
  const settings = useSettings();

  // Do NOT render Monetag ads in admin dashboard or API routes
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/api")) {
    return null;
  }

  const isEnabled = settings.monetag_enabled !== "false";
  const customTagCode = (settings.monetag_tag_code || "").trim();

  if (!isEnabled) {
    return null;
  }

  // If the admin pasted a script with src
  if (customTagCode) {
    if (customTagCode.includes("<script") || customTagCode.includes("src=")) {
      const srcRegex = /src=["']([^"']+)["']/i;
      const match = customTagCode.match(srcRegex);
      if (match && match[1]) {
        return (
          <Script
            id="monetag-custom-src"
            src={match[1]}
            strategy="afterInteractive"
          />
        );
      }
    }

    if (customTagCode.startsWith("http") || customTagCode.startsWith("//")) {
      return (
        <Script
          id="monetag-direct-url"
          src={customTagCode}
          strategy="afterInteractive"
        />
      );
    }

    const inlineContent = customTagCode.replace(/<\/?script[^>]*>/gi, "");
    return (
      <Script
        id="monetag-custom-inline"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: inlineContent }}
      />
    );
  }

  return (
    <Script
      id="monetag-sw-reg"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/sw.js').catch(function() {});
            });
          }
        `,
      }}
    />
  );
}

