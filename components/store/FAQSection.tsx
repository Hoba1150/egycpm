"use client";

import React, { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FAQSectionProps {
  settings?: Record<string, string>;
}

export default function FAQSection({ settings = {} }: FAQSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: "كيف أستلم السيارة أو الخدمة بعد الدفع؟",
      a: "بمجرد الدفع يظهر لك رقم الطلب في صفحة 'تتبع طلبك'. يقوم فريقنا بتسليم السيارة داخل اللعبة أو شحن حسابك بدقة مع إشعار مباشر عند اكتمال الطلب.",
    },
    {
      q: "هل الشحن وتعديل السيارات آمن ضد الباند؟",
      a: "نعم 100%، جميع طرق الشحن والتعديل والمحركات تتم بأساليب برمجية رسمية ومحمية تماماً لضمان سلامة حسابك الدائم.",
    },
    {
      q: "كيف أشحن رصيد المحفظة عبر فودافون كاش؟",
      a: `توجه لصفحة 'شحن رصيد' وانسخ رقم الكاش (${settings.vodafone_cash || "01288212101"}) ثم حوّل المبلغ وارفع صورة الإشعار للموافقة الفورية.`,
    },
    {
      q: "هل يمكن استرجاع رصيدي إذا تعذر تنفيذ الخدمة؟",
      a: "نعم، في حال حدوث أي تعذر يتم رد المبلغ كاملاً وفورياً إلى رصيد محفظتك مع إشعار رسمي وتوثيق العملية.",
    },
  ];

  return (
    <section className="py-6 sm:py-8 px-3 sm:px-6 lg:px-8 max-w-4xl mx-auto text-right">
      <div className="text-center max-w-2xl mx-auto mb-6 space-y-1">
        <span className="text-xs font-bold text-red-500 uppercase tracking-wide flex items-center justify-center gap-1">
          <HelpCircle className="w-4 h-4 text-red-500" />
          <span>{settings.faq_badge || "الأسئلة الشائعة"}</span>
        </span>
        <h2 className="text-lg sm:text-2xl font-black text-white">
          {settings.faq_title || "إجابات سريعة تهمك قبل الشراء"}
        </h2>
      </div>

      <div className="space-y-2.5">
        {faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className="rounded-2xl bg-[#0f1218] border border-gray-800 overflow-hidden shadow-sm"
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full p-4 sm:p-5 flex items-center justify-between text-right gap-3 text-white hover:text-orange-500 transition"
              >
                <span className="font-bold text-xs sm:text-sm">
                  {faq.q}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${
                    isOpen ? "rotate-180 text-orange-500" : ""
                  }`}
                />
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className="px-4 sm:px-5 pb-5 pt-1 text-xs text-gray-400 leading-relaxed border-t border-gray-800/60">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
}

