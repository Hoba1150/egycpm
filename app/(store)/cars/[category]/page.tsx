import React from "react";
import { getProducts } from "@/lib/actions/product";
import ProductCard from "@/components/store/ProductCard";
import Link from "next/link";
import { ArrowLeft, Car, Filter } from "lucide-react";

export const revalidate = 30; // Fast Edge CDN Caching (Zero Latency & 98% Bandwidth Savings)

interface CarCategoryPageProps {
  params: {
    category: string;
  };
}

export default async function CarCategoryPage({ params }: CarCategoryPageProps) {
  const categoryMap: Record<string, { type: string; title: string; desc: string }> = {
    modified: {
      type: "MODIFIED_CAR",
      title: "سيارات معدلة وسرعة 1695HP",
      desc: "أقوى سيارات الدريفت والسباقات المزودة بمحركات W16 وجيربوكس معدل للدراج هاي واي.",
    },
    drawn: {
      type: "DRAWN_CAR",
      title: "سيارات رسم وتصميمات خاصة (Drawn Cars)",
      desc: "سيارات بتصاميم أنمي وفينيلات سينمائية بدقة Ultra HD تفوق 300 لاير رسم.",
    },
    "realistic-logos": {
      type: "REALISTIC_LOGO_CAR",
      title: "سيارات لوجوهات وماركات واقعية وPolice",
      desc: "لوجوهات Red Bull, Monster, Supreme مع فليشر بوليس أصلي.",
    },
    limited: {
      type: "LIMITED_CAR",
      title: "سيارات حصرية ومحدودة (Limited Edition)",
      desc: "سيارات نادرة الإصدار ولمسات مذهبة وكروم بأعداد محددة.",
    },
    stock: {
      type: "STOCK_CAR",
      title: "سيارات ستوك وكلاسيك الأصلية",
      desc: "سيارات اللعبة الأصلية مفتوحة بالكامل وجاهزة للاستلام الفوري.",
    },
  };

  const currentCat = categoryMap[params.category] || {
    type: "STOCK_CAR",
    title: "سيارات كار باركينج",
    desc: "تشكيلة مميزة من سيارات كار باركينج.",
  };

  const productsRes = await getProducts({
    productType: currentCat.type,
    limit: 24,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-right space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-neon-cyan font-mono font-bold">
            <Car className="w-4 h-4" />
            <Link href="/cars" className="hover:underline">كراج السيارات</Link>
            <span>/</span>
            <span>{currentCat.title}</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white">{currentCat.title}</h1>
          <p className="text-xs sm:text-sm text-gray-400 max-w-xl">{currentCat.desc}</p>
        </div>

        <Link
          href="/cars"
          className="px-4 py-2 rounded-xl bg-garage-850 border border-gray-700 text-xs font-bold text-gray-300 hover:text-white flex items-center gap-1.5 self-start sm:self-auto"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>كل التصنيفات</span>
        </Link>
      </div>

      {productsRes.items.length === 0 ? (
        <div className="py-16 text-center rounded-3xl bg-garage-900 border border-gray-800 text-gray-400 text-sm">
          لا توجد سيارات متوفرة في هذا القسم حالياً.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {productsRes.items.map((prod) => (
            <ProductCard key={prod.id} product={prod as any} />
          ))}
        </div>
      )}
    </div>
  );
}
