"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, CheckCheck, Gift, ShoppingBag, ShieldAlert, Info, ExternalLink, Trash2, Gamepad2 } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link?: string | null;
  createdAt: string;
}

export default function NotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000);
    return () => clearInterval(interval);
  }, []);

  const markAllRead = async () => {
    try {
      await fetch("/api/notifications/mark-read", { method: "POST" });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // ignore
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const prev = [...notifications];
    setNotifications((curr) => curr.filter((n) => n.id !== id));
    try {
      await fetch("/api/notifications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    } catch {
      setNotifications(prev);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "CREDENTIALS_DELIVERED":
        return <Gamepad2 className="w-3.5 h-3.5 text-orange-500" />;
      case "DEPOSIT_APPROVED":
      case "GIFT_RECEIVED":
        return <Gift className="w-3.5 h-3.5 text-emerald-400" />;
      case "ORDER_STATUS":
        return <ShoppingBag className="w-3.5 h-3.5 text-orange-500" />;
      case "DEPOSIT_REJECTED":
        return <ShieldAlert className="w-3.5 h-3.5 text-red-400" />;
      default:
        return <Info className="w-3.5 h-3.5 text-orange-400" />;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-1.5 sm:p-2 rounded-lg bg-[#12161f] border border-gray-800 text-gray-300 hover:text-orange-500 transition"
        aria-label="التنبيهات"
      >
        <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-3.5 px-0.5 rounded-full bg-orange-500 text-black text-[8px] sm:text-[9px] font-black">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 mt-1.5 w-72 sm:w-80 rounded-xl bg-[#0f1218] border border-gray-800 shadow-xl overflow-hidden z-50 text-right"
            >
              {/* Dropdown Header */}
              <div className="p-3 border-b border-gray-800 flex items-center justify-between bg-[#121620]">
                <div className="flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-orange-500" />
                  <h4 className="text-xs font-bold text-white">مركز الإشعارات</h4>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-500 border border-orange-500/20 text-[9px] font-mono font-bold">
                      {unreadCount} جديد
                    </span>
                  )}
                </div>

                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[10px] text-gray-400 hover:text-orange-500 transition flex items-center gap-1"
                  >
                    <CheckCheck className="w-3 h-3" />
                    <span>قراءة الكل</span>
                  </button>
                )}
              </div>

              {/* Notifications List */}
              <div className="max-h-80 overflow-y-auto divide-y divide-gray-800/60">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-gray-500 space-y-1">
                    <Bell className="w-6 h-6 mx-auto opacity-30" />
                    <p className="text-xs">لا توجد إشعارات حالياً</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3 transition flex gap-2.5 items-start ${
                        n.isRead ? "bg-transparent opacity-70" : "bg-[#161b24]"
                      } hover:bg-[#1a202c]`}
                    >
                      <div className="p-1 rounded bg-[#08090d] border border-gray-800 shrink-0 mt-0.5">
                        {getIcon(n.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h5 className="text-xs font-bold text-white truncate">{n.title}</h5>
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-[9px] text-gray-500 font-mono">
                              {formatDate(n.createdAt)}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => handleDelete(e, n.id)}
                              className="p-0.5 rounded text-gray-600 hover:text-red-400 transition"
                              title="حذف"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-0.5 leading-tight">{n.message}</p>
                        {n.link && (
                          <div className="mt-1">
                            <Link
                              href={n.link}
                              onClick={() => setIsOpen(false)}
                              className="text-[10px] text-orange-500 hover:underline inline-flex items-center gap-0.5 font-bold"
                            >
                              <span>عرض التفاصيل</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="p-2 text-center border-t border-gray-800 bg-[#121620]">
                <Link
                  href="/notifications"
                  onClick={() => setIsOpen(false)}
                  className="text-[11px] text-gray-400 hover:text-orange-500 transition font-medium"
                >
                  مشاهدة جميع الإشعارات
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
