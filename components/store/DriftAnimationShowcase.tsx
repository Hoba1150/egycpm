"use client";

import React, { useState, useEffect, useRef } from "react";
import { Zap, Flame, Sparkles, Volume2, VolumeX } from "lucide-react";

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
    title: "DRIFT MODE: MAXIMUM SMOKE & SPEED! 💨",
    subtitle: "تجهيز كامل للسباقات والتحديات مع تسليم مباشر على حسابك!",
    accent: "from-cyan-400 via-blue-500 to-indigo-600",
    badge: "SPEED DEMON",
  },
  {
    title: "EGY CPM: NO LIMITS, ONLY POWER! ⚡",
    subtitle: "الورشة رقم 1 المعتمدة لجميع خدمات وحسابات اللعبة في مصر!",
    accent: "from-red-500 via-rose-600 to-red-700",
    badge: "DOMINATE THE GAME",
  },
];

export default function DriftAnimationShowcase({ onFinish, active }: DriftAnimationShowcaseProps) {
  const [phase, setPhase] = useState<"idle" | "smoke_in" | "car_drift" | "quote_reveal" | "car_exit" | "done">("idle");
  const [currentQuote, setCurrentQuote] = useState(ACTION_QUOTES[0]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);

  // Pick random quote on each launch
  useEffect(() => {
    if (active) {
      const randomQuote = ACTION_QUOTES[Math.floor(Math.random() * ACTION_QUOTES.length)];
      setCurrentQuote(randomQuote);
      setPhase("smoke_in");

      // Play soft engine roar sound synth
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(80, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + 1.2);
        osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 2.5);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3.0);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 3.0);
      } catch {}
    }
  }, [active]);

  // Phase Sequence Controller
  useEffect(() => {
    if (!active) return;

    if (phase === "smoke_in") {
      const t = setTimeout(() => setPhase("car_drift"), 600);
      return () => clearTimeout(t);
    }
    if (phase === "car_drift") {
      const t = setTimeout(() => setPhase("quote_reveal"), 800);
      return () => clearTimeout(t);
    }
    if (phase === "quote_reveal") {
      const t = setTimeout(() => setPhase("car_exit"), 2200);
      return () => clearTimeout(t);
    }
    if (phase === "car_exit") {
      const t = setTimeout(() => {
        setPhase("done");
        onFinish();
      }, 900);
      return () => clearTimeout(t);
    }
  }, [phase, active, onFinish]);

  // High-performance 2D Canvas Smoke Particles System
  useEffect(() => {
    if (!active || phase === "idle" || phase === "done") return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      opacity: number;
      growth: number;
      color: string;
    }

    const particles: Particle[] = [];
    const colors = ["rgba(255, 60, 60, ", "rgba(255, 140, 0, ", "rgba(220, 220, 220, ", "rgba(80, 80, 80, "];

    const createSmokePuff = (x: number, y: number, count = 8) => {
      for (let i = 0; i < count; i++) {
        particles.push({
          x: x + (Math.random() - 0.5) * 40,
          y: y + (Math.random() - 0.5) * 20,
          vx: (Math.random() - 0.5) * 4 - 2,
          vy: (Math.random() - 0.5) * 3 - 1,
          radius: Math.random() * 18 + 12,
          opacity: Math.random() * 0.7 + 0.3,
          growth: Math.random() * 0.8 + 0.4,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
    };

    let frame = 0;
    const render = () => {
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Spawn particles during active phases
      if (frame % 2 === 0 && (phase === "smoke_in" || phase === "car_drift" || phase === "car_exit")) {
        createSmokePuff(canvas.width * 0.7, canvas.height * 0.6, 5);
        createSmokePuff(canvas.width * 0.4, canvas.height * 0.5, 4);
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.radius += p.growth;
        p.opacity -= 0.015;

        if (p.opacity <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${p.opacity})`;
        ctx.fill();
        ctx.restore();
      }

      if (active) {
        animFrameRef.current = requestAnimationFrame(render);
      }
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [active, phase]);

  if (!active || phase === "done") return null;

  return (
    <div className="absolute inset-0 z-30 overflow-hidden rounded-2xl sm:rounded-3xl bg-[#090b10] border border-red-500/40 p-6 flex flex-col justify-center items-center text-center select-none animate-in fade-in duration-300">
      {/* 2D Smoke Canvas Background */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-10 opacity-80"
      />

      {/* Speed & Drift Tire Skid Marks on Ground */}
      <div className="absolute inset-x-0 bottom-6 h-12 pointer-events-none z-0 opacity-40">
        <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 400 60">
          <path
            d="M 400 30 Q 250 55 180 25 T 0 35"
            fill="none"
            stroke="#000"
            strokeWidth="6"
            strokeDasharray="8 6"
            className="animate-pulse"
          />
          <path
            d="M 400 40 Q 250 65 180 35 T 0 45"
            fill="none"
            stroke="#ff2200"
            strokeWidth="3"
            opacity="0.6"
          />
        </svg>
      </div>

      {/* 2D Sports BMW Drift Silhouette / Vector Car */}
      <div
        className={`absolute z-20 transition-all duration-700 ease-out pointer-events-none ${
          phase === "smoke_in"
            ? "translate-x-[150%] scale-75 opacity-0 rotate-12"
            : phase === "car_drift"
            ? "translate-x-[15%] scale-105 opacity-100 -rotate-6"
            : phase === "quote_reveal"
            ? "translate-x-[0%] scale-100 opacity-95 rotate-0"
            : "translate-x-[-160%] scale-90 opacity-0 -rotate-12"
        }`}
        style={{
          filter: "drop-shadow(0 0 25px rgba(239, 68, 68, 0.7))",
        }}
      >
        <div className="relative w-64 sm:w-80 h-28 sm:h-36 flex items-center justify-center">
          {/* Stylized 2D BMW M-Power Sports Car Vector */}
          <svg
            viewBox="0 0 320 120"
            className="w-full h-full text-white"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Turbo Flame Blast from Exhaust */}
            <g className="animate-pulse">
              <path
                d="M 290 85 Q 330 82 315 88 Q 335 85 305 92 Z"
                fill="url(#exhaustFire)"
              />
            </g>

            {/* Car Body Shell */}
            <path
              d="M 25 80 L 45 50 Q 80 40 130 38 L 195 38 Q 235 40 265 65 L 295 78 Q 300 85 290 92 L 30 92 Q 20 88 25 80 Z"
              fill="#181c24"
              stroke="#ef4444"
              strokeWidth="3"
            />
            {/* Aerodynamic Roof & Windows */}
            <path
              d="M 95 48 L 135 25 Q 185 24 215 48 Z"
              fill="#0a0c10"
              stroke="#38bdf8"
              strokeWidth="2"
            />
            {/* Iconic M-Power Stripes */}
            <path d="M 120 48 L 140 25" stroke="#38bdf8" strokeWidth="4" />
            <path d="M 126 48 L 146 25" stroke="#1d4ed8" strokeWidth="4" />
            <path d="M 132 48 L 152 25" stroke="#ef4444" strokeWidth="4" />

            {/* Glowing Angel Eyes / Neon Headlights */}
            <circle cx="42" cy="74" r="5" fill="#38bdf8" className="animate-ping" />
            <circle cx="42" cy="74" r="4" fill="#fff" />
            <circle cx="56" cy="74" r="4" fill="#38bdf8" />

            {/* Rear Tail Light Glow */}
            <rect x="282" y="72" width="12" height="6" rx="2" fill="#ef4444" className="animate-pulse" />

            {/* Front & Rear Wheels / Alloy Rims with Spinning Effect */}
            <g className="animate-spin" style={{ transformOrigin: "70px 92px" }}>
              <circle cx="70" cy="92" r="18" fill="#0c0d12" stroke="#4b5563" strokeWidth="4" />
              <circle cx="70" cy="92" r="10" fill="#1f2937" stroke="#ef4444" strokeWidth="2" />
              <line x1="70" y1="74" x2="70" y2="110" stroke="#9ca3af" strokeWidth="2" />
              <line x1="52" y1="92" x2="88" y2="92" stroke="#9ca3af" strokeWidth="2" />
            </g>
            <g className="animate-spin" style={{ transformOrigin: "245px 92px" }}>
              <circle cx="245" cy="92" r="18" fill="#0c0d12" stroke="#4b5563" strokeWidth="4" />
              <circle cx="245" cy="92" r="10" fill="#1f2937" stroke="#ef4444" strokeWidth="2" />
              <line x1="245" y1="74" x2="245" y2="110" stroke="#9ca3af" strokeWidth="2" />
              <line x1="227" y1="92" x2="263" y2="92" stroke="#9ca3af" strokeWidth="2" />
            </g>

            {/* Gradients */}
            <defs>
              <linearGradient id="exhaustFire" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="40%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#ef4444" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Dynamic Action Quote Revealed in Drift Smoke */}
      <div
        className={`relative z-20 space-y-2.5 max-w-xl transition-all duration-500 transform ${
          phase === "quote_reveal" || phase === "car_drift"
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
