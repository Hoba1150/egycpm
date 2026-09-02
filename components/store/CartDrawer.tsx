"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, Plus, Minus, ShoppingCart, ArrowLeft, Tag, ShieldCheck, Loader2 } from "lucide-react";
import { useCartStore } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { validateCouponCode } from "@/lib/actions/coupon";
import { toast } from "sonner";
import Image from "next/image";

export default function CartDrawer() {
  const {
    items,
    isOpen,
    setIsOpen,
    removeItem,
    updateQuantity,
    appliedCoupon,
    getSubtotal,
    getDiscount,
    getTotal,
    clearCart,
  } = useCartStore();

  const subtotal = getSubtotal();
  const discount = getDiscount();
  const total = getTotal();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[70] overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
          />

          <div className="fixed inset-y-0 left-0 max-w-full flex pl-0 pr-0">
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-screen max-w-md bg-[#0f1218] border-r border-gray-800 shadow-2xl flex flex-col justify-between overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-[#121620]">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-500 border border-orange-500/20">
                    <ShoppingCart className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">سلة المشتريات</h3>
                    <p className="text-[11px] text-gray-400">{items.length} منتجات في السلة</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {items.length > 0 && (
                    <button
                      onClick={clearCart}
                      title="إفراغ السلة"
                      className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-[#161b24] rounded-lg transition text-xs"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 text-gray-400 hover:text-white hover:bg-[#161b24] rounded-lg transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5">
                {items.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                    <div className="w-14 h-14 rounded-xl bg-[#161b24] border border-gray-800 flex items-center justify-center text-gray-500">
                      <ShoppingCart className="w-7 h-7" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-base font-bold text-white">سلتك فارغة حالياً</h4>
                      <p className="text-xs text-gray-400 max-w-xs">
                        تصفح المنتجات والسيارات وأضف ما ترغب به إلى سلتك!
                      </p>
                    </div>
                    <Link
                      href="/shop"
                      onClick={() => setIsOpen(false)}
                      className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-black font-extrabold text-xs transition"
                    >
                      تصفح المنتجات الآن
                    </Link>
                  </div>
                ) : (
                  items.map((item) => (
                    <div
                      key={item.productId}
                      className="p-2.5 rounded-xl bg-[#161b24] border border-gray-800 flex gap-2.5 group relative"
                    >
                      {/* Product Thumbnail */}
                      <div className="relative w-16 h-16 rounded-lg bg-[#08090d] overflow-hidden shrink-0 border border-gray-800">
                        <img
                          src={item.image || "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=200"}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-white truncate">
                            {item.name}
                          </h4>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-xs font-bold text-orange-500 font-mono">
                              {formatCurrency(item.price)}
                            </span>
                            {item.originalPrice && item.originalPrice > item.price && (
                              <span className="text-[10px] text-gray-500 line-through font-mono">
                                {formatCurrency(item.originalPrice)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-gray-800/80">
                          {item.productType === "ACCOUNT" || item.productType === "UNIQUE_DIGITAL" ? (
                            <span className="text-[10px] text-gray-400">
                              عنصر رقمي فريد (1 فقط)
                            </span>
                          ) : (
                            <div className="flex items-center border border-gray-700 rounded-md bg-[#0f1218] overflow-hidden">
                              <button
                                onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                className="p-1 text-gray-400 hover:text-white hover:bg-gray-800 transition"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="px-2 text-xs font-bold text-white">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                className="p-1 text-gray-400 hover:text-white hover:bg-gray-800 transition"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          )}

                          <button
                            onClick={() => removeItem(item.productId)}
                            className="text-gray-500 hover:text-red-400 transition p-1"
                            title="حذف من السلة"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Bottom Checkout & Summary */}
              {items.length > 0 && (
                <div className="p-3 sm:p-4 border-t border-gray-800 bg-[#121620] space-y-2.5">

                  {/* Price Breakdown */}
                  <div className="space-y-1 pt-1.5 border-t border-gray-800 text-xs">
                    <div className="flex justify-between text-gray-400">
                      <span>المجموع الفرعي:</span>
                      <span className="font-semibold text-white font-mono">{formatCurrency(subtotal)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-emerald-400">
                        <span>الخصم المطبق:</span>
                        <span className="font-mono">-{formatCurrency(discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-bold text-white pt-1.5 border-t border-gray-800">
                      <span>الإجمالي:</span>
                      <span className="text-orange-500 text-base font-extrabold font-mono">
                        {formatCurrency(total)}
                      </span>
                    </div>
                  </div>

                  {/* Checkout CTA */}
                  <Link
                    href="/checkout"
                    onClick={() => setIsOpen(false)}
                    className="w-full py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-black font-extrabold text-xs text-center flex items-center justify-center gap-1.5 transition"
                  >
                    <span>متابعة إتمام الطلب</span>
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </Link>

                  <div className="flex items-center justify-center gap-1.5 text-[10px] text-gray-400 pt-0.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>دفع آمن وفوري عبر رصيد المحفظة</span>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
