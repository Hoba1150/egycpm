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
  Wrench,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useSettings } from "@/lib/context/SettingsContext";

interface HeroSectionProps {
  user?: any;
  products?: any[];
  // Keep prop for backward compat but now we use Context
  initialSettings?: Record<string, string>;
}

export default function HeroSection({ user: initialUser }: HeroSectionProps) {
  const [currentUser, setCurrentUser] = useState(initialUser);
  // Read settings from server-injected Context — no FOUC
  const settings = useSettings();
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const fetchLiveSession = () => {
    Promise.all([
      fetch("/api/auth/me", { cache: "no-store" }).then((r) => r.json()).catch(() => ({ user: null })),
    ]).then(([authData]) => {
      if (authData.user) {
        setCurrentUser(authData.user);
      } else {
        setCurrentUser(null);
      }
    });
  };

  useEffect(() => {
    fetchLiveSession();
    window.addEventListener("cpm_auth_changed", fetchLiveSession);
    window.addEventListener("focus", fetchLiveSession);
    return () => {
      window.removeEventListener("cpm_auth_changed", fetchLiveSession);
      window.removeEventListener("focus", fetchLiveSession);
    };
  }, []);

  // Parse hero images list
  const getSlides = (): string[] => {
    try {
      if (!settings.hero_images) {
        return [
          "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800",
          "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800",
          "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=800",
        ];
      }
      const parsed = JSON.parse(settings.hero_images);
      return Array.isArray(parsed) && parsed.length > 0
        ? parsed
        : ["https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800"];
    } catch {
      return [
        "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800",
      ];
    }
  };

  const slides = getSlides();
  const autoplayEnabled = settings.hero_slider_autoplay !== "false";
  const intervalSeconds = Math.max(2, parseInt(settings.hero_slider_interval || "4", 10));

  // Autoplay Slider Timer
  useEffect(() => {
    if (!autoplayEnabled || isPaused || slides.length <= 1) return;

    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, intervalSeconds * 1000);

    return () => clearInterval(timer);
  }, [slides.length, autoplayEnabled, isPaused, intervalSeconds]);

  const nextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setActiveSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  // Touch Swipe Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        // swipe left -> next in RTL
        nextSlide();
      } else {
        // swipe right -> prev
        prevSlide();
      }
    }
    touchStartX.current = null;
  };

  const walletTotal = currentUser?.wallet?.totalAvailable ?? 0;

  const quickServices = [
    {
      title: settings.srv1_title || "سيارات معدلة 1695HP",
      desc: settings.srv1_desc || "أقوى سيارات دريفت وسرعة بأعلى تظبيط للمحركات",
      icon: Car,
      href: "/shop?type=MODIFIED_CAR",
      badge: "W16 Tuning",
      borderColor: "border-orange-500/40",
      iconColor: "text-orange-500 bg-orange-500/10",
    },
    {
      title: settings.srv2_title || "سيارات رسم وفينيل حصري",
      desc: settings.srv2_desc || "تصاميم مرسومة بدقة واحترافية عالية",
      icon: Flame,
      href: "/shop?type=DRAWN_CAR",
      badge: "Custom Livery",
      borderColor: "border-purple-500/40",
      iconColor: "text-purple-500 bg-purple-500/10",
    },
    {
      title: settings.srv3_title || "خدمات شحن الكاش والكوينز",
      desc: settings.srv3_desc || "شحن كاش 50M وكوينز ذهبي وتفعيل الكينج رانك",
      icon: Zap,
      href: "/shop?type=SERVICE",
      badge: "Coins & Cash",
      borderColor: "border-emerald-500/40",
      iconColor: "text-emerald-500 bg-emerald-500/10",
    },
    {
      title: settings.srv4_title || "حسابات جاهزة VIP",
      desc: settings.srv4_desc || "حسابات بكامل السيارات المعدلة والأموال",
      icon: Key,
      href: "/shop?type=ACCOUNT",
      badge: "VIP Accounts",
      borderColor: "border-blue-500/40",
      iconColor: "text-blue-500 bg-blue-500/10",
    },
  ];

  return (
    <section className="relative pt-3 pb-6 px-3 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto w-full space-y-5">
        {/* 1. Top Live Wallet & Instant Action Card */}
        <div className="rounded-2xl bg-[#0f1218] border border-gray-800 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-right shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-3.5 w-full sm:w-auto">
            <div className="w-12 h-12 rounded-xl bg-[#161b24] text-orange-500 border border-orange-500/20 flex items-center justify-center shrink-0">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-gray-400 block font-medium">
                {currentUser ? `مرحباً بك، ${currentUser.name}` : "رصيد المحفظة المتاح للشراء"}
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl sm:text-3xl font-black text-orange-500 font-mono tracking-tight">
                  {formatCurrency(walletTotal)}
                </span>
                <span className="text-[11px] text-gray-400 font-medium">
                  جاهز للاستخدام الفوري
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <Link
              href="/deposit"
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-black font-black text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>{settings.hero_cta1_text ?? "شحن رصيد المحفظة"}</span>
            </Link>
            <Link
              href="/shop"
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-[#161b24] hover:bg-gray-800/60 text-white border border-gray-700 font-bold text-xs transition text-center"
            >
              {settings.hero_cta2_text ?? "تصفح المتجر الكامل"}
            </Link>
          </div>
        </div>

        {/* 2. Main Store Workshop Banner with Responsive Multi-Image Slider */}
        <div className="rounded-3xl bg-[#0f1218] border border-gray-800 p-6 sm:p-8 lg:p-10 text-right shadow-sm relative overflow-hidden card-drift-accent">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left/Content Column */}
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#161b24] border border-orange-500/30 text-orange-500 text-xs font-bold">
                <Wrench className="w-3.5 h-3.5" />
                <span>{settings.hero_badge ?? "متجر وورشة Car Parking Multiplayer الرسمية"}</span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight tracking-tight">
                {settings.store_name ?? "EGY CPM"}{" "}
                <span className="text-orange-500 block sm:inline mt-1 sm:mt-0">
                  {settings.hero_title ?? "المنصة الأولى لخدمات وتعديل سيارات اللعبة"}
                </span>
              </h1>

              {settings.hero_description !== "" && (
                <p className="text-xs sm:text-sm text-gray-300 leading-relaxed max-w-2xl">
                  {settings.hero_description ?? "المتجر الرائد لتعديل محركات السيارات 1695HP، وتصاميم الفينيل الحصرية، وشحن الكاش والكوينز وتفعيل الكينج رانك، مع حماية تامة وأمان معتمد 100%."}
                </p>
              )}

              {/* Verified Trust Points */}
              <div className="flex flex-wrap items-center gap-2.5 pt-2 text-xs text-gray-300 font-medium">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#161b24] border border-gray-800 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>حماية كاملة وأمان معتمد</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#161b24] border border-gray-800 text-orange-500">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>تسليم مباشر ومتابعة حية للطلب</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#161b24] border border-gray-800 text-blue-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>دعم متواصل عبر التذاكر</span>
                </div>
              </div>
            </div>

            {/* Right Automotive Hero Visual Graphic (Dynamic Slider) */}
            <div
              className="lg:col-span-5 relative group"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <div className="relative aspect-[16/11] rounded-2xl overflow-hidden bg-[#161b24] border border-gray-800 shadow-md">
                {slides.map((url, idx) => (
                  <div
                    key={idx}
                    className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                      activeSlide === idx ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                    }`}
                  >
                    <img
                      src={url}
                      alt={`Car Tuning Slide ${idx + 1}`}
                      loading={idx === 0 ? "eager" : "lazy"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}

                {/* Badges Over Image */}
                <div className="absolute top-3 right-3 z-20 px-3 py-1 rounded-lg bg-black/80 text-orange-500 font-extrabold text-xs font-mono border border-orange-500/30">
                  1695 HP TUNING
                </div>
                <div className="absolute bottom-3 left-3 z-20 px-3 py-1 rounded-lg bg-black/80 text-gray-200 font-bold text-xs border border-gray-700">
                  CPM GARAGE
                </div>

                {/* Slider Navigation Arrows (If > 1 image) */}
                {slides.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={prevSlide}
                      className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/70 hover:bg-black/90 text-white border border-gray-700 transition opacity-80 group-hover:opacity-100"
                      aria-label="الصورة السابقة"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={nextSlide}
                      className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/70 hover:bg-black/90 text-white border border-gray-700 transition opacity-80 group-hover:opacity-100"
                      aria-label="الصورة التالية"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    {/* Dot Indicators */}
                    <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/70 border border-gray-700">
                      {slides.map((_, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setActiveSlide(idx)}
                          className={`h-1.5 rounded-full transition-all ${
                            activeSlide === idx ? "w-4 bg-orange-500" : "w-1.5 bg-gray-500 hover:bg-gray-300"
                          }`}
                          aria-label={`الشريحة ${idx + 1}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 3. Quick Automotive Services & Navigation Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {quickServices.map((srv, idx) => {
            const Icon = srv.icon;
            return (
              <Link
                key={idx}
                href={srv.href}
                className="p-4 rounded-2xl bg-[#0f1218] border border-gray-800 hover:border-orange-500/60 transition flex flex-col justify-between space-y-3 group shadow-sm relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <div className={`p-2.5 rounded-xl ${srv.iconColor} border ${srv.borderColor} shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-gray-400 px-2 py-0.5 rounded-md bg-[#161b24] border border-gray-800">
                    {srv.badge}
                  </span>
                </div>

                <div className="space-y-1 text-right">
                  <h3 className="text-xs sm:text-sm font-black text-white group-hover:text-orange-500 transition">
                    {srv.title}
                  </h3>
                  <p className="text-[11px] text-gray-400 leading-snug">
                    {srv.desc}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

