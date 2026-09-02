import React from "react";
import Link from "next/link";
import { 
  Car, 
  Flame, 
  Palette, 
  Zap, 
  Key, 
  Sparkles, 
  Layers, 
  ArrowLeft,
  ChevronLeft
} from "lucide-react";

interface CategoryShowcaseProps {
  categories: Array<{
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    _count?: { products: number };
  }>;
}

function getCleanName(name: string) {
  return name.split("(")[0].trim();
}

function getCategoryIcon(name: string, slug: string) {
  const lower = (name + " " + slug).toLowerCase();
  if (lower.includes("modified") || lower.includes("تعديل") || lower.includes("سرعة") || lower.includes("1695")) {
    return { icon: Car, border: "hover:border-red-500/80", accent: "text-red-500 bg-red-950/20 border-red-500/30" };
  }
  if (lower.includes("drawn") || lower.includes("رسم") || lower.includes("فينيل")) {
    return { icon: Palette, border: "hover:border-rose-500/80", accent: "text-rose-500 bg-rose-950/20 border-rose-500/30" };
  }
  if (lower.includes("realistic") || lower.includes("واقعية") || lower.includes("لوجو") || lower.includes("ماركات")) {
    return { icon: Sparkles, border: "hover:border-red-400/80", accent: "text-red-400 bg-red-950/20 border-red-500/30" };
  }
  if (lower.includes("limited") || lower.includes("نادرة") || lower.includes("محدودة")) {
    return { icon: Flame, border: "hover:border-amber-500/80", accent: "text-amber-500 bg-amber-950/20 border-amber-500/30" };
  }
  if (lower.includes("service") || lower.includes("شحن") || lower.includes("تطوير")) {
    return { icon: Zap, border: "hover:border-yellow-500/80", accent: "text-yellow-500 bg-yellow-950/20 border-yellow-500/30" };
  }
  if (lower.includes("account") || lower.includes("حسابات") || lower.includes("جاهزة")) {
    return { icon: Key, border: "hover:border-red-600/80", accent: "text-red-500 bg-red-950/20 border-red-500/30" };
  }
  return { icon: Layers, border: "hover:border-red-500/80", accent: "text-red-400 bg-red-950/20 border-red-500/30" };
}

export default function HomeCategoryShowcase({ categories }: CategoryShowcaseProps) {
  if (!categories || categories.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/shop"
          className="text-xs text-red-500 hover:text-red-400 font-bold flex items-center gap-1 transition group"
        >
          <span>تصفح كل الأقسام</span>
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
        </Link>
        <div className="text-right">
          <span className="text-xs text-red-500 font-mono font-bold uppercase tracking-wider block">
            التصنيفات المعتمدة
          </span>
          <h2 className="text-lg sm:text-2xl font-black text-white">
            أقسام المتجر المتاحة
          </h2>
        </div>
      </div>

      {/* Grid of Cockpit Gaming Tiles (No Images) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3.5">
        {categories.map((cat) => {
          const cleanName = getCleanName(cat.name);
          const { icon: Icon, border, accent } = getCategoryIcon(cat.name, cat.slug);
          const productCount = cat._count?.products ?? 0;

          return (
            <Link
              key={cat.id}
              href={`/shop?category=${cat.slug}`}
              className={`group relative rounded-2xl bg-[#0b0d13] border border-gray-800/90 ${border} p-4 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_25px_-5px_rgba(220,38,38,0.3)] min-h-[125px]`}
            >
              {/* Subtle Red Ambient Glow behind Icon */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-red-600/5 rounded-full blur-xl group-hover:bg-red-600/15 transition-all" />

              {/* Top Row: Icon + Count */}
              <div className="relative z-10 flex items-center justify-between">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all duration-300 group-hover:scale-110 group-hover:bg-red-600 group-hover:text-white group-hover:border-red-500 ${accent}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#141824] border border-gray-800 text-gray-400 group-hover:text-red-400 group-hover:border-red-500/30 transition-colors">
                  {productCount} سيارة
                </span>
              </div>

              {/* Bottom: Name & Action */}
              <div className="relative z-10 text-right space-y-0.5 pt-3">
                <h3 className="text-xs sm:text-sm font-black text-white group-hover:text-red-400 transition-colors line-clamp-1">
                  {cleanName}
                </h3>
                <span className="text-[10px] text-gray-500 font-medium flex items-center justify-end gap-1 group-hover:text-gray-300 transition-colors">
                  <span>فتح القسم</span>
                  <ChevronLeft className="w-3 h-3 text-red-500 group-hover:-translate-x-0.5 transition-transform" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
