import React from "react";
import { getCurrentAdminUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTelegramBotConfig } from "@/lib/actions/telegram-bot-settings";
import TelegramBotManagerClient from "./TelegramBotManagerClient";

export const dynamic = "force-dynamic";

export default async function AdminTelegramPage() {
  const user = await getCurrentAdminUser();
  if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN")) {
    redirect("/admin/login");
  }

  const config = await getTelegramBotConfig();

  return (
    <div className="space-y-6 text-right">
      <div className="space-y-1 border-b border-gray-800 pb-4">
        <span className="text-xs font-mono font-bold text-neon-cyan uppercase">
          Telegram Bot Management & Content Experience
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-white">
          إعدادات ومحتوى بوت Telegram
        </h1>
        <p className="text-xs text-gray-400">
          تحكم كامل في نصوص الترحيب، رسائل الربط والإشعارات، تسميات وتفعيل الأزرار، مع محاكاة مباشرة لشكل الرسائل على تيليجرام.
        </p>
      </div>

      <TelegramBotManagerClient initialConfig={config} />
    </div>
  );
}
