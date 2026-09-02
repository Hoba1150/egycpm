"use client";

import React, { useState } from "react";
import { Lock, Mail, Loader2, ArrowLeft, Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import Logo from "@/components/shared/Logo";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          isAdminLogin: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "بيانات الدخول الإدارية غير صحيحة.");
      }

      toast.success("تم الدخول للوحة التحكم بنجاح 🛡️");
      router.push("/admin");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "فشل تسجيل الدخول الإداري.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#050608] relative">
      {/* Background Accent */}
      <div className="absolute inset-0 bg-cyber-grid bg-[size:40px_40px] opacity-20 pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md bg-[#0c1017] border border-orange-500/30 rounded-2xl p-8 text-right space-y-6">
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <Logo size="lg" showText={false} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">بوابة إدارة EGY CPM</h1>
            <p className="text-xs text-gray-400 mt-1">
              تسجيل دخول آمن لمشرفي ومسؤولي المتجر
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              البريد الإلكتروني الإداري
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-3 pr-10 py-3 bg-[#12161f] border border-gray-700 rounded-xl text-xs text-white focus:border-orange-500 text-right dir-ltr"
              />
              <Mail className="w-4 h-4 absolute right-3.5 top-3.5 text-gray-400" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              كلمة المرور الإدارية
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-3 pr-10 py-3 bg-[#12161f] border border-gray-700 rounded-xl text-xs text-white focus:border-orange-500 text-right dir-ltr"
              />
              <Lock className="w-4 h-4 absolute right-3.5 top-3.5 text-gray-400" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl bg-orange-500 text-black font-extrabold text-xs hover:scale-[1.01] active:scale-[0.98] transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "تسجيل الدخول إلى لوحة التحكم"}
          </button>
        </form>

        <div className="pt-2 border-t border-gray-800 text-center">
          <Link
            href="/"
            className="text-xs text-gray-400 hover:text-orange-500 transition inline-flex items-center gap-1 font-bold"
          >
            <span>العودة للواجهة الرئيسية للمتجر</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
