import React from "react";
import Link from "next/link";
import { 
  Car, 
  Flame, 
  Palette, 
  Zap, 
  Key, 
  Sparkles, 
  ShieldCheck, 
  Layers, 
  ChevronLeft,
  Crown
} from "lucide-react";

interface CategoryBarProps {
  categories: Array<{
    id: string;
    name: string;
    slug: string;
    image?: string | null;
    icon?: string | null;
    _count?: { products: number };
  }>;
  activeCategory?: string;
  activeType?: string;
  className?: string;
}

// Function to match category to appropriate gaming/automotive icon
function getCategoryIcon(name: string, slug: string) {
  const lower = (name + " " + slug).toLowerCase();
  if (lower.includes("modified") || lower.includes("تعديل") || lower.includes("سرعة") || lower.includes("1695")) {
    return { icon: Car, color: "text-red-500 bg-red-500/10 border-red-500/30" };
  }
  if (lower.includes("drawn") || lower.includes("رسم") || lower.includes("فينيل")) {
    return { icon: Palette, color: "text-rose-500 bg-rose-500/10 border-rose-500/30" };
  }
  if (lower.includes("realistic") || lower.includes("واقعية") || lower.includes("لوجو") || lower.includes("ماركات")) {
    return { icon: Sparkles, color: "text-red-400 bg-red-950/30 border-red-500/30" };
  }
  if (lower.includes("limited") || lower.includes("نادرة") || lower.includes("محدودة")) {
    return { icon: Flame, color: "text-amber-500 bg-amber-500/10 border-amber-500/30" };
  }
  if (lower.includes("service") || lower.includes("شحن") || lower.includes("تطوير")) {
    return { icon: Zap, color: "text-yellow-500 bg-yellow-500/10 border-yellow-500/30" };
  }
  if (lower.includes("account") || lower.includes("حسابات") || lower.includes("جاهزة")) {
    return { icon: Key, color: "text-red-500 bg-red-500/10 border-red-500/30" };
  }
  return { icon: Layers, color: "text-red-400 bg-red-500/10 border-red-500/30" };
}

// Function to format cleaner display name if it has brackets
function getCleanName(name: string) {
  return name.split("(")[0].trim();
}

export default function ModernCategoryBar({
  categories,
  activeCategory,
  activeType,
  className = "",
}: CategoryBarProps) {
  const isAllActive = !activeCategory || activeCategory === "all";

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Category Cards Carousel / Grid */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-red-600/30 scrollbar-track-transparent">
        {/* 'All Products' Modern Card */}
        <Link
          href={activeType ? `/shop?type=${activeType}` : "/shop"}
          className={`shrink-0 flex items-center gap-2.5 px-4 py-3 rounded-2xl border transition-all duration-300 group ${
            isAllActive
              ? "bg-gradient-to-r from-red-600 to-red-700 text-white border-red-500 shadow-[0_0_20px_rgba(220,38,38,0.4)] scale-[1.02]"
              : "bg-[#0c0e14] border-gray-800/80 text-gray-300 hover:border-red-500/50 hover:bg-[#121620]"
          }`}
        >
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${
              isAllActive
                ? "bg-black/30 text-white"
                : "bg-red-500/10 text-red-500 border border-red-500/20"
            }`}
          >
            <Crown className="w-4 h-4" />
          </div>
          <div className="text-right">
            <span className="block text-xs font-black tracking-wide">
              جميع المنتجات
            </span>
            <span className={`block text-[10px] font-mono ${isAllActive ? "text-red-100" : "text-gray-500"}`}>
              تصفح الكل
            </span>
          </div>
        </Link>

        {/* Dynamic Categories From Database */}
        {categories.map((cat) => {
          const isSelected = activeCategory === cat.slug;
          const { icon: Icon, color } = getCategoryIcon(cat.name, cat.slug);
          const cleanName = getCleanName(cat.name);
          const productCount = cat._count?.products ?? 0;
          const href = activeType
            ? `/shop?type=${activeType}&category=${cat.slug}`
            : `/shop?category=${cat.slug}`;

          return (
            <Link
              key={cat.id}
              href={href}
              className={`shrink-0 flex items-center gap-3 px-3.5 py-2.5 rounded-2xl border transition-all duration-300 group ${
                isSelected
                  ? "bg-gradient-to-r from-red-600/90 to-red-700/90 text-white border-red-500 shadow-[0_0_20px_rgba(220,38,38,0.35)] scale-[1.02]"
                  : "bg-[#0c0e14] border-gray-800/80 text-gray-300 hover:border-red-500/50 hover:bg-[#121620]"
              }`}
            >
              {/* Category Image or Dynamic Icon */}
              {cat.image ? (
                <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-gray-700/60 shrink-0 group-hover:scale-105 transition">
                  <img
                    src={cat.image}
                    alt={cleanName}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>
              ) : (
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-transform group-hover:scale-110 shrink-0 ${
                    isSelected ? "bg-black/30 border-white/20 text-white" : color
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
              )}

              {/* Text & Count */}
              <div className="text-right">
                <span className="block text-xs font-black tracking-tight whitespace-nowrap">
                  {cleanName}
                </span>
                <span
                  className={`block text-[10px] font-mono ${
                    isSelected ? "text-red-100" : "text-gray-500"
                  }`}
                >
                  {productCount} منتج متاح
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
