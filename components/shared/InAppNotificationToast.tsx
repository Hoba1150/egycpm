"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, ShoppingBag, Gift, Key, CheckCircle2, X, ExternalLink } from "lucide-react";
import Link from "next/link";

interface PopupNotification {
  id: string;
  title: string;
  message: string;
  type?: string;
  link?: string | null;
}

export default function InAppNotificationToast() {
  const [activeNotification, setActiveNotification] = useState<PopupNotification | null>(null);
  const lastSeenIdRef = useRef<string | null>(null);
  const isFirstLoadRef = useRef<boolean>(true);

  // Check for new notifications
  const checkForNewNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      const notifications = data.notifications || [];
      const unreadList = notifications.filter((n: any) => !n.isRead);

      if (unreadList.length > 0) {
        const latest = unreadList[0];
        // Don't show toast on initial mount if already existing, only when newly arrived or changed
        if (isFirstLoadRef.current) {
          lastSeenIdRef.current = latest.id;
          isFirstLoadRef.current = false;
          return;
        }

        if (latest.id !== lastSeenIdRef.current) {
          lastSeenIdRef.current = latest.id;
          showPopup({
            id: latest.id,
            title: latest.title,
            message: latest.message,
            type: latest.type,
            link: latest.link,
          });
        }
      } else {
        isFirstLoadRef.current = false;
      }
    } catch {
      // Ignore network errors
    }
  };

  const showPopup = (notif: PopupNotification) => {
    setActiveNotification(notif);
    // Play subtle soft notification tone if permitted
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {
      // Audio autoplay policy fallback
    }

    // Auto-dismiss after 6 seconds
    setTimeout(() => {
      setActiveNotification((current) => (current?.id === notif.id ? null : current));
    }, 6000);
  };

  useEffect(() => {
    checkForNewNotifications();
    const interval = setInterval(checkForNewNotifications, 45000);

    // Custom event listener for instant in-app triggers
    const handleCustomNotification = (e: any) => {
      if (e.detail) {
        showPopup(e.detail);
      }
    };

    window.addEventListener("cpm_notification_arrived", handleCustomNotification);
    window.addEventListener("cpm_wallet_changed", checkForNewNotifications);
    window.addEventListener("cpm_order_changed", checkForNewNotifications);

    return () => {
      clearInterval(interval);
      window.removeEventListener("cpm_notification_arrived", handleCustomNotification);
      window.removeEventListener("cpm_wallet_changed", checkForNewNotifications);
      window.removeEventListener("cpm_order_changed", checkForNewNotifications);
    };
  }, []);

  const getIcon = (type?: string) => {
    switch (type) {
      case "ORDER_COMPLETED":
      case "ORDER_STATUS":
        return <ShoppingBag className="w-5 h-5 text-orange-500" />;
      case "DEPOSIT_APPROVED":
      case "GIFT_RECEIVED":
        return <Gift className="w-5 h-5 text-emerald-400" />;
      case "CREDENTIALS_DELIVERED":
        return <Key className="w-5 h-5 text-purple-400" />;
      default:
        return <Bell className="w-5 h-5 text-orange-500" />;
    }
  };

  return (
    <AnimatePresence>
      {activeNotification && (
        <div className="fixed top-4 right-4 sm:right-6 z-[100] max-w-sm w-[calc(100vw-2rem)] pointer-events-auto">
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="rounded-2xl bg-[#0c1017]/95 border border-orange-500/50 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.8)] backdrop-blur-xl text-right relative overflow-hidden"
          >
            {/* Top Glowing Progress Line */}
            <motion.div
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 6, ease: "linear" }}
              className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-amber-400"
            />

            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center shrink-0 mt-0.5">
                {getIcon(activeNotification.type)}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-white truncate">
                    {activeNotification.title}
                  </h4>
                  <button
                    onClick={() => setActiveNotification(null)}
                    className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/60 transition"
                    aria-label="إغلاق الإشعار"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-[11px] text-gray-300 leading-relaxed whitespace-pre-line">
                  {activeNotification.message}
                </p>

                {activeNotification.link && (
                  <div className="pt-1.5">
                    <Link
                      href={activeNotification.link}
                      onClick={() => setActiveNotification(null)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-500 hover:underline"
                    >
                      <span>عرض التفاصيل الآن</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
