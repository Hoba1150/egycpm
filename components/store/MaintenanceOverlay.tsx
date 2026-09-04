"use client";

import React, { useEffect, useState } from "react";
import { useSettings } from "@/lib/context/SettingsContext";
import { Wrench, ShieldAlert, Clock } from "lucide-react";
import Link from "next/link";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className || "w-5 h-5"} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.972.531 1.768.815 2.796.815 3.183 0 5.769-2.587 5.77-5.766.001-3.182-2.585-5.77-5.77-5.772zm3.376 8.204c-.149.42-1.009.807-1.401.834-.393.028-.792.176-2.529-.533-1.737-.709-2.83-2.483-2.915-2.597-.086-.114-.707-.941-.707-1.794 0-.853.447-1.272.607-1.444.159-.172.348-.215.464-.215.117 0 .232.001.334.006.107.004.25-.041.391.297.149.36.508 1.238.552 1.328.045.089.075.194.015.313-.06.119-.09.194-.179.298-.09.105-.188.234-.269.314-.09.09-.184.187-.079.367.105.18.468.771 1.002 1.248.687.613 1.266.804 1.446.894.18.09.284.075.39-.045.105-.119.45-.523.57-.703.119-.179.239-.149.39-.09.15.06.953.449 1.118.531.164.083.274.124.314.194.041.07.041.406-.108.826z" />
      <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.526 3.658 1.438 5.174L2 22l4.966-1.397A9.957 9.957 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.2a8.17 8.17 0 01-4.223-1.165l-.303-.18-2.951.829.838-2.877-.197-.314A8.169 8.169 0 013.8 12c0-4.522 3.678-8.2 8.2-8.2s8.2 3.678 8.2 8.2c0 4.522-3.678 8.2-8.2 8.2z" />
    </svg>
  );
}

export default function MaintenanceOverlay() {
  const settings = useSettings();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    try {
      const cached = sessionStorage.getItem("cpm_cached_user");
      if (cached) {
        const user = JSON.parse(cached);
        if (user && (user.role === "ADMIN" || user.role === "SUPER_ADMIN" || user.role === "ORDER_MANAGER")) {
          setIsAdmin(true);
        }
      }
    } catch {}
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data?.user && (data.user.role === "ADMIN" || data.user.role === "SUPER_ADMIN" || data.user.role === "ORDER_MANAGER")) {
          setIsAdmin(true);
        }
      })
      .catch(() => {});
  }, []);

  const isMaintenanceActive = settings.maintenance_mode === "true";
  if (!isClient || !isMaintenanceActive) return null;

  if (isAdmin) {
    return (
      <div className="sticky top-0 z-[9999] bg-red-700 text-white text-xs font-bold py-2.5 px-4 shadow-xl border-b border-red-400 flex items-center justify-between gap-3 text-right">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-200 animate-pulse shrink-0" />
          <span><strong>وضع الصيانة مفعل:</strong> المتجر مغلق أمام الزوار. أنت مسؤول.</span>
        </div>
        <Link href="/admin/settings" className="px-3 py-1 bg-black/40 hover:bg-black/60 rounded-lg text-white font-black text-[11px] transition shrink-0 border border-white/20">
          إلغاء الصيانة ⚙️
        </Link>
      </div>
    );
  }

  const rawWhatsApp = settings.social_whatsapp || settings.vodafone_cash || "01288212101";
  const whatsappUrl = rawWhatsApp.startsWith("http") ? rawWhatsApp : `https://wa.me/${rawWhatsApp.replace(/[^0-9]/g, "")}`;

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-[#050507]/90 backdrop-blur-xl select-none overflow-y-auto">
      <div className="max-w-lg w-full rounded-3xl bg-[#0c1017] border-2 border-red-500/40 p-6 sm:p-8 text-center shadow-[0_0_50px_rgba(220,38,38,0.35)] relative overflow-hidden space-y-6 my-auto">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-red-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative mx-auto w-20 h-20 rounded-2xl bg-red-600/10 border-2 border-red-500/50 flex items-center justify-center">
          <Wrench className="w-10 h-10 text-red-500 animate-bounce" />
        </div>
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-black font-mono">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          <span>أعمال صيانة وتطوير مجدولة</span>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {settings.maintenance_title || "المتجر في وضع الصيانة وسنعود قريباً 🛠️"}
          </h2>
          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed max-w-md mx-auto">
            {settings.maintenance_message || "نعتذر لعملائنا الكرام، نقوم حالياً بعمل تحسينات دورية للمتجر لتقديم أفضل تجربة. سنعود قريباً جداً!"}
          </p>
        </div>
        <div className="p-3.5 rounded-2xl bg-[#12161f] border border-gray-800 flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-orange-400 animate-spin" />
            <span className="font-bold text-gray-200">حالة المتجر:</span>
          </div>
          <span className="text-emerald-400 font-mono font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            جاري تطبيق التحديثات
          </span>
        </div>
        <div className="space-y-3 pt-2">
          <span className="text-xs text-gray-400 block font-bold">هل لديك استفسار أو طلب عاجل؟</span>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto flex-1 px-5 py-3 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-black font-black text-xs flex items-center justify-center gap-2 shadow-lg transition hover:scale-[1.02]">
              <WhatsAppIcon className="w-4 h-4" />
              <span>تواصل معنا عبر واتساب</span>
            </a>
            <Link href="/admin/login" className="w-full sm:w-auto px-4 py-3 rounded-xl bg-[#161b24] hover:bg-gray-800 text-gray-300 hover:text-white font-bold text-xs border border-gray-700 transition text-center">
              دخول الإدارة
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
