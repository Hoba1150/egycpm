"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShieldCheck, UserPlus, LogIn, Lock, Mail, User, Phone, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"LOGIN" | "REGISTER">("LOGIN");
  const [isLoading, setIsLoading] = useState(false);

  // Form Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const resetForm = () => {
    setName("");
    setEmail("");
    setPhone("");
    setPassword("");
    setConfirmPassword("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error("يرجى إدخال البريد الإلكتروني وكلمة المرور.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "فشل تسجيل الدخول");
      }

      toast.success(`مرحباً بك مجدداً ${data.user.name || ""}!`);
      resetForm();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("cpm_auth_changed"));
      }
      onClose();
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء تسجيل الدخول.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error("يرجى ملء جميع الحقول المطلوبة.");
      return;
    }

    if (password.length < 5) {
      toast.error("كلمة المرور يجب ألا تقل عن 5 أحرف أو أرقام.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("كلمتا المرور غير متطابقتين.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || email.split("@")[0],
          email: email.trim().toLowerCase(),
          password,
          phone: phone.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "فشل إنشاء الحساب.");
      }

      toast.success(`تم إنشاء حسابك بنجاح! مرحباً بك ${data.user.name}`);
      resetForm();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("cpm_auth_changed"));
      }
      onClose();
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء إنشاء الحساب.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ duration: 0.15 }}
            className="relative w-full max-w-md bg-[#0f1218] border border-gray-800 rounded-2xl p-5 sm:p-6 shadow-2xl overflow-hidden z-10 text-right"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 left-4 p-1.5 rounded-lg bg-[#161b24] text-gray-400 hover:text-white transition"
              aria-label="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="text-center pt-1 pb-4">
              <h3 className="text-lg font-extrabold text-white">
                حسابك في المتجر
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                سجل الدخول أو أنشئ حسابك للاستفادة من المحفظة ومتابعة طلباتك
              </p>
            </div>

            {/* Tabs (Login / Register) */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-[#161b24] border border-gray-800 rounded-xl mb-4">
              <button
                type="button"
                onClick={() => setActiveTab("LOGIN")}
                className={`py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  activeTab === "LOGIN"
                    ? "bg-orange-500 text-black font-extrabold shadow-sm"
                    : "text-gray-400 text-gray-400 hover:text-white hover:text-white"
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>تسجيل الدخول</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("REGISTER")}
                className={`py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  activeTab === "REGISTER"
                    ? "bg-orange-500 text-black font-extrabold shadow-sm"
                    : "text-gray-400 text-gray-400 hover:text-white hover:text-white"
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>إنشاء حساب جديد</span>
              </button>
            </div>

            {/* LOGIN FORM */}
            {activeTab === "LOGIN" && (
              <form onSubmit={handleLogin} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">
                    البريد الإلكتروني
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      placeholder="yourname@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-3 pr-9 py-2 bg-[#161b24] border border-gray-700 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition text-right dir-ltr"
                    />
                    <Mail className="w-4 h-4 absolute right-3 top-2.5 text-gray-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">
                    كلمة المرور
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-3 pr-9 py-2 bg-[#161b24] border border-gray-700 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition text-right dir-ltr"
                    />
                    <Lock className="w-4 h-4 absolute right-3 top-2.5 text-gray-400" />
                  </div>
                </div>

                <div className="flex items-center justify-end text-[11px] pt-0.5">
                  <button
                    type="button"
                    onClick={() => setActiveTab("REGISTER")}
                    className="text-gray-400 hover:text-white"
                  >
                    ليس لديك حساب؟ <span className="text-orange-500 font-bold">سجل الآن</span>
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-black font-extrabold text-xs transition flex items-center justify-center gap-1.5 mt-2 shadow-sm disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <LogIn className="w-3.5 h-3.5" />
                      <span>دخول</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* REGISTER FORM */}
            {activeTab === "REGISTER" && (
              <form onSubmit={handleRegister} className="space-y-2.5">
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">
                    الاسم *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="اسمك الكامل"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-3 pr-9 py-2 bg-[#161b24] border border-gray-700 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition text-right"
                    />
                    <User className="w-4 h-4 absolute right-3 top-2.5 text-gray-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">
                    البريد الإلكتروني *
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      placeholder="yourname@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-3 pr-9 py-2 bg-[#161b24] border border-gray-700 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition text-right dir-ltr"
                    />
                    <Mail className="w-4 h-4 absolute right-3 top-2.5 text-gray-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">
                    رقم الهاتف (اختياري)
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      placeholder="01234567890"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-3 pr-9 py-2 bg-[#161b24] border border-gray-700 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition text-right dir-ltr font-mono"
                    />
                    <Phone className="w-4 h-4 absolute right-3 top-2.5 text-gray-400" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1">
                      كلمة المرور *
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        required
                        minLength={5}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-2 pr-7 py-2 bg-[#161b24] border border-gray-700 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition text-right dir-ltr"
                      />
                      <Lock className="w-3.5 h-3.5 absolute right-2 top-2.5 text-gray-400" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1">
                      تأكيد كلمة المرور *
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        required
                        minLength={5}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-2 pr-7 py-2 bg-[#161b24] border border-gray-700 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition text-right dir-ltr"
                      />
                      <Lock className="w-3.5 h-3.5 absolute right-2 top-2.5 text-gray-400" />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-black font-extrabold text-xs transition flex items-center justify-center gap-1.5 mt-2 shadow-sm disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>إنشاء الحساب</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Security Notice */}
            <div className="mt-3.5 pt-2.5 border-t border-gray-800 flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>بياناتك ومحفظتك محمية ومؤمنة بالكامل</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
