import React from "react";
import { Phone, Headphones } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "اتصل بنا | CPM GARAGE",
};

export default function ContactPage() {
  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-8 text-right space-y-6">
      <div className="space-y-1 border-b border-gray-800 pb-4">
        <span className="text-xs font-mono font-bold text-orange-500 uppercase">
          Get In Touch
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
          تواصل مع إدارة ودعم CPM GARAGE
        </h1>
        <p className="text-xs sm:text-sm text-gray-400">
          نحن هنا لمساعدتك على مدار الساعة عبر التذاكر المباشرة أو قنوات التواصل المعتمدة.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div className="p-5 sm:p-6 rounded-2xl bg-[#0f1218] border border-gray-800 shadow-sm space-y-4">
          <div className="w-11 h-11 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
            <Headphones className="w-5 h-5" />
          </div>
          <h3 className="text-base font-extrabold text-white">نظام التذاكر المباشر</h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            أسرع طريقة للحصول على دعم مخصص بخصوص طلباتك وشحن المحفظة ومتابعة العمليات.
          </p>
          <Link
            href="/support"
            className="inline-block px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-black font-extrabold text-xs shadow-sm transition"
          >
            فتح تذكرة دعم فني
          </Link>
        </div>

        <div className="p-5 sm:p-6 rounded-2xl bg-[#0f1218] border border-gray-800 shadow-sm space-y-4">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <Phone className="w-5 h-5" />
          </div>
          <h3 className="text-base font-extrabold text-white">رقم الكاش وخدمة العملاء</h3>
          <div className="space-y-1 text-xs text-gray-300">
            <p>رقم التحويل المعتمد: <strong className="text-orange-500 font-mono text-sm">01288212101</strong></p>
            <p>البريد الإلكتروني الرسمي: <strong className="text-white font-mono">support@cpmgarage.com</strong></p>
            <p className="text-gray-400">أوقات العمل: متاح 24 ساعة / 7 أيام في الأسبوع</p>
          </div>
        </div>
      </div>
    </div>
  );
}
