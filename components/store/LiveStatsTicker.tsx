import React from "react";
import { Wrench, ShieldCheck, Zap, Sparkles } from "lucide-react";

interface LiveStatsTickerProps {
  settings?: Record<string, string>;
}

export default function LiveStatsTicker({ settings = {} }: LiveStatsTickerProps) {
  const features = [
    {
      label: settings.ticker_item1_title || "تعديل محركات 1695HP & W16",
      desc: settings.ticker_item1_desc || "تظبيط سرعة ودريفت احترافي",
      icon: Wrench,
    },
    {
      label: settings.ticker_item2_title || "رسم وفينيل حصري",
      desc: settings.ticker_item2_desc || "تصاميم استثنائية ونادرة",
      icon: Sparkles,
    },
    {
      label: settings.ticker_item3_title || "شحن كاش وكوينز وكينج رانك",
      desc: settings.ticker_item3_desc || "تنفيذ وتسليم فوري ومباشر",
      icon: Zap,
    },
    {
      label: settings.ticker_item4_title || "حماية تامة وأمان معتمد 100%",
      desc: settings.ticker_item4_desc || "بدون أي خطر للباند على الحساب",
      icon: ShieldCheck,
    },
  ];

  return (
    <section className="py-4 border-y border-gray-800 bg-[#0c0f15] text-right">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {features.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 rounded-2xl bg-[#0f1218] border border-gray-800 shadow-sm"
              >
                <div className="p-2.5 rounded-xl bg-[#161b24] border border-gray-800 text-orange-500 shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-white leading-snug">
                    {item.label}
                  </h4>
                  <p className="text-[10px] sm:text-[11px] text-gray-400 font-medium">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

