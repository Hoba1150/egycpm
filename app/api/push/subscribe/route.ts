import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { subscription, action } = body;

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
    }

    const { endpoint, keys } = subscription;
    const p256dh = keys?.p256dh;
    const auth = keys?.auth;

    if (action === "unsubscribe") {
      await prisma.pushSubscription.deleteMany({
        where: { endpoint },
      }).catch(() => {});
      return NextResponse.json({ ok: true, message: "Unsubscribed" });
    }

    if (!p256dh || !auth) {
      return NextResponse.json({ error: "Missing subscription keys" }, { status: 400 });
    }

    let userId: string | null = null;
    try {
      const user = await getCurrentUser();
      if (user) userId = user.id;
    } catch {}

    const ua = req.headers.get("user-agent") || "";

    // Upsert subscription
    await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: {
        p256dh,
        auth,
        userId,
        userAgent: ua.substring(0, 255),
      },
      create: {
        endpoint,
        p256dh,
        auth,
        userId,
        userAgent: ua.substring(0, 255),
      },
    });

    return NextResponse.json({ ok: true, message: "Subscribed successfully" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Subscription failed" }, { status: 500 });
  }
}
