"use client";

import React, { useState, useEffect } from "react";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import {
  Bell,
  Gift,
  ShoppingBag,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  Trash2,
  Gamepad2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link?: string | null;
  createdAt: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const prev = [...notifications];
    setNotifications((curr) => curr.filter((n) => n.id !== id));

    try {
      const res = await fetch("/api/notifications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        toast.success("تم حذف الإشعار بنجاح.");
      } else {
        throw new Error();
      }
    } catch {
      setNotifications(prev);
      toast.error("فشل حذف الإشعار.");
    } finally {
      setDeletingId(null);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "CREDENTIALS_DELIVERED":
        return <Gamepad2 className="w-5 h-5 text-orange-500" />;
      case "DEPOSIT_APPROVED":
      case "GIFT_RECEIVED":
        return <Gift className="w-5 h-5 text-emerald-400" />;
      case "ORDER_STATUS":
        return <ShoppingBag className="w-5 h-5 text-orange-500" />;
      case "DEPOSIT_REJECTED":
        return <ShieldAlert className="w-5 h-5 text-red-400" />;
      default:
        return <Sparkles className="w-5 h-5 text-purple-400" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-right space-y-8">
      {/* Header */}
      <div className="space-y-1 border-b border-gray-800 pb-4">
        <span className="text-xs font-mono font-bold text-orange-500 uppercase">
          Notification Center
        </span>
        <h1 className="text-2xl sm:text-4xl font-black text-white">
          مركز الإشعارات والتنبيهات
        </h1>
      </div>

      {isLoading ? (
        <div className="py-20 text-center">
          <Loader2 className="w-8 h-8 mx-auto animate-spin text-orange-500" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="py-20 text-center rounded-3xl bg-[#0f1218] border border-gray-800 space-y-3">
          <Bell className="w-10 h-10 mx-auto text-gray-600" />
          <h3 className="text-base font-bold text-white">لا توجد إشعارات حالياً</h3>
          <p className="text-xs text-gray-400">ستصلك هنا إشعارات فورية عند تسليم الحسابات أو تأكيد الإيداعات أو تغير حالة طلباتك.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const isCredentials = n.type === "CREDENTIALS_DELIVERED";
            return (
              <div
                key={n.id}
                className={`p-4 sm:p-5 rounded-2xl border transition flex items-start gap-4 ${
                  isCredentials
                    ? "bg-[#14101d] border-purple-500/40 shadow-[0_0_20px_rgba(168,85,247,0.15)]"
                    : !n.isRead
                    ? "bg-[#121620] border-orange-500/30"
                    : "bg-[#0f1218] border-gray-800"
                }`}
              >
                <div className="p-2.5 rounded-xl bg-[#161b24] border border-gray-700 shrink-0">
                  {getIcon(n.type)}
                </div>

                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className={`text-sm font-bold ${isCredentials ? "text-purple-300" : "text-white"}`}>
                      {n.title}
                    </h4>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-gray-500 font-mono">
                        {formatDate(n.createdAt)}
                      </span>
                      <button
                        type="button"
                        disabled={deletingId === n.id}
                        onClick={() => handleDelete(n.id)}
                        className="p-1 rounded-lg hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition"
                        title="حذف الإشعار"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-line select-text font-sans">
                    {n.message}
                  </p>

                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <Link
                      href={`/notifications/${n.id}`}
                      className="text-xs text-purple-400 hover:text-purple-300 hover:underline inline-flex items-center gap-1 font-bold"
                    >
                      <span>عرض تفاصيل الإشعار</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>

                    {n.link && (
                      <Link
                        href={n.link}
                        className="text-xs text-orange-500 hover:underline inline-flex items-center gap-1 font-bold"
                      >
                        <span>عرض تفاصيل الطلب</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
