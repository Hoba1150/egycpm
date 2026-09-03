"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, Eye, ShoppingBag } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface HomeProductSliderProps {
  products: any[];
}

export default function HomeProductSlider({ products }: HomeProductSliderProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  if (!products || products.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        {/* Navigation Arrows & View Store Link */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <button
              onClick={() => scroll("right")}
              className="w-8 h-8 rounded-xl bg-[#121622] hover:bg-red-600/20 text-gray-300 hover:text-red-400 border border-gray-800 flex items-center justify-center transition active:scale-95"
              aria-label="السابق"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll("left")}
              className="w-8 h-8 rounded-xl bg-[#121622] hover:bg-red-600/20 text-gray-300 hover:text-red-400 border border-gray-800 flex items-center justify-center transition active:scale-95"
              aria-label="التالي"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          <Link
            href="/shop"
            className="px-3 py-1.5 rounded-xl bg-red-600/10 hover:bg-red-600/20 text-red-500 hover:text-red-400 border border-red-500/30 text-xs font-bold flex items-center gap-1 transition group"
          >
            <span>عرض المتجر الكامل</span>
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Title */}
        <div className="text-right">
          <span className="text-[11px] text-red-500 font-mono font-bold block">
            معاينة السيارات والخدمات
          </span>
          <h2 className="text-base sm:text-xl font-black text-white">
            استعراض نماذج من المنتجات
          </h2>
        </div>
      </div>

      {/* Horizontal Carousel Slider */}
      <div
        ref={scrollRef}
        className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-none pb-2 pt-1 scroll-smooth snap-x snap-mandatory"
      >
        {products.map((product) => {
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
              key={product.id}
              href={`/product/${product.slug}`}
              className="snap-start shrink-0 w-[190px] sm:w-[240px] cpm-card flex flex-col overflow-hidden group relative rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:border-red-500/50 hover:shadow-[0_10px_25px_-5px_rgba(220,38,38,0.25)]"
            >
              {/* Image with hover effect */}
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
                  <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-[var(--red)] text-white text-[9px] font-black font-mono shadow-md z-10">
                    %{product.discountPercent}-
                  </span>
                )}

                {/* Quick View Tag on Hover */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                  <span className="px-2.5 py-1 rounded-xl bg-red-600/90 text-white text-[11px] font-bold flex items-center gap-1 shadow-lg backdrop-blur-sm transform translate-y-2 group-hover:translate-y-0 transition-transform">
                    <Eye className="w-3 h-3" />
                    <span>معاينة</span>
                  </span>
                </div>
              </div>

              {/* Info Body */}
              <div className="p-3 flex-1 flex flex-col justify-between text-right gap-2">
                <div className="space-y-1">
                  <span className="text-[9px] text-red-500/80 font-mono font-bold block truncate uppercase">
                    {product.category?.name?.split("(")[0]?.trim() || "EGY CPM"}
                  </span>
                  <h3 className="text-xs sm:text-sm font-black text-white group-hover:text-red-400 transition-colors line-clamp-1">
                    {product.name}
                  </h3>
                  <span className="text-xs sm:text-sm font-black text-white font-mono block">
                    {formatCurrency(product.price)}
                  </span>
                </div>

                <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[10px] text-gray-400 group-hover:text-red-400 transition-colors">
                  <span className="font-bold">تفاصيل المنتج</span>
                  <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
