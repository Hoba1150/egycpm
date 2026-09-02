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
    toast.success("تمت إضافة المنتج للسلة بنجاح!");
    setTimeout(() => setIsAdded(false), 2000);
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
    <div className="glass-card rounded-3xl overflow-hidden flex flex-col justify-between group relative">
      {/* Product Image Stage */}
      <Link href={`/product/${product.slug}`} className="block relative aspect-[4/3] overflow-hidden bg-black/40">
        <img
          src={primaryImage}
          alt={product.name}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />

        {/* Ambient Dark Overlay on bottom of image for contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

        {/* Discount Badge */}
        {product.discountPercent && product.discountPercent > 0 && (
          <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-red-600/90 backdrop-blur-md text-white font-black text-[10px] shadow-sm font-mono z-10 border border-white/20">
            %{product.discountPercent}-
          </span>
        )}

        {/* Stock / Rarity Badge */}
        {product.stockType === "ONE_OF_ONE" ? (
          <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-red-600 to-amber-600 text-white font-black text-[10px] shadow-md z-10 border border-white/30 flex items-center gap-1 font-mono">
            <span>1 OF 1</span>
            <span>⚡</span>
          </span>
        ) : product.stockType === "LIMITED" || product.isLimited ? (
          <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-rose-300 font-bold text-[10px] z-10 border border-rose-500/30">
            إصدار محدود
          </span>
        ) : product.stockType === "QUANTITY" && product.stockQuantity <= 10 ? (
          <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-amber-500/80 backdrop-blur-md text-black font-black text-[10px] z-10">
            متبقي {product.stockQuantity}
          </span>
        ) : null}
      </Link>

      {/* Product Content Body */}
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between text-right space-y-2.5">
        <div>
          {/* Category Pill */}
          <span className="text-[10px] text-red-400 font-mono tracking-wide block truncate">
            {product.category?.name?.split("(")[0] || "سيارات وتعديل"}
          </span>

          {/* Product Title */}
          <Link href={`/product/${product.slug}`} className="block mt-0.5">
            <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-red-400 transition-colors line-clamp-2 leading-snug min-h-[36px]">
              {product.name}
            </h3>
          </Link>

          {/* Price Layout */}
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-base sm:text-lg font-black text-white font-mono tracking-tight">
              {formatCurrency(product.price)}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-[11px] text-gray-500 line-through font-mono font-medium">
                {formatCurrency(product.originalPrice)}
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons (iOS Glass Pill Group) */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/[0.06]">
          <button
            onClick={handleAddToCart}
            className={`py-2 px-1 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 active:scale-95 ${
              isAdded
                ? "bg-emerald-500/20 border border-emerald-500 text-emerald-400"
                : "glass-button-secondary text-gray-300 hover:text-white"
            }`}
            aria-label="إضافة للسلة"
          >
            {isAdded ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <>
                <ShoppingCart className="w-3.5 h-3.5 text-red-500" />
                <span>سلة</span>
              </>
            )}
          </button>

          <button
            onClick={handleBuyNow}
            className="py-2 px-1 rounded-xl glass-button-primary text-[11px] font-black flex items-center justify-center gap-1 active:scale-95 shadow-sm"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>شراء</span>
          </button>
        </div>
      </div>
    </div>
  );
}
