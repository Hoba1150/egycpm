"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import {
  ArrowRight,
  Bell,
  Check,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Gamepad2,
  Gift,
  Key,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { deleteNotification } from "@/lib/actions/order";

interface NotificationDetailClientProps {
  notification: {
    id: string;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    link?: string | null;
    createdAt: string | Date;
  };
}

export default function NotificationDetailClient({
  notification,
}: NotificationDetailClientProps) {
  const router = useRouter();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isCredentials = notification.type === "CREDENTIALS_DELIVERED";

  // Parse credentials from message if formatted
  const parseCredentials = () => {
    const text = notification.message || "";
    let email = "";
    let password = "";
    let notes = "";

    const emailMatch = text.match(/(?:البريد \/ اسم المستخدم|البريد|الإيميل|الحساب):\s*([^\n\r]+)/i);
    const passMatch = text.match(/(?:كلمة المرور|الباسورد|كلمة السر):\s*([^\n\r]+)/i);
    const notesMatch = text.match(/(?:ملاحظات الحساب|ملاحظات):\s*([^\n\r]+)/i);

    if (emailMatch) email = emailMatch[1].trim();
    if (passMatch) password = passMatch[1].trim();
    if (notesMatch) notes = notesMatch[1].trim();

    return { email, password, notes, hasParsed: Boolean(email || password) };
  };

  const creds = parseCredentials();

  const handleCopy = (text: string, key: string) => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      toast.success("تم النسخ إلى الحافظة!");
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/notifications");
    }
  };

  const handleDelete = async () => {
    if (!confirm("هل أنت متأكد من حذف هذا الإشعار؟")) return;
    setIsDeleting(true);
    try {
      await deleteNotification(notification.id);
      toast.success("تم حذف الإشعار بنجاح.");
      router.push("/notifications");
    } catch {
      toast.error("فشل حذف الإشعار.");
      setIsDeleting(false);
    }
  };

  const getIcon = () => {
    switch (notification.type) {
      case "CREDENTIALS_DELIVERED":
        return <Gamepad2 className="w-6 h-6 text-purple-400" />;
      case "DEPOSIT_APPROVED":
      case "GIFT_RECEIVED":
        return <Gift className="w-6 h-6 text-emerald-400" />;
      case "ORDER_STATUS":
        return <ShoppingBag className="w-6 h-6 text-orange-500" />;
      case "DEPOSIT_REJECTED":
        return <ShieldAlert className="w-6 h-6 text-red-400" />;
      default:
        return <Sparkles className="w-6 h-6 text-orange-400" />;
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-right space-y-6">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between border-b border-gray-800 pb-4">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#12161f] border border-gray-800 text-xs font-bold text-gray-300 hover:text-orange-500 hover:border-gray-700 transition"
        >
          <ArrowRight className="w-4 h-4" />
          <span>رجوع للخلف</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isDeleting}
            onClick={handleDelete}
            className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition text-xs flex items-center gap-1.5"
            title="حذف الإشعار"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">حذف الإشعار</span>
          </button>
        </div>
      </div>

      {/* Main Notification Card */}
      <div
        className={`p-6 sm:p-8 rounded-3xl border shadow-xl space-y-6 relative overflow-hidden ${
          isCredentials
            ? "bg-[#100d1a] border-purple-500/50 shadow-[0_0_30px_rgba(168,85,247,0.15)]"
            : "bg-[#0f1218] border-gray-800"
        }`}
      >
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="p-3.5 rounded-2xl bg-[#161b24] border border-gray-700 shrink-0">
            {getIcon()}
          </div>

          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-mono text-gray-400">
                {formatDate(notification.createdAt)}
              </span>
              {isCredentials && (
                <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold">
                  بيانات تسليم مشفرة 🔒
                </span>
              )}
            </div>

            <h1 className="text-lg sm:text-2xl font-black text-white leading-snug">
              {notification.title}
            </h1>
          </div>
        </div>

        {/* Credentials Display Box (If Game Account credentials) */}
        {isCredentials && creds.hasParsed ? (
          <div className="space-y-4 pt-2">
            <div className="p-4 sm:p-5 rounded-2xl bg-[#0b0e14] border border-purple-500/40 space-y-3.5 shadow-inner">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-300 border-b border-gray-800 pb-2.5">
                <Key className="w-4 h-4 text-purple-400" />
                <span>بيانات حساب اللعبة المشتراة (تم فك التشفير لك بنجاح):</span>
              </div>

              {/* Email / Username Field */}
              {creds.email && (
                <div className="p-3 rounded-xl bg-[#121620] border border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] text-gray-400 block mb-0.5">البريد الإلكتروني / الحساب:</span>
                    <span className="font-mono text-xs sm:text-sm font-bold text-white select-all dir-ltr text-right block">
                      {creds.email}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(creds.email, "email")}
                    className="px-3 py-1.5 rounded-lg bg-[#1a202c] hover:bg-purple-600 hover:text-white text-gray-300 text-xs font-bold transition flex items-center justify-center gap-1.5 self-end sm:self-auto border border-gray-700"
                  >
                    {copiedKey === "email" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === "email" ? "تم النسخ" : "نسخ البريد"}</span>
                  </button>
                </div>
              )}

              {/* Password Field */}
              {creds.password && (
                <div className="p-3 rounded-xl bg-[#121620] border border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] text-gray-400 block mb-0.5">كلمة المرور (Password):</span>
                    <span className="font-mono text-xs sm:text-sm font-black text-emerald-400 select-all dir-ltr text-right block">
                      {showPassword ? creds.password : "••••••••••••"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1.5 rounded-lg bg-[#1a202c] text-gray-400 hover:text-white border border-gray-700 transition"
                      title={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopy(creds.password, "password")}
                      className="px-3 py-1.5 rounded-lg bg-[#1a202c] hover:bg-emerald-600 hover:text-white text-gray-300 text-xs font-bold transition flex items-center justify-center gap-1.5 border border-gray-700"
                    >
                      {copiedKey === "password" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === "password" ? "تم النسخ" : "نسخ كلمة السر"}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Notes Field */}
              {creds.notes && (
                <div className="p-3 rounded-xl bg-[#121620] border border-gray-800 text-xs space-y-1">
                  <span className="text-[10px] text-gray-400 block font-bold">ملاحظات الحساب والتعليمات:</span>
                  <p className="text-gray-200 leading-relaxed whitespace-pre-line">{creds.notes}</p>
                </div>
              )}
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2.5 text-xs text-emerald-400">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="text-[11px] text-gray-300 leading-relaxed">
                <strong>نصيحة أمنية:</strong> يرجى تسجيل الدخول للحساب عبر لعبة Car Parking وتغيير كلمة السر فوراً وربط حسابك لضمان ملكيتك التامة.
              </p>
            </div>
          </div>
        ) : (
          /* Standard Notification Text Content */
          <div className="p-4 sm:p-5 rounded-2xl bg-[#12161f] border border-gray-800 text-xs sm:text-sm text-gray-200 leading-relaxed whitespace-pre-line select-text">
            {notification.message}
          </div>
        )}

        {/* Action Link (e.g. Order Tracking) */}
        {notification.link && (
          <div className="pt-2 flex justify-end">
            <Link
              href={notification.link}
              className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-black font-black text-xs inline-flex items-center gap-2 shadow-sm transition"
            >
              <span>الانتقال لصفحة الطلب والمتابعة</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
