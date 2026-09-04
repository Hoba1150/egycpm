"use client";

import React, { useState, useEffect, useRef } from "react";
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
  const [currentQuote, setCurrentQuote] = useState(ACTION_QUOTES[0]);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Synthesize realistic V12 Supercar ignition & aggressive rev sound (matching YouTube V12 exhaust roar)
  const playV12IgnitionSound = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;
      const now = ctx.currentTime;

      // Master output gain
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.2, now);
      masterGain.gain.exponentialRampToValueAtTime(0.001, now + 3.2);
      masterGain.connect(ctx.destination);

      // Deep Exhaust Resonance Filter
      const exhaustFilter = ctx.createBiquadFilter();
      exhaustFilter.type = "lowpass";
      exhaustFilter.frequency.setValueAtTime(300, now);
      // Starter crank -> Violent throttle surge -> Idle settles
      exhaustFilter.frequency.exponentialRampToValueAtTime(1800, now + 0.9);
      exhaustFilter.frequency.exponentialRampToValueAtTime(450, now + 2.8);
      exhaustFilter.connect(masterGain);

      // 1. Starter Motor Cranking Sound (0.0s to 0.5s)
      const starterOsc = ctx.createOscillator();
      starterOsc.type = "square";
      starterOsc.frequency.setValueAtTime(45, now);
      starterOsc.frequency.linearRampToValueAtTime(80, now + 0.4);
      const starterGain = ctx.createGain();
      starterGain.gain.setValueAtTime(0.12, now);
      starterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      starterOsc.connect(starterGain);
      starterGain.connect(exhaustFilter);
      starterOsc.start(now);
      starterOsc.stop(now + 0.55);

      // 2. V12 Low-End Rumble (Deep V12 displacement)
      const v12Low = ctx.createOscillator();
      v12Low.type = "sawtooth";
      v12Low.frequency.setValueAtTime(55, now + 0.35);
      v12Low.frequency.exponentialRampToValueAtTime(320, now + 1.1); // High Rev Surge
      v12Low.frequency.exponentialRampToValueAtTime(110, now + 2.9); // Idle settle
      const v12LowGain = ctx.createGain();
      v12LowGain.gain.setValueAtTime(0.001, now);
      v12LowGain.gain.setValueAtTime(0.18, now + 0.35);
      v12LowGain.gain.exponentialRampToValueAtTime(0.001, now + 3.1);
      v12Low.connect(v12LowGain);
      v12LowGain.connect(exhaustFilter);
      v12Low.start(now + 0.35);
      v12Low.stop(now + 3.2);

      // 3. V12 High Harmonic Scream (Metallic valve & exhaust note)
      const v12High = ctx.createOscillator();
      v12High.type = "sawtooth";
      v12High.frequency.setValueAtTime(110, now + 0.4);
      v12High.frequency.exponentialRampToValueAtTime(680, now + 1.1); // Screaming peak
      v12High.frequency.exponentialRampToValueAtTime(220, now + 2.9);
      const v12HighGain = ctx.createGain();
      v12HighGain.gain.setValueAtTime(0.001, now);
      v12HighGain.gain.setValueAtTime(0.12, now + 0.4);
      v12HighGain.gain.exponentialRampToValueAtTime(0.001, now + 3.1);
      v12High.connect(v12HighGain);
      v12HighGain.connect(exhaustFilter);
      v12High.start(now + 0.4);
      v12High.stop(now + 3.2);

      // 4. Turbo / Supercharger Spool Whistle
      const turboWhistle = ctx.createOscillator();
      turboWhistle.type = "sine";
      turboWhistle.frequency.setValueAtTime(400, now + 0.4);
      turboWhistle.frequency.exponentialRampToValueAtTime(1200, now + 1.1);
      turboWhistle.frequency.exponentialRampToValueAtTime(300, now + 2.8);
      const turboGain = ctx.createGain();
      turboGain.gain.setValueAtTime(0.001, now);
      turboGain.gain.setValueAtTime(0.04, now + 0.5);
      turboGain.gain.exponentialRampToValueAtTime(0.001, now + 2.9);
      turboWhistle.connect(turboGain);
      turboGain.connect(masterGain);
      turboWhistle.start(now + 0.4);
      turboWhistle.stop(now + 3.0);
    } catch {}
  };

  // Run one-shot on active = true, pick random quote, play sound, and auto-close via onFinish
  useEffect(() => {
    if (!active) return;

    // Pick brand new random quote
    const randomQuote = ACTION_QUOTES[Math.floor(Math.random() * ACTION_QUOTES.length)];
    setCurrentQuote(randomQuote);

    // Play engine roar
    playV12IgnitionSound();

    // Auto close after 3.2 seconds
    const timer = setTimeout(() => {
      onFinish();
    }, 3200);

    return () => {
      clearTimeout(timer);
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        try {
          audioCtxRef.current.close();
        } catch {}
      }
    };
  }, [active, onFinish]);

  if (!active) return null;

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

      {/* V12 Sound Wave Visual Pulse */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-15">
        <div className="w-64 h-64 sm:w-80 sm:h-80 rounded-full bg-red-600 animate-ping" />
      </div>

      {/* Dynamic Action Quote in Pure Bold Text */}
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
            V12 ENGINE ACTIVE • EGY CPM
          </span>
          <span className="h-1 w-14 bg-red-600 rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
}



