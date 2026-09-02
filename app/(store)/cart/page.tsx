"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useCartStore } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import { ShoppingCart, Trash2, Plus, Minus, ArrowLeft, Tag, Zap, Loader2 } from "lucide-react";
import { validateCouponCode } from "@/lib/actions/coupon";
import { toast } from "sonner";

export default function CartPage() {
  const {
    items,
    removeItem,
    updateQuantity,
    appliedCoupon,
    applyCoupon,
    getSubtotal,
    getDiscount,
    getTotal,
    clearCart,
  } = useCartStore();

  const [couponInput, setCouponInput] = useState("");
  const [isValidating, setIsValidating] = useState(false);

  const subtotal = getSubtotal();
  const discount = getDiscount();
  const total = getTotal();

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;

    setIsValidating(true);
    try {
      const res = await validateCouponCode(couponInput, subtotal);
      if (res.valid) {
        applyCoupon({
          code: res.code!,
          discountType: res.discountType as any,
          discountValue: res.discountValue!,
          discountAmount: res.discountAmount!,
        });
        toast.success(res.message);
        setCouponInput("");
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("فشل التحقق من الكوبون.");
    } finally {
      setIsValidating(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-20 h-20 rounded-2xl bg-[#0f1218] border border-gray-800 mx-auto flex items-center justify-center text-gray-500">
          <ShoppingCart className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            سلة التسوق فارغة
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 max-w-md mx-auto">
            لم تقم بإضافة أي سيارات أو خدمات حتى الآن. تصفح أقسام المتجر واكتشف أقوى العروض!
          </p>
        </div>
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-black font-black text-xs transition shadow-sm"
        >
          <Zap className="w-4 h-4" />
          <span>تصفح المتجر الآن</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-right space-y-6">
      <div className="flex items-center justify-between border-b border-gray-800 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            عربة التسوق
          </h1>
          <p className="text-xs text-gray-400 font-medium">
            {items.length} منتجات مضافة
          </p>
        </div>
        <button
          onClick={clearCart}
          className="text-xs text-red-500 hover:text-red-400 font-bold flex items-center gap-1.5 p-2 rounded-xl bg-red-500/10 border border-red-500/20 transition"
        >
          <Trash2 className="w-4 h-4" />
          <span>إفراغ السلة</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Items List */}
        <div className="lg:col-span-8 space-y-3">
          {items.map((item) => (
            <div
              key={item.productId}
              className="p-4 rounded-2xl bg-[#0f1218] border border-gray-800 hover:border-orange-500/50 transition flex flex-col sm:flex-row items-center gap-4 group shadow-sm relative overflow-hidden card-drift-accent"
            >
              <img
                src={item.image}
                alt={item.name}
                className="w-20 h-20 rounded-xl object-cover border border-gray-800 shrink-0 bg-black/20"
              />

              <div className="flex-1 min-w-0 text-center sm:text-right space-y-1">
                <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-orange-500 transition">
                  {item.name}
                </h3>
                <div className="flex items-center justify-center sm:justify-start gap-2 text-sm font-black text-orange-500 font-mono">
                  <span>{formatCurrency(item.price)}</span>
                  {item.originalPrice && (
                    <span className="text-gray-500 line-through text-xs font-medium">
                      {formatCurrency(item.originalPrice)}
                    </span>
                  )}
                </div>
              </div>

              {/* Quantity & Delete */}
              <div className="flex items-center gap-4">
                {item.productType !== "ACCOUNT" && item.productType !== "UNIQUE_DIGITAL" && (
                  <div className="flex items-center border border-gray-700 rounded-xl bg-[#161b24] overflow-hidden">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 transition"
                      aria-label="تقليل الكمية"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 text-xs font-black text-white font-mono">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 transition"
                      aria-label="زيادة الكمية"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <span className="text-base sm:text-lg font-black text-orange-500 font-mono w-28 text-left">
                  {formatCurrency(item.price * item.quantity)}
                </span>

                <button
                  type="button"
                  onClick={() => removeItem(item.productId)}
                  className="p-2 text-gray-500 hover:text-red-500 transition"
                  title="حذف"
                  aria-label="حذف العنصر"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-4 p-5 sm:p-6 rounded-2xl bg-[#0f1218] border border-gray-800 shadow-sm space-y-5 relative overflow-hidden card-drift-accent">
          <h3 className="text-base font-black text-white">
            ملخص الحساب
          </h3>

          {/* Pricing breakdown */}
          <div className="space-y-2 pt-2 border-t border-gray-800 text-xs text-gray-300">
            <div className="flex justify-between">
              <span>المجموع الفرعي:</span>
              <span className="font-bold text-white font-mono text-sm">
                {formatCurrency(subtotal)}
              </span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-emerald-500 font-bold">
                <span>خصم الكوبون:</span>
                <span className="font-mono text-sm">-{formatCurrency(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-black text-white pt-3 border-t border-gray-800">
              <span>الإجمالي النهائي:</span>
              <span className="text-orange-500 text-2xl font-mono font-black tracking-tight">
                {formatCurrency(total)}
              </span>
            </div>
          </div>

          <Link
            href="/checkout"
            className="w-full py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-black font-black text-center flex items-center justify-center gap-2 shadow-sm transition text-xs sm:text-sm"
          >
            <span>متابعة إتمام الطلب (Checkout)</span>
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

