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

        {/* Copyright */}
        <div className="mt-6 pt-4 border-t border-gray-800/60 text-center text-[11px] text-gray-500">
          <p>{copyrightText}</p>
        </div>
      </div>
    </footer>
  );
}

