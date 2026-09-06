"use server";

import { prisma } from "@/lib/prisma";
import { requireAdminRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";

import {
  TelegramBotConfig,
  DEFAULT_TELEGRAM_BOT_CONFIG,
  SETTING_KEY,
} from "@/lib/telegram-bot-config";

export type { TelegramBotConfig };

export async function getTelegramBotConfig(): Promise<TelegramBotConfig> {
  try {
    const setting = await prisma.storeSetting.findUnique({
      where: { key: SETTING_KEY },
    });

    if (!setting?.value) {
      return DEFAULT_TELEGRAM_BOT_CONFIG;
    }

    const parsed = JSON.parse(setting.value);
    return {
      ...DEFAULT_TELEGRAM_BOT_CONFIG,
      ...parsed,
      buttons: {
        ...DEFAULT_TELEGRAM_BOT_CONFIG.buttons,
        ...(parsed.buttons || {}),
      },
    };
  } catch (err) {
    console.error("Failed to load Telegram bot config, falling back to defaults:", err);
    return DEFAULT_TELEGRAM_BOT_CONFIG;
  }
}

export async function updateTelegramBotConfig(config: Partial<TelegramBotConfig>) {
  const admin = await requireAdminRole(["SUPER_ADMIN", "ADMIN"]);

  const current = await getTelegramBotConfig();
  const merged: TelegramBotConfig = {
    ...current,
    ...config,
    buttons: {
      ...current.buttons,
      ...(config.buttons || {}),
    },
  };

  const jsonValue = JSON.stringify(merged);

  await prisma.storeSetting.upsert({
    where: { key: SETTING_KEY },
    create: {
      key: SETTING_KEY,
      value: jsonValue,
    },
    update: {
      value: jsonValue,
    },
  });

  await prisma.auditLog.create({
    data: {
      adminId: admin.id,
      adminEmail: admin.email,
      action: "UPDATE_TELEGRAM_BOT_CONFIG",
      targetType: "SETTINGS",
      targetId: SETTING_KEY,
      afterValue: jsonValue,
    },
  });

  revalidatePath("/admin/telegram");
  return { success: true, config: merged };
}

export async function resetTelegramBotConfig() {
  const admin = await requireAdminRole(["SUPER_ADMIN", "ADMIN"]);

  const jsonValue = JSON.stringify(DEFAULT_TELEGRAM_BOT_CONFIG);

  await prisma.storeSetting.upsert({
    where: { key: SETTING_KEY },
    create: {
      key: SETTING_KEY,
      value: jsonValue,
    },
    update: {
      value: jsonValue,
    },
  });

  await prisma.auditLog.create({
    data: {
      adminId: admin.id,
      adminEmail: admin.email,
      action: "RESET_TELEGRAM_BOT_CONFIG",
      targetType: "SETTINGS",
      targetId: SETTING_KEY,
      afterValue: jsonValue,
    },
  });

  revalidatePath("/admin/telegram");
  return { success: true, config: DEFAULT_TELEGRAM_BOT_CONFIG };
}
