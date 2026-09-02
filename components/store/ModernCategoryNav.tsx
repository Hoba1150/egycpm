"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Car, 
  Flame, 
  Palette, 
  Zap, 
  Key, 
  Sparkles, 
  Layers, 
  SlidersHorizontal,
  ChevronDown,
  Crown,
  Grid3X3,
  Check
} from "lucide-react";

interface CategoryNavProps {
  categories: Array<{
    id: string;
    name: string;
    slug: string;
    icon?: string | null;
    _count?: { products: number };
  }>;
  activeCategory?: string;
  activeType?: string;
  totalProductsCount?: number;
}

function getCategoryIcon(name: string, slug: string) {
  const lower = (name + " " + slug).toLowerCase();
  if (lower.includes("modified") || lower.includes("تعديل") || lower.includes("سرعة") || lower.includes("1695")) {
    return { icon: Car, glow: "group-hover:border-red-500/80 group-hover:text-red-500 text-red-500 bg-red-950/20" };
  }
  if (lower.includes("drawn") || lower.includes("رسم") || lower.includes("فينيل")) {
    return { icon: Palette, glow: "group-hover:border-rose-500/80 group-hover:text-rose-500 text-rose-500 bg-rose-950/20" };
  }
  if (lower.includes("realistic") || lower.includes("واقعية") || lower.includes("لوجو") || lower.includes("ماركات")) {
    return { icon: Sparkles, glow: "group-hover:border-red-400/80 group-hover:text-red-400 text-red-400 bg-red-950/20" };
  }
  if (lower.includes("limited") || lower.includes("نادرة") || lower.includes("محدودة")) {
    return { icon: Flame, glow: "group-hover:border-amber-500/80 group-hover:text-amber-500 text-amber-500 bg-amber-950/20" };
  }
  if (lower.includes("service") || lower.includes("شحن") || lower.includes("تطوير")) {
    return { icon: Zap, glow: "group-hover:border-yellow-500/80 group-hover:text-yellow-500 text-yellow-500 bg-yellow-950/20" };
  }
  if (lower.includes("account") || lower.includes("حسابات") || lower.includes("جاهزة")) {
    return { icon: Key, glow: "group-hover:border-red-600/80 group-hover:text-red-500 text-red-500 bg-red-950/20" };
  }
  return { icon: Layers, glow: "group-hover:border-red-500/80 group-hover:text-red-500 text-red-400 bg-red-950/20" };
}

function getCleanName(name: string) {
  return name.split("(")[0].trim();
}

export default function ModernCategoryNav({
  categories,
  activeCategory,
  activeType,
  totalProductsCount = 0,
}: CategoryNavProps) {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const isAllActive = !activeCategory || activeCategory === "all";
  const currentCategoryObj = categories.find((c) => c.slug === activeCategory);
  const currentActiveName = isAllActive ? "جميع الأقسام والتصنيفات" : getCleanName(currentCategoryObj?.name || "");

  return (
    <div className="space-y-3">
      {/* ─── 1. MOBILE CONTROLLER (Futuristic HUD Bar + Drop Selector) ─── */}
      <div className="block lg:hidden">
        <div className="p-2.5 rounded-2xl bg-[#0b0d13] border border-gray-800/90 shadow-[0_4px_20px_rgba(0,0,0,0.6)] space-y-2">
          {/* Header Row */}
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-mono font-bold text-red-500 flex items-center gap-1.5 uppercase">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>تصنيف المنتجات</span>
            </span>
            <span className="text-[10px] text-gray-500 font-mono">
              {categories.length} فئات نشطة
            </span>
          </div>

          {/* Interactive Trigger Button */}
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-[#121620] border border-red-500/40 text-right transition hover:border-red-500 shadow-[0_0_15px_rgba(220,38,38,0.15)]"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(220,38,38,0.5)]">
                {isAllActive ? <Crown className="w-4 h-4" /> : <Grid3X3 className="w-4 h-4" />}
              </div>
              <div className="truncate">
                <span className="block text-xs font-black text-white truncate">
                  {currentActiveName}
                </span>
                <span className="block text-[10px] text-red-400 font-mono">
                  {isAllActive ? "عرض كافة الكتالوج" : `${currentCategoryObj?._count?.products || 0} منتج متاح`}
                </span>
              </div>
            </div>

            <div className={`p-1.5 rounded-lg bg-[#161b26] text-red-500 transition-transform duration-200 ${mobileDrawerOpen ? "rotate-180" : ""}`}>
              <ChevronDown className="w-4 h-4" />
            </div>
          </button>

          {/* Collapsible Mobile Selector Panel */}
          {mobileDrawerOpen && (
            <div className="pt-2 border-t border-gray-800/80 grid grid-cols-1 gap-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
              {/* All Option */}
              <Link
                href={activeType ? `/shop?type=${activeType}` : "/shop"}
                onClick={() => setMobileDrawerOpen(false)}
                className={`flex items-center justify-between p-2.5 rounded-xl border transition ${
                  isAllActive
                    ? "bg-red-600 text-white border-red-500 shadow-[0_0_12px_rgba(220,38,38,0.4)]"
                    : "bg-[#141824] border-gray-800 text-gray-300 hover:bg-[#1a2030]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4" />
                  <span className="text-xs font-bold">جميع الأقسام والتصنيفات</span>
                </div>
                {isAllActive && <Check className="w-4 h-4" />}
              </Link>

              {/* Dynamic Categories */}
              {categories.map((cat) => {
                const isSelected = activeCategory === cat.slug;
                const { icon: Icon } = getCategoryIcon(cat.name, cat.slug);
                const cleanName = getCleanName(cat.name);
                const count = cat._count?.products ?? 0;
                const href = activeType
                  ? `/shop?type=${activeType}&category=${cat.slug}`
                  : `/shop?category=${cat.slug}`;

                return (
                  <Link
                    key={cat.id}
                    href={href}
                    onClick={() => setMobileDrawerOpen(false)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition ${
                      isSelected
                        ? "bg-red-600 text-white border-red-500 shadow-[0_0_12px_rgba(220,38,38,0.4)]"
                        : "bg-[#141824] border-gray-800 text-gray-300 hover:bg-[#1a2030]"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon className="w-4 h-4 shrink-0 text-red-400" />
                      <span className="text-xs font-bold truncate">{cleanName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${isSelected ? "bg-black/30 text-white" : "bg-black/50 text-gray-400"}`}>
                        {count}
                      </span>
                      {isSelected && <Check className="w-4 h-4" />}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ─── 2. DESKTOP & TABLET: MODERN ACTION GRID TILES (NO IMAGES) ─── */}
      <div className="hidden lg:block">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {/* 'All Categories' Tile */}
          <Link
            href={activeType ? `/shop?type=${activeType}` : "/shop"}
            className={`group relative p-3.5 rounded-2xl border transition-all duration-300 flex flex-col justify-between min-h-[92px] ${
              isAllActive
                ? "bg-gradient-to-br from-red-600 to-red-800 text-white border-red-500 shadow-[0_0_20px_rgba(220,38,38,0.4)] scale-[1.02]"
                : "bg-[#0b0d13] border-gray-800/80 text-gray-300 hover:border-red-500/60 hover:bg-[#11141c] hover:-translate-y-0.5"
            }`}
          >
            <div className="flex items-center justify-between">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${
                  isAllActive
                    ? "bg-black/30 text-white"
                    : "bg-red-500/10 border border-red-500/30 text-red-500"
                }`}
              >
                <Crown className="w-4 h-4" />
              </div>
              <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${isAllActive ? "bg-black/40 text-red-100" : "bg-[#141824] text-gray-500"}`}>
                الكل
              </span>
            </div>

            <div className="text-right pt-2">
              <span className="block text-xs font-black tracking-tight leading-tight">
                جميع المنتجات
              </span>
              <span className={`block text-[10px] font-mono mt-0.5 ${isAllActive ? "text-red-100" : "text-gray-500"}`}>
                تصفح الكتالوج
              </span>
            </div>
          </Link>

          {/* Dynamic Categories Tiles */}
          {categories.map((cat) => {
            const isSelected = activeCategory === cat.slug;
            const { icon: Icon, glow } = getCategoryIcon(cat.name, cat.slug);
            const cleanName = getCleanName(cat.name);
            const count = cat._count?.products ?? 0;
            const href = activeType
              ? `/shop?type=${activeType}&category=${cat.slug}`
              : `/shop?category=${cat.slug}`;

            return (
              <Link
                key={cat.id}
                href={href}
                className={`group relative p-3.5 rounded-2xl border transition-all duration-300 flex flex-col justify-between min-h-[92px] ${
                  isSelected
                    ? "bg-gradient-to-br from-red-600 to-red-800 text-white border-red-500 shadow-[0_0_20px_rgba(220,38,38,0.4)] scale-[1.02]"
                    : "bg-[#0b0d13] border-gray-800/80 text-gray-300 hover:border-red-500/60 hover:bg-[#11141c] hover:-translate-y-0.5"
                }`}
              >
                {/* Top Row: Icon + Count */}
                <div className="flex items-center justify-between">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-all duration-300 group-hover:scale-110 ${
                      isSelected
                        ? "bg-black/30 border-white/20 text-white"
                        : `${glow} border-red-500/20`
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span
                    className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      isSelected
                        ? "bg-black/40 text-red-100"
                        : "bg-[#141824] text-gray-500 group-hover:text-red-400"
                    }`}
                  >
                    {count} سيارة
                  </span>
                </div>

                {/* Bottom Row: Name */}
                <div className="text-right pt-2">
                  <span className="block text-xs font-black tracking-tight leading-tight group-hover:text-white line-clamp-1">
                    {cleanName}
                  </span>
                  <span
                    className={`block text-[10px] font-mono mt-0.5 ${
                      isSelected ? "text-red-100" : "text-gray-500"
                    }`}
                  >
                    قسم معتمد
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
