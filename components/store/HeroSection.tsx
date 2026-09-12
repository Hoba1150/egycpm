"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Wallet,
  Plus,
  Car,
  Zap,
  Key,
  Flame,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  ExternalLink,
  Megaphone,
  ShieldCheck,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useSettings } from "@/lib/context/SettingsContext";
import { SponsoredStoriesBar } from "@/components/store/AdBanners";

interface HeroSectionProps {
  user?: any;
  products?: any[];
  initialSettings?: Record<string, string>;
}

export interface BillboardAdItem {
  id: string;
  image: string;
  link?: string;
  title?: string;
  desc?: string;
  badge?: string;
  sponsor?: string;
  cta?: string;
  enabled?: boolean;
}

export default function HeroSection({ user: initialUser }: HeroSectionProps) {
  const [currentUser, setCurrentUser] = useState(initialUser || (() => {
    if (typeof window !== "undefined") {
      try {
        const cached = sessionStorage.getItem("cpm_cached_user");
        if (cached) return JSON.parse(cached);
      } catch {}
    }
    return null;
  }));

  const settings = useSettings();
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  // Auth fetch on explicit login/logout event (saves Vercel Compute)
  const fetchLiveSession = () => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((authData) => {
        if (authData?.user) {
          setCurrentUser(authData.user);
          try {
            sessionStorage.setItem("cpm_cached_user", JSON.stringify(authData.user));
          } catch {}
        } else {
          setCurrentUser(null);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    if (!initialUser) {
      fetchLiveSession();
    }
    const handleAuth = () => fetchLiveSession();
    window.addEventListener("cpm_auth_changed", handleAuth);
    return () => {
      window.removeEventListener("cpm_auth_changed", handleAuth);
    };
  }, [initialUser]);

  // Parse multi-ad slides from settings (Purely Dynamic - No Forced Dummies)
  const getAds = (): BillboardAdItem[] => {
    const bookingWhatsapp = settings.ad_booking_whatsapp || "01288212101";
    const defaultBookingLink = `https://wa.me/20${bookingWhatsapp.replace(/\D/g, "").replace(/^0/, "")}?text=${encodeURIComponent("مرحباً، أود حجز مساحة إعلانية في الواجهة الرئيسية لمتجر EGY CPM")}`;

    try {
      if (settings.hero_billboard_ads !== undefined) {
        const parsed = JSON.parse(settings.hero_billboard_ads);
        if (Array.isArray(parsed)) {
          return parsed.filter((item: BillboardAdItem) => item.enabled !== false && item.image);
        }
      }
    } catch {}

    if (settings.ad_hero_enabled === "true" && settings.ad_hero_image) {
      return [
        {
          id: "hero_legacy_vip",
          image: settings.ad_hero_image,
          link: settings.ad_hero_link || defaultBookingLink,
          title: settings.ad_hero_title || "",
          desc: settings.ad_hero_desc || "",
          badge: settings.ad_hero_badge || "SPONSORED VIP ⭐",
          sponsor: settings.ad_hero_sponsor || "راعي معتمد",
          cta: settings.ad_hero_cta || "زيارة العرض ↗",
          enabled: true,
        },
      ];
    }

    return [];
  };

  const ads = getAds();
  const autoplayEnabled = settings.hero_slider_autoplay !== "false";
  const intervalSeconds = Math.max(3, parseInt(settings.hero_slider_interval || "4", 10));

  // Autoplay timer
  useEffect(() => {
    if (!autoplayEnabled || isPaused || ads.length <= 1) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % ads.length);
    }, intervalSeconds * 1000);
    return () => clearInterval(timer);
  }, [ads.length, autoplayEnabled, isPaused, intervalSeconds]);

  const nextSlide = () => setActiveSlide((prev) => (prev + 1) % ads.length);
  const prevSlide = () => setActiveSlide((prev) => (prev - 1 + ads.length) % ads.length);

  // Swipe for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) nextSlide();
      else prevSlide();
    }
    touchStartX.current = null;
  };

  const walletTotal = currentUser?.wallet?.totalAvailable ?? 0;
  const currentAd = ads[activeSlide] || ads[0];

  const bookingWhatsapp = settings.ad_booking_whatsapp || "01288212101";
  const advertiseHereLink = `https://wa.me/20${bookingWhatsapp.replace(/\D/g, "").replace(/^0/, "")}?text=${encodeURIComponent("مرحباً، أود حجز مساحة إعلانية في الواجهة الرئيسية لمتجر EGY CPM")}`;

  return (
    <section className="relative pt-2 sm:pt-3 pb-4 sm:pb-6 px-2.5 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto w-full space-y-3 sm:space-y-4">

        {/* 1. Wallet Balance / Top Hub */}
        <div className="rounded-2xl bg-[#0f1218] border border-gray-800 p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-right shadow-md">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-red-600/15 text-red-500 border border-red-500/30 flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-gray-400 block font-medium">
                {currentUser ? `مرحباً بك، ${currentUser.name}` : "رصيد المحفظة المتاح للشراء"}
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl sm:text-2xl font-black text-white font-mono">
                  {formatCurrency(walletTotal)}
                </span>
                <span className="text-[10px] text-gray-500 hidden sm:inline">
                  جاهز للاستخدام
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Link
              href="/deposit"
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-md shadow-red-600/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{settings.hero_cta1_text ?? "شحن المحفظة"}</span>
            </Link>
            <Link
              href="/shop"
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-[#161b24] hover:bg-[#1e2430] border border-gray-700 text-gray-200 font-bold text-xs text-center transition"
            >
              {settings.hero_cta2_text ?? "تصفح المتجر"}
            </Link>
          </div>
        </div>

        {/* 2. Main Featured Ad Billboard (المساحة الإعلانية الرئيسية المميزة) */}
        {settings.ad_hero_enabled !== "false" && ads.length > 0 && (
          <div
            className="relative group rounded-2xl sm:rounded-3xl overflow-hidden border border-amber-500/30 bg-[#090b0f] shadow-2xl transition hover:border-amber-500/60"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Billboard Container */}
            <div className="relative w-full h-[200px] xs:h-[230px] sm:h-[310px] md:h-[380px] lg:h-[430px] overflow-hidden bg-black">
              {/* Slides */}
              {ads.map((ad, idx) => {
                const isActive = activeSlide === idx;
                const hasText = Boolean(ad.title?.trim() || ad.desc?.trim() || ad.badge?.trim() || ad.sponsor?.trim());
                const hasButton = Boolean(ad.cta?.trim());

                return (
                  <div
                    key={ad.id || idx}
                    className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                      isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                    }`}
                  >
                    {/* Entire Ad Image Banner */}
                    <img
                      src={ad.image}
                      alt={ad.title || `Ad ${idx + 1}`}
                      loading={idx === 0 ? "eager" : "lazy"}
                      className="w-full h-full object-cover"
                    />

                    {/* Click Entire Slide to Navigate if link provided */}
                    {ad.link && (
                      <a
                        href={ad.link}
                        target={ad.link.startsWith("http") ? "_blank" : undefined}
                        rel="noreferrer"
                        className="absolute inset-0 z-10 cursor-pointer"
                        title={ad.title || "زيارة الإعلان"}
                      />
                    )}

                    {/* Smart Lightweight Bottom Elements */}
                    {(hasText || hasButton) && (
                      <div className="absolute bottom-2.5 sm:bottom-4 inset-x-2.5 sm:inset-x-5 z-20 pointer-events-none">
                        <div className="flex items-end justify-between gap-2.5">
                          {/* Left: Optional Floating Action Button */}
                          {hasButton && ad.link ? (
                            <a
                              href={ad.link}
                              target={ad.link.startsWith("http") ? "_blank" : undefined}
                              rel="noreferrer"
                              className="pointer-events-auto px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-xs transition flex items-center gap-1.5 shadow-xl shadow-black/60 active:scale-95 shrink-0"
                            >
                              <span>{ad.cta}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <div />
                          )}

                          {/* Right: Non-obscuring Smart Micro-Card if text exists */}
                          {hasText && (
                            <div className="pointer-events-auto max-w-[80%] sm:max-w-md rounded-xl sm:rounded-2xl bg-black/70 border border-white/10 backdrop-blur-md px-3 py-2 sm:px-4 sm:py-2.5 text-right shadow-2xl space-y-1">
                              <div className="flex items-center gap-2 justify-end">
                                {ad.sponsor && (
                                  <span className="text-[10px] text-gray-300 font-bold truncate flex items-center gap-1">
                                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                                    <span>{ad.sponsor}</span>
                                  </span>
                                )}

                                {ad.badge && (
                                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] sm:text-[10px] font-black flex items-center gap-1">
                                    <Sparkles className="w-2.5 h-2.5 animate-pulse text-amber-400" />
                                    <span>{ad.badge}</span>
                                  </span>
                                )}
                              </div>

                              {ad.title && (
                                <h3 className="text-xs sm:text-sm md:text-base font-black text-white truncate drop-shadow-md">
                                  {ad.title}
                                </h3>
                              )}

                              {ad.desc && (
                                <p className="text-[10px] sm:text-xs text-gray-300 truncate hidden xs:block">
                                  {ad.desc}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Top Overlays: Story Progress Bars + Quick Booking Trigger */}
              <div className="absolute top-2.5 sm:top-4 inset-x-2.5 sm:inset-x-5 z-30 flex items-center justify-between gap-3 pointer-events-none">
                {/* Story-Style Progress Bars */}
                {ads.length > 1 && (
                  <div className="flex-1 flex items-center gap-1.5 max-w-xs sm:max-w-md pointer-events-auto">
                    {ads.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveSlide(idx)}
                        aria-label={`الانتقال للإعلان ${idx + 1}`}
                        className="h-1 flex-1 rounded-full bg-white/30 overflow-hidden transition-all"
                      >
                        <div
                          className={`h-full transition-all duration-300 ${
                            activeSlide === idx
                              ? "w-full bg-gradient-to-r from-amber-400 to-orange-500 shadow-sm"
                              : idx < activeSlide
                              ? "w-full bg-white/70"
                              : "w-0"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                )}

                {/* Direct Booking Trigger: "أعلن هنا 💎" */}
                <a
                  href={advertiseHereLink}
                  target="_blank"
                  rel="noreferrer"
                  className="pointer-events-auto px-2.5 sm:px-3 py-1 rounded-full bg-black/80 hover:bg-amber-500 hover:text-black text-amber-300 border border-amber-400/50 backdrop-blur-md text-[10px] sm:text-xs font-black flex items-center gap-1 shadow-lg transition active:scale-95 shrink-0 ml-auto"
                  title="احجز مساحة إعلانية في هذه الواجهة"
                >
                  <Megaphone className="w-3 h-3 text-amber-400" />
                  <span>أعلن هنا 💎</span>
                </a>
              </div>

              {/* Navigation Arrows */}
              {ads.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={prevSlide}
                    aria-label="السابق"
                    className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-black/60 hover:bg-black text-white border border-white/20 items-center justify-center transition opacity-0 group-hover:opacity-100"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={nextSlide}
                    aria-label="التالي"
                    className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-black/60 hover:bg-black text-white border border-white/20 items-center justify-center transition opacity-0 group-hover:opacity-100"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* 3. Sponsored Partner Stories Strip (Horizontal scrolling on mobile) */}
        <SponsoredStoriesBar />

      </div>
    </section>
  );
}
