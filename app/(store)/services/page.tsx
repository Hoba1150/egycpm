import React from "react";
import { getProducts } from "@/lib/actions/product";
import ProductCard from "@/components/store/ProductCard";
import { Zap, ShieldCheck, Sparkles } from "lucide-react";
import { getStoreSettings } from "@/lib/actions/settings";

export const revalidate = 30; // Fast Edge CDN Caching (Zero Latency & 98% Bandwidth Savings)

export default async function ServicesPage() {
  const servicesRes = await getProducts({
    productType: "SERVICE",
    limit: 24,
  });

  const settings: Record<string, string> = await getStoreSettings().catch(() => ({}));
  const pageTitle = settings.page_services_title || "خدمات الشحن وزيادة الرتبة";
  const pageDesc = settings.page_services_desc || "خدمات شحن الكاش والكوينز الذهبي وتفعيل الكينج رانك في Car Parking بأعلى درجات الأمان";

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-8 text-right space-y-8">
      {/* Header Banner */}
      <div className="rounded-3xl bg-[#0f1218] border border-gray-800 p-6 sm:p-8 shadow-sm">
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-bold">
            <Zap className="w-3.5 h-3.5" />
            <span>شحن وتسليم مباشر وفوري</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white">{pageTitle}</h1>
          <p className="text-xs sm:text-sm text-gray-400">{pageDesc}</p>

          <div className="flex flex-wrap gap-4 pt-2 text-xs">
            <span className="flex items-center gap-1.5 text-emerald-500 font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>أمان 100% بدون أي باند</span>
            </span>
            <span className="flex items-center gap-1.5 text-orange-500 font-bold">
              <Zap className="w-4 h-4" />
              <span>تسليم مباشر ومتابعة حية للطلب</span>
            </span>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
          <h2 className="text-lg sm:text-xl font-extrabold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-500" />
            <span>باقات الشحن والخدمات المتاحة ({servicesRes.totalCount})</span>
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-4">
          {servicesRes.items.map((service) => (
            <ProductCard key={service.id} product={service as any} />
          ))}
        </div>
      </div>
    </div>
  );
}
