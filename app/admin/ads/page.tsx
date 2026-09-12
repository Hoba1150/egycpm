import React from "react";
import { getCurrentAdminUser } from "@/lib/auth";
import { getStoreSettings } from "@/lib/actions/settings";
import { redirect } from "next/navigation";
import AdsManagerClient from "@/components/admin/AdsManagerClient";
import { Megaphone, ExternalLink } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminAdsPage() {
  const user = await getCurrentAdminUser();
  if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN")) {
    redirect("/admin/login");
  }

  const settings = await getStoreSettings();

  return (
    <div className="space-y-6 text-right">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <Megaphone className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              إدارة المساحات الإعلانية والشراكات
            </h1>
          </div>
          <p className="text-xs text-gray-400">
            تحكم كامل وسريع في جميع البانرات الإعلانية، القصص المؤقتة (12 ساعة)، والمساحات الترويجية بكافة صفحات المتجر.
          </p>
        </div>

        <Link
          href="/"
          target="_blank"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#12161f] border border-gray-700 text-xs font-bold text-gray-300 hover:text-white hover:border-amber-500/50 transition w-fit"
        >
          <span>معاينة المتجر لايف</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      <AdsManagerClient initialSettings={settings} />
    </div>
  );
}
