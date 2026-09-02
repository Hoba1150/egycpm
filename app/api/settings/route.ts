import { NextResponse } from "next/server";
import { getStoreSettings } from "@/lib/actions/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await getStoreSettings();
    return NextResponse.json({ settings });
  } catch (error: any) {
    return NextResponse.json({ settings: {} }, { status: 500 });
  }
}
