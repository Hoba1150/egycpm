"use client";

import React, { useState, useEffect } from "react";
import { Bell, BellRing, X, Sparkles, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

// Convert Base64 URL string to Uint8Array for applicationServerKey
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PushNotificationPrompt() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Verify Browser support
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window
    ) {
      setIsSupported(true);
      setPermission(Notification.permission);

      // Register SW
      navigator.serviceWorker
        .register("/sw.js")
        .then(async (reg) => {
          const sub = await reg.pushManager.getSubscription();
          if (sub) {
            setIsSubscribed(true);
          } else if (Notification.permission === "default") {
            // Check if user dismissed prompt previously
            const dismissed = localStorage.getItem("egycpm_push_dismissed");
            if (!dismissed) {
              const timer = setTimeout(() => setShowPrompt(true), 4000);
              return () => clearTimeout(timer);
            }
          }
        })
        .catch(() => {});
    }
  }, []);

  const subscribeUser = async () => {
    setIsLoading(true);
    try {
      // 1. Request Browser Permission
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm !== "granted") {
        toast.info("تم رفض إذن الإشعارات من إعدادات المتصفح.");
        setShowPrompt(false);
        setIsLoading(false);
        return;
      }

      // 2. Fetch VAPID Public Key
      const keyRes = await fetch("/api/push/public-key");
      const keyData = await keyRes.json();
      if (!keyData.publicKey) throw new Error("تعذر جلب مفتاح الإشعارات.");

      // 3. Register with PushManager
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(keyData.publicKey),
      });

      // 4. Save to Database
      const saveRes = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub }),
      });

      if (!saveRes.ok) throw new Error("فشل تسجيل الاشتراك بالسيرفر.");

      setIsSubscribed(true);
      setShowPrompt(false);
      toast.success("تم تفعيل إشعارات المتجر بنجاح! 🔔 ستصلك العروض الحصرية فوراً.");
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء تفعيل الإشعارات.");
    } finally {
      setIsLoading(false);
    }
  };

  const dismissPrompt = () => {
    setShowPrompt(false);
    localStorage.setItem("egycpm_push_dismissed", Date.now().toString());
  };

  if (!isSupported) return null;

  return (
    <>
      {/* Floating Prompt Banner (Bottom Left on Desktop, Bottom Center on Mobile) */}
      {showPrompt && !isSubscribed && permission === "default" && (
        <div className="fixed bottom-20 sm:bottom-6 left-4 right-4 sm:right-auto sm:w-96 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="p-4 rounded-2xl bg-gradient-to-b from-[#161b26] to-[#0d1017] border-2 border-cyan-500/60 shadow-[0_10px_35px_rgba(0,0,0,0.8)] text-right relative space-y-3">
            <button
              type="button"
              onClick={dismissPrompt}
              className="absolute top-3 left-3 p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shrink-0">
                <BellRing className="w-5 h-5 animate-bounce" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                  <span>تفعيل إشعارات وعروض المتجر 🔔</span>
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                </h4>
                <p className="text-[11px] text-gray-300 leading-relaxed">
                  احصل على تنبيهات فورية على هاتفك عند نزول سيارات CPM 2 نادرة، سحوبات مجانية، وأكواد خصم حصرية!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={subscribeUser}
                disabled={isLoading}
                className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-400 hover:from-cyan-400 hover:to-sky-300 text-black font-black text-xs shadow-md shadow-cyan-500/20 flex items-center justify-center gap-1.5 transition disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Bell className="w-3.5 h-3.5 fill-black" />
                )}
                <span>تفعيل التنبيهات الآن 🚀</span>
              </button>

              <button
                type="button"
                onClick={dismissPrompt}
                className="py-2 px-3 rounded-xl bg-[#1c2230] hover:bg-gray-800 text-gray-300 text-xs font-bold transition border border-gray-700"
              >
                لاحقاً
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
