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
      a: "بمجرد إتمام الدفع من رصيد محفظتك، يظهر لك رقم الطلب وتتبعه مباشرة في صفحة 'تتبع الطلب'. يقوم فريقنا بتسليم السيارة لك داخل سيرفر خاص باللعبة أو شحن حسابك بدقة وأمان مع إشعار مباشر عند اكتمال التنفيذ.",
    },
    {
      q: "هل الشحن وتعديل السيارات آمنة 100% ضد الباند؟",
      a: "نعم، 100% بدون أي خطر. جميع تعديلات السيارات ومحركات 1695HP، الأموال الخضراء، الكوينز الذهبي، وتفعيل الكينج رانك تتم بطرق برمجية متوافقة بالكامل مع قواعد اللعبة لضمان سلامة حسابك بشكل دائم.",
    },
    {
      q: "كيف أقوم بشحن رصيد المحفظة عبر فودافون كاش؟",
      a: `توجه إلى صفحة 'شحن المحفظة' وانسخ رقم الكاش المعتمد (${settings.vodafone_cash || "01288212101"})، ثم قم بتحويل المبلغ من محفظتك واملأ نموذج الإيداع برقم هاتفك واسمك وصورة إثبات التحويل. سيقوم فريق الإدارة بتأكيد الإيداع وإضافة الرصيد فوراً.`,
    },
    {
      q: "ماذا لو كان رصيد المحفظة غير كافٍ عند إتمام الشراء؟",
      a: "سيظهر لك تنبيه فوري بأن الرصيد غير كافٍ مع زر مباشر لنقلك لصفحة شحن المحفظة. بمجرد شحن رصيدك وتأكيده يمكنك العودة للسلة وإتمام الشراء بنقرة واحدة.",
    },
    {
      q: "هل يمكنني استرجاع أموالي إذا حدثت أي مشكلة؟",
      a: "نعم بالتأكيد! إذا تعذر تنفيذ أي خدمة أو تم إلغاء الطلب من قِبل الإدارة، يتم استرجاع المبلغ بالكامل فورياً إلى رصيد محفظتك مع إشعار رسمي وتوثيق العملية في سجل معاملاتك.",
    },
    {
      q: "كيف أحصل على كود خصم أو رصيد هدية؟",
      a: "نوفر كوبونات خصم دورية في المتجر. كما نمنح رصيد هدايا مجاني للعملاء النشطين وفي المناسبات، ويتم إشعارك فورياً عند إضافة أي هدية لمحفظتك.",
    },
  ];

  return (
    <section className="py-8 sm:py-12 px-3 sm:px-6 lg:px-8 max-w-4xl mx-auto text-right">
      <div className="text-center max-w-2xl mx-auto mb-8 space-y-1.5">
        <span className="text-xs font-bold text-orange-500 uppercase tracking-wide flex items-center justify-center gap-1">
          <HelpCircle className="w-4 h-4 text-orange-500" />
          <span>{settings.faq_badge || "الأسئلة الشائعة"}</span>
        </span>
        <h2 className="text-xl sm:text-3xl font-black text-white">
          {settings.faq_title || "كل ما تحتاج معرفته عن الشراء والتسليم"}
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

