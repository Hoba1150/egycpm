"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSettings } from "@/lib/context/SettingsContext";
import {
  Sparkles,
  ExternalLink,
  X,
  Megaphone,
  ChevronLeft,
  MessageCircle,
  Eye,
} from "lucide-react";

/**
 * 1. Top Panorama Bar (شريط بانوراما علوي فائق الأناقة والجاذبية)
 */
export function TopPanoramaAdBanner() {
  const settings = useSettings();
  const [isDismissed, setIsDismissed] = useState(false);

  // Check if dismissed in current session
  useEffect(() => {
    try {
      const dismissed = sessionStorage.getItem("cpm_top_ad_dismissed");
      if (dismissed === "true") setIsDismissed(true);
    } catch {}
  }, []);

  const isEnabled = settings.ad_top_enabled === "true";
  if (!isEnabled || isDismissed) return null;

  const text = settings.ad_top_text || "مساحة إعلانية متاحة: أعلن عن خدماتك أو قناتك أمام آلاف الزوار يومياً!";
  const badge = settings.ad_top_badge || "إعلان مميز ⭐";
  const link = settings.ad_top_link || `https://wa.me/20${(settings.ad_booking_whatsapp || "01288212101").replace(/\D/g, "").replace(/^0/, "")}?text=${encodeURIComponent("مرحباً، أريد الاستفسار عن حجز المساحة الإعلانية العلوية في متجر EGY CPM")}`;
  const cta = settings.ad_top_cta || "احجز إعلانك الآن ↗";
  const imageUrl = settings.ad_top_image;
  const isDismissible = settings.ad_top_dismissible !== "false";

  const handleDismiss = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDismissed(true);
    try {
      sessionStorage.setItem("cpm_top_ad_dismissed", "true");
    } catch {}
  };

  return (
    <aside aria-label="إعلان مميز" className="relative z-40 w-full overflow-hidden bg-gradient-to-r from-amber-600/90 via-orange-600/90 to-red-700/90 text-white shadow-md border-b border-white/10">
      {/* Background image if provided */}
      {imageUrl && (
        <div
          className="absolute inset-0 opacity-20 bg-cover bg-center pointer-events-none"
          style={{ backgroundImage: `url(${imageUrl})` }}
        />
      )}

      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between gap-3 text-xs">
        {/* Content Link */}
        <a
          href={link}
          target={link.startsWith("http") ? "_blank" : undefined}
          rel="noreferrer"
          className="flex-1 flex items-center justify-center sm:justify-start gap-2 sm:gap-3 group hover:opacity-95 transition"
        >
          <span className="px-2 py-0.5 rounded-full bg-black/40 text-amber-300 border border-amber-400/40 text-[10px] font-black shrink-0 flex items-center gap-1 shadow-sm">
            <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
            <span>{badge}</span>
          </span>

          <span className="font-bold truncate text-[11px] sm:text-xs">
            {text}
          </span>

          <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-black text-amber-200 underline underline-offset-2 shrink-0 group-hover:translate-x-[-2px] transition-transform">
            <span>{cta}</span>
            <ExternalLink className="w-3 h-3" />
          </span>
        </a>

        {/* Dismiss Button */}
        {isDismissible && (
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="إغلاق الإعلان"
            className="p-1 rounded-md text-white/70 hover:text-white hover:bg-black/30 transition shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </aside>
  );
}

/**
 * 2. Mid-Store Panorama Banner (بانر أفقي بانوراما عريض Leaderboard)
 * Fits smoothly between sections on Home, Shop, Product pages.
 */
export function PanoramaAdBanner({
  slotLocation = "home",
  className = "",
}: {
  slotLocation?: "home" | "shop" | "product";
  className?: string;
}) {
  const settings = useSettings();

  const isEnabled = settings.ad_mid_enabled === "true";
  const targetPages = settings.ad_mid_show_pages || "all";

  // Check page targeting
  if (!isEnabled) return null;
  if (targetPages !== "all" && targetPages !== slotLocation) return null;

  const bookingWhatsapp = settings.ad_booking_whatsapp || "01288212101";
  const defaultBookingLink = `https://wa.me/20${bookingWhatsapp.replace(/\D/g, "").replace(/^0/, "")}?text=${encodeURIComponent(`مرحباً، أريد حجز المساحة الإعلانية البانورامية في قسم (${slotLocation}) بمتجر EGY CPM`)}`;

  const imageUrl = settings.ad_mid_image;
  const link = settings.ad_mid_link || defaultBookingLink;
  const title = settings.ad_mid_title || "مساحة إعلانية بانورامية كبرى متاحة الآن";
  const desc = settings.ad_mid_desc || "احصل على وصول فوري لأكثر من 50,000 مهتم بألعاب السيارات وخدمات الجيمنج.";
  const cta = settings.ad_mid_cta || (imageUrl ? "زيارة المعلن ↗" : "احجز هذه المساحة الإعلانية 💬");

  return (
    <div className={`w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 my-4 sm:my-6 ${className}`}>
      <div className="relative group rounded-2xl sm:rounded-3xl overflow-hidden border border-amber-500/30 bg-gradient-to-r from-[#14120c] via-[#1c1810] to-[#0f1218] p-4 sm:p-6 shadow-xl transition hover:border-amber-500/60">
        
        {/* Glow corner */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Image banner mode */}
        {imageUrl ? (
          <a
            href={link}
            target={link.startsWith("http") ? "_blank" : undefined}
            rel="noreferrer"
            className="block relative overflow-hidden rounded-xl sm:rounded-2xl"
          >
            <div className="relative aspect-[16/4] sm:aspect-[21/5] w-full max-h-[160px] sm:max-h-[200px] overflow-hidden rounded-xl">
              <img
                src={imageUrl}
                alt={title}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-[1.015] transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

              {/* Badges on image */}
              <div className="absolute top-2 sm:top-3 right-2 sm:right-3 z-10 flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-black/80 text-amber-300 border border-amber-500/40 text-[10px] font-black flex items-center gap-1 backdrop-blur-sm">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>إعلان راعي / SPONSORED</span>
                </span>
              </div>

              {/* Title & CTA on image */}
              <div className="absolute bottom-2 sm:bottom-3 inset-x-3 sm:inset-x-4 z-10 flex items-center justify-between gap-3 text-right">
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-black text-white truncate drop-shadow-md">
                    {title}
                  </h4>
                  {desc && (
                    <p className="text-[10px] sm:text-[11px] text-gray-300 truncate hidden sm:block">
                      {desc}
                    </p>
                  )}
                </div>
                <span className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs shrink-0 flex items-center gap-1 shadow-lg transition">
                  <span>{cta}</span>
                  <ExternalLink className="w-3 h-3" />
                </span>
              </div>
            </div>
          </a>
        ) : (
          /* Text / Showcase Banner Mode (Directly attractive to advertisers) */
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-right">
            <div className="space-y-1.5 w-full sm:w-auto">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] font-black">
                <Megaphone className="w-3 h-3" />
                <span>مساحة إعلانية بانورامية مميزة</span>
              </div>
              <h3 className="text-base sm:text-xl font-black text-white">
                {title}
              </h3>
              <p className="text-xs text-gray-400 max-w-2xl leading-relaxed">
                {desc}
              </p>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end shrink-0">
              <a
                href={link}
                target={link.startsWith("http") ? "_blank" : undefined}
                rel="noreferrer"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-xs transition flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 active:scale-95"
              >
                <MessageCircle className="w-4 h-4" />
                <span>{cta}</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 3. Vertical / Skyscraper Ad Banner (إعلان رأسي طويل جانبي للشاشات الكبيرة)
 * Designed to float on desktop side rails with a close/minimize button, completely non-intrusive.
 */
export function VerticalSkyscraperAd() {
  const settings = useSettings();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const isEnabled = settings.ad_vertical_enabled === "true";
  if (!isEnabled || isDismissed) return null;

  const side = settings.ad_vertical_side === "left" ? "left-3" : "right-3";
  const imageUrl = settings.ad_vertical_image || "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=400";
  const bookingWhatsapp = settings.ad_booking_whatsapp || "01288212101";
  const defaultBookingLink = `https://wa.me/20${bookingWhatsapp.replace(/\D/g, "").replace(/^0/, "")}?text=${encodeURIComponent("مرحباً، أريد الاستفسار عن حجز المساحة الإعلانية الرأسية (Skyscraper) في متجر EGY CPM")}`;
  const link = settings.ad_vertical_link || defaultBookingLink;
  const title = settings.ad_vertical_title || "مساحة إعلانية مميزة";

  return (
    <aside
      aria-label="إعلان جانبي"
      className={`hidden 2xl:block fixed top-24 ${side} z-30 transition-all duration-300`}
      style={{ width: isMinimized ? "42px" : "160px" }}
    >
      <div className="relative rounded-2xl overflow-hidden border border-amber-500/40 bg-[#0d1017] shadow-2xl">
        {/* Controls Bar */}
        <div className="flex items-center justify-between p-1.5 bg-black/80 border-b border-gray-800 text-[10px]">
          <button
            type="button"
            onClick={() => setIsMinimized(!isMinimized)}
            className="text-gray-400 hover:text-white p-0.5 rounded"
            title={isMinimized ? "توسيع الإعلان" : "تصغير الإعلان"}
          >
            <ChevronLeft className={`w-3.5 h-3.5 transition-transform ${isMinimized ? "rotate-180" : ""}`} />
          </button>

          {!isMinimized && (
            <span className="text-[9px] font-mono text-amber-400 font-bold">
              SPONSORED
            </span>
          )}

          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="text-gray-400 hover:text-red-400 p-0.5 rounded"
            title="إغلاق الإعلان"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Main Content */}
        {!isMinimized ? (
          <a
            href={link}
            target={link.startsWith("http") ? "_blank" : undefined}
            rel="noreferrer"
            className="block group relative"
          >
            <div className="relative w-[160px] h-[460px] overflow-hidden bg-black/40">
              <img
                src={imageUrl}
                alt={title}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30 pointer-events-none" />

              <div className="absolute bottom-2 inset-x-2 z-10 text-center space-y-1">
                <span className="text-[10px] font-black text-white block leading-tight truncate">
                  {title}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-black text-[10px] block shadow transition">
                  زيارة الإعلان ↗
                </span>
              </div>
            </div>
          </a>
        ) : (
          <button
            type="button"
            onClick={() => setIsMinimized(false)}
            className="w-full py-6 flex flex-col items-center justify-center gap-2 text-amber-400 hover:text-white"
          >
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span className="text-[10px] font-bold [writing-mode:vertical-lr] rotate-180">
              إعلان مميز
            </span>
          </button>
        )}
      </div>
    </aside>
  );
}
