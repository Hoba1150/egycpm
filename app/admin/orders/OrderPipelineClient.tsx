"use client";

import React, { useState, useEffect } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { updateOrderStatus, refundOrder, deleteOrder, deliverOrderCredentials } from "@/lib/actions/order";
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

  return (
    <div className="space-y-4">
      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-gray-800 pb-4">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
          {[
            { key: "ALL", label: "الكل" },
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

      {/* Orders Table */}
      <div className="rounded-2xl bg-[#12161f] border border-gray-800 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-500 text-xs">
            لا توجد طلبات مطابقة للبحث أو الفلتر.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-gray-800 bg-garage-950/60 text-gray-400 font-bold">
                  <th className="p-4">رقم الطلب</th>
                  <th className="p-4">العميل</th>
                  <th className="p-4">المنتجات المطلوبة</th>
                  <th className="p-4">الإجمالي</th>
                  <th className="p-4">حساب اللعبة</th>
                  <th className="p-4">الحالة</th>
                  <th className="p-4">التاريخ</th>
                  <th className="p-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {filtered.map((o) => (
                  <tr key={o.id} className="hover:bg-[#1a202c]/50 transition">
                    <td className="p-4 font-mono font-black text-orange-500">#{o.orderNumber}</td>
                    <td className="p-4">
                      <div className="space-y-0.5">
                        <span className="font-bold text-white block">{o.user?.name || "عميل"}</span>
                        <span className="text-[10px] text-gray-400 font-mono">{o.user?.email}</span>
                      </div>
                    </td>
                    <td className="p-4 max-w-xs">
                      <span className="text-gray-200 block truncate">
                        {o.items.map((it: any) => `${it.productName} (x${it.quantity})`).join(", ")}
                      </span>
                    </td>
                    <td className="p-4 font-black text-sm text-green-400 font-mono">
                      {formatCurrency(o.total)}
                    </td>
                    <td className="p-4">
                      {o.gameUsername ? (
                        <div className="space-y-0.5 font-mono text-[11px]">
                          <span className="text-cyan-300 block">{o.gameUsername}</span>
                          {o.decryptedPassword && (
                            <span className="text-purple-300 text-[10px]">
                              [كلمة السر متوفرة]
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-500 text-[10px]">-</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                          o.status === "COMPLETED"
                            ? "bg-green-500/20 text-green-400"
                            : o.status === "REFUNDED"
                            ? "bg-orange-500/10 text-orange-400"
                            : "bg-orange-500/10 text-orange-500 animate-pulse"
                        }`}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td className="p-4 text-[10px] text-gray-500 font-mono">{formatDate(o.createdAt)}</td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedOrder(o);
                            setNewStatus(o.status || "COMPLETED");
                            setAdminNotes(o.adminNotes || "");
                            setDeliveredEmail(o.deliveredAccountEmail || "");
                            setDeliveredPassword(o.decryptedDeliveredPassword || "");
                            setDeliveredNotes(o.deliveredAccountNotes || "");
                            setShowPassword(false);
                            setShowDeliveredPassword(false);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 border border-orange-500/30 text-xs font-bold transition"
                        >
                          معاينة وتحديث
                        </button>

                        {o.status !== "REFUNDED" && (
                          <button
                            onClick={() => {
                              setRefundModalOrder(o);
                              setRefundReason("");
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 text-xs font-bold transition"
                            title="استرجاع مالي للمحفظة"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteOrder(o.id, o.orderNumber)}
                          className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition"
                          title="حذف الطلب نهائياً"
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

            {/* Customer & Order Items Info */}
            <div className="p-4 rounded-xl bg-[#12161f] border border-gray-800 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-gray-800/80 pb-2.5">
                <div>
                  <span className="text-[10px] text-gray-400 block">العميل صاحب الطلب:</span>
                  <span className="font-bold text-white">{selectedOrder.user?.name || "عميل بدون اسم"}</span>
                  <span className="text-[10px] text-gray-400 font-mono block">{selectedOrder.user?.email}</span>
                </div>
                <div className="text-left">
                  <span className="text-[10px] text-gray-400 block">إجمالي المبلغ:</span>
                  <span className="font-black text-green-400 font-mono text-sm">{formatCurrency(selectedOrder.total)}</span>
                </div>
              </div>

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

              <button
                type="button"
                onClick={handleDeliverCredentials}
                disabled={isDelivering || !deliveredEmail.trim() || !deliveredPassword.trim()}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs transition flex items-center justify-center gap-1.5 shadow-md disabled:opacity-40"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isDelivering ? "جاري تشفير وتسليم البيانات وإشعار العميل..." : "تسليم بيانات الحساب وإكمال الطلب الآن 🔑"}</span>
              </button>
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
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-neon-purple to-neon-pink text-white font-bold text-xs transition disabled:opacity-50"
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
    </div>
  );
}
