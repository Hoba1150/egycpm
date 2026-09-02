import React from "react";
import { ShieldCheck, FileText } from "lucide-react";

export const metadata = {
  title: "الشروط والأحكام | CPM GARAGE",
};

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-right space-y-8">
      <div className="space-y-2 border-b border-gray-800 pb-4">
        <span className="text-xs font-mono font-bold text-neon-cyan uppercase">
          Terms & Conditions
        </span>
        <h1 className="text-2xl sm:text-4xl font-black text-white">
          الشروط والأحكام وسياسة الاستخدام
        </h1>
      </div>

      <div className="p-6 sm:p-8 rounded-3xl bg-garage-900 border border-gray-800 space-y-6 text-xs sm:text-sm text-gray-300 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-neon-cyan" />
            <span>1. نظام المحفظة وشحن الرصيد</span>
          </h2>
          <p>
            تعتبر المحفظة الإلكترونية داخل الموقع هي وسيلة الدفع المعتمدة الوحيدة. يتم شحن المحفظة عبر تحويل الكاش (فودافون كاش، أورنج، اتصالات، وي باي) للرقم الرسمي للمتجر 01288212101 ومراجعة الإيداع واعتماده من الإدارة قبل إضافة الرصيد.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-neon-green" />
            <span>2. ضمان الأمان والتسليم</span>
          </h2>
          <p>
            يلتزم متجر CPM GARAGE بتسليم السيارات والخدمات المتفق عليها خلال مدة تتراوح بين 5 إلى 15 دقيقة بعد تأكيد الدفع من المحفظة. ونضمن سلامة الحسابات بنسبة 100% ضد أي حظر أو باند.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-neon-purple" />
            <span>3. سياسة الاسترجاع (Refund Policy)</span>
          </h2>
          <p>
            في حال تعذر تنفيذ الخدمة أو إلغاء الطلب من قبل الإدارة، يعود كامل المبلغ فورياً لمحفظة العميل داخل المتجر دون أي خصومات إضافية.
          </p>
        </section>
      </div>
    </div>
  );
}
