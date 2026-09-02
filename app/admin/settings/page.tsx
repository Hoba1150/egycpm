import React from "react";
import { getCurrentAdminUser } from "@/lib/auth";
import { getStoreSettings } from "@/lib/actions/settings";
import { redirect } from "next/navigation";
import SettingsClient from "./SettingsClient";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const user = await getCurrentAdminUser();
  if (!user || user.role !== "SUPER_ADMIN") {
    redirect("/admin/login");
  }

  const settings = await getStoreSettings();

  return (
    <div className="space-y-6 text-right">
      <div className="space-y-1 border-b border-gray-800 pb-4">
        <span className="text-xs font-mono font-bold text-neon-cyan uppercase">
          Master Configuration & Backups
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-white">
          إعدادات المتجر والنسخ الاحتياطي
        </h1>
        <p className="text-xs text-gray-400">
          التحكم في أرقام الكاش، العملة، وضع الصيانة، وتحميل النسخ الاحتياطية لقاعدة البيانات.
        </p>
      </div>

      <SettingsClient initialSettings={settings} />
    </div>
  );
}
