"use client";

import React from "react";
import { useSettings } from "@/lib/context/SettingsContext";
import { Sparkles, ExternalLink, Flame, Users } from "lucide-react";

function WhatsAppLogo({ className }: { className?: string }) {
  return (
    <svg className={className || "w-6 h-6"} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.972.531 1.768.815 2.796.815 3.183 0 5.769-2.587 5.77-5.766.001-3.182-2.585-5.77-5.77-5.772zm3.376 8.204c-.149.42-1.009.807-1.401.834-.393.028-.792.176-2.529-.533-1.737-.709-2.83-2.483-2.915-2.597-.086-.114-.707-.941-.707-1.794 0-.853.447-1.272.607-1.444.159-.172.348-.215.464-.215.117 0 .232.001.334.006.107.004.25-.041.391.297.149.36.508 1.238.552 1.328.045.089.075.194.015.313-.06.119-.09.194-.179.298-.09.105-.188.234-.269.314-.09.09-.184.187-.079.367.105.18.468.771 1.002 1.248.687.613 1.266.804 1.446.894.18.09.284.075.39-.045.105-.119.45-.523.57-.703.119-.179.239-.149.39-.09.15.06.953.449 1.118.531.164.083.274.124.314.194.041.07.041.406-.108.826z" />
      <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.526 3.658 1.438 5.174L2 22l4.966-1.397A9.957 9.957 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.2a8.17 8.17 0 01-4.223-1.165l-.303-.18-2.951.829.838-2.877-.197-.314A8.169 8.169 0 013.8 12c0-4.522 3.678-8.2 8.2-8.2s8.2 3.678 8.2 8.2c0 4.522-3.678 8.2-8.2 8.2z" />
    </svg>
  );
}

function FacebookLogo({ className }: { className?: string }) {
  return (
    <svg className={className || "w-6 h-6"} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function TikTokLogo({ className }: { className?: string }) {
  return (
    <svg className={className || "w-6 h-6"} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  );
}

export default function SocialCommunityBanner() {
  const settings = useSettings();

  const rawWhatsApp = settings.social_whatsapp || settings.vodafone_cash || "01288212101";
  const whatsappUrl = rawWhatsApp.startsWith("http") ? rawWhatsApp : `https://wa.me/${rawWhatsApp.replace(/[^0-9]/g, "")}`;
  const facebookUrl = settings.social_facebook || "https://facebook.com";
  const tiktokUrl = settings.social_tiktok || "https://tiktok.com";
  const ctaText = settings.social_cta_text || "انضم لمجتمعنا الرسمي وتابع أقوى العروض الحصرية، مسابقات الكوينز، وتسليمات السيارات أولاً بأول! 🚀🔥";

  return (
    <div className="px-3 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto rounded-3xl bg-gradient-to-b from-[#12161f] to-[#0a0d14] border border-red-500/30 p-5 sm:p-7 shadow-[0_0_30px_rgba(220,38,38,0.15)] relative overflow-hidden space-y-4 text-center">
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-80 h-32 bg-red-600/15 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-gray-800/80 pb-4 text-right">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-600/10 border border-red-500/30 text-red-500 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>مجتمع وقنوات EGY CPM الرسمية</span>
                <span className="px-2 py-0.5 rounded-full bg-red-600/20 text-red-400 font-mono text-[10px] font-bold border border-red-500/30">OFFICIAL</span>
              </h3>
              <p className="text-xs text-gray-400">تواصل معنا وتابع أحدث التعديلات والمسابقات اليومية</p>
            </div>
          </div>
          <span className="text-xs text-gray-300 font-bold hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>تسليم فوري ومتابعة مباشرة</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="group flex items-center justify-center gap-3 p-4 rounded-2xl bg-[#0e1713] hover:bg-[#12231b] border-2 border-[#25D366]/40 hover:border-[#25D366] transition-all duration-300 hover:-translate-y-0.5">
            <div className="w-11 h-11 rounded-xl bg-[#25D366]/15 border border-[#25D366]/40 flex items-center justify-center text-[#25D366] group-hover:scale-110 transition shrink-0">
              <WhatsAppLogo className="w-6 h-6" />
            </div>
            <div className="text-right">
              <span className="block text-sm font-black text-white group-hover:text-[#25D366] transition">واتساب (WhatsApp)</span>
              <span className="text-[11px] text-gray-400 block">تواصل مباشر ومساعدة بالطلب 💬</span>
            </div>
            <ExternalLink className="w-4 h-4 text-[#25D366] opacity-60 group-hover:opacity-100 mr-auto" />
          </a>

          <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className="group flex items-center justify-center gap-3 p-4 rounded-2xl bg-[#0c1424] hover:bg-[#101b33] border-2 border-[#1877F2]/40 hover:border-[#1877F2] transition-all duration-300 hover:-translate-y-0.5">
            <div className="w-11 h-11 rounded-xl bg-[#1877F2]/15 border border-[#1877F2]/40 flex items-center justify-center text-[#1877F2] group-hover:scale-110 transition shrink-0">
              <FacebookLogo className="w-6 h-6" />
            </div>
            <div className="text-right">
              <span className="block text-sm font-black text-white group-hover:text-[#1877F2] transition">فيسبوك (Facebook)</span>
              <span className="text-[11px] text-gray-400 block">الصفحة والمجتمع الرسمي 👥</span>
            </div>
            <ExternalLink className="w-4 h-4 text-[#1877F2] opacity-60 group-hover:opacity-100 mr-auto" />
          </a>

          <a href={tiktokUrl} target="_blank" rel="noopener noreferrer" className="group flex items-center justify-center gap-3 p-4 rounded-2xl bg-[#140e16] hover:bg-[#1e1321] border-2 border-[#FE2C55]/40 hover:border-[#FE2C55] transition-all duration-300 hover:-translate-y-0.5">
            <div className="w-11 h-11 rounded-xl bg-[#FE2C55]/15 border border-[#FE2C55]/40 flex items-center justify-center text-[#FE2C55] group-hover:scale-110 transition shrink-0">
              <TikTokLogo className="w-6 h-6" />
            </div>
            <div className="text-right">
              <span className="block text-sm font-black text-white group-hover:text-[#FE2C55] transition">تيك توك (TikTok)</span>
              <span className="text-[11px] text-gray-400 block">فيديوهات استعراض وتجارب 🏎️</span>
            </div>
            <ExternalLink className="w-4 h-4 text-[#FE2C55] opacity-60 group-hover:opacity-100 mr-auto" />
          </a>
        </div>

        <div className="p-3 sm:p-3.5 rounded-2xl bg-[#0d1017] border border-red-500/20 text-center flex flex-col sm:flex-row items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs font-black text-amber-400 shrink-0">
            <Flame className="w-4 h-4 text-red-500" />
            <span>عروض وجوائز حصرية:</span>
          </span>
          <p className="text-xs sm:text-sm font-medium text-gray-300 leading-relaxed">{ctaText}</p>
        </div>
      </div>
    </div>
  );
}
