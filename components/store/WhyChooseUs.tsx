import React from "react";
import { ShieldCheck, Zap, Headphones } from "lucide-react";

interface WhyChooseUsProps {
  settings?: Record<string, string>;
}

export default function WhyChooseUs({ settings = {} }: WhyChooseUsProps) {
  const features = [
    {
      title: settings.why1_title || "أمان وحماية 100%",
      description: settings.why1_desc || "تعديل وشحن رسمي آمن تماماً بدون أي خطر للباند.",
      icon: ShieldCheck,
    },
    {
      title: settings.why2_title || "تسليم سريع ومباشر",
      description: settings.why2_desc || "تنفيذ فوري ودقيق للطلبات مع متابعة لحظية.",
      icon: Zap,
    },
    {
      title: settings.why4_title || "دعم فني متواصل 24/7",
      description: settings.why4_desc || "متابعة واستجابة سريعة لجميع الاستفسارات.",
      icon: Headphones,
    },
  ];

  return (
    <section className="py-6 sm:py-8 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto text-right">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {features.map((f, idx) => {
          const Icon = f.icon;
          return (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-[#0b0e14] border border-gray-800/80 flex items-center gap-3.5 text-right shadow-sm"
            >
              <div className="w-10 h-10 rounded-xl bg-red-950/30 border border-red-500/30 text-red-500 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <h3 className="text-xs sm:text-sm font-black text-white truncate">
                  {f.title}
                </h3>
                <p className="text-[11px] text-gray-400 leading-tight truncate">
                  {f.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}


