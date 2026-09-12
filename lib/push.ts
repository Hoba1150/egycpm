import webpush from "web-push";
import { prisma } from "@/lib/prisma";

interface PushPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  requireInteraction?: boolean;
}

// Ensure VAPID keys exist (either in env or in StoreSetting table)
export async function getVapidKeys(): Promise<{ publicKey: string; privateKey: string }> {
  const envPublic = process.env.VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const envPrivate = process.env.VAPID_PRIVATE_KEY;

  if (envPublic && envPrivate) {
    return { publicKey: envPublic, privateKey: envPrivate };
  }

  // Check in database
  const [pubSetting, privSetting] = await Promise.all([
    prisma.storeSetting.findUnique({ where: { key: "vapid_public_key" } }),
    prisma.storeSetting.findUnique({ where: { key: "vapid_private_key" } }),
  ]);

  if (pubSetting?.value && privSetting?.value) {
    return { publicKey: pubSetting.value, privateKey: privSetting.value };
  }

  // Generate new pair and persist
  const newKeys = webpush.generateVAPIDKeys();
  await prisma.$transaction([
    prisma.storeSetting.upsert({
      where: { key: "vapid_public_key" },
      update: { value: newKeys.publicKey },
      create: { key: "vapid_public_key", value: newKeys.publicKey },
    }),
    prisma.storeSetting.upsert({
      where: { key: "vapid_private_key" },
      update: { value: newKeys.privateKey },
      create: { key: "vapid_private_key", value: newKeys.privateKey },
    }),
  ]);

  return { publicKey: newKeys.publicKey, privateKey: newKeys.privateKey };
}

// Configure web-push details
export async function setupWebPush() {
  const { publicKey, privateKey } = await getVapidKeys();
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@egycpm.com";
  webpush.setVapidDetails(subject, publicKey, privateKey);
  return { publicKey, privateKey };
}

// Send push notification to a single subscriber
export async function sendPushNotification(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: PushPayload
) {
  await setupWebPush();

  const pushSubscription = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.p256dh,
      auth: subscription.auth,
    },
  };

  const payloadString = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url || "/",
    icon: payload.icon || "/icons/icon-192x192.png",
    badge: payload.badge || "/icons/icon-192x192.png",
    image: payload.image || undefined,
    tag: payload.tag || "egycpm-notification",
    requireInteraction: payload.requireInteraction ?? false,
  });

  return webpush.sendNotification(pushSubscription, payloadString);
}

// Broadcast push notification to all subscribers with automatic cleanup of invalid endpoints
export async function sendBroadcastPush(payload: PushPayload) {
  await setupWebPush();

  const subscribers = await prisma.pushSubscription.findMany({
    select: { id: true, endpoint: true, p256dh: true, auth: true },
  });

  if (subscribers.length === 0) {
    return { successCount: 0, failedCount: 0, total: 0 };
  }

  let successCount = 0;
  let failedCount = 0;
  const expiredIds: string[] = [];

  const promises = subscribers.map(async (sub) => {
    try {
      await sendPushNotification(sub, payload);
      successCount++;
    } catch (err: any) {
      failedCount++;
      // 404 or 410 means subscription is expired / user revoked permission
      if (err.statusCode === 404 || err.statusCode === 410) {
        expiredIds.push(sub.id);
      }
    }
  });

  await Promise.allSettled(promises);

  // Clean up expired subscriptions
  if (expiredIds.length > 0) {
    await prisma.pushSubscription.deleteMany({
      where: { id: { in: expiredIds } },
    }).catch(() => {});
  }

  return {
    successCount,
    failedCount,
    total: subscribers.length,
    cleanedCount: expiredIds.length,
  };
}
