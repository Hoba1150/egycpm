"use client";

import React, { useState } from "react";
import {
  ShoppingCart,
  Zap,
  ShieldCheck,
  Check,
  Plus,
  Minus,
  Flame,
  Share2,
  ChevronRight,
  ChevronLeft,
  Key,
  Lock,
  AlertCircle,
  Gamepad2,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useCartStore } from "@/lib/store";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ProductDetailsClientProps {
  product: any;
  user?: any;
}

export default function ProductDetailsClient({ product, user }: ProductDetailsClientProps) {
  const router = useRouter();
  const { addItem, setIsOpen } = useCartStore();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  const isSoldOut = Boolean(product.isSoldOut);
  const isGameAccount = Boolean(
    product.isGameAccount ||
    product.productType === "GAME_ACCOUNT" ||
    product.productType === "ACCOUNT"
  );

  const images: string[] =
    product.imagesArray && product.imagesArray.length > 0
      ? product.imagesArray
      : product.images
      ? [product.images]
      : ["https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800"];

  const currentImage = images[activeImageIndex] || images[0];

  const handleAddToCart = () => {
    addItem(
      {
        id: product.id,
        productId: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        originalPrice: product.originalPrice,
        image: currentImage,
        productType: product.productType,
        deliveryTimeMinutes: product.deliveryTimeMinutes,
        serviceRequirements: product.serviceRequirements,
      },
      quantity
    );

    setIsAdded(true);
    toast.success(`تمت إضافة "${product.name}" (${quantity}) إلى السلة!`);
    setTimeout(() => setIsAdded(false), 1500);
  };

  const handleBuyNow = () => {
    addItem(
      {
        id: product.id,
        productId: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        originalPrice: product.originalPrice,
        image: currentImage,
        productType: product.productType,
        deliveryTimeMinutes: product.deliveryTimeMinutes,
        serviceRequirements: product.serviceRequirements,
      },
      quantity
    );

    router.push("/checkout");
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      toast.success("تم نسخ رابط المنتج للمشاركة!");
    }
  };

  const nextImage = () => {
    setActiveImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setActiveImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
      {/* Right Column: Multi-Image Gallery */}
      <div className="lg:col-span-7 space-y-3">
        {/* Main Display Image - Clean Responsive Height on Mobile & Desktop */}
        <div className="relative w-full h-[240px] sm:h-[340px] md:h-[420px] rounded-2xl bg-[#08080b] border border-gray-800 overflow-hidden shadow-2xl group card-drift-accent">
          {/* Subtle ambient backdrop for luxury feel */}
          <img
            src={currentImage}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover blur-xl opacity-25 pointer-events-none"
          />

          {/* Primary crisp image (object-contain ensures never stretched or cropped on mobile) */}
          <img
            src={currentImage}
            alt={product.name}
            className="relative z-10 w-full h-full object-contain p-1.5 sm:p-3 group-hover:scale-102 transition duration-300"
          />

          {/* Badges */}
          <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end z-20">
            {product.discountPercent > 0 && (
              <span className="px-2.5 py-1 rounded-lg bg-red-600 text-white font-black text-xs shadow flex items-center gap-1 font-mono">
                <Flame className="w-3.5 h-3.5" />
                <span>خصم %{product.discountPercent}-</span>
              </span>
            )}
            {product.isFeatured && (
              <span className="px-2.5 py-1 rounded-lg bg-red-600 text-white font-black text-xs shadow">
                مميز ⭐
              </span>
            )}
          </div>

          {/* Share Button */}
          <button
            onClick={handleShare}
            className="absolute top-3 left-3 z-20 p-2 rounded-xl bg-black/70 hover:bg-black/90 text-white border border-gray-700 transition"
            title="مشاركة المنتج"
            aria-label="مشاركة"
          >
            <Share2 className="w-4 h-4" />
          </button>

          {/* Left / Right Nav Arrows if multiple images */}
          {images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/70 hover:bg-black/90 text-white transition border border-gray-700 shadow-md"
                aria-label="الصورة السابقة"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={nextImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/70 hover:bg-black/90 text-white transition border border-gray-700 shadow-md"
                aria-label="الصورة التالية"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* Gallery Thumbnails (Strict sizing so mobile never overflows) */}
        {images.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 scrollbar-thin">
            {images.map((img: string, idx: number) => (
              <button
                key={idx}
                onClick={() => setActiveImageIndex(idx)}
                className={`relative w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 min-w-[56px] min-h-[56px] rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                  activeImageIndex === idx
                    ? "border-red-600 shadow-[0_0_12px_rgba(220,38,38,0.5)] scale-105"
                    : "border-gray-800 opacity-60 hover:opacity-100"
                }`}
              >
                <img src={img} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Left Column: Product Info & Actions */}
      <div className="lg:col-span-5 space-y-5">
        {/* Category & Edition Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-orange-500 uppercase px-3 py-1 rounded-lg bg-orange-500/10 border border-orange-500/30">
            {product.category?.name || "سيارات وتعديلات"}
          </span>

          {product.stockType === "ONE_OF_ONE" ? (
            <span className="text-xs font-black text-black uppercase px-3 py-1 rounded-lg bg-gradient-to-r from-red-500 to-orange-400 border border-amber-300/40 shadow-sm animate-pulse flex items-center gap-1.5">
              <span dir="ltr" className="inline-block font-mono font-black">1 OF 1</span>
              <span>🔥</span>
              <span>نسخة فريدة وحيدة</span>
            </span>
          ) : product.stockType === "LIMITED" || product.isLimited ? (
            <span className="text-xs font-bold text-purple-300 uppercase px-3 py-1 rounded-lg bg-purple-500/20 border border-purple-500/40">
              إصدار محدود 💎 (متبقي {product.stockQuantity} قطع)
            </span>
          ) : product.stockType === "QUANTITY" ? (
            <span className="text-xs font-bold text-blue-300 uppercase px-3 py-1 rounded-lg bg-blue-500/20 border border-blue-500/40">
              متبقي في المخزون: {product.stockQuantity} قطع 📦
            </span>
          ) : null}
        </div>

        {/* Bold Title */}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight">
          {product.name}
        </h1>

        {/* Description */}
        <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
          {product.description}
        </p>

        {/* Game Account Preview Box (Masked Credentials) */}
        {isGameAccount && (
          <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/40 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-300">
              <Gamepad2 className="w-4 h-4 text-purple-400" />
              <span>معاينة حساب اللعبة (تسليم فوري ومباشر 🎮):</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-[#121620] border border-gray-800 flex items-center justify-between">
                <span className="text-gray-400 text-[10px]">البريد / المعرف:</span>
                <span className="text-white font-bold tracking-wide">
                  {product.maskedAccountEmail || "ac••••••@gmail.com"}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#121620] border border-gray-800 flex items-center justify-between">
                <span className="text-gray-400 text-[10px]">كلمة المرور:</span>
                <span className="text-orange-400 font-bold tracking-widest">••••••••</span>
              </div>
            </div>

            <p className="text-[11px] text-gray-300">
              🔒 بعد نجاح الشراء، يتم فك تشفير البيانات كاملة وإرسالها فوراً إلى <strong>مركز الإشعارات</strong> وصفحة متابعة الطلب.
            </p>
          </div>
        )}

        {/* Guarantees & Speed Badges */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-3 rounded-xl bg-[#12161f] border border-gray-800 flex items-center gap-2">
            <Zap className="w-4 h-4 text-orange-500 shrink-0" />
            <span className="text-gray-300">
              تسليم: <strong className="text-white font-bold">مباشر وفوري</strong>
            </span>
          </div>
          <div className="p-3 rounded-xl bg-[#12161f] border border-gray-800 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="text-gray-300">
              حماية: <strong className="text-emerald-400 font-black">ضد الباند 100%</strong>
            </span>
          </div>
        </div>

        {/* Pricing Box with Prominent Prices */}
        <div className="p-5 rounded-2xl bg-[#0f1218] border border-gray-800 shadow-xl space-y-4 relative overflow-hidden card-drift-accent">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-medium">السعر المطلوب:</span>
            <div className="text-left flex items-baseline gap-2">
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-sm sm:text-base text-gray-500 line-through font-mono font-bold">
                  {formatCurrency(product.originalPrice * quantity)}
                </span>
              )}
              <span className="text-3xl sm:text-4xl font-black text-orange-500 font-mono tracking-tight">
                {formatCurrency(product.price * quantity)}
              </span>
            </div>
          </div>

          {/* Sold Out Notice */}
          {isSoldOut ? (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-center space-y-1">
              <div className="flex items-center justify-center gap-2 text-red-400 font-black text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>تم بيع هذا المنتج / غير متوفر حالياً ⛔</span>
              </div>
              <p className="text-[11px] text-gray-400">
                هذا الحساب تم شراؤه مسبقاً وغير متاح للشراء مجدداً.
              </p>
            </div>
          ) : (
            <>
              {/* Quantity Selector (Only for non-account items) */}
              {!isGameAccount && product.productType !== "ACCOUNT" && product.stockType !== "ONE_OF_ONE" && (
                <div className="flex items-center justify-between pt-3 border-t border-gray-800">
                  <span className="text-xs text-gray-300 font-bold">الكمية:</span>
                  <div className="flex items-center border border-gray-700 rounded-xl bg-[#161b24] overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 transition"
                      aria-label="تقليل الكمية"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="px-4 text-sm font-black text-white font-mono">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity(quantity + 1)}
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 transition"
                      aria-label="زيادة الكمية"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className={`py-3.5 px-4 rounded-xl border font-black text-xs sm:text-sm transition flex items-center justify-center gap-2 ${
                    isAdded
                      ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                      : "bg-[#161b24] hover:bg-orange-500/10 border-gray-700 text-white hover:border-orange-500"
                  }`}
                >
                  {isAdded ? <Check className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4 text-orange-500" />}
                  <span>{isAdded ? "تمت الإضافة للسلة" : "إضافة إلى السلة"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleBuyNow}
                  className="py-3.5 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-black font-black text-xs sm:text-sm shadow-md hover:scale-102 active:scale-95 transition flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  <span>شراء الآن (Checkout)</span>
                </button>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}

