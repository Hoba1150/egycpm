"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Wallet,
  Plus,
  Car,
  Zap,
  Key,
  CheckCircle2,
  Flame,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  ExternalLink,
  Megaphone,
  ShieldCheck,
  MessageCircle,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useSettings } from "@/lib/context/SettingsContext";
import { SponsoredStoriesBar } from "@/components/store/AdBanners";

interface HeroSectionProps {
  user?: any;
  products?: any[];
  initialSettings?: Record<string, string>;
}

interface SlideData {
  url: string;
  isAd?: boolean;
  title?: string;
  desc?: string;
  badge?: string;
  sponsor?: string;
  link?: string;
  cta?: string;
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

  // Fetch session only when explicit auth changed (prevents Vercel Compute churn)
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

  // Slides configuration: Smart Billboard Stage
  const getSlides = (): SlideData[] => {
    const bookingWhatsapp = settings.ad_booking_whatsapp || "01288212101";
    const defaultBookingLink = `https://wa.me/20${bookingWhatsapp.replace(/\D/g, "").replace(/^0/, "")}?text=${encodeURIComponent("مرحباً، أود حجز المساحة الإعلانية الكبرى (Hero Billboard) في متجر EGY CPM")}`;

    let baseImages: string[] = [];
    try {
      if (!settings.hero_images) {
        baseImages = [
          "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=1200",
          "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200",
          "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=1200",
        ];
      } else {
        const parsed = JSON.parse(settings.hero_images);
        baseImages = Array.isArray(parsed) && parsed.length > 0
          ? parsed
          : ["https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=1200"];
      }
    } catch {
      baseImages = ["https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=1200"];
    }

    const result: SlideData[] = baseImages.map((url, i) => ({
      url,
      isAd: false,
      title: i === 0 ? (settings.hero_title || "المنصة الأولى لسيارات وتعديلات Car Parking") : "أساطيل وسيارات حصرية بقوة 1695HP",
      desc: i === 0 ? "تسليم فوري، حماية كاملة، وأمان معتمد 100%" : "خصومات كبرى وشحن فوري للكاش والكوينز",
      badge: i === 0 ? "متجر معتمد 🏎️" : "عروض حصرية 🔥",
      sponsor: settings.store_name || "EGY CPM",
      link: "/shop",
      cta: "تصفح المتجر ↗",
    }));

    // Inject VIP Sponsored Ad Slide at index 0 if enabled
    if (settings.ad_hero_enabled === "true") {
      const adSlide: SlideData = {
        url: settings.ad_hero_image || baseImages[0],
        isAd: true,
        title: settings.ad_hero_title || "مساحة إعلانية راعية كبرى (VIP Sponsor)",
        desc: settings.ad_hero_desc || "احصل على ظهور حصري في واجهة المتجر الرئيسية أمام آلاف الزوار يومياً.",
        badge: settings.ad_hero_badge || "SPONSORED VIP ⭐",
        sponsor: settings.ad_hero_sponsor || "راعي رسمي معتمد",
        link: settings.ad_hero_link || defaultBookingLink,
        cta: settings.ad_hero_cta || "زيارة العرض ↗",
      };
      result.unshift(adSlide);
    }

    return result;
  };

  const slides = getSlides();
  const autoplayEnabled = settings.hero_slider_autoplay !== "false";
  const intervalSeconds = Math.max(3, parseInt(settings.hero_slider_interval || "4", 10));

  // Autoplay timer
  useEffect(() => {
    if (!autoplayEnabled || isPaused || slides.length <= 1) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, intervalSeconds * 1000);
    return () => clearInterval(timer);
  }, [slides.length, autoplayEnabled, isPaused, intervalSeconds]);

  const nextSlide = () => setActiveSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setActiveSlide((prev) => (prev - 1 + slides.length) % slides.length);

  // Swipe handlers for mobile
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
  const currentSlide = slides[activeSlide] || slides[0];

  const bookingWhatsapp = settings.ad_booking_whatsapp || "01288212101";
  const advertiseHereLink = `https://wa.me/20${bookingWhatsapp.replace(/\D/g, "").replace(/^0/, "")}?text=${encodeURIComponent("مرحباً، أود حجز مساحة إعلانية في سلايدر واجهة متجر EGY CPM")}`;

  const quickServices = [
    {
      title: settings.srv1_title || "سيارات معدلة 1695HP",
      desc: "W16 Tuning",
      icon: Car,
      href: "/shop?type=MODIFIED_CAR",
      badge: "محركات خارقة",
      iconBg: "bg-red-600/15 border-red-500/30 text-red-400",
    },
    {
      title: settings.srv2_title || "سيارات رسم وفينيل",
      desc: "Custom Livery",
      icon: Flame,
      href: "/shop?type=DRAWN_CAR",
      badge: "تصاميم حصرية",
      iconBg: "bg-purple-600/15 border-purple-500/30 text-purple-400",
    },
    {
      title: settings.srv3_title || "شحن كاش وكوينز",
      desc: "Coins & Cash",
      icon: Zap,
      href: "/shop?type=SERVICE",
      badge: "تسليم فوري",
      iconBg: "bg-emerald-600/15 border-emerald-500/30 text-emerald-400",
    },
    {
      title: settings.srv4_title || "حسابات جاهزة VIP",
      desc: "VIP Accounts",
      icon: Key,
      href: "/shop?type=ACCOUNT",
      badge: "جاهزة للعب",
      iconBg: "bg-blue-600/15 border-blue-500/30 text-blue-400",
    },
  ];

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

        {/* 2. Grand Smart Advertising Billboard & Showroom Stage */}
        <div
          className="relative group rounded-2xl sm:rounded-3xl overflow-hidden border border-amber-500/30 bg-[#090b0f] shadow-2xl transition hover:border-amber-500/60"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Billboard Frame Container */}
          <div className="relative w-full h-[210px] xs:h-[240px] sm:h-[320px] md:h-[390px] lg:h-[440px] overflow-hidden bg-black">
            {/* Background Slides */}
            {slides.map((slide, idx) => (
              <div
                key={idx}
                className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                  activeSlide === idx ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                }`}
              >
                <img
                  src={slide.url}
                  alt={slide.title || `Slide ${idx + 1}`}
                  loading={idx === 0 ? "eager" : "lazy"}
                  className="w-full h-full object-cover"
                />
                {/* Visual Depth Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-black/40 pointer-events-none" />
              </div>
            ))}

            {/* Top Bar Overlays: Story Progress Bars + Quick Booking Trigger */}
            <div className="absolute top-2.5 sm:top-4 inset-x-2.5 sm:inset-x-5 z-20 flex items-center justify-between gap-3">
              {/* Story-Style Progress Bars */}
              <div className="flex-1 flex items-center gap-1.5 max-w-xs sm:max-w-md">
                {slides.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveSlide(idx)}
                    aria-label={`الانتقال للشريحة ${idx + 1}`}
                    className="h-1 flex-1 rounded-full bg-white/25 overflow-hidden transition-all"
                  >
                    <div
                      className={`h-full transition-all duration-300 ${
                        activeSlide === idx
                          ? "w-full bg-gradient-to-r from-amber-400 to-red-500 shadow-sm"
                          : idx < activeSlide
                          ? "w-full bg-white/60"
                          : "w-0"
                      }`}
                    />
                  </button>
                ))}
              </div>

              {/* Direct Booking Trigger: "أعلن هنا 💎" */}
              <a
                href={advertiseHereLink}
                target="_blank"
                rel="noreferrer"
                className="px-2.5 sm:px-3 py-1 rounded-full bg-black/75 hover:bg-amber-500 hover:text-black text-amber-300 border border-amber-400/50 backdrop-blur-md text-[10px] sm:text-xs font-black flex items-center gap-1 shadow-lg transition active:scale-95 shrink-0"
                title="احجز مساحة إعلانية في هذه الواجهة"
              >
                <Megaphone className="w-3 h-3 text-amber-400" />
                <span>أعلن هنا 💎</span>
              </a>
            </div>

            {/* Bottom Glassmorphic Overlay Card (High Impact, Reduced Text) */}
            <div className="absolute bottom-2.5 sm:bottom-4 inset-x-2.5 sm:inset-x-5 z-20">
              <div className="rounded-xl sm:rounded-2xl bg-black/80 border border-white/10 backdrop-blur-md p-3 sm:p-4 text-right shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-4">
                {/* Concise Punchy Details */}
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black flex items-center gap-1 border ${
                      currentSlide.isAd
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                        : "bg-red-600/20 text-red-400 border-red-500/30"
                    }`}>
                      <Sparkles className="w-2.5 h-2.5 animate-pulse" />
                      <span>{currentSlide.badge || "إعلان مميز"}</span>
                    </span>

                    <span className="text-[10px] text-gray-400 font-bold truncate flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      <span>{currentSlide.sponsor || "معتمد"}</span>
                    </span>
                  </div>

                  <h2 className="text-xs sm:text-base md:text-lg font-black text-white truncate drop-shadow-md">
                    {currentSlide.title}
                  </h2>

                  {currentSlide.desc && (
                    <p className="text-[10px] sm:text-xs text-gray-300 truncate hidden xs:block">
                      {currentSlide.desc}
                    </p>
                  )}
                </div>

                {/* Direct Action Button */}
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
                  {currentSlide.link && (
                    <a
                      href={currentSlide.link}
                      target={currentSlide.link.startsWith("http") ? "_blank" : undefined}
                      rel="noreferrer"
                      className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-xs transition flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 active:scale-95"
                    >
                      <span>{currentSlide.cta || "زيارة العرض ↗"}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Left & Right Navigation Arrows (Desktop hover / Touch friendly) */}
            {slides.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prevSlide}
                  aria-label="السابق"
                  className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/60 hover:bg-black text-white border border-white/20 items-center justify-center transition opacity-0 group-hover:opacity-100"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={nextSlide}
                  aria-label="التالي"
                  className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/60 hover:bg-black text-white border border-white/20 items-center justify-center transition opacity-0 group-hover:opacity-100"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* 3. Sponsored Partner Stories Strip (Horizontal scrolling on mobile) */}
        <SponsoredStoriesBar />

        {/* 4. Quick Services Grid: 2x2 on Mobile, 4 columns on Desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 pt-1">
          {quickServices.map((srv, idx) => {
            const Icon = srv.icon;
            return (
              <Link
                key={idx}
                href={srv.href}
                className="group p-3 rounded-xl bg-[#0f1218] hover:bg-[#161b24] border border-gray-800 hover:border-gray-700 transition flex items-center gap-2.5 text-right shadow-sm"
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center border shrink-0 transition-transform group-hover:scale-105 ${srv.iconBg}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-black text-white block truncate group-hover:text-red-400 transition">
                    {srv.title}
                  </span>
                  <span className="text-[10px] text-gray-400 block truncate font-mono">
                    {srv.badge}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

      </div>
    </section>
  );
}
