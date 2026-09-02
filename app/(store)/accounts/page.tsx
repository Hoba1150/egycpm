import React from "react";
import { getProducts } from "@/lib/actions/product";
import ProductCard from "@/components/store/ProductCard";
import { Sparkles, Key, CheckCircle2, Lock } from "lucide-react";
import { getStoreSettings } from "@/lib/actions/settings";

export const dynamic = "force-dynamic";

export default async function AccountsPage() {
  const accountsRes = await getProducts({
    productType: "ACCOUNT",
    limit: 24,
  });

  const settings: Record<string, string> = await getStoreSettings().catch(() => ({}));
  const pageTitle = settings.page_accounts_title || "حسابات Car Parking المميزة";
  const pageDesc = settings.page_accounts_desc || "حسابات جاهزة بالسيارات المعدلة والكاش والكوينز وأعلى الرتب بتسليم فوري";

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-8 text-right space-y-8">
      {/* Header Banner */}
      <div className="rounded-3xl bg-[#0f1218] border border-gray-800 p-6 sm:p-8 shadow-sm">
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold">
            <Key className="w-3.5 h-3.5" />
            <span>حسابات جاهزة VIP - تسليم فوري لبيانات الحساب</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white">{pageTitle}</h1>
          <p className="text-xs sm:text-sm text-gray-400">{pageDesc}</p>

          <div className="flex flex-wrap gap-4 pt-2 text-xs">
            <span className="flex items-center gap-1.5 text-emerald-500 font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>تسليم فوري ومباشر بعد الدفع</span>
            </span>
            <span className="flex items-center gap-1.5 text-orange-500 font-bold">
              <Lock className="w-4 h-4" />
              <span>إمكانية نقل وتغيير بيانات الحساب بالكامل</span>
            </span>
          </div>
        </div>
      </div>

      {/* Accounts Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
          <h2 className="text-lg sm:text-xl font-extrabold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-400" />
            <span>الحسابات الجاهزة المتاحة للبيع ({accountsRes.totalCount})</span>
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-4">
          {accountsRes.items.map((acc) => (
            <ProductCard key={acc.id} product={acc as any} />
          ))}
        </div>
      </div>
    </div>
  );
}
