import React from "react";
import { getCurrentAdminUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getPushSubscribersStats } from "@/lib/actions/push";
import PushBroadcastClient from "@/components/admin/PushBroadcastClient";
import { BellRing, ExternalLink } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminPushPage() {
  const user = await getCurrentAdminUser();
  if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN")) {
    redirect("/admin/login");
  }

  const stats = await getPushSubscribersStats();

  return (
    <div className="space-y-6 text-right">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <BellRing className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              مركز إشعارات الويب والمتصفح (Web Push Broadcast)
            </h1>
          </div>
          <p className="text-xs text-gray-400">
            أرسل تنبيهات إعلانية وعروض فورية تظهر على شاشات هواتف وحواسيب كافة الزوار المشتركين حتى عندما يكون المتجر مغلقاً.
          </p>
        </div>

        <Link
          href="/"
          target="_blank"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#12161f] border border-gray-700 text-xs font-bold text-gray-300 hover:text-white hover:border-cyan-500/50 transition w-fit"
        >
          <span>تصفح المتجر</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      <PushBroadcastClient initialStats={stats} />
    </div>
  );
}
