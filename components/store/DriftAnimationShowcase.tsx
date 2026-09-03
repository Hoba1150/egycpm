"use client";

import React, { useState, useEffect } from "react";
import { Flame, Zap } from "lucide-react";

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
  const [phase, setPhase] = useState<"idle" | "car_enter" | "quote_reveal" | "car_exit" | "done">("idle");
  const [currentQuote, setCurrentQuote] = useState(ACTION_QUOTES[0]);

  // Pick random quote on each launch
  useEffect(() => {
    if (active) {
      const randomQuote = ACTION_QUOTES[Math.floor(Math.random() * ACTION_QUOTES.length)];
      setCurrentQuote(randomQuote);
      setPhase("car_enter");

      // Play soft engine roar sound synth
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(80, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + 1.0);
        osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 2.4);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.8);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 2.8);
      } catch {}
    }
  }, [active]);

  // Phase Sequence Controller
  useEffect(() => {
    if (!active) return;

    if (phase === "car_enter") {
      const t = setTimeout(() => setPhase("quote_reveal"), 700);
      return () => clearTimeout(t);
    }
    if (phase === "quote_reveal") {
      const t = setTimeout(() => setPhase("car_exit"), 2500);
      return () => clearTimeout(t);
    }
    if (phase === "car_exit") {
      const t = setTimeout(() => {
        setPhase("done");
        onFinish();
      }, 800);
      return () => clearTimeout(t);
    }
  }, [phase, active, onFinish]);

  if (!active || phase === "done") return null;

  return (
    <div className="absolute inset-0 z-30 overflow-hidden rounded-2xl sm:rounded-3xl bg-[#090b10] border border-red-500/40 p-6 flex flex-col justify-center items-center text-center select-none animate-in fade-in duration-300">
      {/* Real Drift Skid Marks on Ground */}
      <div className="absolute inset-x-0 bottom-4 h-12 pointer-events-none z-0 opacity-60">
        <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 400 60">
          <path
            d="M 400 28 Q 240 52 170 24 T 0 34"
            fill="none"
            stroke="#000"
            strokeWidth="8"
            strokeDasharray="10 6"
          />
          <path
            d="M 400 38 Q 240 62 170 34 T 0 44"
            fill="none"
            stroke="#c0121a"
            strokeWidth="3"
            opacity="0.8"
          />
        </svg>
      </div>

      {/* Realistic Real Sports BMW M5 Drift Car Image */}
      <div
        className={`absolute z-20 transition-all duration-700 ease-out pointer-events-none ${
          phase === "car_enter"
            ? "translate-x-[160%] scale-75 opacity-0 rotate-12"
            : phase === "quote_reveal"
            ? "translate-x-[0%] scale-105 opacity-100 rotate-0"
            : "translate-x-[-160%] scale-90 opacity-0 -rotate-12"
        }`}
        style={{
          filter: "drop-shadow(0 10px 30px rgba(220, 38, 38, 0.6))",
        }}
      >
        <div className="relative w-64 sm:w-80 h-32 sm:h-40 flex items-center justify-center">
          {/* Realistic Real Car Cutout Image */}
          <img
            src="https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&auto=format&fit=crop&q=80"
            alt="BMW M-Power Sports Car"
            className="w-full h-full object-contain rounded-2xl"
          />
          {/* Neon Underglow Effect */}
          <div className="absolute -bottom-2 inset-x-8 h-4 bg-red-600/60 blur-md rounded-full" />
        </div>
      </div>

      {/* Dynamic Action Quote Revealed in Drift Scene */}
      <div
        className={`relative z-20 space-y-2.5 max-w-xl transition-all duration-500 transform ${
          phase === "quote_reveal"
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-90 translate-y-4"
        }`}
      >
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600/20 border border-red-500/50 text-red-400 font-mono font-black text-[10px] tracking-widest uppercase shadow-lg">
          <Flame className="w-3.5 h-3.5 text-red-500 animate-bounce" />
          <span>{currentQuote.badge}</span>
        </div>

        <h2
          className={`text-xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r ${currentQuote.accent} tracking-tight leading-tight drop-shadow-[0_0_20px_rgba(239,68,68,0.5)]`}
        >
          {currentQuote.title}
        </h2>

        <p className="text-xs sm:text-sm text-gray-200 font-bold leading-relaxed px-4">
          {currentQuote.subtitle}
        </p>

        <div className="pt-2 flex items-center justify-center gap-2">
          <span className="h-1 w-12 bg-red-600 rounded-full animate-pulse" />
          <span className="text-[10px] text-gray-400 font-mono font-bold uppercase tracking-wider">
            DRIFT ACTIVATED • EGY CPM
          </span>
          <span className="h-1 w-12 bg-red-600 rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
}

