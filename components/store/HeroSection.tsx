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
  const [currentUser, setCurrentUser] = useState(initialUser || (() => {
    if (typeof window !== "undefined") {
      try {
        const cached = sessionStorage.getItem("cpm_cached_user");
        if (cached) return JSON.parse(cached);
      } catch {}
    }
    return null;
  }));
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
        try {
          sessionStorage.setItem("cpm_cached_user", JSON.stringify(authData.user));
        } catch {}
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
      iconBg: "bg-[#c0121a]/10 border-[#c0121a]/30 text-[#e8161f]",
    },
    {
      title: settings.srv2_title || "سيارات رسم وفينيل حصري",
      desc: settings.srv2_desc || "تصاميم مرسومة بدقة واحترافية عالية",
      icon: Flame,
      href: "/shop?type=DRAWN_CAR",
      badge: "Custom Livery",
      iconBg: "bg-purple-600/10 border-purple-600/30 text-purple-400",
    },
    {
      title: settings.srv3_title || "شحن الكاش والكوينز",
      desc: settings.srv3_desc || "كاش 50M وكوينز ذهبي وتفعيل الكينج رانك",
      icon: Zap,
      href: "/shop?type=SERVICE",
      badge: "Coins & Cash",
      iconBg: "bg-emerald-600/10 border-emerald-600/30 text-emerald-400",
    },
    {
      title: settings.srv4_title || "حسابات جاهزة VIP",
      desc: settings.srv4_desc || "حسابات بكامل السيارات المعدلة والأموال",
      icon: Key,
      href: "/shop?type=ACCOUNT",
      badge: "VIP Accounts",
      iconBg: "bg-blue-600/10 border-blue-600/30 text-blue-400",
    },
  ];



  return (
    <section className="relative pt-3 pb-6 px-3 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto w-full space-y-5">

        {/* 1. Wallet/CTA Banner */}
        <div className="rounded-2xl bg-[var(--card)] border border-[var(--border)] p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-right shadow-sm overflow-hidden">
          <div className="flex items-center gap-3.5 w-full sm:w-auto">
            <div className="w-12 h-12 rounded-xl bg-[var(--red-soft)] text-[var(--red-hi)] border border-[var(--border-hi)] flex items-center justify-center shrink-0">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-[var(--text-dim)] block font-medium">
                {currentUser ? `مرحباً بك، ${currentUser.name}` : "رصيد المحفظة المتاح للشراء"}
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl sm:text-3xl font-black text-[var(--red-hi)] font-mono tracking-tight">
                  {formatCurrency(walletTotal)}
                </span>
                <span className="text-[11px] text-[var(--text-dim)] font-medium">
                  جاهز للاستخدام الفوري
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <Link
              href="/deposit"
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl cpm-btn-red text-xs flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{settings.hero_cta1_text ?? "شحن رصيد المحفظة"}</span>
            </Link>
            <Link
              href="/shop"
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl cpm-btn-ghost text-xs text-center"
            >
              {settings.hero_cta2_text ?? "تصفح المتجر الكامل"}
            </Link>
          </div>
        </div>

        {/* 2. Cinematic Hero + Slider */}
        <div className="rounded-3xl bg-[var(--card)] border border-[var(--border)] overflow-hidden shadow-lg">
          <div className="grid grid-cols-1 lg:grid-cols-12">

            {/* Content Column */}
            <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-center space-y-5 text-right">
              <div className="inline-flex items-center gap-2 self-start px-3 py-1.5 rounded-xl bg-[var(--red-soft)] border border-[var(--border-hi)] text-[var(--red-hi)] text-xs font-bold">
                <Wrench className="w-3.5 h-3.5" />
                <span>{settings.hero_badge ?? "متجر وورشة Car Parking الرسمية"}</span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight tracking-tight">
                {settings.store_name ?? "EGY CPM"}{" "}
                <span className="text-[var(--red-hi)] block sm:inline mt-1 sm:mt-0">
                  {settings.hero_title ?? "المنصة الأولى لتعديل سيارات اللعبة"}
                </span>
              </h1>

              {settings.hero_description !== "" && (
                <p className="text-xs sm:text-sm text-[var(--text-dim)] leading-relaxed max-w-2xl">
                  {settings.hero_description ?? "المتجر الرائد لتعديل محركات السيارات 1695HP، وتصاميم الفينيل الحصرية، وشحن الكاش والكوينز، مع حماية تامة وأمان معتمد 100%."}
                </p>
              )}

              <div className="flex flex-wrap gap-2 pt-1">
                {[
                  { icon: CheckCircle2, text: "حماية كاملة وأمان معتمد", color: "text-emerald-400" },
                  { icon: CheckCircle2, text: "تسليم مباشر ومتابعة حية", color: "text-[var(--red-hi)]" },
                  { icon: CheckCircle2, text: "دعم متواصل عبر التذاكر", color: "text-blue-400" },
                ].map((item, i) => {
                  const Ico = item.icon;
                  return (
                    <div key={i} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--card-hi)] border border-[var(--border)] text-xs font-medium ${item.color}`}>
                      <Ico className="w-3.5 h-3.5" />
                      <span>{item.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Slider Column */}
            <div
              className="lg:col-span-5 relative group min-h-[220px] sm:min-h-[280px] lg:min-h-0"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <div className="relative h-full min-h-[220px] sm:min-h-[280px] lg:min-h-[360px] overflow-hidden bg-[#080809] lg:rounded-l-3xl">
                {/* Slides */}
                {slides.map((url, idx) => (
                  <div
                    key={idx}
                    className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                      activeSlide === idx ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                    }`}
                  >
                    <img
                      src={url}
                      alt={`Slide ${idx + 1}`}
                      loading={idx === 0 ? "eager" : "lazy"}
                      className="w-full h-full object-cover"
                    />
                    {/* cinematic right-edge gradient + bottom vignette */}
                    <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-[var(--card)] opacity-90 pointer-events-none" />
                    <div className="absolute inset-0 hero-vignette pointer-events-none" />
                  </div>
                ))}

                {/* Top badge */}
                <div className="absolute top-3 right-3 z-20 px-3 py-1 rounded-lg bg-black/75 text-[var(--red-hi)] font-black text-xs font-mono border border-[var(--red)]/40 backdrop-blur-sm">
                  1695 HP TUNING
                </div>

                {/* Bottom-left label */}
                <div className="absolute bottom-10 right-3 z-20 px-3 py-1 rounded-lg bg-black/70 text-gray-300 font-bold text-xs border border-white/10 backdrop-blur-sm">
                  EGY CPM GARAGE
                </div>

                {/* Slider controls */}
                {slides.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={prevSlide}
                      className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/70 hover:bg-[var(--red)]/80 text-white border border-white/10 transition opacity-70 group-hover:opacity-100"
                      aria-label="السابق"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={nextSlide}
                      className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/70 hover:bg-[var(--red)]/80 text-white border border-white/10 transition opacity-70 group-hover:opacity-100"
                      aria-label="التالي"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    {/* Dot indicators */}
                    <div className="absolute bottom-3 inset-x-0 z-20 flex items-center justify-center gap-1.5">
                      {slides.map((_, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setActiveSlide(idx)}
                          className={`h-1.5 rounded-full transition-all ${
                            activeSlide === idx
                              ? "w-5 bg-[var(--red-hi)]"
                              : "w-1.5 bg-white/30 hover:bg-white/60"
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

        {/* 3. Quick Service Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {quickServices.map((srv, idx) => {
            const Icon = srv.icon;
            return (
              <Link
                key={idx}
                href={srv.href}
                className="cpm-card p-4 flex flex-col justify-between space-y-3 group overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <div className={`p-2.5 rounded-xl border ${srv.iconBg} shrink-0 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-[var(--text-dim)] px-2 py-0.5 rounded-md bg-[var(--card-hi)] border border-[var(--border)]">
                    {srv.badge}
                  </span>
                </div>

                <div className="space-y-1 text-right">
                  <h3 className="text-xs sm:text-sm font-black text-white group-hover:text-[var(--red-hi)] transition-colors">
                    {srv.title}
                  </h3>
                  <p className="text-[11px] text-[var(--text-dim)] leading-snug">
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

