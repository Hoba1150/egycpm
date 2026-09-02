import React from "react";
import { UserCheck, Wallet, ShoppingBag, CheckCircle2 } from "lucide-react";

interface HowItWorksProps {
  settings?: Record<string, string>;
}

export default function HowItWorks({ settings = {} }: HowItWorksProps) {
  const steps = [
    {
      num: "01",
      title: settings.step1_title || "دخول فوري بحسابك",
      desc: settings.step1_desc || "سجل دخولك بنقرة واحدة بحسابك وسيتم تجهيز محفظتك ومتابعة كافة طلباتك تلقائياً.",
      icon: UserCheck,
    },
    {
      num: "02",
      title: settings.step2_title || "شحن رصيد المحفظة",
      desc: settings.step2_desc || "حول المبلغ المطلوب عبر فودافون كاش أو أورنج أو اتصالات وارفع صورة الإشعار للموافقة الفورية.",
      icon: Wallet,
    },
    {
      num: "03",
      title: settings.step3_title || "اختر طلبك وأكد الشراء",
      desc: settings.step3_desc || "تصفح السيارات والخدمات، أضف لسلة الشراء وادفع بضغطة زر مباشرة من رصيد محفظتك المتاح.",
      icon: ShoppingBag,
    },
    {
      num: "04",
      title: settings.step4_title || "تسليم فوري ومباشر",
      desc: settings.step4_desc || "يقوم فريق المتخصصين بتنفيذ وتسليم السيارة أو شحن الحساب بدقة وأمان مع تتبع مباشر لحالة الطلب.",
      icon: CheckCircle2,
    },
  ];

  return (
    <section className="py-8 sm:py-12 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto text-right">
      <div className="text-center max-w-2xl mx-auto mb-8 space-y-1.5">
        <span className="text-xs font-bold text-orange-500 uppercase tracking-wide">
          {settings.how_badge || "خطوات الشراء والتسليم"}
        </span>
        <h2 className="text-xl sm:text-3xl font-black text-white">
          {settings.how_title || "كيف يعمل المتجر؟"}
        </h2>
        <p className="text-xs sm:text-sm text-gray-400">
          {settings.how_subtitle || "4 خطوات سهلة ومباشرة تفصلك عن استلام وتطوير سيارتك"}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-[#0f1218] border border-gray-800 flex flex-col justify-between space-y-3 shadow-sm relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black font-mono text-gray-700">
                  {step.num}
                </span>
                <div className="p-2.5 rounded-xl bg-[#161b24] border border-gray-800 text-orange-500">
                  <Icon className="w-5 h-5" />
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-xs sm:text-sm font-black text-white">
                  {step.title}
                </h3>
                <p className="text-[11px] sm:text-xs text-gray-400 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

