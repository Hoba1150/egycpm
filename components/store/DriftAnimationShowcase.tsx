"use client";

import React, { useState, useEffect } from "react";
import { Flame, Zap, Volume2 } from "lucide-react";

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
  const [phase, setPhase] = useState<"idle" | "quote_reveal" | "done">("idle");
  const [currentQuote, setCurrentQuote] = useState(ACTION_QUOTES[0]);

  // Play realistic multi-harmonic V12 engine roar synthesizer
  const playV12EngineRoar = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const now = ctx.currentTime;

      // Master Gain
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.15, now);
      masterGain.gain.exponentialRampToValueAtTime(0.001, now + 3.2);
      masterGain.connect(ctx.destination);

      // Low-pass filter for deep exhaust rumble
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(450, now);
      filter.frequency.exponentialRampToValueAtTime(1400, now + 0.8);
      filter.frequency.exponentialRampToValueAtTime(350, now + 3.0);
      filter.connect(masterGain);

      // Cylinder 1: Sub Bass Rumble (Fundamental Idle -> Rev)
      const osc1 = ctx.createOscillator();
      osc1.type = "sawtooth";
      osc1.frequency.setValueAtTime(65, now); // Starter crank
      osc1.frequency.exponentialRampToValueAtTime(240, now + 0.9); // High Rev
      osc1.frequency.exponentialRampToValueAtTime(95, now + 3.0); // Idle down
      osc1.connect(filter);
      osc1.start(now);
      osc1.stop(now + 3.2);

      // Cylinder 2: Harmonic Growl (V12 distinctive high scream)
      const osc2 = ctx.createOscillator();
      osc2.type = "sawtooth";
      osc2.frequency.setValueAtTime(130, now);
      osc2.frequency.exponentialRampToValueAtTime(480, now + 0.9);
      osc2.frequency.exponentialRampToValueAtTime(190, now + 3.0);
      osc2.connect(filter);
      osc2.start(now);
      osc2.stop(now + 3.2);

      // Cylinder 3: High Pitch Turbo Whistle / Exhaust Spool
      const osc3 = ctx.createOscillator();
      osc3.type = "triangle";
      osc3.frequency.setValueAtTime(350, now);
      osc3.frequency.exponentialRampToValueAtTime(920, now + 0.85);
      osc3.frequency.exponentialRampToValueAtTime(280, now + 2.8);
      const turboGain = ctx.createGain();
      turboGain.gain.setValueAtTime(0.04, now);
      turboGain.gain.exponentialRampToValueAtTime(0.001, now + 3.0);
      osc3.connect(turboGain);
      turboGain.connect(masterGain);
      osc3.start(now);
      osc3.stop(now + 3.0);
    } catch {}
  };

  // Pick random quote on each launch & trigger V12 sound
  useEffect(() => {
    if (active) {
      const randomQuote = ACTION_QUOTES[Math.floor(Math.random() * ACTION_QUOTES.length)];
      setCurrentQuote(randomQuote);
      setPhase("quote_reveal");
      playV12EngineRoar();

      const timer = setTimeout(() => {
        setPhase("done");
        onFinish();
      }, 3500);

      return () => clearTimeout(timer);
    }
  }, [active, onFinish]);

  if (!active || phase === "done") return null;

  return (
    <div className="absolute inset-0 z-30 overflow-hidden rounded-2xl sm:rounded-3xl bg-[#090b10]/95 backdrop-blur-md border border-red-500/40 p-6 flex flex-col justify-center items-center text-center select-none animate-in fade-in duration-300">
      {/* V12 Sound Wave Visual Accent */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-10">
        <div className="w-72 h-72 rounded-full bg-red-600 animate-ping" />
      </div>

      {/* Dynamic Action Quote Revealed in Pure Clean Text */}
      <div className="relative z-20 space-y-3 max-w-xl animate-in zoom-in-95 duration-500">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-600/20 border border-red-500/50 text-red-400 font-mono font-black text-xs tracking-widest uppercase shadow-lg">
          <Flame className="w-4 h-4 text-red-500 animate-bounce" />
          <span>{currentQuote.badge}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
        </div>

        <h2
          className={`text-2xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r ${currentQuote.accent} tracking-tight leading-tight drop-shadow-[0_0_25px_rgba(239,68,68,0.6)]`}
        >
          {currentQuote.title}
        </h2>

        <p className="text-xs sm:text-base text-gray-200 font-bold leading-relaxed px-4">
          {currentQuote.subtitle}
        </p>

        <div className="pt-3 flex items-center justify-center gap-3">
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


