"use client";

import React, { useState, useEffect } from "react";
import { generateTelegramLinkToken, getTelegramAccountStatus, unlinkTelegramAccount } from "@/lib/actions/telegram-payment";
import { CheckCircle2, AlertCircle, ExternalLink, Loader2, Unlink } from "lucide-react";
import { toast } from "sonner";

function TelegramLogo({ className }: { className?: string }) {
  return (
    <svg className={className || "w-5 h-5"} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
    </svg>
  );
}

interface TelegramLinkCardProps {
  compact?: boolean;
  onLinkStatusChange?: (isLinked: boolean) => void;
}

export default function TelegramLinkCard({ compact = false, onLinkStatusChange }: TelegramLinkCardProps) {
  const [status, setStatus] = useState<{
    isLinked: boolean;
    telegramUserId: string | null;
    telegramUsername: string | null;
  }>({ isLinked: false, telegramUserId: null, telegramUsername: null });

  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);
  const [isWaitingForAuth, setIsWaitingForAuth] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await getTelegramAccountStatus();
      setStatus(res);
      if (onLinkStatusChange) {
        onLinkStatusChange(res.isLinked);
      }
      return res;
    } catch {
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  // Polling when waiting for user to click /start in bot
  useEffect(() => {
    if (!isWaitingForAuth) return;

    const interval = setInterval(async () => {
      const updated = await fetchStatus();
      if (updated?.isLinked) {
        setIsWaitingForAuth(false);
        toast.success("🎉 تم ربط حساب Telegram بنجاح!");
      }
    }, 2500);

    const timeout = setTimeout(() => {
      setIsWaitingForAuth(false);
    }, 15 * 60 * 1000); // 15 min timeout

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isWaitingForAuth]);

  const handleStartLink = async () => {
    setIsGenerating(true);
    try {
      const res = await generateTelegramLinkToken();
      if (res.success && res.link) {
        setIsWaitingForAuth(true);
        // Open deep link in new tab or telegram
        window.open(res.link, "_blank");
        toast.info("تم فتح بوت تيليجرام. اضغط زر Start داخل التطبيق لإتمام الربط.");
      }
    } catch (err: any) {
      toast.error(err.message || "فشل إنشاء رابط الربط.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUnlink = async () => {
    if (!confirm("هل أنت متأكد من رغبتك في إلغاء ربط حساب Telegram؟")) return;
    setIsUnlinking(true);
    try {
      await unlinkTelegramAccount();
      await fetchStatus();
      toast.success("تم إلغاء ربط حساب Telegram بنجاح.");
    } catch (err: any) {
      toast.error(err.message || "فشل إلغاء الربط.");
    } finally {
      setIsUnlinking(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 rounded-2xl bg-[#0f1218] border border-gray-800 flex items-center justify-center gap-2 text-xs text-gray-400">
        <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
        <span>جاري التحقق من حالة ربط Telegram...</span>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="p-3.5 rounded-xl bg-[#0e1724] border border-sky-500/30 flex items-center justify-between gap-3 text-right">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center shrink-0">
            <TelegramLogo className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white">حساب Telegram:</span>
              {status.isLinked ? (
                <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>مرتبط ({status.telegramUsername || status.telegramUserId})</span>
                </span>
              ) : (
                <span className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>غير مرتبط</span>
                </span>
              )}
            </div>
            {!status.isLinked && (
              <p className="text-[10px] text-gray-400">مطلوب للدفع بنجوم تيليجرام ⭐</p>
            )}
          </div>
        </div>

        <div>
          {status.isLinked ? (
            <button
              type="button"
              onClick={handleUnlink}
              disabled={isUnlinking}
              className="px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-bold transition flex items-center gap-1"
            >
              {isUnlinking ? <Loader2 className="w-3 h-3 animate-spin" /> : <Unlink className="w-3 h-3" />}
              <span>إلغاء الربط</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStartLink}
              disabled={isGenerating || isWaitingForAuth}
              className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-black font-black text-xs transition flex items-center gap-1.5 shadow-sm"
            >
              {isGenerating || isWaitingForAuth ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>بانتظار Start...</span>
                </>
              ) : (
                <>
                  <ExternalLink className="w-3 h-3" />
                  <span>ربط Telegram</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-[#0c1424] border border-sky-500/40 shadow-[0_0_30px_rgba(14,165,233,0.15)] relative overflow-hidden space-y-4 text-right">
      <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-24 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-gray-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/15 border border-sky-500/40 text-sky-400 flex items-center justify-center shrink-0 shadow-inner">
            <TelegramLogo className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <span>ربط حساب Telegram (Telegram Stars ⭐)</span>
              {status.isLinked ? (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>تم الربط بنجاح</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>غير مرتبط</span>
                </span>
              )}
            </h3>
            <p className="text-xs text-gray-400">
              اربط حسابك لتفعيل الدفع الفوري بنجوم تيليجرام واستلام إشعارات التحديثات أولاً بأول.
            </p>
          </div>
        </div>

        <div>
          {status.isLinked ? (
            <button
              type="button"
              onClick={handleUnlink}
              disabled={isUnlinking}
              className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold transition flex items-center gap-1.5"
            >
              {isUnlinking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Unlink className="w-3.5 h-3.5" />}
              <span>إلغاء ربط الحساب</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStartLink}
              disabled={isGenerating || isWaitingForAuth}
              className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-black font-black text-xs transition flex items-center gap-2 shadow-lg hover:scale-[1.02]"
            >
              {isGenerating || isWaitingForAuth ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>بانتظار الضغط على Start في البوت...</span>
                </>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4" />
                  <span>ربط حساب Telegram الآن 📲</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {status.isLinked ? (
        <div className="p-3.5 rounded-2xl bg-[#0a101d] border border-emerald-500/20 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-gray-300">
            <span className="text-gray-400 font-medium">معرف Telegram:</span>
            <span className="text-white font-mono font-bold">{status.telegramUserId}</span>
            {status.telegramUsername && (
              <span className="text-sky-400 font-mono font-bold">({status.telegramUsername})</span>
            )}
          </div>
          <span className="text-emerald-400 font-bold text-[11px] flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>يمكنك الآن الدفع بنجوم تيليجرام في الـ Checkout</span>
          </span>
        </div>
      ) : (
        isWaitingForAuth && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2.5 text-xs text-amber-300">
            <Loader2 className="w-4 h-4 animate-spin text-amber-400 shrink-0" />
            <p className="text-[11px] leading-relaxed">
              تم فتح البوت في نافذة جديدة. يرجى الضغط على زر <strong>Start</strong> في تيليجرام. ستتعرف هذه الصفحة على حسابك تلقائياً خلال لحظات دون الحاجة لإعادة التحميل.
            </p>
          </div>
        )
      )}
    </div>
  );
}
