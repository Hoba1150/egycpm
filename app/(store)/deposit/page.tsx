"use client";

import React, { useState, useEffect } from "react";
import { Copy, Check, Upload, ShieldCheck, Zap, Loader2, Wallet, ArrowRight, CheckCircle2, PhoneCall } from "lucide-react";
import { toast } from "sonner";
import { submitDepositRequest } from "@/lib/actions/wallet";
import { useRouter } from "next/navigation";
import AuthModal from "@/components/shared/AuthModal";
import { formatCurrency } from "@/lib/utils";
import { useSettings } from "@/lib/context/SettingsContext";
import Link from "next/link";

const QUICK_AMOUNTS = [50, 100, 200, 350, 500, 1000];

export default function DepositPage() {
  const router = useRouter();
  const settings = useSettings();
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

  const walletNumber = settings.vodafone_cash_number || settings.wallet_deposit_number || "01288212101";

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

    if (!amount || Number(amount) <= 0) {
      toast.error("يرجى إدخال مبلغ شحن صحيح.");
      return;
    }

    if (!screenshotPreview) {
      toast.error("يرجى إرفاق صورة إثبات التحويل (Screenshot).");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitDepositRequest({
        method,
        senderPhone: senderPhone.trim(),
        senderName: senderName.trim(),
        amount: Number(amount),
        screenshotUrl: screenshotPreview,
      });

      if (res.success) {
        toast.success(`تم استلام طلب الشحن بنجاح! رقم الطلب: ${res.deposit.requestNumber}`);
        // Notify all app components to refresh user balance
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("cpm_auth_changed"));
        }
        router.push("/wallet");
      }
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء إرسال طلب الشحن.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentBalance = user?.wallet?.totalAvailable ?? 0;

  return (
    <>
      <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-6 text-right space-y-6">
        {/* Top Breadcrumb & User Balance Strip */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#0f1218] border border-gray-800">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Link href="/" className="hover:text-white transition">الرئيسية</Link>
              <span>/</span>
              <Link href="/wallet" className="hover:text-white transition">المحفظة</Link>
              <span>/</span>
              <span className="text-orange-500 font-bold">شحن الرصيد</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white">شحن رصيد المحفظة</h1>
          </div>

          {user && (
            <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/30">
              <Wallet className="w-4 h-4 text-orange-500" />
              <div className="text-right">
                <span className="text-[10px] text-gray-400 block">رصيدك الحالي:</span>
                <span className="text-xs font-black text-orange-400 font-mono">
                  {formatCurrency(currentBalance)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 3 Step Indicator */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
          <div className="p-2.5 sm:p-3 rounded-xl bg-orange-500/10 border border-orange-500/40 text-orange-400">
            <span className="w-5 h-5 sm:w-6 sm:h-6 mx-auto rounded-full bg-orange-500 text-black font-black text-[11px] sm:text-xs flex items-center justify-center mb-1">1</span>
            <span className="text-[11px] sm:text-xs font-bold block">انسخ رقم الكاش</span>
          </div>
          <div className="p-2.5 sm:p-3 rounded-xl bg-[#0f1218] border border-gray-800 text-gray-300">
            <span className="w-5 h-5 sm:w-6 sm:h-6 mx-auto rounded-full bg-gray-800 text-gray-300 font-black text-[11px] sm:text-xs flex items-center justify-center mb-1">2</span>
            <span className="text-[11px] sm:text-xs font-bold block">حوّل المبلغ</span>
          </div>
          <div className="p-2.5 sm:p-3 rounded-xl bg-[#0f1218] border border-gray-800 text-gray-300">
            <span className="w-5 h-5 sm:w-6 sm:h-6 mx-auto rounded-full bg-gray-800 text-gray-300 font-black text-[11px] sm:text-xs flex items-center justify-center mb-1">3</span>
            <span className="text-[11px] sm:text-xs font-bold block">أرسل إثبات التحويل</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Step 1 & Instructions (Right) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-5 rounded-2xl bg-[#0f1218] border border-gray-800 space-y-4">
              <div className="flex items-center gap-2 text-orange-500 font-black text-sm">
                <span className="w-6 h-6 rounded-full bg-orange-500 text-black text-xs font-black flex items-center justify-center">1</span>
                <span>رقم تحويل الكاش المعتمد</span>
              </div>

              {/* Big Copy Card */}
              <div className="p-4 rounded-xl bg-[#161b24] border border-orange-500/40 space-y-2.5 text-center">
                <span className="text-xs text-gray-400 block font-medium">حول المبلغ عبر محفظتك إلى الرقم:</span>
                <div className="font-mono text-2xl sm:text-3xl font-black text-orange-400 tracking-widest dir-ltr">
                  {walletNumber}
                </div>
                <button
                  type="button"
                  onClick={handleCopyNumber}
                  className="w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-black font-black text-xs transition flex items-center justify-center gap-2 shadow-sm active:scale-98"
                >
                  {isCopied ? <Check className="w-4 h-4 text-black" /> : <Copy className="w-4 h-4" />}
                  <span>{isCopied ? "تم نسخ الرقم بنجاح!" : "انقر لنسخ الرقم"}</span>
                </button>
              </div>

              {/* Supported Wallets */}
              <div className="space-y-1.5 text-xs">
                <span className="text-gray-400 font-bold block">المحافظ المتاحة للإرسال:</span>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-300">
                  <div className="p-2 rounded-xl bg-[#161b24] border border-gray-800 text-center font-bold text-red-400">Vodafone Cash</div>
                  <div className="p-2 rounded-xl bg-[#161b24] border border-gray-800 text-center font-bold text-orange-400">Orange Cash</div>
                  <div className="p-2 rounded-xl bg-[#161b24] border border-gray-800 text-center font-bold text-emerald-400">Etisalat Cash</div>
                  <div className="p-2 rounded-xl bg-[#161b24] border border-gray-800 text-center font-bold text-purple-400">WE Pay</div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#161b24] border border-gray-800/80 text-[11px] text-gray-400 space-y-1.5 leading-relaxed">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>ضمان وصول الرصيد 100%</span>
                </div>
                <p>يتم تدقيق ومطابقة التحويلات وإضافة الرصيد إلى حسابك تلقائياً وبسرعة فائقة بعد مراجعة الإدارة.</p>
              </div>
            </div>
          </div>

          {/* Steps 2 & 3: Form (Left) */}
          <div className="lg:col-span-7">
            <form onSubmit={handleSubmit} className="p-5 sm:p-6 rounded-2xl bg-[#0f1218] border border-gray-800 space-y-5">
              
              {/* Step 2: Amount & Method */}
              <div className="space-y-3 border-b border-gray-800 pb-4">
                <div className="flex items-center gap-2 text-white font-black text-sm">
                  <span className="w-6 h-6 rounded-full bg-orange-500 text-black text-xs font-black flex items-center justify-center">2</span>
                  <span>المبلغ والمحفظة المستخدمة</span>
                </div>

                {/* Method Picker */}
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
                          ? "bg-orange-500 text-black shadow-sm font-black"
                          : "bg-[#161b24] text-gray-300 border border-gray-700 hover:border-orange-500/50"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                {/* Amount Input + Quick Selectors */}
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5">
                    المبلغ الذي قمت بتحويله (بالجنيه المصري) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    step={1}
                    placeholder="مثال: 200"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : "")}
                    className="w-full px-3.5 py-2.5 bg-[#161b24] border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:border-orange-500 text-right dir-ltr font-mono font-black"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {QUICK_AMOUNTS.map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setAmount(amt)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono transition ${
                          amount === amt
                            ? "bg-orange-500/20 text-orange-400 border border-orange-500/50"
                            : "bg-[#161b24] text-gray-400 border border-gray-800 hover:text-white"
                        }`}
                      >
                        +{amt} ج.م
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Step 3: Proof Details */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-white font-black text-sm">
                  <span className="w-6 h-6 rounded-full bg-orange-500 text-black text-xs font-black flex items-center justify-center">3</span>
                  <span>بيانات وإثبات التحويل</span>
                </div>

                {/* Sender Phone */}
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">
                    رقم الهاتف الذي قمت بالتحويل منه (11 رقم) *
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={11}
                    placeholder="010XXXXXXXX"
                    value={senderPhone}
                    onChange={(e) => setSenderPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#161b24] border border-gray-700 rounded-xl text-xs text-white placeholder-gray-500 focus:border-orange-500 text-right dir-ltr font-mono font-bold"
                  />
                </div>

                {/* Sender Name */}
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">
                    اسم الراسل أو صاحب المحفظة *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="الاسم كما هو مسجل في التحويل"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#161b24] border border-gray-700 rounded-xl text-xs text-white placeholder-gray-500 focus:border-orange-500 text-right"
                  />
                </div>

                {/* Screenshot Upload */}
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5">
                    صورة سكرين شوت لرسالة التحويل *
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
                          className="max-h-40 mx-auto rounded-xl object-contain border border-gray-700"
                        />
                        <p className="text-xs text-emerald-400 font-bold flex items-center justify-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>تم إرفاق الصورة بنجاح (انقر لتغييرها)</span>
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1.5 py-3">
                        <Upload className="w-6 h-6 mx-auto text-orange-500" />
                        <p className="text-xs text-gray-200 font-bold">انقر هنا لرفع سكرين شوت التحويل</p>
                        <span className="text-[10px] text-gray-500">JPG, PNG, WebP (الحد الأقصى 5MB)</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-black font-black text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 disabled:opacity-50 active:scale-98"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>جاري إرسال طلب الشحن...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>تأكيد وإرسال طلب الشحن</span>
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

