import React from "react";
import { getOrderByNumber } from "@/lib/actions/order";
import { notFound } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import {
  Clock,
  ShoppingBag,
  Headphones,
  Key,
  ArrowRight,
} from "lucide-react";
import OrderTrackerClient from "./OrderTrackerClient";

export const dynamic = "force-dynamic";

interface OrderTrackingPageProps {
  params: {
    orderNumber: string;
  };
}

export default async function OrderTrackingPage({ params }: OrderTrackingPageProps) {
  const order = await getOrderByNumber(params.orderNumber);

  if (!order) {
    notFound();
  }

  let timelineArray: any[] = [];
  try {
    timelineArray = JSON.parse(order.timeline || "[]");
  } catch {
    timelineArray = [];
  }

  const isCompleted = order.status === "COMPLETED";

  // Check if any digital account secret was delivered
  const deliveredAccounts = order.items
    .filter((i) => i.deliveredDataEncrypted)
    .map((i) => ({
      name: i.productName,
      data: i.deliveredDataEncrypted,
    }));

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-8 text-right space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-orange-500 mb-1">
            <Link href="/orders" className="hover:underline flex items-center gap-1">
              <span>طلباتي</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <span>/</span>
            <span>تتبع الطلب</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2">
            <span>طلب رقم:</span>
            <span className="font-mono text-orange-500 font-bold">{order.orderNumber}</span>
          </h1>
        </div>

        <Link
          href={`/support?relatedId=${order.orderNumber}`}
          className="px-4 py-2 rounded-xl bg-[#161b24] border border-gray-700 text-xs font-bold text-gray-300 hover:text-orange-500 transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Headphones className="w-4 h-4" />
          <span>مساعدة بخصوص هذا الطلب</span>
        </Link>
      </div>

      {/* Live Timeline */}
      <div className="p-5 sm:p-7 rounded-2xl bg-[#0f1218] border border-gray-800 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-500" />
            <span>مراحل وتتبع تنفيذ الطلب</span>
          </h3>
          <span className="text-xs text-gray-400 font-mono">
            {formatDate(order.createdAt)}
          </span>
        </div>

        {/* Timeline Steps */}
        <div className="relative border-r-2 border-orange-500/40 mr-4 pr-6 space-y-5 py-2">
          {timelineArray.map((step, idx) => {
            const isLast = idx === timelineArray.length - 1;
            return (
              <div key={idx} className="relative group">
                {/* Step Node Marker */}
                <div
                  className={`absolute -right-[31px] top-0.5 w-4 h-4 rounded-full border-2 border-[#0f1218] border-[#0f1218] ${
                    isLast
                      ? "bg-orange-500"
                      : "bg-emerald-500"
                  }`}
                />

                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h4 className="text-sm font-extrabold text-white">{step.title}</h4>
                    <span className="text-[10px] text-gray-400 font-mono">
                      {formatDate(step.timestamp)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Admin Notes if any */}
        {order.adminNotes && (
          <div className="p-4 rounded-xl bg-[#161b24] border border-orange-500/20 text-xs space-y-1 text-orange-400">
            <span className="font-bold block">ملاحظات الإدارة وفريق التنفيذ:</span>
            <p className="text-gray-300">{order.adminNotes}</p>
          </div>
        )}
      </div>

      {/* Delivered Digital Accounts / New Game Account Credentials */}
      {Boolean(order.deliveredAccountEmail || order.decryptedDeliveredPassword || order.deliveredAccountNotes || (deliveredAccounts.length > 0 && isCompleted)) && (
        <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-[#121622] to-[#0c1017] border-2 border-purple-500/60 shadow-[0_0_25px_rgba(168,85,247,0.15)] space-y-4">
          <div className="flex items-center justify-between border-b border-gray-800 pb-3">
            <div className="flex items-center gap-2 text-purple-400 font-black text-base">
              <Key className="w-5 h-5 text-purple-400 animate-pulse" />
              <span>بيانات حساب اللعبة المسلّمة لك (تسليم مشفر وآمن) 🔑</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs font-bold font-mono">
              جاهز للاستخدام ✅
            </span>
          </div>

          <p className="text-xs text-gray-300">
            تم تجهيز وتسليم بيانات حسابك، يرجى نسخ البيانات وتغيير كلمة السر فوراً بعد تسجيل الدخول لضمان أمان حسابك:
          </p>

          {(order.deliveredAccountEmail || order.decryptedDeliveredPassword || order.deliveredAccountNotes) && (
            <div className="p-4 rounded-xl bg-[#0b0e14] border border-purple-500/40 space-y-3">
              {order.deliveredAccountEmail && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-800/80 pb-3">
                  <div>
                    <span className="text-[11px] text-gray-400 block mb-0.5">البريد الإلكتروني لحساب اللعبة (Email):</span>
                    <span className="font-mono text-sm sm:text-base font-bold text-white tracking-wider">
                      {order.deliveredAccountEmail}
                    </span>
                  </div>
                  <OrderTrackerClient copyText={order.deliveredAccountEmail} />
                </div>
              )}

              {order.decryptedDeliveredPassword && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-800/80 pb-3">
                  <div>
                    <span className="text-[11px] text-gray-400 block mb-0.5">كلمة المرور (Game Password):</span>
                    <span className="font-mono text-sm sm:text-base font-black text-emerald-400 tracking-wider">
                      {order.decryptedDeliveredPassword}
                    </span>
                  </div>
                  <OrderTrackerClient copyText={order.decryptedDeliveredPassword} />
                </div>
              )}

              {order.deliveredAccountNotes && (
                <div className="pt-1 text-xs text-purple-300">
                  <span className="font-bold block text-gray-400 mb-0.5">ملاحظات وتعليمات الاستلام:</span>
                  <p className="leading-relaxed whitespace-pre-line text-gray-200">{order.deliveredAccountNotes}</p>
                </div>
              )}
            </div>
          )}

          {deliveredAccounts.length > 0 && isCompleted && (
            <div className="space-y-3 pt-2">
              {deliveredAccounts.map((acc, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl bg-[#0b0e14] border border-purple-500/30 flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <span className="text-[11px] text-gray-400 block">{acc.name}</span>
                    <span className="font-mono text-sm font-bold text-emerald-500 tracking-wider">
                      {acc.data}
                    </span>
                  </div>
                  <OrderTrackerClient copyText={acc.data || ""} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Customer's Requested Game Account Credentials (If entered at checkout) */}
      {Boolean(order.gameUsername || order.decryptedGamePassword) && (
        <div className="p-5 sm:p-6 rounded-2xl bg-[#0f1218] border border-gray-800 shadow-sm space-y-3">
          <h4 className="text-sm font-bold text-gray-300 flex items-center gap-2">
            <span>بيانات حساب اللعبة المدخلة عند الطلب:</span>
          </h4>
          <div className="p-3.5 rounded-xl bg-[#161b24] border border-gray-800/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
            {order.gameUsername && (
              <div>
                <span className="text-[10px] text-gray-400 block">الإيميل المسجل:</span>
                <span className="text-white font-bold">{order.gameUsername}</span>
              </div>
            )}
            {order.decryptedGamePassword && (
              <div>
                <span className="text-[10px] text-gray-400 block">كلمة السر المدخلة:</span>
                <span className="text-emerald-400 font-bold">{order.decryptedGamePassword}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Order Details & Summary */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#0f1218] border border-gray-800 shadow-sm space-y-4">
        <h3 className="text-base font-extrabold text-white border-b border-gray-800 pb-3 flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-orange-500" />
          <span>تفاصيل المنتجات المشتراة</span>
        </h3>

        <div className="divide-y divide-gray-800">
          {order.items.map((item) => (
            <div key={item.id} className="py-3 flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <span className="font-extrabold text-white">{item.productName}</span>
                <span className="block text-[11px] text-gray-400">الكمية: {item.quantity}</span>
              </div>
              <span className="font-black text-sm text-emerald-500 font-mono">
                {formatCurrency(item.total)}
              </span>
            </div>
          ))}
        </div>

        {/* Pricing Summary */}
        <div className="pt-3 border-t border-gray-800 space-y-2 text-xs text-gray-300">
          <div className="flex justify-between items-center">
            <span>المجموع الفرعي:</span>
            <span className="font-bold text-white font-mono text-sm">{formatCurrency(order.subtotal)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between items-center text-emerald-500 font-bold">
              <span>الخصم المطبق:</span>
              <span className="font-mono text-sm">-{formatCurrency(order.discount)}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-sm font-black text-white pt-3 border-t border-gray-800">
            <span>الإجمالي المدفوع بالمحفظة:</span>
            <span className="text-orange-500 text-xl font-mono font-black tracking-tight">{formatCurrency(order.total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
