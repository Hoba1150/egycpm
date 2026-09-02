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
    image?: string | null;
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
    return { icon: Car, accent: "from-red-600 to-red-950", badge: "W16 Tuning" };
  }
  if (lower.includes("drawn") || lower.includes("رسم") || lower.includes("فينيل")) {
    return { icon: Palette, accent: "from-rose-600 to-rose-950", badge: "Custom Vinyls" };
  }
  if (lower.includes("realistic") || lower.includes("واقعية") || lower.includes("لوجو") || lower.includes("ماركات")) {
    return { icon: Sparkles, accent: "from-red-700 to-black", badge: "Hyper Realistic" };
  }
  if (lower.includes("limited") || lower.includes("نادرة") || lower.includes("محدودة")) {
    return { icon: Flame, accent: "from-amber-600 to-red-950", badge: "1 of 1 Edition" };
  }
  if (lower.includes("service") || lower.includes("شحن") || lower.includes("تطوير")) {
    return { icon: Zap, accent: "from-yellow-600 to-amber-950", badge: "Instant Delivery" };
  }
  if (lower.includes("account") || lower.includes("حسابات") || lower.includes("جاهزة")) {
    return { icon: Key, accent: "from-red-800 to-black", badge: "VIP Accounts" };
  }
  return { icon: Layers, accent: "from-gray-800 to-black", badge: "Category" };
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
            التصنيفات الرئيسية
          </span>
          <h2 className="text-lg sm:text-2xl font-black text-white">
            أقسام المتجر المتخصصة
          </h2>
        </div>
      </div>

      {/* Grid of Interactive Category Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3.5">
        {categories.map((cat) => {
          const cleanName = getCleanName(cat.name);
          const { icon: Icon, accent, badge } = getCategoryIcon(cat.name, cat.slug);
          const productCount = cat._count?.products ?? 0;

          return (
            <Link
              key={cat.id}
              href={`/shop?category=${cat.slug}`}
              className="group relative overflow-hidden rounded-2xl bg-[#0b0d13] border border-gray-800/80 hover:border-red-500/60 p-3.5 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_25px_-5px_rgba(220,38,38,0.3)] min-h-[140px]"
            >
              {/* Background Glow / Image */}
              {cat.image ? (
                <div className="absolute inset-0 opacity-15 group-hover:opacity-30 transition-opacity">
                  <img src={cat.image} alt={cleanName} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0b0d13] via-[#0b0d13]/80 to-transparent" />
                </div>
              ) : (
                <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-gradient-to-br ${accent} opacity-20 blur-xl group-hover:opacity-40 transition-opacity`} />
              )}

              {/* Top Row: Icon + Badge */}
              <div className="relative z-10 flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 flex items-center justify-center group-hover:bg-red-600 group-hover:text-white group-hover:border-red-500 transition-all duration-300">
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-black/50 border border-gray-800 text-gray-400">
                  {productCount} عنصر
                </span>
              </div>

              {/* Bottom: Name & Action */}
              <div className="relative z-10 text-right space-y-0.5 pt-4">
                <h3 className="text-xs sm:text-sm font-black text-white group-hover:text-red-400 transition-colors line-clamp-1">
                  {cleanName}
                </h3>
                <span className="text-[10px] text-gray-500 font-medium block flex items-center justify-end gap-1 group-hover:text-gray-300 transition-colors">
                  <span>تصفح القسم</span>
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
