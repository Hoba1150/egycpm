import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { getMyOrders } from "@/lib/actions/order";
import { redirect } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import { ShoppingBag, CheckCircle2, XCircle, RefreshCw, Car, ChevronLeft, Sparkles, Wallet } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/");
  }

  const orders = await getMyOrders();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING_PAYMENT":
        return (
          <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/40 text-xs font-bold inline-flex items-center gap-1 animate-pulse">
            <span>⏳</span>
            <span>بانتظار دفع النجوم</span>
          </span>
        );
      case "COMPLETED":
        return (
          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 text-xs font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>مكتمل ومسلّم ✅</span>
          </span>
        );
      case "PROCESSING":
      case "IN_PROGRESS":
        return (
          <span className="px-2.5 py-1 rounded-lg bg-orange-500/10 text-orange-500 border border-orange-500/30 text-xs font-bold flex items-center gap-1">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>جاري التنفيذ والتسليم ⏳</span>
          </span>
        );
      case "REFUNDED":
        return (
          <span className="px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/30 text-xs font-bold">
            مسترجع 💰
          </span>
        );
      case "CANCELLED":
      case "REJECTED":
        return (
          <span className="px-2.5 py-1 rounded-lg bg-red-500/10 text-red-500 border border-red-500/30 text-xs font-bold flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" />
            <span>ملغي / مرفوض</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/30 text-xs font-bold">
            مدفوع ومؤكد ✅
          </span>
        );
    }
  };

  const getPaymentMethodBadge = (order: any) => {
    const isStars = order.paymentMethod === "TELEGRAM_STARS" || (order.starsTotal && order.starsTotal > 0);
    if (isStars) {
      return (
        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-bold inline-flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>Telegram Stars</span>
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold inline-flex items-center gap-1">
        <Wallet className="w-3 h-3 text-emerald-400" />
        <span>المحفظة</span>
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-8 text-right space-y-6">
      {/* Header */}
      <div className="space-y-1 border-b border-gray-800 pb-4">
        <span className="text-xs font-mono font-bold text-orange-500 uppercase">
          Order Tracking
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
          طلباتي وتتبع الخدمات
        </h1>
        <p className="text-xs sm:text-sm text-gray-400">
          تتبع حالة طلباتك لحظة بلحظة واستلم سياراتك وخدماتك بكل أمان.
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-[#0f1218] border border-gray-800 space-y-3 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-[#161b24] mx-auto flex items-center justify-center text-gray-500">
            <ShoppingBag className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-extrabold text-white">لم تقم بإجراء أي طلبات حتى الآن</h3>
            <p className="text-xs text-gray-400">
              تصفح سيارات الدريفت المعدلة وخدمات الشحن واطلب الآن!
            </p>
          </div>
          <Link
            href="/shop"
            className="inline-block px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-black font-extrabold text-xs shadow-sm transition"
          >
            تصفح المتجر
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const isStars = order.paymentMethod === "TELEGRAM_STARS" || (order.starsTotal && order.starsTotal > 0);
            return (
              <div
                key={order.id}
                className="p-4 sm:p-5 rounded-2xl bg-[#0f1218] border border-gray-800 hover:border-orange-500/40 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group shadow-sm"
              >
                {/* Order Info */}
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono text-sm sm:text-base font-black text-orange-500">
                      #{order.orderNumber}
                    </span>
                    {getStatusBadge(order.status)}
                    {getPaymentMethodBadge(order)}
                    <span className="text-[11px] text-gray-400 font-mono font-medium">
                      {formatDate(order.createdAt)}
                    </span>
                  </div>

                  {/* Items preview */}
                  <div className="flex items-center gap-2 text-xs text-gray-300 font-medium">
                    <Car className="w-4 h-4 text-orange-500 shrink-0" />
                    <span>
                      {order.items.map((i) => `${i.productName} (x${i.quantity})`).join(" + ")}
                    </span>
                  </div>
                </div>

                {/* Price & Action */}
                <div className="flex items-center justify-between md:justify-end gap-5 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-gray-800">
                  <div className="text-right md:text-left space-y-0.5">
                    <span className="text-[10px] text-gray-400 block font-medium">
                      {isStars ? "المدفوع بالنجوم:" : "المبلغ المدفوع:"}
                    </span>
                    {isStars && order.starsTotal ? (
                      <div>
                        <span className="text-base font-black text-amber-400 font-mono flex items-center justify-end gap-1">
                          <span>{order.starsTotal}</span>
                          <span>⭐</span>
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono block">
                          ({formatCurrency(order.total)})
                        </span>
                      </div>
                    ) : (
                      <span className="text-base font-black text-white font-mono">
                        {formatCurrency(order.total)}
                      </span>
                    )}
                  </div>

                  <Link
                    href={`/orders/${order.orderNumber}`}
                    className="px-4 py-2 rounded-xl bg-[#161b24] hover:bg-orange-500/10 border border-gray-700 hover:border-orange-500 text-xs font-bold text-white hover:text-orange-500 transition flex items-center gap-1.5"
                  >
                    <span>تتبع الطلب</span>
                    <ChevronLeft className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
