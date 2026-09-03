"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { LogOut, Shield, Bell, ShoppingBag, Wallet, Headphones, Star, ExternalLink, CheckCheck, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import { getAdminSidebarCounts } from "@/lib/actions/settings";

interface AdminNotification {
  id: string;
  title: string;
  message: string;
  type: "ORDER" | "DEPOSIT" | "TICKET" | "REVIEW";
  link: string;
  createdAt: string;
  isRead: boolean;
}

export default function AdminTopbar({ user }: { user: any }) {
  const router = useRouter();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const lastCountsRef = useRef<Record<string, number>>({});
  const isFirstLoadRef = useRef(true);

  // Play subtle sound on new admin event
  const playAlertSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.12); // G5
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch {}
  };

  // Real-time polling & sync
  const checkAdminRealtime = useCallback(async () => {
    try {
      const currentCounts = await getAdminSidebarCounts();
      if (isFirstLoadRef.current) {
        lastCountsRef.current = currentCounts;
        isFirstLoadRef.current = false;
        return;
      }

      const prev = lastCountsRef.current;
      let hasChange = false;

      // 1. Check new/pending orders
      const pendingOrders = currentCounts["/admin/orders"] || 0;
      const prevPendingOrders = prev["/admin/orders"] || 0;
      if (pendingOrders > prevPendingOrders) {
        hasChange = true;
        const diff = pendingOrders - prevPendingOrders;
        playAlertSound();
        const notifId = `order_${Date.now()}`;
        const newNotif: AdminNotification = {
          id: notifId,
          title: "🚀 طلب جديد وصل للتو!",
          message: `يوجد ${diff} طلب جديد بانتظار التجهيز والتنفيذ.`,
          type: "ORDER",
          link: "/admin/orders",
          createdAt: new Date().toISOString(),
          isRead: false,
        };
        setNotifications((n) => [newNotif, ...n.slice(0, 19)]);
        setUnreadCount((c) => c + 1);

        toast("🚀 طلب جديد وصل للتو!", {
          description: `وصل طلب جديد بانتظار التنفيذ.`,
          action: {
            label: "فتح الطلبات ⚡",
            onClick: () => router.push("/admin/orders"),
          },
          duration: 7000,
        });
      }

      // 2. Check pending deposit requests
      const pendingDeposits = currentCounts["/admin/deposits"] || 0;
      const prevPendingDeposits = prev["/admin/deposits"] || 0;
      if (pendingDeposits > prevPendingDeposits) {
        hasChange = true;
        playAlertSound();
        const notifId = `deposit_${Date.now()}`;
        const newNotif: AdminNotification = {
          id: notifId,
          title: "💰 طلب إيداع محفظة جديد!",
          message: `عميل قام بطلب شحن محفظة بانتظار المراجعة والاعتماد.`,
          type: "DEPOSIT",
          link: "/admin/deposits",
          createdAt: new Date().toISOString(),
          isRead: false,
        };
        setNotifications((n) => [newNotif, ...n.slice(0, 19)]);
        setUnreadCount((c) => c + 1);

        toast("💰 طلب إيداع رصيد جديد!", {
          description: "طلب شحن محفظة بانتظار المراجعة.",
          action: {
            label: "مراجعة الإيداع 🔍",
            onClick: () => router.push("/admin/deposits"),
          },
          duration: 7000,
        });
      }

      // 3. Check open tickets
      const openTickets = currentCounts["/admin/tickets"] || 0;
      const prevOpenTickets = prev["/admin/tickets"] || 0;
      if (openTickets > prevOpenTickets) {
        hasChange = true;
        playAlertSound();
        const notifId = `ticket_${Date.now()}`;
        const newNotif: AdminNotification = {
          id: notifId,
          title: "🎧 تذكرة دعم فني جديدة!",
          message: `استفسار جديد من عميل بانتظار الرد.`,
          type: "TICKET",
          link: "/admin/tickets",
          createdAt: new Date().toISOString(),
          isRead: false,
        };
        setNotifications((n) => [newNotif, ...n.slice(0, 19)]);
        setUnreadCount((c) => c + 1);

        toast("🎧 تذكرة دعم فني جديدة!", {
          description: "عميل أرسل استفساراً جديداً.",
          action: {
            label: "فتح التذاكر 📩",
            onClick: () => router.push("/admin/tickets"),
          },
          duration: 7000,
        });
      }

      // 4. Check new unapproved reviews
      const reviewsCount = currentCounts["/admin/reviews"] || 0;
      const prevReviews = prev["/admin/reviews"] || 0;
      if (reviewsCount > prevReviews) {
        hasChange = true;
        playAlertSound();
        const notifId = `review_${Date.now()}`;
        const newNotif: AdminNotification = {
          id: notifId,
          title: "⭐ تقييم جديد من عميل!",
          message: `تمت إضافة تقييم جديد يحتاج المراجعة.`,
          type: "REVIEW",
          link: "/admin/reviews",
          createdAt: new Date().toISOString(),
          isRead: false,
        };
        setNotifications((n) => [newNotif, ...n.slice(0, 19)]);
        setUnreadCount((c) => c + 1);

        toast("⭐ تقييم جديد وصل!", {
          description: "تقييم جديد بانتظار المراجعة.",
          action: {
            label: "عرض التقييمات ⭐",
            onClick: () => router.push("/admin/reviews"),
          },
          duration: 6000,
        });
      }

      lastCountsRef.current = currentCounts;
    } catch {}
  }, [router]);

  useEffect(() => {
    checkAdminRealtime();
    // Reduced to 60s to avoid connection pool exhaustion (DB limit: 5 connections)
    const interval = setInterval(checkAdminRealtime, 60000);
    return () => clearInterval(interval);
  }, [checkAdminRealtime]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout?type=admin", { method: "POST" });
      toast.success("تم تسجيل الخروج من لوحة الإدارة.");
      router.push("/admin/login");
      router.refresh();
    } catch {
      toast.error("فشل تسجيل الخروج.");
    }
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case "ORDER":
        return <ShoppingBag className="w-3.5 h-3.5 text-orange-500" />;
      case "DEPOSIT":
        return <Wallet className="w-3.5 h-3.5 text-emerald-400" />;
      case "TICKET":
        return <Headphones className="w-3.5 h-3.5 text-cyan-400" />;
      case "REVIEW":
        return <Star className="w-3.5 h-3.5 text-amber-400" />;
      default:
        return <Bell className="w-3.5 h-3.5 text-orange-500" />;
    }
  };

  return (
    <header className="h-14 border-b border-gray-800 bg-[#0d1117]/95 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between z-30 relative">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-500 text-xs font-mono font-bold">
          <Shield className="w-3.5 h-3.5" />
          <span>EGY CPM COMMAND</span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Central Real-Time Admin Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-2 rounded-xl bg-[#161b22] hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-700/80 transition active:scale-95"
            aria-label="إشعارات الإدارة الفورية"
            title="مركز إشعارات الإدارة المباشر"
          >
            <Bell className="w-4 h-4 text-orange-400" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-4 px-1 rounded-full bg-orange-500 text-black text-[9px] font-black font-mono animate-bounce shadow-md">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {isNotifOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)} />
              <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[#0f1219] border border-orange-500/40 shadow-2xl overflow-hidden z-50 text-right animate-in fade-in-50 duration-150">
                {/* Header */}
                <div className="p-3.5 border-b border-gray-800 bg-[#121622] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-orange-500" />
                    <h4 className="text-xs font-black text-white">إشعارات العمليات المباشرة</h4>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded bg-orange-500 text-black text-[9px] font-black font-mono">
                        {unreadCount} جديد
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => setUnreadCount(0)}
                      className="text-[10px] text-gray-400 hover:text-orange-400 flex items-center gap-1 transition"
                    >
                      <CheckCheck className="w-3 h-3" />
                      <span>قراءة الكل</span>
                    </button>
                  )}
                </div>

                {/* List */}
                <div className="max-h-80 overflow-y-auto divide-y divide-gray-800/60">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 space-y-1">
                      <Bell className="w-6 h-6 mx-auto opacity-30 text-orange-400" />
                      <p className="text-xs">لا توجد إشعارات جديدة حتى الآن</p>
                      <span className="text-[10px] text-gray-600">سيتم تنبيهك فور وصول طلب أو إيداع جديد ⚡</span>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-3 transition flex gap-2.5 items-start ${
                          n.isRead ? "bg-transparent opacity-75" : "bg-[#161b24]"
                        } hover:bg-[#1a202c]`}
                      >
                        <div className="p-1.5 rounded-lg bg-[#0a0c10] border border-gray-800 shrink-0 mt-0.5">
                          {getNotifIcon(n.type)}
                        </div>
                        <div className="flex-1 min-w-0 space-y-0.5">
                          <h5 className="text-xs font-bold text-white truncate">{n.title}</h5>
                          <p className="text-[11px] text-gray-300 leading-tight">{n.message}</p>
                          <div className="pt-1 flex items-center justify-between">
                            <span className="text-[9px] text-gray-500 font-mono">{formatDate(n.createdAt)}</span>
                            <Link
                              href={n.link}
                              onClick={() => setIsNotifOpen(false)}
                              className="text-[10px] text-orange-400 hover:text-orange-300 font-bold inline-flex items-center gap-1 hover:underline"
                            >
                              <span>فتح القسم مباشرة</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer */}
                <div className="p-2 border-t border-gray-800 bg-[#0a0c10] text-center">
                  <span className="text-[10px] text-gray-500 font-mono">
                    🟢 التحديثات المباشرة مفعلة تلقائياً (Live Real-Time)
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold transition active:scale-95"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">تسجيل خروج</span>
        </button>
      </div>
    </header>
  );
}

