"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, Plus, Minus, ShoppingCart, ArrowLeft, Tag, ShieldCheck } from "lucide-react";
import { useCartStore } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { validateCouponCode } from "@/lib/actions/coupon";
import { toast } from "sonner";

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
            className="absolute inset-0 bg-black/75 backdrop-blur-md transition-opacity"
          />

          <div className="fixed inset-y-0 left-0 max-w-full flex pl-0 pr-0">
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 220 }}
              className="w-screen max-w-md bg-[#080a0f]/90 backdrop-blur-2xl border-r border-white/10 shadow-2xl flex flex-col justify-between overflow-hidden text-right"
            >
              {/* Header */}
              <div className="p-4 sm:p-5 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-red-600/10 text-red-500 border border-red-500/20">
                    <ShoppingCart className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-white text-sm">سلة المشتريات</h3>
                    <p className="text-[11px] text-gray-400 font-mono">{items.length} عناصر محددة</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {items.length > 0 && (
                    <button
                      onClick={clearCart}
                      title="إفراغ السلة"
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-white/[0.05] rounded-xl transition text-xs"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 text-gray-400 hover:text-white hover:bg-white/[0.05] rounded-xl transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {items.length === 0 ? (
                  <div className="py-20 text-center space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/10 mx-auto flex items-center justify-center text-gray-500">
                      <ShoppingCart className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-white">السلة فارغة حالياً</p>
                    <p className="text-xs text-gray-400">تصفح المتجر واختر أفضل السيارات والخدمات</p>
                    <Link
                      href="/shop"
                      onClick={() => setIsOpen(false)}
                      className="inline-block px-5 py-2.5 rounded-xl glass-button-primary text-xs font-black"
                    >
                      تصفح المتجر
                    </Link>
                  </div>
                ) : (
                  items.map((item) => (
                    <div
                      key={item.id}
                      className="glass-card rounded-2xl p-3 flex items-center gap-3 relative group"
                    >
                      <img
                        src={item.image || "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=200"}
                        alt={item.name}
                        className="w-16 h-16 rounded-xl object-cover border border-white/10 shrink-0 bg-black/50"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-white truncate">{item.name}</h4>
                        <span className="text-xs font-black text-white font-mono block mt-0.5">
                          {formatCurrency(item.price)}
                        </span>

                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center rounded-lg bg-black/40 border border-white/10 p-0.5">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="p-1 text-gray-400 hover:text-white rounded transition"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-2 text-xs font-mono text-white font-bold">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="p-1 text-gray-400 hover:text-white rounded transition"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-gray-500 hover:text-red-400 text-[10px] transition"
                          >
                            حذف
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer Checkout Summary */}
              {items.length > 0 && (
                <div className="p-4 sm:p-5 border-t border-white/[0.08] bg-white/[0.02] space-y-3">
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>المجموع الفرعي</span>
                    <span className="font-mono text-white font-bold">{formatCurrency(subtotal)}</span>
                  </div>

                  {discount > 0 && (
                    <div className="flex items-center justify-between text-xs text-emerald-400">
                      <span>الخصم المطبق</span>
                      <span className="font-mono">-{formatCurrency(discount)}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm font-black text-white border-t border-white/[0.06] pt-2">
                    <span>الإجمالي النهائي</span>
                    <span className="font-mono text-base text-red-400">{formatCurrency(total)}</span>
                  </div>

                  <Link
                    href="/checkout"
                    onClick={() => setIsOpen(false)}
                    className="w-full py-3.5 rounded-2xl glass-button-primary text-xs font-black flex items-center justify-center gap-2 tracking-wide text-center"
                  >
                    <span>إتمام عملية الشراء</span>
                    <ArrowLeft className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
