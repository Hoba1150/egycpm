"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import Logo from "@/components/shared/Logo";
import { useSettings } from "@/lib/context/SettingsContext";

export default function Footer() {
  // Read from server-injected Context — no FOUC, no extra API call
  const settings = useSettings();

  const storeName = settings.store_name || "EGY CPM";
  const cashPhone = settings.vodafone_cash || settings.announcement_cash_phone || "01288212101";
  const copyrightText =
    settings.footer_copyright ||
    `© ${new Date().getFullYear()} ${storeName}. جميع الحقوق محفوظة لمتجر كار باركينج.`;

  return (
    <footer className="border-t border-gray-800 bg-[#08090d] text-gray-400 relative z-10 pb-20 md:pb-6 text-right">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Col 1: Logo & Brief Bio */}
          <div className="space-y-2">
            <Logo size="sm" />
            <p className="text-xs text-gray-400 leading-relaxed">
              {settings.footer_bio || "المتجر الأول والمتخصص في خدمات لعبة Car Parking Multiplayer على الهواتف. سيارات مرسومة، تعديل محركات 1695HP، كينج رانك، شحن كاش وكوينز بأمان 100%."}
            </p>
          </div>

          {/* Col 2: Quick Links */}
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-300">
            <Link href="/" className="hover:text-orange-500 transition">الرئيسية</Link>
            <Link href="/shop" className="hover:text-orange-500 transition">المتجر الكامل</Link>
            <Link href="/shop?type=MODIFIED_CAR" className="hover:text-orange-500 transition">سيارات 1695HP</Link>
            <Link href="/shop?type=DRAWN_CAR" className="hover:text-orange-500 transition">سيارات رسم</Link>
            <Link href="/shop?type=SERVICE" className="hover:text-orange-500 transition">خدمات الشحن</Link>
            <Link href="/deposit" className="hover:text-orange-500 transition">شحن المحفظة</Link>
            <Link href="/support" className="hover:text-orange-500 transition">الدعم الفني</Link>
            <Link href="/terms" className="hover:text-orange-500 transition">الشروط</Link>
            <Link href="/privacy" className="hover:text-orange-500 transition">الخصوصية</Link>
          </div>

          {/* Col 3: Cash & Contact Info */}
          <div className="space-y-2">
            <div className="p-3 rounded-xl bg-[#0f1218] border border-gray-800 flex items-center justify-between">
              <span className="text-xs text-gray-300 font-medium">رقم فودافون كاش:</span>
              <span className="font-mono text-orange-500 font-bold text-xs dir-ltr">
                {cashPhone}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-500 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>{settings.footer_guarantee || "تسليم مباشر ومضمون مع حماية كاملة ودعم فني متواصل"}</span>
            </div>
          </div>
        </div>

        {/* Social Links Row */}
        <div className="mt-6 pt-4 border-t border-gray-800/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-gray-500">
          <p>{copyrightText}</p>

          <div className="flex items-center gap-3">
            <a
              href={settings.social_whatsapp ? (settings.social_whatsapp.startsWith("http") ? settings.social_whatsapp : `https://wa.me/${settings.social_whatsapp.replace(/[^0-9]/g, "")}`) : "https://wa.me/201288212101"}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg bg-white/5 hover:bg-[#25D366]/20 hover:text-[#25D366] transition text-gray-400"
              title="واتساب"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.972.531 1.768.815 2.796.815 3.183 0 5.769-2.587 5.77-5.766.001-3.182-2.585-5.77-5.77-5.772zm3.376 8.204c-.149.42-1.009.807-1.401.834-.393.028-.792.176-2.529-.533-1.737-.709-2.83-2.483-2.915-2.597-.086-.114-.707-.941-.707-1.794 0-.853.447-1.272.607-1.444.159-.172.348-.215.464-.215.117 0 .232.001.334.006.107.004.25-.041.391.297.149.36.508 1.238.552 1.328.045.089.075.194.015.313-.06.119-.09.194-.179.298-.09.105-.188.234-.269.314-.09.09-.184.187-.079.367.105.18.468.771 1.002 1.248.687.613 1.266.804 1.446.894.18.09.284.075.39-.045.105-.119.45-.523.57-.703.119-.179.239-.149.39-.09.15.06.953.449 1.118.531.164.083.274.124.314.194.041.07.041.406-.108.826z" />
                <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.526 3.658 1.438 5.174L2 22l4.966-1.397A9.957 9.957 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.2a8.17 8.17 0 01-4.223-1.165l-.303-.18-2.951.829.838-2.877-.197-.314A8.169 8.169 0 013.8 12c0-4.522 3.678-8.2 8.2-8.2s8.2 3.678 8.2 8.2c0 4.522-3.678 8.2-8.2 8.2z" />
              </svg>
            </a>

            <a
              href={settings.social_facebook || "https://facebook.com"}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg bg-white/5 hover:bg-[#1877F2]/20 hover:text-[#1877F2] transition text-gray-400"
              title="فيسبوك"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </a>

            <a
              href={settings.social_tiktok || "https://tiktok.com"}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg bg-white/5 hover:bg-[#FE2C55]/20 hover:text-[#FE2C55] transition text-gray-400"
              title="تيك توك"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

