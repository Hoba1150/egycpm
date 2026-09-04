"use client";

import React, { useState, useEffect } from "react";
import { Flame, X } from "lucide-react";

interface DriftAnimationShowcaseProps {
  onFinish: () => void;
  active: boolean;
}

const ACTION_QUOTES = [
  {
    title: "1695HP W16 TUNING UNLEASHED! 🔥",
    subtitle: "أقوى تسارع وتظبيط دريفت في Car Parking بدون منافس!",
    accent: "from-red-600 via-orange-500 to-amber-400",
    badge: "TUNING BEAST",
  },
  {
    title: "KING RANK & GOLDEN COINS ACTIVATED! 👑",
    subtitle: "شحن فوري مباشر بدون انتظار وبأعلى درجات الحماية والأمان!",
    accent: "from-amber-400 via-yellow-500 to-amber-600",
    badge: "VIP ROYALTY",
  },
  {
    title: "CUSTOM LIVERY & EXCLUSIVE VINYL! 🎨",
    subtitle: "تصاميم مرسومة يدوي بدقة أسطورية تميزك في كل السيرفرات!",
    accent: "from-purple-500 via-pink-500 to-rose-500",
    badge: "EXCLUSIVE ART",
  },
  {
    title: "DRIFT MODE: MAXIMUM SPEED & CONTROL! ⚡",
    subtitle: "تجهيز كامل للسباقات والتحديات مع تسليم مباشر على حسابك!",
    accent: "from-cyan-400 via-blue-500 to-indigo-600",
    badge: "SPEED DEMON",
  },
  {
    title: "EGY CPM: NO LIMITS, ONLY POWER! 🚀",
    subtitle: "الورشة رقم 1 المعتمدة لجميع خدمات وحسابات اللعبة في مصر!",
    accent: "from-red-500 via-rose-600 to-red-700",
    badge: "DOMINATE THE GAME",
  },
];

export default function DriftAnimationShowcase({ onFinish, active }: DriftAnimationShowcaseProps) {
  const [currentQuote, setCurrentQuote] = useState<typeof ACTION_QUOTES[0] | null>(null);

  // When active becomes true: pick exactly ONE random quote and set 3-second auto-close timer
  useEffect(() => {
    if (!active) {
      setCurrentQuote(null);
      return;
    }

    // Pick 1 random quote
    const randomQuote = ACTION_QUOTES[Math.floor(Math.random() * ACTION_QUOTES.length)];
    setCurrentQuote(randomQuote);

    // Auto close completely after 3 seconds
    const timer = setTimeout(() => {
      onFinish();
    }, 3000);

    return () => clearTimeout(timer);
  }, [active, onFinish]);

  if (!active || !currentQuote) return null;

  return (
    <div className="absolute inset-0 z-30 overflow-hidden rounded-2xl sm:rounded-3xl bg-[#07090e]/95 backdrop-blur-md border border-red-500/40 p-5 sm:p-8 flex flex-col justify-center items-center text-center select-none animate-in fade-in duration-300">
      {/* Quick Close Button */}
      <button
        onClick={onFinish}
        className="absolute top-3 left-3 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-400 hover:text-white transition z-30"
        title="إغلاق العرض"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Subtle Ambient Pulse */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-10">
        <div className="w-64 h-64 sm:w-80 sm:h-80 rounded-full bg-red-600 animate-ping" />
      </div>

      {/* Single Dynamic Action Quote in Bold Clean Typography */}
      <div className="relative z-20 space-y-3 max-w-xl animate-in zoom-in-95 duration-400">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-600/25 border border-red-500/60 text-red-400 font-mono font-black text-xs tracking-widest uppercase shadow-lg">
          <Flame className="w-4 h-4 text-red-500 animate-bounce" />
          <span>{currentQuote.badge}</span>
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
        </div>

        <h2
          className={`text-2xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r ${currentQuote.accent} tracking-tight leading-tight drop-shadow-[0_0_30px_rgba(239,68,68,0.7)]`}
        >
          {currentQuote.title}
        </h2>

        <p className="text-xs sm:text-base text-gray-100 font-bold leading-relaxed px-4">
          {currentQuote.subtitle}
        </p>

        <div className="pt-2 flex items-center justify-center gap-3">
          <span className="h-1 w-14 bg-red-600 rounded-full animate-pulse" />
          <span className="text-[11px] text-gray-400 font-mono font-bold uppercase tracking-wider">
            EGY CPM • SPECIAL HIGHLIGHT
          </span>
          <span className="h-1 w-14 bg-red-600 rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
}



