"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSettings } from "@/lib/context/SettingsContext";
import {
  Sparkles,
  ExternalLink,
  X,
  Megaphone,
  MessageCircle,
  Plus,
  Flame,
  CheckCircle2,
} from "lucide-react";

/**
 * 1. Top Panorama Bar (شريط بانوراما علوي - يظهر فقط عند التفعيل ووجود إعلانات)
 */
export function TopPanoramaAdBanner() {
  const settings = useSettings();
  const [isDismissed, setIsDismissed] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    try {
      const dismissed = sessionStorage.getItem("cpm_top_ad_dismissed");
      if (dismissed === "true") setIsDismissed(true);
    } catch {}
  }, []);

  const isEnabled = settings.ad_top_enabled === "true";
  if (!isEnabled || isDismissed) return null;

  // Parse multi-announcement items (NO HARDCODED DUMMIES)
  const getItems = () => {
    try {
      if (settings.ad_top_items !== undefined) {
        const parsed = JSON.parse(settings.ad_top_items);
        if (Array.isArray(parsed)) {
          return parsed.filter((it: any) => it.enabled !== false && it.text);
        }
      }
    } catch {}

    if (settings.ad_top_text) {
      return [
        {
          id: "top_legacy",
          badge: settings.ad_top_badge || "إعلان مميز ⭐",
          text: settings.ad_top_text,
          link: settings.ad_top_link || "",
          cta: settings.ad_top_cta || "احجز إعلانك ↗",
        },
      ];
    }

    return [];
  };

  const items = getItems();

  // Rotate top ads if more than 1
  useEffect(() => {
    if (items.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [items.length]);

  if (items.length === 0) return null;

  const currentItem = items[currentIndex] || items[0];
  const isDismissible = settings.ad_top_dismissible !== "false";
  const imageUrl = settings.ad_top_image;

  return (
    <aside aria-label="إعلان مميز" className="relative z-40 w-full overflow-hidden bg-gradient-to-r from-amber-600/90 via-orange-600/90 to-red-700/90 text-white shadow-md border-b border-white/10">
      {imageUrl && (
        <div
          className="absolute inset-0 opacity-20 bg-cover bg-center pointer-events-none"
          style={{ backgroundImage: `url(${imageUrl})` }}
        />
      )}

      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 py-1.5 sm:py-2 flex items-center justify-between gap-2 text-xs">
        <a
          href={currentItem.link || "#"}
          target={currentItem.link?.startsWith("http") ? "_blank" : undefined}
          rel="noreferrer"
          className="flex-1 min-w-0 flex items-center justify-center sm:justify-start gap-1.5 sm:gap-3 group hover:opacity-95 transition"
        >
          {currentItem.badge && (
            <span className="px-1.5 sm:px-2 py-0.5 rounded-full bg-black/40 text-amber-300 border border-amber-400/40 text-[9px] sm:text-[10px] font-black shrink-0 flex items-center gap-1 shadow-sm">
              <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-300 animate-pulse" />
              <span>{currentItem.badge}</span>
            </span>
          )}

          <span className="font-bold truncate text-[11px] sm:text-xs">
            {currentItem.text}
          </span>

          {currentItem.cta && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-black text-amber-200 underline underline-offset-2 shrink-0 group-hover:translate-x-[-2px] transition-transform">
              <span>{currentItem.cta}</span>
              <ExternalLink className="w-3 h-3" />
            </span>
          )}
        </a>

        {isDismissible && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDismissed(true);
              try { sessionStorage.setItem("cpm_top_ad_dismissed", "true"); } catch {}
            }}
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
 * 2. Mid-Store Panorama Banner (بانر أفقي بين الأقسام - يظهر فقط عند التفعيل ووجود محتوى)
 */
export function PanoramaAdBanner({
  slotLocation = "home",
  className = "",
}: {
  slotLocation?: "home" | "shop" | "product";
  className?: string;
}) {
  const settings = useSettings();
  const [currentIndex, setCurrentIndex] = useState(0);

  const isEnabled = settings.ad_mid_enabled === "true";
  if (!isEnabled) return null;

  // Parse multi-banners list (NO HARDCODED DUMMIES)
  const getBanners = () => {
    try {
      if (settings.ad_mid_items !== undefined) {
        const parsed = JSON.parse(settings.ad_mid_items);
        if (Array.isArray(parsed)) {
          return parsed.filter((b: any) => {
            if (b.enabled === false) return false;
            if (!b.image && !b.title) return false;
            if (b.targetPages && b.targetPages !== "all" && b.targetPages !== slotLocation) return false;
            return true;
          });
        }
      }
    } catch {}

    const targetPages = settings.ad_mid_show_pages || "all";
    if (targetPages !== "all" && targetPages !== slotLocation) return [];

    if (settings.ad_mid_image || settings.ad_mid_title) {
      return [
        {
          id: "mid_legacy",
          image: settings.ad_mid_image || "",
          link: settings.ad_mid_link || "",
          title: settings.ad_mid_title || "",
          desc: settings.ad_mid_desc || "",
          cta: settings.ad_mid_cta || "زيارة العرض ↗",
        },
      ];
    }

    return [];
  };

  const banners = getBanners();

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  if (banners.length === 0) return null;

  const banner = banners[currentIndex] || banners[0];

  return (
    <div className={`w-full max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 my-3 sm:my-6 ${className}`}>
      <div className="relative group rounded-2xl overflow-hidden border border-amber-500/30 bg-gradient-to-r from-[#14120c] via-[#1c1810] to-[#0f1218] p-3 sm:p-5 shadow-xl transition hover:border-amber-500/60">
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        {banner.image ? (
          <a
            href={banner.link || "#"}
            target={banner.link?.startsWith("http") ? "_blank" : undefined}
            rel="noreferrer"
            className="block relative overflow-hidden rounded-xl"
          >
            <div className="relative aspect-[16/5] sm:aspect-[21/5] w-full max-h-[130px] sm:max-h-[190px] overflow-hidden rounded-xl">
              <img
                src={banner.image}
                alt={banner.title || "Ad Banner"}
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
                  {banner.title && (
                    <h4 className="text-xs sm:text-sm font-black text-white truncate drop-shadow-md">
                      {banner.title}
                    </h4>
                  )}
                  {banner.desc && (
                    <p className="text-[10px] text-gray-300 truncate hidden sm:block">
                      {banner.desc}
                    </p>
                  )}
                </div>
                {banner.cta && (
                  <span className="px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-lg sm:rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-[11px] sm:text-xs shrink-0 flex items-center gap-1 shadow-lg transition">
                    <span>{banner.cta}</span>
                    <ExternalLink className="w-3 h-3" />
                  </span>
                )}
              </div>
            </div>
          </a>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-right">
            <div className="space-y-1 w-full sm:w-auto">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] font-black">
                <Megaphone className="w-3 h-3" />
                <span>إعلان ترويجي مميز</span>
              </div>
              {banner.title && (
                <h3 className="text-sm sm:text-lg font-black text-white truncate">
                  {banner.title}
                </h3>
              )}
              {banner.desc && (
                <p className="text-[11px] sm:text-xs text-gray-400 line-clamp-1">
                  {banner.desc}
                </p>
              )}
            </div>

            {banner.link && (
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
                <a
                  href={banner.link}
                  target={banner.link?.startsWith("http") ? "_blank" : undefined}
                  rel="noreferrer"
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-xs transition flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 active:scale-95"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>{banner.cta || "زيارة العرض ↗"}</span>
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 3. Sponsored Stories & Partner Strip (قصص الرعاة والشركاء - تظهر فقط عند وجود قصص حقيقية غير منتهية الصلاحية)
 */
export function SponsoredStoriesBar() {
  const settings = useSettings();

  const isEnabled = settings.ad_stories_enabled === "true";
  if (!isEnabled) return null;

  const bookingWhatsapp = settings.ad_booking_whatsapp || "01288212101";
  const defaultBookingLink = `https://wa.me/20${bookingWhatsapp.replace(/\D/g, "").replace(/^0/, "")}?text=${encodeURIComponent("مرحباً، أريد حجز مساحة في شريط قصص الرعاة والشركاء المعتمدين في متجر EGY CPM")}`;

  // Parse stories & filter out expired ones (12-hour limit) (NO HARDCODED DUMMIES)
  const getStories = () => {
    const now = Date.now();
    try {
      if (settings.ad_stories_items !== undefined) {
        const parsed = JSON.parse(settings.ad_stories_items);
        if (Array.isArray(parsed)) {
          return parsed.filter((s: any) => {
            if (s.enabled === false || !s.image || !s.name) return false;
            const createdAt = Number(s.createdAt) || 0;
            const durationHours = Number(s.durationHours) || 12;
            if (createdAt > 0 && now - createdAt > durationHours * 3600 * 1000) {
              return false; // expired
            }
            return true;
          });
        }
      }
    } catch {}

    return [];
  };

  const stories = getStories();

  // If no stories exist, hide the whole bar completely!
  if (stories.length === 0) return null;

  return (
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-2">
      <div className="flex items-center gap-3.5 sm:gap-5 overflow-x-auto no-scrollbar py-2 px-1 text-center justify-start">
        {/* Story 0: Permanent "+ أعلن هنا" circle */}
        <a
          href={defaultBookingLink}
          target="_blank"
          rel="noreferrer"
          style={{ width: 68, minWidth: 68 }}
          className="flex flex-col items-center gap-1.5 shrink-0 group"
        >
          <div
            style={{ width: 58, height: 58, minWidth: 58, minHeight: 58 }}
            className="rounded-full p-[2px] bg-gradient-to-tr from-amber-500 via-orange-500 to-red-500 shadow-md group-hover:scale-105 transition-transform flex items-center justify-center shrink-0"
          >
            <div className="w-full h-full rounded-full bg-[#12161f] border-2 border-black flex items-center justify-center text-amber-400 group-hover:text-amber-300">
              <Plus className="w-5 h-5" />
            </div>
          </div>
          <span className="text-[10px] font-black text-amber-400 group-hover:text-amber-300 truncate w-full text-center block">
            + أعلن هنا
          </span>
        </a>

        {/* Real User Stories */}
        {stories.map((story: any) => (
          <a
            key={story.id}
            href={story.link || defaultBookingLink}
            target={story.link?.startsWith("http") ? "_blank" : undefined}
            rel="noreferrer"
            style={{ width: 68, minWidth: 68 }}
            className="flex flex-col items-center gap-1.5 shrink-0 group"
          >
            <div
              style={{ width: 58, height: 58, minWidth: 58, minHeight: 58 }}
              className="relative rounded-full p-[2px] bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 shadow-md group-hover:scale-105 transition-transform flex items-center justify-center shrink-0"
            >
              <div className="w-full h-full rounded-full overflow-hidden border-2 border-black bg-black flex items-center justify-center">
                <img
                  src={story.image}
                  alt={story.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  className="rounded-full"
                />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 text-black flex items-center justify-center text-[9px] font-black border border-black shadow">
                ✓
              </span>
            </div>
            <span className="text-[10px] font-bold text-gray-300 group-hover:text-white truncate w-full text-center block">
              {story.name}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}

/**
 * 4. In-Feed Native Ad Card (بطاقة إعلانية مدمجة بشبكة المنتجات - تظهر فقط عند وجود بطاقات حقيقية)
 */
export function InFeedGridAdCard() {
  const settings = useSettings();
  const [currentIndex, setCurrentIndex] = useState(0);

  const isEnabled = settings.ad_feed_enabled === "true";
  if (!isEnabled) return null;

  // Parse multi-feed cards (NO HARDCODED DUMMIES)
  const getCards = () => {
    try {
      if (settings.ad_feed_items !== undefined) {
        const parsed = JSON.parse(settings.ad_feed_items);
        if (Array.isArray(parsed)) {
          return parsed.filter((c: any) => c.enabled !== false && c.image);
        }
      }
    } catch {}

    if (settings.ad_feed_image) {
      return [
        {
          id: "feed_legacy",
          image: settings.ad_feed_image,
          title: settings.ad_feed_title || "",
          desc: settings.ad_feed_desc || "",
          badge: settings.ad_feed_badge || "راعي معتمد ⭐",
          link: settings.ad_feed_link || "",
          cta: settings.ad_feed_cta || "مشاهدة العرض ↗",
        },
      ];
    }

    return [];
  };

  const cards = getCards();

  useEffect(() => {
    if (cards.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % cards.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [cards.length]);

  if (cards.length === 0) return null;

  const card = cards[currentIndex] || cards[0];

  return (
    <div className="group relative rounded-2xl overflow-hidden bg-gradient-to-b from-[#181308] to-[#0d1017] border-2 border-amber-500/40 p-3 sm:p-4 flex flex-col justify-between shadow-xl hover:border-amber-500/80 transition text-right">
      {card.link && (
        <a
          href={card.link}
          target={card.link.startsWith("http") ? "_blank" : undefined}
          rel="noreferrer"
          className="absolute inset-0 z-10"
          title={card.title || "زيارة العرض"}
        />
      )}

      {/* Top Badge */}
      <div className="flex items-center justify-between mb-2 relative z-0">
        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-black flex items-center gap-1">
          <Sparkles className="w-2.5 h-2.5 text-amber-400" />
          <span>{card.badge || "SPONSORED"}</span>
        </span>
        <span className="text-[9px] text-gray-400 font-mono">SPONSORED</span>
      </div>

      {/* Image */}
      <div className="relative aspect-video w-full rounded-xl overflow-hidden mb-2.5 bg-black/50 relative z-0">
        <img
          src={card.image}
          alt={card.title || "Ad Card"}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
      </div>

      {/* Title & Desc */}
      <div className="space-y-1 mb-3 flex-1 relative z-0">
        {card.title && (
          <h4 className="text-xs sm:text-sm font-black text-white truncate group-hover:text-amber-300 transition">
            {card.title}
          </h4>
        )}
        {card.desc && (
          <p className="text-[10px] text-gray-400 line-clamp-2 leading-relaxed">
            {card.desc}
          </p>
        )}
      </div>

      {/* Action Button */}
      {card.cta && (
        <div className="w-full py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-xs flex items-center justify-center gap-1.5 shadow-md transition relative z-20 pointer-events-none">
          <span>{card.cta}</span>
          <ExternalLink className="w-3 h-3" />
        </div>
      )}
    </div>
  );
}

/**
 * 5. Sticky Mobile Bottom Smart Ad Bar (الشريط الإعلاني العائم للموبايل - يظهر فقط عند وجود إعلانات)
 */
export function StickyMobileAdBar() {
  const settings = useSettings();
  const [isDismissed, setIsDismissed] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    try {
      const dismissed = sessionStorage.getItem("cpm_mobile_bar_dismissed");
      if (dismissed === "true") setIsDismissed(true);
    } catch {}
  }, []);

  const isEnabled = settings.ad_mobile_bar_enabled === "true";
  if (!isEnabled || isDismissed) return null;

  // Parse multi mobile bar ads (NO HARDCODED DUMMIES)
  const getItems = () => {
    try {
      if (settings.ad_mobile_items !== undefined) {
        const parsed = JSON.parse(settings.ad_mobile_items);
        if (Array.isArray(parsed)) {
          return parsed.filter((it: any) => it.enabled !== false && it.text);
        }
      }
    } catch {}

    if (settings.ad_mobile_bar_text) {
      return [
        {
          id: "mobile_legacy",
          badge: settings.ad_mobile_bar_badge || "عرض خاص 🔥",
          text: settings.ad_mobile_bar_text,
          link: settings.ad_mobile_bar_link || "",
        },
      ];
    }

    return [];
  };

  const items = getItems();

  useEffect(() => {
    if (items.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [items.length]);

  if (items.length === 0) return null;

  const current = items[currentIndex] || items[0];

  return (
    <div className="fixed bottom-[60px] inset-x-2 z-40 md:hidden transition-all duration-300">
      <div className="relative flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-black/90 border border-amber-500/50 backdrop-blur-md shadow-2xl text-white">
        <a
          href={current.link || "#"}
          target={current.link?.startsWith("http") ? "_blank" : undefined}
          rel="noreferrer"
          className="flex-1 min-w-0 flex items-center gap-1.5"
        >
          {current.badge && (
            <span className="px-1.5 py-0.5 rounded-md bg-amber-500 text-black text-[9px] font-black shrink-0">
              {current.badge}
            </span>
          )}
          <span className="text-[11px] font-bold text-gray-200 truncate">
            {current.text}
          </span>
        </a>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDismissed(true);
            try { sessionStorage.setItem("cpm_mobile_bar_dismissed", "true"); } catch {}
          }}
          aria-label="إغلاق"
          className="p-1 rounded-md text-gray-400 hover:text-white shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
