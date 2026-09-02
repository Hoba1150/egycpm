"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ShoppingCart, Zap, Check } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useCartStore } from "@/lib/store";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    description: string;
    price: number;
    originalPrice?: number | null;
    discountPercent?: number | null;
    productType: string;
    stockType: string;
    stockQuantity: number;
    imagesArray?: string[];
    images?: string;
    isFeatured?: boolean;
    isBestSeller?: boolean;
    isLimited?: boolean;
    deliveryTimeMinutes?: number;
    serviceRequirements?: string | null;
    category?: { name: string; slug: string };
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();
  const { addItem } = useCartStore();
  const [isAdded, setIsAdded] = useState(false);

  let images: string[] = [];
  if (product.imagesArray && product.imagesArray.length > 0) {
    images = product.imagesArray;
  } else if (typeof product.images === "string") {
    try {
      images = JSON.parse(product.images);
      if (!Array.isArray(images)) images = [product.images];
    } catch {
      images = [product.images];
    }
  }

  const primaryImage = images[0] || "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800";

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    addItem({
      id: product.id,
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      originalPrice: product.originalPrice,
      image: primaryImage,
      productType: product.productType,
      deliveryTimeMinutes: product.deliveryTimeMinutes,
      serviceRequirements: product.serviceRequirements,
    });

    setIsAdded(true);
    toast.success(`تمت إضافة "${product.name}" إلى السلة`);
    setTimeout(() => setIsAdded(false), 1500);
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    addItem({
      id: product.id,
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      originalPrice: product.originalPrice,
      image: primaryImage,
      productType: product.productType,
      deliveryTimeMinutes: product.deliveryTimeMinutes,
      serviceRequirements: product.serviceRequirements,
    });

    router.push("/checkout");
  };

  return (
    <div className="rounded-2xl bg-[#0f1218] border border-gray-800 hover:border-orange-500/60 transition-all flex flex-col justify-between overflow-hidden group shadow-sm relative card-drift-accent">
      {/* Product Image Link */}
      <Link href={`/product/${product.slug}`} className="block relative aspect-[4/3] overflow-hidden bg-[#161b24]">
        <img
          src={primaryImage}
          alt={product.name}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Discount Badge (Top Right) */}
        {product.discountPercent && product.discountPercent > 0 && (
          <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-red-600 text-white font-black text-[10px] tracking-wide shadow-sm font-mono z-10">
            %{product.discountPercent}-
          </span>
        )}

        {/* Edition & Stock Badges (Top Left) */}
        {product.stockType === "ONE_OF_ONE" ? (
          <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded-md bg-gradient-to-r from-red-600 to-orange-500 text-black font-black text-[10px] tracking-wide shadow-md z-10 border border-amber-300/40 animate-pulse flex items-center gap-1">
            <span dir="ltr" className="inline-block font-mono font-black">1 OF 1</span>
            <span>🔥</span>
          </span>
        ) : product.stockType === "LIMITED" || product.isLimited ? (
          <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded-md bg-purple-600/90 text-white font-black text-[10px] tracking-wide shadow-sm z-10 border border-purple-400/30">
            إصدار محدود 💎
          </span>
        ) : product.stockType === "QUANTITY" && product.stockQuantity <= 10 ? (
          <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded-md bg-amber-500/90 text-black font-black text-[10px] tracking-wide shadow-sm z-10">
            متبقي {product.stockQuantity} فقط ⚡
          </span>
        ) : null}
      </Link>

      {/* Body Info */}
      <div className="p-3 sm:p-3.5 flex-1 flex flex-col justify-between text-right space-y-2 relative z-10">
        <div>
          {/* Category */}
          <span className="text-[10px] sm:text-[11px] text-gray-400 block truncate font-medium">
            {product.category?.name || "سيارات وتعديلات"}
          </span>

          {/* Product Name */}
          <Link href={`/product/${product.slug}`} className="block mt-0.5">
            <h3 className="text-xs sm:text-sm font-bold text-white hover:text-orange-500 transition line-clamp-2 leading-snug min-h-[34px]">
              {product.name}
            </h3>
          </Link>

          {/* Price - Bold Heavy & Large */}
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-base sm:text-lg font-black text-orange-500 font-mono tracking-tight">
              {formatCurrency(product.price)}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-[11px] sm:text-xs text-gray-500 line-through font-mono font-bold">
                {formatCurrency(product.originalPrice)}
              </span>
            )}
          </div>
        </div>

        {/* Compact Action Buttons */}
        <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-gray-800/80">
          <button
            onClick={handleAddToCart}
            className={`py-2 px-1 rounded-xl border text-[11px] font-bold transition flex items-center justify-center gap-1 ${
              isAdded
                ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                : "bg-[#161b24] border-gray-700 hover:border-orange-500 text-gray-200"
            }`}
            aria-label="إضافة للسلة"
          >
            {isAdded ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <>
                <ShoppingCart className="w-3.5 h-3.5 text-orange-500" />
                <span>سلة</span>
              </>
            )}
          </button>

          <button
            onClick={handleBuyNow}
            className="py-2 px-1 rounded-xl bg-orange-500 hover:bg-orange-600 text-black font-black text-[11px] transition flex items-center justify-center gap-1 shadow-sm"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>شراء</span>
          </button>
        </div>
      </div>
    </div>
  );
}

