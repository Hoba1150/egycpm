import React from "react";
import { Lock, ShieldCheck, Key } from "lucide-react";

export const metadata = {
  title: "سياسة الخصوصية والأمان | CPM GARAGE",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-right space-y-8">
      <div className="space-y-2 border-b border-gray-800 pb-4">
        <span className="text-xs font-mono font-bold text-neon-green uppercase">
          Privacy & Security
        </span>
        <h1 className="text-2xl sm:text-4xl font-black text-white">
          سياسة الخصوصية وأمان البيانات
        </h1>
      </div>

      <div className="p-6 sm:p-8 rounded-3xl bg-garage-900 border border-gray-800 space-y-6 text-xs sm:text-sm text-gray-300 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-neon-green" />
            <span>تشفير بيانات الحسابات (AES-256-GCM)</span>
          </h2>
          <p>
            يتم تشفير كلمات المرور الخاصة بحسابات اللعبة المرسلة من قبل العملاء بأقوى معايير التشفير العسكري ولا يتم تسجيلها في أي سجلات عامة. تنتهي صلاحية الاطلاع عليها بمجرد اكتمال تنفيذ الخدمة.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-neon-cyan" />
            <span>سرية المعاملات والطلبات</span>
          </h2>
          <p>
            لا يُسمح لأي طرف ثالث أو مستخدم آخر بالاطلاع على مشترياتك أو رصيد محفظتك أو تفاصيل طلباتك. حسابك محمي بالكامل برقم تعريف مشفر.
          </p>
        </section>
      </div>
    </div>
  );
}
