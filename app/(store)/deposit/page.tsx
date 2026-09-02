"use client";

import React, { useState, useEffect } from "react";
import { Copy, Check, Upload, ShieldCheck, Zap, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { submitDepositRequest } from "@/lib/actions/wallet";
import { useRouter } from "next/navigation";
import AuthModal from "@/components/shared/AuthModal";

export default function DepositPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Form State
  const [method, setMethod] = useState<"VODAFONE_CASH" | "ORANGE_CASH" | "ETISALAT_CASH" | "WE_PAY">("VODAFONE_CASH");
  const [senderPhone, setSenderPhone] = useState("");
  const [senderName, setSenderName] = useState("");
  const [amount, setAmount] = useState<number | "">(100);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const walletNumber = "01288212101";

  const fetchUser = () => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => setUser(data.user))
      .catch(() => {});
  };

  useEffect(() => {
    fetchUser();

    window.addEventListener("cpm_auth_changed", fetchUser);
    window.addEventListener("focus", fetchUser);

    return () => {
      window.removeEventListener("cpm_auth_changed", fetchUser);
      window.removeEventListener("focus", fetchUser);
    };
  }, []);

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(walletNumber);
    setIsCopied(true);
    toast.success("تم نسخ رقم الكاش بنجاح!");
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("حجم الصورة كبير جداً. الحد الأقصى 5 ميجابايت.");
      return;
    }

    setScreenshotFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setScreenshotPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    if (!senderPhone || senderPhone.trim().length < 11) {
      toast.error("يرجى إدخال رقم هاتف تحويل صحيح مكون من 11 رقم.");
      return;
    }

    if (!senderName || senderName.trim().length < 3) {
      toast.error("يرجى إدخال اسم الراسل بالكامل.");
      return;
    }

    if (!amount || Number(amount) < 50) {
      toast.error("الحد الأدنى للشحن هو 50 ج.م.");
      return;
    }

    if (!screenshotFile) {
      toast.error("يرجى إرفاق صورة إثبات التحويل (Screenshot).");
      return;
    }

    setIsSubmitting(true);
    try {
      if (!screenshotPreview) {
        toast.error("يرجى اختيار صورة إثبات التحويل أولاً.");
        return;
      }

      const res = await submitDepositRequest({
        method,
        senderPhone: senderPhone.trim(),
        senderName: senderName.trim(),
        amount: Number(amount),
        screenshotUrl: screenshotPreview,
      });

      if (res.success) {
        toast.success(`تم استلام طلب الشحن بنجاح! رقم الطلب: ${res.deposit.requestNumber}`);
        router.push("/wallet");
      }
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء إرسال طلب الشحن.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-8 text-right space-y-6">
        {/* Header */}
        <div className="space-y-1 border-b border-gray-800 pb-4">
          <span className="text-xs font-mono font-bold text-orange-500 uppercase">
            Wallet Deposit
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">شحن رصيد المحفظة</h1>
          <p className="text-xs sm:text-sm text-gray-400">
            اشحن محفظتك عبر فودافون كاش، أورنج، اتصالات أو وي باي للشراء الفوري
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Transfer Instruction Card (Right) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-5 sm:p-6 rounded-2xl bg-[#0f1218] border border-gray-800 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-orange-500 font-extrabold text-sm">
                <Zap className="w-5 h-5" />
                <span>رقم تحويل الكاش المعتمد</span>
              </div>

              {/* Number with Copy Button */}
              <div className="p-4 rounded-xl bg-[#161b24] border border-orange-500/30 space-y-2">
                <span className="text-[11px] text-gray-400 block font-medium">حول المبلغ إلى هذا الرقم:</span>
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleCopyNumber}
                    className="p-2 rounded-xl bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 transition flex items-center gap-1.5 text-xs font-bold"
                  >
                    {isCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    <span>{isCopied ? "تم النسخ!" : "نسخ الرقم"}</span>
                  </button>
                  <span className="font-mono text-xl sm:text-2xl font-black text-orange-500 tracking-widest dir-ltr">
                    {walletNumber}
                  </span>
                </div>
              </div>

              {/* Supported Wallets */}
              <div className="space-y-1.5 text-xs">
                <span className="text-gray-400 font-bold block">المحافظ المدعومة للتحويل:</span>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-300">
                  <div className="p-2 rounded-xl bg-[#161b24] border border-gray-700 text-center font-medium">Vodafone Cash</div>
                  <div className="p-2 rounded-xl bg-[#161b24] border border-gray-700 text-center font-medium">Orange Cash</div>
                  <div className="p-2 rounded-xl bg-[#161b24] border border-gray-700 text-center font-medium">Etisalat Cash</div>
                  <div className="p-2 rounded-xl bg-[#161b24] border border-gray-700 text-center font-medium">WE Pay</div>
                </div>
              </div>

              {/* Instructions */}
              <div className="p-3.5 rounded-xl bg-[#161b24] border border-gray-800 text-[11px] text-gray-300 space-y-1.5 leading-relaxed">
                <p>1. قم بتحويل المبلغ المطلوب إلى الرقم أعلاه عبر تطبيق المحفظة الخاص بك.</p>
                <p>2. التقط سكرين شوت (Screenshot) لإثبات التحويل ورسالة الخصم.</p>
                <p>3. املأ النموذج وسيقوم فريق الإدارة بتأكيد الإيداع وإضافة الرصيد فوراً.</p>
              </div>
            </div>
          </div>

          {/* Deposit Form (Left) */}
          <div className="lg:col-span-7">
            <form onSubmit={handleSubmit} className="p-5 sm:p-6 rounded-2xl bg-[#0f1218] border border-gray-800 shadow-sm space-y-4">
              <h3 className="text-base font-extrabold text-white border-b border-gray-800 pb-3">
                بيانات إثبات التحويل
              </h3>

              {/* Method Picker */}
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">
                  طريقة التحويل المستخدمة
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { key: "VODAFONE_CASH", label: "فودافون كاش" },
                    { key: "ORANGE_CASH", label: "أورنج كاش" },
                    { key: "ETISALAT_CASH", label: "اتصالات كاش" },
                    { key: "WE_PAY", label: "وي باي" },
                  ].map((m) => (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => setMethod(m.key as any)}
                      className={`p-2 rounded-xl text-xs font-bold transition text-center ${
                        method === m.key
                          ? "bg-orange-500 text-black shadow-sm"
                          : "bg-[#161b24] bg-[#161b24] text-gray-300 text-gray-300 border border-gray-700 border-gray-700 hover:border-orange-500/50"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sender Phone */}
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">
                  رقم الهاتف الذي قمت بالتحويل منه (11 رقم) *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="010XXXXXXXX"
                  value={senderPhone}
                  onChange={(e) => setSenderPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#161b24] border border-gray-700 rounded-xl text-xs text-white placeholder-gray-500 focus:border-orange-500 text-right dir-ltr font-mono"
                />
              </div>

              {/* Sender Name */}
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">
                  اسم صاحب المحفظة أو الراسل بالكامل *
                </label>
                <input
                  type="text"
                  required
                  placeholder="الاسم كما هو مسجل بالتحويل"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#161b24] border border-gray-700 rounded-xl text-xs text-white placeholder-gray-500 focus:border-orange-500 text-right"
                />
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">
                  المبلغ المحول بالجنيه (الحد الأدنى 50 ج.م) *
                </label>
                <input
                  type="number"
                  required
                  min={50}
                  step={10}
                  placeholder="500"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : "")}
                  className="w-full px-3.5 py-2.5 bg-[#161b24] border border-gray-700 rounded-xl text-xs text-white placeholder-gray-500 focus:border-orange-500 text-right dir-ltr font-mono font-bold"
                />
              </div>

              {/* Screenshot Upload */}
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">
                  صورة إثبات التحويل (Screenshot) *
                </label>
                <div className="relative border-2 border-dashed border-gray-700 hover:border-orange-500/60 rounded-xl p-4 text-center cursor-pointer transition bg-[#161b24]/40">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  {screenshotPreview ? (
                    <div className="space-y-2">
                      <img
                        src={screenshotPreview}
                        alt="Proof Preview"
                        className="max-h-44 mx-auto rounded-xl object-contain border border-gray-700"
                      />
                      <p className="text-[11px] text-emerald-500 font-bold">تم اختيار الصورة بنجاح (انقر للتغيير)</p>
                    </div>
                  ) : (
                    <div className="space-y-1.5 py-3">
                      <Upload className="w-7 h-7 mx-auto text-gray-400" />
                      <p className="text-xs text-gray-300 font-medium">انقر هنا لرفع سكرين شوت التحويل</p>
                      <span className="text-[10px] text-gray-500">PNG, JPG, WebP (الحد الأقصى 5MB)</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-black font-extrabold text-sm transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>إرسال طلب الشحن للمراجعة</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
}
