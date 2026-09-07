"use client";

import React, { useState } from "react";
import { Copy, Check, Upload, Loader2, Image as ImageIcon, Sparkles, MessageCircle, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { attachTelegramStarsProof } from "@/lib/actions/telegram-payment";

export function CopyButton({ copyText }: { copyText: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!copyText) return;
    navigator.clipboard.writeText(copyText);
    setCopied(true);
    toast.success("تم نسخ بيانات الحساب بنجاح!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="p-2 rounded-xl bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition flex items-center gap-1 text-xs font-bold"
    >
      {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-purple-400" />}
      <span>{copied ? "تم النسخ" : "نسخ البيانات"}</span>
    </button>
  );
}

export default function OrderTrackerClient({ copyText }: { copyText: string }) {
  return <CopyButton copyText={copyText} />;
}

export function TelegramStarsPaymentSection({
  orderNumber,
  starsTotal,
  initialScreenshotUrl,
  recipientPhone = "01288212101",
}: {
  orderNumber: string;
  starsTotal: number;
  initialScreenshotUrl?: string | null;
  recipientPhone?: string;
}) {
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(initialScreenshotUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaved, setIsSaved] = useState(Boolean(initialScreenshotUrl));

  // Format phone to international format for Telegram (+201288212101)
  const cleanPhone = recipientPhone.replace(/\D/g, "");
  const intlPhone = cleanPhone.startsWith("0") ? `+20${cleanPhone.substring(1)}` : `+${cleanPhone}`;
  const telegramDirectLink = `https://t.me/${intlPhone}`;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      toast.error("حجم الصورة كبير جداً (الحد الأقصى 8 ميجابايت).");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setIsUploading(true);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.message || "فشل رفع الصورة.");
      }

      setScreenshotUrl(data.url);
      await attachTelegramStarsProof(orderNumber, data.url);
      setIsSaved(true);
      toast.success("✅ تم إرفاق سكرين شوت تحويل النجوم بنجاح وإرسالها للإدارة!");
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء رفع سكرين شوت التحويل.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-amber-500/15 via-[#1a140b] to-[#0f1218] border-2 border-amber-500/50 text-amber-300 space-y-5 shadow-xl">
      <div className="flex items-center justify-between border-b border-amber-500/30 pb-3">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-6 h-6 text-amber-400 shrink-0" />
          <div>
            <h3 className="text-base font-black text-white">إرسال النجوم كـ هدية (Gift / Stars) ⭐</h3>
            <span className="text-xs text-amber-400 font-mono font-bold">
              المطلوب إرساله: {starsTotal} نجمة تيليجرام
            </span>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold">
          بانتظار التحويل
        </span>
      </div>

      {/* Step by step */}
      <div className="p-4 rounded-xl bg-[#0f1218]/90 border border-amber-500/30 text-xs space-y-2 text-gray-200 leading-relaxed">
        <p className="font-bold text-amber-300">📌 خطوات إتمام الطلب وتفعيله:</p>
        <ol className="list-decimal list-inside space-y-1.5 text-gray-300 text-[11px]">
          <li>
            انقر على الزر بالأسفل لفتح محادثة الإدارة على تيليجرام مباشرة بالرقم (<strong className="text-white font-mono dir-ltr">{recipientPhone}</strong>).
          </li>
          <li>
            أرسل الهدية (Gift) أو النجوم المطلوبة (<strong>{starsTotal} ⭐</strong>) في الشات مع كتابة رقم الطلب: <code className="text-orange-400 font-bold font-mono">#{orderNumber}</code>
          </li>
          <li>
            التقط سكرين شوت (Screenshot) لعملية التحويل الناجحة وارفعها في الحقل أدناه لتأكيد طلبك فورياً لدى الإدارة.
          </li>
        </ol>
      </div>

      {/* Direct Telegram Chat Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <a
          href={telegramDirectLink}
          target="_blank"
          rel="noreferrer"
          className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-xs transition shadow-lg shadow-amber-500/20 active:scale-95"
        >
          <MessageCircle className="w-4 h-4" />
          <span>فتح تليجرام والإرسال إلى رقم الإدارة ({recipientPhone}) 💬</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Screenshot Upload Field */}
      <div className="p-4 rounded-xl bg-[#0f1218] border border-gray-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
            <ImageIcon className="w-4 h-4 text-amber-400" />
            <span>إرفاق سكرين شوت إثبات تحويل النجوم:</span>
          </span>
          {isSaved && (
            <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/30">
              <Check className="w-3 h-3" />
              <span>تم إرفاق الإثبات للإدارة</span>
            </span>
          )}
        </div>

        {screenshotUrl ? (
          <div className="space-y-2">
            <div className="relative rounded-xl overflow-hidden border border-amber-500/40 max-w-sm mx-auto bg-[#161b24]">
              <img
                src={screenshotUrl}
                alt="إثبات تحويل النجوم"
                className="w-full max-h-48 object-contain rounded-xl"
              />
            </div>
            <label className="block text-center cursor-pointer text-[11px] text-amber-400 hover:underline font-bold">
              <span>{isUploading ? "جاري الرفع والتحديث..." : "اضغط هنا لتغيير صورة الإثبات 🔄"}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleUpload}
                disabled={isUploading}
                className="hidden"
              />
            </label>
          </div>
        ) : (
          <label className={`w-full py-4 px-4 rounded-xl border-2 border-dashed border-amber-500/40 bg-[#161b24] hover:bg-amber-500/10 transition cursor-pointer flex flex-col items-center justify-center gap-2 text-center ${isUploading ? "opacity-50 pointer-events-none" : ""}`}>
            {isUploading ? (
              <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
            ) : (
              <Upload className="w-6 h-6 text-amber-400" />
            )}
            <span className="text-xs font-bold text-gray-200">
              {isUploading ? "جاري رفع الإثبات وحفظه بالطلب..." : "انقر هنا لرفع سكرين شوت تحويل النجوم (PNG, JPG)"}
            </span>
            <span className="text-[10px] text-gray-500">
              سيصل الإثبات للإدارة فوراً لتأكيد طلبك وتجهيزه
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={handleUpload}
              disabled={isUploading}
              className="hidden"
            />
          </label>
        )}
      </div>
    </div>
  );
}

