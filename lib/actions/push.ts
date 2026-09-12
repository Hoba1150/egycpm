"use server";

import { prisma } from "@/lib/prisma";
import { requireAdminRole } from "@/lib/auth";
import { sendBroadcastPush, sendPushNotification } from "@/lib/push";
import { revalidatePath } from "next/cache";

export async function getPushSubscribersStats() {
  await requireAdminRole(["SUPER_ADMIN", "ADMIN"]);

  const [totalCount, recentSubs] = await Promise.all([
    prisma.pushSubscription.count(),
    prisma.pushSubscription.findMany({
      take: 20,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
      },
    }),
  ]);

  return {
    totalCount,
    recentSubs,
  };
}

export async function sendPushBroadcastAction(formData: {
  title: string;
  body: string;
  url?: string;
  image?: string;
  requireInteraction?: boolean;
}) {
  await requireAdminRole(["SUPER_ADMIN", "ADMIN"]);

  if (!formData.title || !formData.body) {
    throw new Error("عنوان الإشعار ونص الرسالة مطلوبان.");
  }

  const result = await sendBroadcastPush({
    title: formData.title.trim(),
    body: formData.body.trim(),
    url: formData.url?.trim() || "/",
    image: formData.image?.trim() || undefined,
    requireInteraction: formData.requireInteraction ?? true,
  });

  revalidatePath("/admin/push");
  return result;
}
