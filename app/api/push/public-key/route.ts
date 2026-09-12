import { NextResponse } from "next/server";
import { getVapidKeys } from "@/lib/push";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { publicKey } = await getVapidKeys();
    return NextResponse.json({ publicKey });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to get VAPID public key" }, { status: 500 });
  }
}
