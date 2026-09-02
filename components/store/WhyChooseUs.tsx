import React from "react";
import { ShieldCheck, Zap, Wallet, Headphones, Award, Wrench } from "lucide-react";

interface WhyChooseUsProps {
  settings?: Record<string, string>;
}

export default function WhyChooseUs({ settings = {} }: WhyChooseUsProps) {
  const features = [
    {
      title: settings.why1_title || "ضمان أمان وحماية 100%",
      description: settings.why1_desc || "نستخدم طرق شحن وتعديل رسمية ومحمية برمجياً بنسبة 100% دون أي خطر للباند على حسابك.",
      icon: ShieldCheck,
    },
    {
      title: settings.why2_title || "تسليم فوري ومباشر",
      description: settings.why2_desc || "فريق عمل متخصص على مدار 24 ساعة لتنفيذ طلبات الشحن وتسليم السيارات بأعلى درجات الدقة والسرعة.",
      icon: Zap,
    },
    {
      title: settings.why3_title || "نظام محفظة إلكترونية آمن",
      description: settings.why3_desc || "اشحن محفظتك بسهولة عبر فودافون كاش، أورنج، اتصالات، أو وي باي واستمتع بالشراء الفوري في أي وقت.",
      icon: Wallet,
    },
    {
      title: settings.why4_title || "دعم فني وتذاكر 24/7",
      description: settings.why4_desc || "مركز دعم ومساعدة متكامل للرد على أي استفسارات ومتابعة تنفيذ طلباتك بشكل فوري.",
      icon: Headphones,
    },
    {
      title: settings.why5_title || "تعديلات حصرية ومحركات W16",
      description: settings.why5_desc || "أقوى تظبيطات الدريفت والسرعة 1695HP وتصاميم فينيل ورسم لا تجدها في أي متجر آخر.",
      icon: Wrench,
    },
    {
      title: settings.why6_title || "أفضل وأوفر الأسعار",
      description: settings.why6_desc || "خصومات وعروض متجددة يومياً وكوبونات تخفيض مع نظام رصيد هدايا مجاني للعملاء المميزين.",
      icon: Award,
    },
  ];

  return (
    <section className="py-8 sm:py-12 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto text-right">
      <div className="text-center max-w-2xl mx-auto mb-8 space-y-1.5">
        <span className="text-xs font-bold text-orange-500 uppercase tracking-wide">
          {settings.why_badge || "لماذا تختار ورشة ومتجر EGY CPM؟"}
        </span>
        <h2 className="text-xl sm:text-3xl font-black text-white">
          {settings.why_title || "المتجر المعتمد للاعبي Car Parking"}
        </h2>
        <p className="text-xs sm:text-sm text-gray-400">
          {settings.why_subtitle || "أمان فائق، دقة في التنفيذ، وأعلى جودة في السيارات والتعديلات الحصرية."}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {features.map((f, idx) => {
          const Icon = f.icon;
          return (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-[#0f1218] border border-gray-800 flex items-start gap-3.5 text-right shadow-sm relative overflow-hidden"
            >
              <div className="p-2.5 rounded-xl bg-[#161b24] border border-gray-800 text-orange-500 shrink-0 mt-0.5">
                <Icon className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xs sm:text-sm font-black text-white">
                  {f.title}
                </h3>
                <p className="text-[11px] sm:text-xs text-gray-400 leading-relaxed">
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

