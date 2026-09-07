"use client";

import React, { useState, useEffect } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { updateOrderStatus, refundOrder, deleteOrder, deliverOrderCredentials } from "@/lib/actions/order";
import { confirmTelegramStarsPayment } from "@/lib/actions/telegram-payment";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  RefreshCw,
  RotateCcw,
  X,
  Loader2,
  Gamepad2,
  FileText,
  Lock,
  Trash2,
  Key,
  Send,
  MoreVertical,
  User,
  ShoppingBag,
  AlertCircle,
  Sparkles,
} from "lucide-react";

export default function OrderPipelineClient({ initialOrders }: { initialOrders: any[] }) {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>(initialOrders);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [newOrdersCount, setNewOrdersCount] = useState(0);

  useEffect(() => {
    setOrders(initialOrders);
    setNewOrdersCount(0);
  }, [initialOrders]);

  // Auto-refresh: poll for new orders every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 15000);
    return () => clearInterval(interval);
  }, [router]);

  // Modals state
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showDeliveredPassword, setShowDeliveredPassword] = useState(false);
  const [newStatus, setNewStatus] = useState<string>("COMPLETED");
  const [adminNotes, setAdminNotes] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Deliver new account credentials state
  const [deliveredEmail, setDeliveredEmail] = useState("");
  const [deliveredPassword, setDeliveredPassword] = useState("");
  const [deliveredNotes, setDeliveredNotes] = useState("");
  const [isDelivering, setIsDelivering] = useState(false);

  // Refund modal state
  const [refundModalOrder, setRefundModalOrder] = useState<any | null>(null);
  const [refundReason, setRefundReason] = useState("");
  const [isRefunding, setIsRefunding] = useState(false);

  // Stars Confirmation state
  const [isConfirmingStars, setIsConfirmingStars] = useState(false);

  // Mobile Bottom Sheet Actions state
  const [bottomSheetOrder, setBottomSheetOrder] = useState<any | null>(null);

  const handleConfirmStarsPayment = async (orderId: string, orderNumber: string, starsCount: number) => {
    if (!confirm(`هل أنت متأكد من استلام (${starsCount} ⭐) في حسابك الشخصي على تيليجرام وتريد تفعيل الطلب #${orderNumber} والبدء في تنفيذه الآن؟`)) {
      return;
    }

    setIsConfirmingStars(true);
    try {
      const res = await confirmTelegramStarsPayment(orderId);
      if (res.success) {
        toast.success(`🎉 تم تأكيد استلام النجوم وتفعيل الطلب #${orderNumber} بنجاح!`);
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: res.status } : o))
        );
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder((prev: any) => (prev ? { ...prev, status: res.status } : null));
        }
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.message || "فشل تأكيد استلام النجوم.");
    } finally {
      setIsConfirmingStars(false);
    }
  };

  const openOrderDetails = (o: any) => {
    setSelectedOrder(o);
    setNewStatus(o.status || "COMPLETED");
    setAdminNotes(o.adminNotes || "");
    setDeliveredEmail(o.deliveredAccountEmail || "");
    setDeliveredPassword(o.decryptedDeliveredPassword || "");
    setDeliveredNotes(o.deliveredAccountNotes || "");
    setShowPassword(false);
    setShowDeliveredPassword(false);
  };

  const filtered = orders.filter((o) => {
    const matchesStatus = filterStatus === "ALL" || o.status === filterStatus;
    const matchesSearch =
      !search ||
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      (o.user?.name && o.user.name.toLowerCase().includes(search.toLowerCase())) ||
      (o.user?.email && o.user.email.toLowerCase().includes(search.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    setIsUpdating(true);
    // Optimistic update
    setOrders((prev) =>
      prev.map((o) =>
        o.id === selectedOrder.id
          ? {
              ...o,
              status: newStatus,
              adminNotes,
              deliveredAccountEmail: deliveredEmail || o.deliveredAccountEmail,
              decryptedDeliveredPassword: deliveredPassword || o.decryptedDeliveredPassword,
              deliveredAccountNotes: deliveredNotes || o.deliveredAccountNotes,
            }
          : o
      )
    );

    try {
      await updateOrderStatus({
        orderId: selectedOrder.id,
        status: newStatus as any,
        adminNotes: adminNotes.trim() || undefined,
        deliveredEmail: deliveredEmail.trim() || undefined,
        deliveredPassword: deliveredPassword.trim() || undefined,
        deliveredNotes: deliveredNotes.trim() || undefined,
      });
      toast.success(`تم تحديث الطلب #${selectedOrder.orderNumber} وإشعار العميل بنجاح!`);
      setSelectedOrder(null);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "فشل تحديث حالة الطلب.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeliverCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    if (!deliveredEmail.trim() || !deliveredPassword.trim()) {
      toast.error("يرجى إدخال البريد الإلكتروني وكلمة المرور لتسليم الحساب.");
      return;
    }

    setIsDelivering(true);
    try {
      await deliverOrderCredentials({
        orderId: selectedOrder.id,
        email: deliveredEmail.trim(),
        password: deliveredPassword,
        notes: deliveredNotes.trim() || undefined,
      });

      toast.success(`تم تسليم بيانات الحساب وإكمال الطلب #${selectedOrder.orderNumber} بنجاح! 🔑`);
      setSelectedOrder(null);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "فشل تسليم الحساب.");
    } finally {
      setIsDelivering(false);
    }
  };

  const handleDeleteOrder = async (orderId: string, orderNumber: string) => {
    if (!confirm(`⚠️ تحذير: هل أنت متأكد من حذف الطلب #${orderNumber} نهائياً؟\nسيتم حذف كافة تفاصيل الطلب وعناصره.`)) return;

    const previous = [...orders];
    // Instant optimistic deletion from UI
    setOrders((prev) => prev.filter((o) => o.id !== orderId));

    try {
      await deleteOrder(orderId);
      toast.success(`تم حذف الطلب #${orderNumber} بنجاح.`);
      router.refresh();
    } catch (err: any) {
      setOrders(previous);
      toast.error(err.message || "فشل حذف الطلب.");
    }
  };

  const getFulfillmentBadge = (type?: string | null) => {
    switch (type) {
      case "NEW_ACCOUNT_AUTO":
        return <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[10px] font-bold">حساب جديد (إنشاء الإدارة)</span>;
      case "NEW_ACCOUNT_CUSTOM":
        return <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-[10px] font-bold">حساب جديد (بيانات مخصصة)</span>;
      case "EXISTING_ACCOUNT":
        return <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">حساب العميل الحالي</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full bg-gray-500/10 border border-gray-500/30 text-gray-400 text-[10px] font-bold">حساب العميل</span>;
    }
  };

  const handleRefundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundModalOrder) return;

    setIsRefunding(true);
    try {
      await refundOrder(refundModalOrder.id, refundReason || "استرجاع مالي بطلب الإدارة");
      toast.success(`تم رد مبلغ ${refundModalOrder.total} ج.م إلى محفظة العميل بنجاح! 💰`);
      setRefundModalOrder(null);
      setRefundReason("");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "فشل استرجاع المبلغ.");
    } finally {
      setIsRefunding(false);
    }
  };

  const getPaymentMethodBadge = (methodOrOrder: any, starsTotal?: number) => {
    const isStars =
      typeof methodOrOrder === "object" && methodOrOrder !== null
        ? methodOrOrder.paymentMethod === "TELEGRAM_STARS" || (methodOrOrder.starsTotal && methodOrOrder.starsTotal > 0)
        : methodOrOrder === "TELEGRAM_STARS" || (starsTotal && starsTotal > 0);

    if (isStars) {
      return (
        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-bold inline-flex items-center gap-1">
          <span>⭐</span>
          <span>Telegram Stars</span>
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold inline-flex items-center gap-1">
        <span>💰</span>
        <span>المحفظة</span>
      </span>
    );
  };

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING_PAYMENT":
        return (
          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse inline-flex items-center gap-1">
            <span>⏳</span>
            <span>بانتظار دفع النجوم</span>
          </span>
        );
      case "PAID":
        return (
          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            تم الدفع بنجاح ✅
          </span>
        );
      case "PROCESSING":
        return (
          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
            جاري التجهيز ⏳
          </span>
        );
      case "IN_PROGRESS":
        return (
          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">
            قيد التنفيذ باللعبة ⚙️
          </span>
        );
      case "COMPLETED":
        return (
          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-green-500/20 text-green-400 border border-green-500/30">
            مكتمل وتم التسليم 🎉
          </span>
        );
      case "REFUNDED":
        return (
          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-orange-500/10 text-orange-400 border border-orange-500/30">
            مسترجع 💸
          </span>
        );
      case "CANCELLED":
      case "REJECTED":
        return (
          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
            ملغي / مرفوض ❌
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-gray-500/20 text-gray-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-gray-800 pb-4">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
          {[
            { key: "ALL", label: "الكل" },
            { key: "PENDING_PAYMENT", label: "بانتظار دفع النجوم ⭐" },
            { key: "PROCESSING", label: "جاري التجهيز ⏳" },
            { key: "IN_PROGRESS", label: "قيد التنفيذ 🚀" },
            { key: "COMPLETED", label: "المكتملة ✅" },
            { key: "REFUNDED", label: "المسترجعة 💰" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilterStatus(tab.key)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                filterStatus === tab.key
                  ? "bg-orange-500 text-black "
                  : "bg-[#12161f] text-gray-300 hover:text-white border border-gray-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="ابحث برقم الطلب أو العميل..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-64 px-3.5 py-2 bg-[#12161f] border border-gray-700 rounded-xl text-xs text-white placeholder-gray-500 focus:border-orange-500 text-right"
        />
      </div>

      {/* ─── Mobile Responsive Cards (Phone UX) ─── */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-xs bg-[#12161f] rounded-2xl border border-gray-800">
            لا توجد طلبات مطابقة للبحث أو الفلتر.
          </div>
        ) : (
          filtered.map((o) => (
            <div
              key={o.id}
              className={`p-3.5 rounded-2xl bg-[#12161f] border shadow-sm space-y-2.5 text-right relative overflow-hidden ${
                o.status === "PENDING_PAYMENT" ? "border-amber-500/40 bg-amber-950/10" : "border-gray-800/90"
              }`}
            >
              {/* Card Header: Order Number, Method & Status */}
              <div className="flex items-center justify-between gap-2 border-b border-gray-800/70 pb-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-mono font-black text-orange-500 text-xs">#{o.orderNumber}</span>
                  {getPaymentMethodBadge(o)}
                  {getFulfillmentBadge(o.fulfillmentType)}
                </div>

                <div className="flex items-center gap-1">
                  {getOrderStatusBadge(o.status)}

                  {/* Mobile Actions Menu Trigger Button */}
                  <button
                    onClick={() => setBottomSheetOrder(o)}
                    className="p-1 rounded-lg bg-[#1a202c] hover:bg-gray-700 text-gray-300 hover:text-white transition active:scale-95 border border-gray-700/60"
                    aria-label="خيارات الطلب"
                    title="خيارات وإجراءات"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Card Body: Items & Customer */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-gray-400 block">العميل:</span>
                  <span className="font-bold text-white block truncate text-[11px]">{o.user?.name || "عميل"}</span>
                  <span className="text-[9px] text-gray-400 font-mono block truncate">{o.user?.email}</span>
                </div>

                <div className="text-left">
                  <span className="text-[10px] text-gray-400 block">المبلغ المطلوب:</span>
                  {o.paymentMethod === "TELEGRAM_STARS" ? (
                    <div>
                      <span className="font-black text-amber-400 font-mono text-sm block">{o.starsTotal ? `${o.starsTotal} ⭐` : `${formatCurrency(o.total)}`}</span>
                      <span className="text-[9px] text-gray-500 font-mono">({formatCurrency(o.total)})</span>
                    </div>
                  ) : (
                    <span className="font-black text-green-400 font-mono text-sm block">{formatCurrency(o.total)}</span>
                  )}
                  <span className="text-[9px] text-gray-500 font-mono block">{formatDate(o.createdAt)}</span>
                </div>
              </div>

              {/* Items Summary & Game ID */}
              <div className="p-2 rounded-xl bg-[#0e1117] border border-gray-800/80 text-[11px] space-y-1">
                <div className="flex items-start gap-1.5 text-gray-300">
                  <ShoppingBag className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />
                  <span className="line-clamp-1 font-medium">
                    {o.items.map((it: any) => `${it.productName} (x${it.quantity})`).join(", ")}
                  </span>
                </div>

                {o.gameUsername && (
                  <div className="flex items-center gap-1.5 text-cyan-300 font-mono text-[10px]">
                    <Gamepad2 className="w-3 h-3 text-cyan-400 shrink-0" />
                    <span className="truncate">{o.gameUsername}</span>
                    {o.decryptedPassword && <span className="text-purple-300 text-[9px]">[كلمة السر متوفرة]</span>}
                  </div>
                )}
              </div>

              {/* Quick Action Button */}
              <div className="flex items-center gap-1.5 pt-0.5">
                <button
                  onClick={() => openOrderDetails(o)}
                  className="flex-1 py-1.5 px-3 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 border border-orange-500/30 text-xs font-bold transition text-center"
                >
                  معاينة وتحديث الحالة ⚙️
                </button>
                {o.status !== "REFUNDED" && o.status !== "PENDING_PAYMENT" && (
                  <button
                    onClick={() => {
                      setRefundModalOrder(o);
                      setRefundReason("");
                    }}
                    className="p-1.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold transition"
                    title="استرجاع مالي"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleDeleteOrder(o.id, o.orderNumber)}
                  className="p-1.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/30 transition"
                  title="حذف الطلب"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ─── Desktop Orders Table (md+) ─── */}
      <div className="hidden md:block rounded-2xl bg-[#12161f] border border-gray-800 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-500 text-xs">
            لا توجد طلبات مطابقة للبحث أو الفلتر.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-gray-800 bg-[#0c1017] text-gray-400 font-bold text-[11px]">
                  <th className="px-3 py-3 whitespace-nowrap">رقم الطلب</th>
                  <th className="px-3 py-3">العميل</th>
                  <th className="px-3 py-3 whitespace-nowrap">الدفع / الإجمالي</th>
                  <th className="px-3 py-3">المنتجات</th>
                  <th className="px-3 py-3 whitespace-nowrap">حساب اللعبة</th>
                  <th className="px-3 py-3 whitespace-nowrap">الحالة</th>
                  <th className="px-3 py-3 whitespace-nowrap">التاريخ</th>
                  <th className="px-3 py-3 text-center whitespace-nowrap">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {filtered.map((o) => (
                  <tr
                    key={o.id}
                    className={`hover:bg-white/[0.02] transition ${
                      o.status === "PENDING_PAYMENT" ? "bg-amber-950/10 border-r-2 border-r-amber-500/50" : ""
                    }`}
                  >
                    {/* Order Number */}
                    <td className="px-3 py-3 font-mono font-black text-orange-500 whitespace-nowrap text-[11px]">
                      #{o.orderNumber}
                    </td>

                    {/* Customer */}
                    <td className="px-3 py-3" style={{ maxWidth: "140px" }}>
                      <div>
                        <span className="font-bold text-white block truncate text-[11px]">{o.user?.name || "عميل"}</span>
                        <span className="text-[9px] text-gray-400 font-mono block truncate">{o.user?.email}</span>
                        {(o.user as any)?.telegramUsername && (
                          <span className="text-[9px] text-blue-400 block">@{(o.user as any).telegramUsername}</span>
                        )}
                      </div>
                    </td>

                    {/* Payment + Total (merged column) */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="space-y-1">
                        {getPaymentMethodBadge(o)}
                        {o.paymentMethod === "TELEGRAM_STARS" ? (
                          <div>
                            <span className="font-black text-amber-400 font-mono block text-[11px]">
                              {o.starsTotal ? `${o.starsTotal} ⭐` : formatCurrency(o.total)}
                            </span>
                            <span className="text-[9px] text-gray-500 font-mono">({formatCurrency(o.total)})</span>
                          </div>
                        ) : (
                          <span className="font-black text-green-400 font-mono text-[11px]">{formatCurrency(o.total)}</span>
                        )}
                      </div>
                    </td>

                    {/* Products */}
                    <td className="px-3 py-3" style={{ maxWidth: "200px" }}>
                      <span
                        className="text-gray-200 block truncate text-[11px] cursor-help"
                        title={o.items.map((it: any) => `${it.productName} (x${it.quantity})`).join(", ")}
                      >
                        {o.items.map((it: any) => `${it.productName} (x${it.quantity})`).join(", ")}
                      </span>
                    </td>

                    {/* Game Account */}
                    <td className="px-3 py-3" style={{ maxWidth: "120px" }}>
                      {o.gameUsername ? (
                        <div className="font-mono text-[10px]">
                          <span className="text-cyan-300 block truncate" title={o.gameUsername}>{o.gameUsername}</span>
                          {o.decryptedPassword && (
                            <span className="text-purple-300 text-[9px]">🔑 متوفرة</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-600">—</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      {getOrderStatusBadge(o.status)}
                    </td>

                    {/* Date */}
                    <td className="px-3 py-3 text-[10px] text-gray-500 font-mono whitespace-nowrap">
                      {formatDate(o.createdAt)}
                    </td>

                    {/* ─── Actions ─── icon-only, always visible, fixed width */}
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-center gap-1.5 flex-nowrap">
                        {/* 1. Preview / Update */}
                        <button
                          onClick={() => openOrderDetails(o)}
                          title="معاينة وتحديث الحالة"
                          className="flex-shrink-0 p-2 rounded-lg bg-orange-500/10 text-orange-400 hover:bg-orange-500/25 border border-orange-500/30 transition active:scale-95"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* 2. Confirm Stars (for PENDING_PAYMENT) OR Refund (for regular orders) */}
                        {o.status === "PENDING_PAYMENT" && (o.paymentMethod === "TELEGRAM_STARS" || (o.starsTotal && o.starsTotal > 0)) ? (
                          <button
                            onClick={() => handleConfirmStarsPayment(o.id, o.orderNumber, o.starsTotal || 0)}
                            disabled={isConfirmingStars}
                            title={`تأكيد استلام (${o.starsTotal || 0} ⭐) وتفعيل الطلب`}
                            className="flex-shrink-0 p-2 rounded-lg bg-amber-500 text-black hover:bg-amber-400 border border-amber-400 transition active:scale-95 shadow-md shadow-amber-500/20 animate-pulse"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                          </button>
                        ) : o.status !== "REFUNDED" && o.status !== "PENDING_PAYMENT" ? (
                          <button
                            onClick={() => { setRefundModalOrder(o); setRefundReason(""); }}
                            title="استرجاع مالي للمحفظة"
                            className="flex-shrink-0 p-2 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/25 border border-amber-500/30 transition active:scale-95"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span className="flex-shrink-0 w-[30px]" />
                        )}

                        {/* 3. Delete — always visible */}
                        <button
                          onClick={() => handleDeleteOrder(o.id, o.orderNumber)}
                          title="حذف الطلب نهائياً"
                          className="flex-shrink-0 p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/25 border border-red-500/30 transition active:scale-95"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Details & Status Update Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative max-w-xl w-full bg-[#0c1017] border border-orange-500/30 rounded-2xl p-6 text-right space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] text-gray-400">تفاصيل الطلب الكاملة:</span>
                  {getFulfillmentBadge(selectedOrder.fulfillmentType)}
                </div>
                <h3 className="text-base font-black text-orange-500">#{selectedOrder.orderNumber}</h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Pending Payment Warning Banner & Quick Confirm */}
            {selectedOrder.status === "PENDING_PAYMENT" && (
              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/20 via-[#1a140b] to-[#0f1218] border border-amber-500/40 text-amber-300 space-y-3">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <div className="font-black text-amber-200 text-sm">⚠️ تنبيه للإدارة: بانتظار التحقق من استلام النجوم كـ هدية (Gift)</div>
                    <p className="text-amber-300/90 leading-relaxed text-[11px]">
                      هذا الطلب تم إنشاؤه عبر نجوم تيليجرام (بمبلغ <strong>{selectedOrder.starsTotal || 0} ⭐</strong>). 
                      يرجى فتح حسابك الشخصي في تيليجرام والتأكد من وصول الهدية من العميل قبل الضغط على زر التأكيد أدناه.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleConfirmStarsPayment(selectedOrder.id, selectedOrder.orderNumber, selectedOrder.starsTotal || 0)}
                  disabled={isConfirmingStars}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-xs transition flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 active:scale-95 disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>تأكيد استلام ({selectedOrder.starsTotal || 0} ⭐) وبدء تجهيز الطلب الآن ✅</span>
                </button>
              </div>
            )}

            {/* Customer & Order Items Info */}
            <div className="p-4 rounded-xl bg-[#12161f] border border-gray-800 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-gray-800/80 pb-2.5">
                <div>
                  <span className="text-[10px] text-gray-400 block">العميل صاحب الطلب:</span>
                  <span className="font-bold text-white">{selectedOrder.user?.name || "عميل بدون اسم"}</span>
                  <span className="text-[10px] text-gray-400 font-mono block">{selectedOrder.user?.email}</span>
                  {selectedOrder.user?.telegramUsername && (
                    <span className="text-[10px] text-sky-400 font-mono block mt-0.5">
                      تيليجرام: @{selectedOrder.user.telegramUsername}
                    </span>
                  )}
                </div>
                <div className="text-left space-y-1">
                  <span className="text-[10px] text-gray-400 block">طريقة وإجمالي الدفع:</span>
                  {selectedOrder.paymentMethod === "TELEGRAM_STARS" || (selectedOrder.starsTotal && selectedOrder.starsTotal > 0) ? (
                    <div>
                      <div className="flex items-center justify-end gap-1 text-amber-400 font-black text-sm">
                        <span>{selectedOrder.starsTotal}</span>
                        <span>⭐</span>
                      </div>
                      <span className="text-[10px] text-gray-400 block">
                        (يعادل {formatCurrency(selectedOrder.total)})
                      </span>
                    </div>
                  ) : (
                    <span className="font-black text-green-400 font-mono text-sm">{formatCurrency(selectedOrder.total)}</span>
                  )}
                  <div className="pt-1 flex justify-end">
                    {getPaymentMethodBadge(selectedOrder.paymentMethod, selectedOrder.starsTotal)}
                  </div>
                </div>
              </div>

              {selectedOrder.telegramPaymentChargeId && (
                <div className="p-2 rounded bg-sky-950/40 border border-sky-800/50 text-[11px] font-mono text-sky-300">
                  <span className="text-[10px] text-gray-400 block">معرف عملية دفع تيليجرام (Telegram Charge ID):</span>
                  <span className="font-bold select-all break-all">{selectedOrder.telegramPaymentChargeId}</span>
                </div>
              )}

              <div>
                <span className="text-[10px] text-gray-400 block mb-1.5 font-bold">المنتجات المشتراة:</span>
                <div className="space-y-1 font-mono text-[11px]">
                  {(selectedOrder.items || []).map((it: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-1.5 rounded bg-[#0b0e14] border border-gray-800/60">
                      <span className="text-gray-200">{it.productName || it.name || "منتج"} <strong className="text-orange-400">x{it.quantity}</strong></span>
                      <span className="text-green-400 font-bold">{formatCurrency(it.total || it.price || 0)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedOrder.customerNotes && (
                <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px]">
                  <strong className="block font-bold">ملاحظات العميل:</strong>
                  <span>{selectedOrder.customerNotes}</span>
                </div>
              )}
            </div>

            {/* Game Account Credentials Box */}
            {selectedOrder.gameUsername && (
              <div className="p-4 rounded-2xl bg-[#1a202c] border border-orange-500/30 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-orange-500 font-bold">
                  <Gamepad2 className="w-4 h-4" />
                  <span>بيانات حساب اللعبة المطلوب التنفيذ عليه:</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 font-mono">
                  <div className="p-2 rounded bg-[#12161f] border border-gray-800">
                    <span className="text-[10px] text-gray-400 block">إيميل اللعبة:</span>
                    <span className="text-white font-bold">{selectedOrder.gameUsername}</span>
                  </div>
                  <div className="p-2 rounded bg-[#12161f] border border-gray-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-gray-400 block">كلمة السر (AES Decrypted):</span>
                      <span className="text-green-400 font-bold">
                        {showPassword
                          ? selectedOrder.decryptedPassword || "غير متوفرة"
                          : "••••••••••"}
                      </span>
                    </div>
                    {selectedOrder.decryptedPassword && (
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-gray-400 hover:text-white p-1"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Already Delivered Credentials (if any) */}
            {selectedOrder.deliveredAccountEmail && (
              <div className="p-4 rounded-2xl bg-[#131b26] border border-purple-500/40 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-purple-400 font-bold">
                  <Key className="w-4 h-4" />
                  <span>بيانات الحساب الجديد المسلّمة للعميل:</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 font-mono">
                  <div className="p-2 rounded bg-[#0b0e14] border border-gray-800">
                    <span className="text-[10px] text-gray-400 block">الإيميل المسلّم:</span>
                    <span className="text-white font-bold">{selectedOrder.deliveredAccountEmail}</span>
                  </div>
                  <div className="p-2 rounded bg-[#0b0e14] border border-gray-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-gray-400 block">كلمة السر المسلّمة:</span>
                      <span className="text-emerald-400 font-bold">
                        {showDeliveredPassword
                          ? selectedOrder.decryptedDeliveredPassword || "••••••"
                          : "••••••••••"}
                      </span>
                    </div>
                    {selectedOrder.decryptedDeliveredPassword && (
                      <button
                        type="button"
                        onClick={() => setShowDeliveredPassword(!showDeliveredPassword)}
                        className="text-gray-400 hover:text-white p-1"
                      >
                        {showDeliveredPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Deliver / Update Account Credentials Form */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#121622] to-[#0c1017] border border-purple-500/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-purple-400 font-bold text-xs">
                  <Key className="w-4 h-4 text-purple-400" />
                  <span>بيانات حساب اللعبة المسلّمة للعميل (تسليم مشفر):</span>
                </div>
                <span className="text-[10px] text-gray-400 font-mono">
                  {selectedOrder.deliveredAccountEmail ? "تم التسليم مسبقاً (يمكن التعديل)" : "بانتظار التسليم"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-gray-300 mb-1">
                    إيميل الحساب المسلّم للعميل
                  </label>
                  <input
                    type="text"
                    placeholder="account@gmail.com"
                    value={deliveredEmail}
                    onChange={(e) => setDeliveredEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0b0e14] border border-gray-700 rounded-xl text-xs text-white dir-ltr font-mono focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-300 mb-1">
                    كلمة مرور الحساب المسلّم
                  </label>
                  <input
                    type="text"
                    placeholder="Password123"
                    value={deliveredPassword}
                    onChange={(e) => setDeliveredPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0b0e14] border border-gray-700 rounded-xl text-xs text-white dir-ltr font-mono focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-300 mb-1">
                  ملاحظات أو تعليمات إضافية لتسليم الحساب للعميل
                </label>
                <input
                  type="text"
                  placeholder="مثال: الحساب يحتوي على 50M + سيارة نيسان GTR 1695HP"
                  value={deliveredNotes}
                  onChange={(e) => setDeliveredNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0b0e14] border border-gray-700 rounded-xl text-xs text-white text-right focus:border-purple-500"
                />
              </div>

              {selectedOrder.status === "PENDING_PAYMENT" ? (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs text-center font-bold flex items-center justify-center gap-1.5">
                  <Lock className="w-4 h-4" />
                  <span>مقفول: يرجى تأكيد استلام النجوم أولاً لتفعيل تسليم بيانات الحساب 🔒</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleDeliverCredentials}
                  disabled={isDelivering || !deliveredEmail.trim() || !deliveredPassword.trim()}
                  className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs transition flex items-center justify-center gap-1.5 shadow-md disabled:opacity-40"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isDelivering ? "جاري تشفير وتسليم البيانات وإشعار العميل..." : "تسليم بيانات الحساب وإكمال الطلب الآن 🔑"}</span>
                </button>
              )}
            </div>

            {/* Standard Status Update Form */}
            <form onSubmit={handleStatusUpdate} className="space-y-4 pt-2 border-t border-gray-800">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">
                  تغيير حالة الطلب في خط الإنتاج:
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#12161f] border border-gray-700 rounded-xl text-xs text-white focus:border-orange-500 text-right"
                >
                  <option value="PROCESSING">جاري التجهيز (Processing)</option>
                  <option value="IN_PROGRESS">قيد التنفيذ والتسليم باللعبة (In Progress)</option>
                  <option value="COMPLETED">تم التسليم بنجاح (Completed) ✅</option>
                  <option value="CANCELLED">إلغاء الطلب (Cancelled)</option>
                  <option value="REJECTED">رفض الطلب (Rejected)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  ملاحظات الإدارة للعميل (ستظهر في صفحة تتبع الطلب):
                </label>
                <textarea
                  rows={3}
                  placeholder="مثال: تم إدخال السيارة لحسابك بنجاح بمحرك 1695HP، شكراً لتعاملك معنا!"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full p-3 bg-[#12161f] border border-gray-700 rounded-xl text-xs text-white focus:border-orange-500 text-right"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 py-3 rounded-xl bg-orange-500 text-black font-extrabold text-xs transition disabled:opacity-50"
                >
                  {isUpdating ? "جاري الحفظ..." : "حفظ وتحديث الحالة وإشعار العميل"}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-3 rounded-xl bg-[#1a202c] text-gray-300 text-xs font-bold"
                >
                  إغلاق
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {refundModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative max-w-md w-full bg-[#0c1017] border border-orange-500/30 rounded-2xl p-6 text-right space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-orange-400" />
              <span>استرجاع مالي للطلب #{refundModalOrder.orderNumber}</span>
            </h3>

            <p className="text-xs text-gray-300 leading-relaxed">
              سيتم رد مبلغ <strong className="text-orange-500 font-bold">{formatCurrency(refundModalOrder.total)}</strong> مباشرة إلى رصيد محفظة العميل وتوثيق العملية في سجل الحسابات.
            </p>

            <form onSubmit={handleRefundSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  سبب الاسترجاع (Refund Reason):
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="مثال: تم إلغاء الطلب بناء على طلب العميل أو تعذر التسليم..."
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full p-3 bg-[#12161f] border border-gray-700 rounded-xl text-xs text-white focus:border-neon-purple text-right"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isRefunding}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-black font-black text-xs transition disabled:opacity-50"
                >
                  {isRefunding ? "جاري تنفيذ الاسترجاع..." : "تأكيد الاسترجاع للمحفظة 💰"}
                </button>
                <button
                  type="button"
                  onClick={() => setRefundModalOrder(null)}
                  className="px-4 py-2.5 rounded-xl bg-[#1a202c] text-gray-300 text-xs font-bold"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Mobile Actions Bottom Sheet ─── */}
      {bottomSheetOrder && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4">
          <div
            className="fixed inset-0"
            onClick={() => setBottomSheetOrder(null)}
          />
          <div className="relative w-full max-w-lg bg-[#0e1219] border-t sm:border border-gray-800 rounded-t-3xl sm:rounded-2xl p-5 text-right space-y-4 z-10 animate-in slide-in-from-bottom duration-200">
            {/* Sheet Handle */}
            <div className="w-12 h-1.5 bg-gray-700 rounded-full mx-auto -mt-1 mb-2 sm:hidden" />

            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div>
                <span className="text-[10px] text-gray-400 block font-mono">خيارات وإجراءات الطلب</span>
                <h3 className="text-base font-black text-orange-500">#{bottomSheetOrder.orderNumber}</h3>
              </div>
              <button
                onClick={() => setBottomSheetOrder(null)}
                className="p-1.5 rounded-full bg-gray-800/60 text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Order Info */}
            <div className="p-3 rounded-xl bg-[#141923] border border-gray-800 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-400">العميل:</span>
                <span className="font-bold text-white">{bottomSheetOrder.user?.name || "عميل"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">الإجمالي:</span>
                <span className="font-black text-green-400 font-mono">{formatCurrency(bottomSheetOrder.total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">الحالة:</span>
                <span className="font-bold text-orange-400">{bottomSheetOrder.status}</span>
              </div>
            </div>

            {/* Action Items List */}
            <div className="space-y-2 pt-1">
              {bottomSheetOrder.status === "PENDING_PAYMENT" && (bottomSheetOrder.paymentMethod === "TELEGRAM_STARS" || (bottomSheetOrder.starsTotal && bottomSheetOrder.starsTotal > 0)) && (
                <button
                  onClick={() => {
                    const target = bottomSheetOrder;
                    setBottomSheetOrder(null);
                    handleConfirmStarsPayment(target.id, target.orderNumber, target.starsTotal || 0);
                  }}
                  disabled={isConfirmingStars}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black text-xs transition flex items-center justify-between shadow-md active:scale-95"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-black" />
                    <span>تأكيد استلام ({bottomSheetOrder.starsTotal || 0} ⭐) وتفعيل الطلب</span>
                  </div>
                  <span className="text-[10px] bg-black/20 px-2 py-0.5 rounded font-bold">فوري ⚡</span>
                </button>
              )}

              <button
                onClick={() => {
                  const target = bottomSheetOrder;
                  setBottomSheetOrder(null);
                  openOrderDetails(target);
                }}
                className="w-full py-3 px-4 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-bold transition flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-orange-500" />
                  <span>معاينة التفاصيل الكاملة وتحديث الحالة</span>
                </div>
                <span className="text-[10px] opacity-70">⚙️</span>
              </button>

              {bottomSheetOrder.status !== "REFUNDED" && (
                <button
                  onClick={() => {
                    const target = bottomSheetOrder;
                    setBottomSheetOrder(null);
                    setRefundModalOrder(target);
                    setRefundReason("");
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold transition flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 text-amber-500" />
                    <span>استرجاع المبلغ للمحفظة</span>
                  </div>
                  <span className="text-[10px] opacity-70">💰</span>
                </button>
              )}

              <button
                onClick={() => {
                  const target = bottomSheetOrder;
                  setBottomSheetOrder(null);
                  handleDeleteOrder(target.id, target.orderNumber);
                }}
                className="w-full py-3 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold transition flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-red-500" />
                  <span>حذف الطلب نهائياً</span>
                </div>
                <span className="text-[10px] opacity-70">⚠️</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
