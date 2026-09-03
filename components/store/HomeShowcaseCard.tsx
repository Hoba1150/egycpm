"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Eye } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface HomeShowcaseCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    originalPrice?: number | null;
    discountPercent?: number | null;
    productType: string;
    stockType: string;
    stockQuantity: number;
    imagesArray?: string[];
    images?: string;
    category?: { name: string; slug: string };
  };
}

export default function HomeShowcaseCard({ product }: HomeShowcaseCardProps) {
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

  const primaryImage =
    images[0] ||
    "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800";

  return (
    <Link
      href={`/product/${product.slug}`}
      className="cpm-card flex flex-col overflow-hidden group relative rounded-xl sm:rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:border-red-500/50 hover:shadow-[0_10px_25px_-5px_rgba(220,38,38,0.25)]"
    >
      {/* Image */}
      <div className="relative aspect-[16/11] sm:aspect-[4/3] overflow-hidden bg-[#0a0b0f]">
        <img
          src={primaryImage}
          alt={product.name}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-500 ease-out"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

        {/* Discount Badge */}
        {product.discountPercent && product.discountPercent > 0 && (
          <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-[var(--red)] text-white text-[10px] font-black font-mono shadow-md z-10">
            %{product.discountPercent}-
          </span>
        )}

        {/* Stock / Edition Badge */}
        {product.stockType === "ONE_OF_ONE" ? (
          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-gradient-to-r from-red-600 to-amber-600 text-white font-black text-[9px] z-10 shadow-md border border-white/20">
            1 OF 1 🔥
          </span>
        ) : product.stockType === "LIMITED" ? (
          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/80 text-red-400 font-bold text-[9px] z-10 border border-red-500/40">
            إصدار نادر
          </span>
        ) : null}

        {/* Quick View Tag on Hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
          <span className="px-3 py-1.5 rounded-xl bg-red-600/90 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg backdrop-blur-sm transform translate-y-2 group-hover:translate-y-0 transition-transform">
            <Eye className="w-3.5 h-3.5" />
            <span>معاينة التفاصيل</span>
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between text-right gap-2">
        <div className="space-y-1">
          <span className="text-[10px] sm:text-[11px] text-red-500/80 font-mono font-bold block truncate uppercase">
            {product.category?.name?.split("(")[0]?.trim() || "EGY CPM"}
          </span>

          <h3 className="text-xs sm:text-sm font-black text-white group-hover:text-red-400 transition-colors line-clamp-1">
            {product.name}
          </h3>

          <div className="flex items-baseline gap-2 pt-0.5">
            <span className="text-sm sm:text-base font-black text-white font-mono">
              {formatCurrency(product.price)}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-[10px] text-gray-500 line-through font-mono">
                {formatCurrency(product.originalPrice)}
              </span>
            )}
          </div>
        </div>

        {/* Subtle CTA footer — No direct cart add, pure view */}
        <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-gray-400 group-hover:text-red-400 transition-colors">
          <span className="font-bold">عرض وتفاصيل</span>
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  );
}
