"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Car,
  Flame,
  Zap,
  Key,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Sparkles,
  Award,
  Lock,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useSettings } from "@/lib/context/SettingsContext";

interface HeroSectionProps {
  user?: any;
  products?: any[];
  initialSettings?: Record<string, string>;
}

export default function HeroSection({ user: initialUser }: HeroSectionProps) {
  const [currentUser, setCurrentUser] = useState(initialUser);
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
          "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=1200&q=80",
          "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&q=80",
          "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=1200&q=80",
        ];
      }
      const parsed = JSON.parse(settings.hero_images);
      return Array.isArray(parsed) && parsed.length > 0
        ? parsed
        : ["https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=1200&q=80"];
    } catch {
      return [
        "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=1200&q=80",
      ];
    }
  };

  const slides = getSlides();
  const autoplayEnabled = settings.hero_slider_autoplay !== "false";
  const intervalSeconds = Math.max(3, parseInt(settings.hero_slider_interval || "5", 10));

  useEffect(() => {
    if (!autoplayEnabled || isPaused || slides.length <= 1) return;

    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, intervalSeconds * 1000);

    return () => clearInterval(timer);
  }, [slides.length, autoplayEnabled, isPaused, intervalSeconds]);

  const nextSlide = () => setActiveSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setActiveSlide((prev) => (prev - 1 + slides.length) % slides.length);

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

  // Modern Minimal Services shortcuts
  const keyShortcuts = [
    {
      title: settings.srv1_title || "سيارات معدلة 1695HP",
      desc: "أقوى محركات وسرعة ودريفت",
      icon: Car,
      href: "/shop?type=MODIFIED_CAR",
      accent: "text-red-500 bg-red-500/10 border-red-500/20",
    },
    {
      title: settings.srv2_title || "سيارات رسم وفينيل",
      desc: "تصاميم فريدة حصرية",
      icon: Flame,
      href: "/shop?type=DRAWN_CAR",
      accent: "text-rose-500 bg-rose-500/10 border-rose-500/20",
    },
    {
      title: settings.srv3_title || "شحن كاش وكوينز",
      desc: "تسليم فوري وآمن 100%",
      icon: Zap,
      href: "/shop?type=SERVICE",
      accent: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20",
    },
    {
      title: settings.srv4_title || "حسابات جاهزة VIP",
      desc: "كامل الميزات والأموال",
      icon: Key,
      href: "/shop?type=ACCOUNT",
      accent: "text-red-400 bg-red-400/10 border-red-400/20",
    },
  ];

  return (
    <div className="space-y-8 text-right">
      {/* ─── 1. CINEMATIC GLASS HERO STAGE ─── */}
      <div className="relative rounded-3xl overflow-hidden border border-white/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
        {/* Background Cinematic Slide Carousel */}
        <div
          className="relative h-[480px] sm:h-[560px] lg:h-[620px] w-full overflow-hidden bg-[#050608]"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {slides.map((url, idx) => (
            <div
              key={idx}
              className={`absolute inset-0 transition-all duration-1000 ease-out ${
                activeSlide === idx
                  ? "opacity-100 scale-100 z-10"
                  : "opacity-0 scale-105 z-0 pointer-events-none"
              }`}
            >
              <img
                src={url}
                alt="EGY CPM Cinematic"
                loading="eager"
                className="w-full h-full object-cover object-center"
              />
            </div>
          ))}

          {/* iOS Cinematic Vignette & Ambient Darkness */}
          <div className="absolute inset-0 z-20 bg-gradient-to-t from-[#030406] via-[#030406]/65 to-black/30" />
          <div className="absolute inset-0 z-20 bg-radial-gradient from-transparent via-black/20 to-black/80" />

          {/* Floating Slider Pagination Dots */}
          {slides.length > 1 && (
            <div className="absolute bottom-6 left-6 z-30 flex items-center gap-1.5 p-1.5 rounded-full bg-black/40 backdrop-blur-xl border border-white/10">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveSlide(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    activeSlide === idx ? "w-6 bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.8)]" : "w-1.5 bg-white/30"
                  }`}
                  aria-label={`Slide ${idx + 1}`}
                />
              ))}
            </div>
          )}

          {/* Hero Content Overlay (Pure Minimal Premium iOS) */}
          <div className="absolute inset-0 z-30 flex flex-col justify-end p-6 sm:p-10 lg:p-14 max-w-4xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.08] backdrop-blur-xl border border-white/15 text-white text-xs font-semibold self-start shadow-sm">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span>{settings.hero_badge || "متجر كار باركينج الرسمي الأول"}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.15] tracking-tight">
              {settings.store_name || "EGY CPM"}{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-red-400 to-white block sm:inline">
                {settings.hero_title || "السرعة، التعديل، والتميز الحقيقي"}
              </span>
            </h1>

            <p className="text-xs sm:text-sm lg:text-base text-gray-300/90 max-w-2xl leading-relaxed">
              {settings.hero_description ||
                "المنصة الاحترافية الأولى لخدمات وتعديل سيارات Car Parking Multiplayer. سيارات 1695HP، تصاميم فينيل ورسم نادرة، وشحن كاش وفك قيود الحسابات بأمان معتمد 100%."}
            </p>

            {/* Quick Action CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-3">
              <Link
                href="/shop"
                className="px-6 py-3.5 rounded-2xl glass-button-primary text-xs sm:text-sm font-black flex items-center gap-2 tracking-wide"
              >
                <span>{settings.hero_cta2_text || "تصفح المتجر الكامل"}</span>
                <ArrowLeft className="w-4 h-4" />
              </Link>

              <Link
                href="/deposit"
                className="px-6 py-3.5 rounded-2xl glass-button-secondary text-xs sm:text-sm font-bold flex items-center gap-2"
              >
                <span>{settings.hero_cta1_text || "شحن المحفظة"}</span>
              </Link>

              {currentUser && (
                <div className="px-4 py-3 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 flex items-center gap-2 text-xs">
                  <span className="text-gray-400">رصيدك:</span>
                  <span className="font-black text-red-400 font-mono">
                    {formatCurrency(walletTotal)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── 2. MINIMAL SERVICES SHORTCUTS GRID ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {keyShortcuts.map((item, idx) => {
          const Icon = item.icon;
          return (
            <Link
              key={idx}
              href={item.href}
              className="glass-card rounded-2xl p-4 sm:p-5 flex flex-col justify-between min-h-[110px] group"
            >
              <div className="flex items-center justify-between">
                <div className={`p-2.5 rounded-xl border ${item.accent} group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-4 h-4" />
                </div>
                <ChevronLeft className="w-4 h-4 text-gray-500 group-hover:text-red-400 group-hover:-translate-x-1 transition-all" />
              </div>

              <div className="mt-3">
                <h3 className="text-xs sm:text-sm font-black text-white group-hover:text-red-400 transition-colors">
                  {item.title}
                </h3>
                <p className="text-[10px] sm:text-[11px] text-gray-400 mt-0.5">
                  {item.desc}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
