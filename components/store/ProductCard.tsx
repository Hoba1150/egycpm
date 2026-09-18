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
    starsPrice?: number | null;
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

  const rawPrimaryImage =
    images[0] ||
    "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800";

  // Dynamic lightweight image delivery (Converts 3MB raw images into 25KB WebP/AVIF)
  const primaryImage =
    rawPrimaryImage.includes("res.cloudinary.com") && rawPrimaryImage.includes("/upload/")
      ? rawPrimaryImage.replace("/upload/", "/upload/w_480,c_limit,f_auto,q_auto/")
      : rawPrimaryImage;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      id: product.id,
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      starsPrice: product.starsPrice || null,
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
      starsPrice: product.starsPrice || null,
      originalPrice: product.originalPrice,
      image: primaryImage,
      productType: product.productType,
      deliveryTimeMinutes: product.deliveryTimeMinutes,
      serviceRequirements: product.serviceRequirements,
    });
    router.push("/checkout");
  };

  return (
    <div className="cpm-card flex flex-col overflow-hidden group relative rounded-2xl sm:rounded-3xl">
      {/* ─── Image ─── */}
      <Link
        href={`/product/${product.slug}`}
        className="block relative aspect-[16/11] sm:aspect-[4/3] overflow-hidden bg-[#0a0b0f]"
      >
        <img
          src={primaryImage}
          alt={product.name}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-300 ease-out"
        />

        {/* Gradient overlay for bottom readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* ─── Discount badge ─── */}
        {product.discountPercent && product.discountPercent > 0 && (
          <span className="absolute top-2 right-2 sm:top-3 sm:right-3 px-2 py-0.5 rounded-full bg-[var(--red-core)] text-white text-[9px] sm:text-[11px] font-black font-mono tracking-wide shadow-[0_0_12px_rgba(255,42,53,0.6)] z-10">
            %{product.discountPercent}-
          </span>
        )}

        {/* ─── Edition / Stock badge ─── */}
        {product.stockType === "ONE_OF_ONE" ? (
          <span className="absolute top-2 left-2 sm:top-3 sm:left-3 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#ff2a35] to-[#ff5900] text-white font-black text-[9px] sm:text-[10px] tracking-wider sm:tracking-widest z-10 shadow-[0_0_12px_rgba(255,42,53,0.7)] border border-white/20 flex items-center gap-1">
            <span dir="ltr" className="font-mono">1 OF 1</span>
            <span>🔥</span>
          </span>
        ) : product.stockType === "LIMITED" || product.isLimited ? (
          <span className="absolute top-2 left-2 sm:top-3 sm:left-3 px-2.5 py-0.5 rounded-full bg-black/80 text-[#ff4d55] font-bold text-[9px] sm:text-[10px] z-10 border border-[var(--red-core)]/50 backdrop-blur-md">
            إصدار محدود
          </span>
        ) : product.stockType === "QUANTITY" && product.stockQuantity <= 10 ? (
          <span className="absolute top-2 left-2 sm:top-3 sm:left-3 px-2.5 py-0.5 rounded-full bg-amber-500 text-black font-black text-[9px] sm:text-[10px] z-10 shadow-md">
            متبقي {product.stockQuantity} ⚡
          </span>
        ) : null}
      </Link>

      {/* ─── Body ─── */}
      <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between text-right gap-2">
        <div className="space-y-1">
          {/* Category label */}
          <span className="text-[10px] sm:text-[11px] text-gray-400 block truncate font-medium tracking-wide uppercase">
            {product.category?.name?.split("(")[0]?.trim() || "سيارات وتعديلات"}
          </span>

          {/* Product Name */}
          <Link href={`/product/${product.slug}`} className="block">
            <h3 className="product-name-lg text-white group-hover:text-[var(--red-core)] transition-colors duration-200 line-clamp-2 min-h-[2rem] sm:min-h-[2.5rem]">
              {product.name}
            </h3>
          </Link>

          {/* Price */}
          <div className="flex items-center gap-1.5 sm:gap-2 pt-0.5 flex-wrap">
            <span className="product-price-lg text-[14px] sm:text-base md:text-lg font-black font-mono text-white">
              {formatCurrency(product.price)}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-[10px] sm:text-xs text-gray-500 line-through font-mono">
                {formatCurrency(product.originalPrice)}
              </span>
            )}
            {product.starsPrice && product.starsPrice > 0 ? (
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-[10px] sm:text-[11px] font-bold">
                <span>{product.starsPrice.toLocaleString()}</span>
                <span>⭐</span>
              </span>
            ) : null}
          </div>
        </div>

        {/* ─── Action Pill Buttons ─── */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/[0.08]">
          <button
            onClick={handleAddToCart}
            aria-label="إضافة للسلة"
            className={`py-2 px-2.5 rounded-full text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95 ${
              isAdded
                ? "bg-emerald-500/20 border border-emerald-500 text-emerald-400"
                : "cpm-btn-ghost"
            }`}
          >
            {isAdded ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <>
                <ShoppingCart className="w-3.5 h-3.5 text-[var(--red-core)]" />
                <span>سلة</span>
              </>
            )}
          </button>

          <button
            onClick={handleBuyNow}
            className="py-2 px-2.5 rounded-full cpm-btn-red text-[11px] sm:text-xs flex items-center justify-center gap-1.5 active:scale-95"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>شراء</span>
          </button>
        </div>
      </div>
    </div>
  );
}
