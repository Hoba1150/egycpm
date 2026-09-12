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
  Plus,
  Flame,
  CheckCircle2,
  Share2,
} from "lucide-react";

/**
 * 1. Top Panorama Bar (شريط بانوراما علوي فائق الأناقة والجاذبية - مضبوط بالكامل للهاتف)
 */
export function TopPanoramaAdBanner() {
  const settings = useSettings();
  const [isDismissed, setIsDismissed] = useState(false);

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
  const cta = settings.ad_top_cta || "احجز إعلانك ↗";
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
      {imageUrl && (
        <div
          className="absolute inset-0 opacity-20 bg-cover bg-center pointer-events-none"
          style={{ backgroundImage: `url(${imageUrl})` }}
        />
      )}

      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 py-1.5 sm:py-2 flex items-center justify-between gap-2 text-xs">
        {/* Content Link */}
        <a
          href={link}
          target={link.startsWith("http") ? "_blank" : undefined}
          rel="noreferrer"
          className="flex-1 min-w-0 flex items-center justify-center sm:justify-start gap-1.5 sm:gap-3 group hover:opacity-95 transition"
        >
          <span className="px-1.5 sm:px-2 py-0.5 rounded-full bg-black/40 text-amber-300 border border-amber-400/40 text-[9px] sm:text-[10px] font-black shrink-0 flex items-center gap-1 shadow-sm">
            <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-300 animate-pulse" />
            <span>{badge}</span>
          </span>

          <span className="font-bold truncate text-[11px] sm:text-xs">
            {text}
          </span>

          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-black text-amber-200 underline underline-offset-2 shrink-0 group-hover:translate-x-[-2px] transition-transform">
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
            className="p-1 sm:p-1.5 rounded-md text-white/70 hover:text-white hover:bg-black/30 transition shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </aside>
  );
}

/**
 * 2. Mid-Store Panorama Banner (بانر أفقي بانوراما عريض - مضبوط للهاتف والأجهزة الكبيرة)
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

  if (!isEnabled) return null;
  if (targetPages !== "all" && targetPages !== slotLocation) return null;

  const bookingWhatsapp = settings.ad_booking_whatsapp || "01288212101";
  const defaultBookingLink = `https://wa.me/20${bookingWhatsapp.replace(/\D/g, "").replace(/^0/, "")}?text=${encodeURIComponent(`مرحباً، أريد حجز المساحة الإعلانية البانورامية في قسم (${slotLocation}) بمتجر EGY CPM`)}`;

  const imageUrl = settings.ad_mid_image;
  const link = settings.ad_mid_link || defaultBookingLink;
  const title = settings.ad_mid_title || "مساحة إعلانية بانورامية كبرى متاحة الآن";
  const desc = settings.ad_mid_desc || "احصل على وصول فوري لآلاف المهتمين بألعاب السيارات وخدمات الجيمنج.";
  const cta = settings.ad_mid_cta || (imageUrl ? "زيارة المعلن ↗" : "احجز هذه المساحة 💬");

  return (
    <div className={`w-full max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 my-3 sm:my-6 ${className}`}>
      <div className="relative group rounded-2xl overflow-hidden border border-amber-500/30 bg-gradient-to-r from-[#14120c] via-[#1c1810] to-[#0f1218] p-3 sm:p-6 shadow-xl transition hover:border-amber-500/60">
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        {imageUrl ? (
          <a
            href={link}
            target={link.startsWith("http") ? "_blank" : undefined}
            rel="noreferrer"
            className="block relative overflow-hidden rounded-xl"
          >
            <div className="relative aspect-[16/5] sm:aspect-[21/5] w-full max-h-[130px] sm:max-h-[190px] overflow-hidden rounded-xl">
              <img
                src={imageUrl}
                alt={title}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-[1.015] transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/20 pointer-events-none" />

              <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-black/80 text-amber-300 border border-amber-500/40 text-[9px] sm:text-[10px] font-black flex items-center gap-1 backdrop-blur-sm">
                  <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                  <span>SPONSORED VIP</span>
                </span>
              </div>

              <div className="absolute bottom-2 inset-x-2.5 sm:inset-x-4 z-10 flex items-center justify-between gap-2 text-right">
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs sm:text-sm font-black text-white truncate drop-shadow-md">
                    {title}
                  </h4>
                  {desc && (
                    <p className="text-[10px] text-gray-300 truncate hidden sm:block">
                      {desc}
                    </p>
                  )}
                </div>
                <span className="px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-lg sm:rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-[11px] sm:text-xs shrink-0 flex items-center gap-1 shadow-lg transition">
                  <span>{cta}</span>
                  <ExternalLink className="w-3 h-3" />
                </span>
              </div>
            </div>
          </a>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-right">
            <div className="space-y-1 w-full sm:w-auto">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] font-black">
                <Megaphone className="w-3 h-3" />
                <span>مساحة إعلانية بانورامية كبرى</span>
              </div>
              <h3 className="text-sm sm:text-lg font-black text-white truncate">
                {title}
              </h3>
              <p className="text-[11px] sm:text-xs text-gray-400 line-clamp-1">
                {desc}
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
              <a
                href={link}
                target={link.startsWith("http") ? "_blank" : undefined}
                rel="noreferrer"
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-xs transition flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 active:scale-95"
              >
                <MessageCircle className="w-3.5 h-3.5" />
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
 * 4. Sponsored Stories & Partner Strip (شريط قصص الشركاء والرعاة المعتمدين)
 * Sleek, horizontal-scrolling story circles below the hero billboard. Highly effective on mobile!
 */
export function SponsoredStoriesBar() {
  const settings = useSettings();

  const isEnabled = settings.ad_stories_enabled === "true";
  if (!isEnabled) return null;

  const bookingWhatsapp = settings.ad_booking_whatsapp || "01288212101";
  const defaultBookingLink = `https://wa.me/20${bookingWhatsapp.replace(/\D/g, "").replace(/^0/, "")}?text=${encodeURIComponent("مرحباً، أريد حجز مساحة في شريط قصص الرعاة والشركاء المعتمدين في متجر EGY CPM")}`;

  // Parse partner list or use high-converting defaults
  let partners = [
    {
      name: settings.ad_story1_name || "فالكون جيمينج",
      image: settings.ad_story1_image || "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=150",
      link: settings.ad_story1_link || defaultBookingLink,
      badge: "راعي رسمي",
    },
    {
      name: settings.ad_story2_name || "تيربو كارز",
      image: settings.ad_story2_image || "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=150",
      link: settings.ad_story2_link || defaultBookingLink,
      badge: "شريك موثق",
    },
    {
      name: settings.ad_story3_name || "سيرفر الأساطير",
      image: settings.ad_story3_image || "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=150",
      link: settings.ad_story3_link || defaultBookingLink,
      badge: "مجتمع VIP",
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 py-1">
      <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-2 px-1 text-right">
        {/* Story 0: Permanent "Advertise Here" story trigger */}
        <a
          href={defaultBookingLink}
          target="_blank"
          rel="noreferrer"
          className="flex flex-col items-center gap-1 shrink-0 group"
        >
          <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full p-0.5 bg-gradient-to-tr from-amber-500 via-orange-500 to-red-500 shadow-md group-hover:scale-105 transition-transform">
            <div className="w-full h-full rounded-full bg-[#12161f] border-2 border-black flex items-center justify-center text-amber-400 group-hover:text-amber-300">
              <Plus className="w-6 h-6" />
            </div>
          </div>
          <span className="text-[10px] font-black text-amber-400 group-hover:text-amber-300 truncate max-w-[64px]">
            + أعلن هنا
          </span>
        </a>

        {/* Partner stories */}
        {partners.map((partner, i) => (
          <a
            key={i}
            href={partner.link}
            target={partner.link.startsWith("http") ? "_blank" : undefined}
            rel="noreferrer"
            className="flex flex-col items-center gap-1 shrink-0 group"
          >
            <div className="relative w-13 h-13 sm:w-14 sm:h-14 rounded-full p-0.5 bg-gradient-to-tr from-amber-500 via-yellow-400 to-orange-500 shadow-md group-hover:scale-105 transition-transform">
              <div className="w-full h-full rounded-full overflow-hidden border-2 border-black bg-black">
                <img
                  src={partner.image}
                  alt={partner.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 text-black flex items-center justify-center text-[9px] font-black border border-black shadow">
                ✓
              </span>
            </div>
            <span className="text-[10px] font-bold text-gray-300 group-hover:text-white truncate max-w-[64px]">
              {partner.name}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}

/**
 * 5. In-Feed Native Ad Card (بطاقة إعلانية مدمجة ذكية داخل شبكة المنتجات)
 * Blends 100% harmoniously inside the product grid without breaking mobile or desktop view.
 */
export function InFeedGridAdCard() {
  const settings = useSettings();

  const isEnabled = settings.ad_feed_enabled === "true";
  if (!isEnabled) return null;

  const bookingWhatsapp = settings.ad_booking_whatsapp || "01288212101";
  const defaultBookingLink = `https://wa.me/20${bookingWhatsapp.replace(/\D/g, "").replace(/^0/, "")}?text=${encodeURIComponent("مرحباً، أريد حجز بطاقة إعلانية مدمجة (In-Feed Sponsored Card) في متجر EGY CPM")}`;

  const imageUrl = settings.ad_feed_image || "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=600";
  const title = settings.ad_feed_title || "مساحة إعلانية مدمجة VIP";
  const desc = settings.ad_feed_desc || "أعلن عن منتجاتك أو خدماتك مباشرة أمام المتسوقين.";
  const badge = settings.ad_feed_badge || "راعي معتمد ⭐";
  const link = settings.ad_feed_link || defaultBookingLink;
  const cta = settings.ad_feed_cta || "مشاهدة العرض ↗";

  return (
    <div className="group relative rounded-2xl overflow-hidden bg-gradient-to-b from-[#181308] to-[#0d1017] border-2 border-amber-500/40 p-3 sm:p-4 flex flex-col justify-between shadow-xl hover:border-amber-500/80 transition text-right">
      {/* Top Badge */}
      <div className="flex items-center justify-between mb-2">
        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-black flex items-center gap-1">
          <Sparkles className="w-2.5 h-2.5 text-amber-400" />
          <span>{badge}</span>
        </span>
        <span className="text-[9px] text-gray-400 font-mono">SPONSORED</span>
      </div>

      {/* Image */}
      <div className="relative aspect-video w-full rounded-xl overflow-hidden mb-2.5 bg-black/50">
        <img
          src={imageUrl}
          alt={title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
      </div>

      {/* Title & Concise Text */}
      <div className="space-y-1 mb-3 flex-1">
        <h4 className="text-xs sm:text-sm font-black text-white truncate group-hover:text-amber-300 transition">
          {title}
        </h4>
        <p className="text-[10px] text-gray-400 line-clamp-2 leading-relaxed">
          {desc}
        </p>
      </div>

      {/* Action Button */}
      <a
        href={link}
        target={link.startsWith("http") ? "_blank" : undefined}
        rel="noreferrer"
        className="w-full py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-xs flex items-center justify-center gap-1.5 shadow-md transition active:scale-95"
      >
        <span>{cta}</span>
        <ExternalLink className="w-3 h-3" />
      </a>
    </div>
  );
}

/**
 * 6. Sticky Mobile Bottom Smart Ad Bar (الشريط الإعلاني الذكي للموبايل - غير مزعج وقابل للإغلاق)
 * Appears floating just above the mobile bottom navigation.
 */
export function StickyMobileAdBar() {
  const settings = useSettings();
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    try {
      const dismissed = sessionStorage.getItem("cpm_mobile_bar_dismissed");
      if (dismissed === "true") setIsDismissed(true);
    } catch {}
  }, []);

  const isEnabled = settings.ad_mobile_bar_enabled === "true";
  if (!isEnabled || isDismissed) return null;

  const bookingWhatsapp = settings.ad_booking_whatsapp || "01288212101";
  const defaultBookingLink = `https://wa.me/20${bookingWhatsapp.replace(/\D/g, "").replace(/^0/, "")}?text=${encodeURIComponent("مرحباً، أريد الاستفسار عن حجز الشريط الإعلاني الذكي للموبايل في متجر EGY CPM")}`;

  const text = settings.ad_mobile_bar_text || "إعلان مميز: انضم لأقوى عروض السيرفرات والسيارات الآن!";
  const badge = settings.ad_mobile_bar_badge || "عرض خاص 🔥";
  const link = settings.ad_mobile_bar_link || defaultBookingLink;

  const handleDismiss = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDismissed(true);
    try {
      sessionStorage.setItem("cpm_mobile_bar_dismissed", "true");
    } catch {}
  };

  return (
    <div className="fixed bottom-[60px] inset-x-2 z-40 md:hidden transition-all duration-300">
      <div className="relative flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-black/90 border border-amber-500/50 backdrop-blur-md shadow-2xl text-white">
        <a
          href={link}
          target={link.startsWith("http") ? "_blank" : undefined}
          rel="noreferrer"
          className="flex-1 min-w-0 flex items-center gap-1.5"
        >
          <span className="px-1.5 py-0.5 rounded-md bg-amber-500 text-black text-[9px] font-black shrink-0">
            {badge}
          </span>
          <span className="text-[11px] font-bold text-gray-200 truncate">
            {text}
          </span>
        </a>

        <button
          type="button"
          onClick={handleDismiss}
          aria-label="إغلاق"
          className="p-1 rounded-md text-gray-400 hover:text-white shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
