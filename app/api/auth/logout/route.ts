import { NextResponse } from "next/server";
import { clearCustomerSession, clearAdminSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const type = url.searchParams.get("type");

    if (type === "admin") {
      await clearAdminSession();
    } else {
      await clearCustomerSession();
    }

    return NextResponse.json({ success: true, message: "تم تسجيل الخروج بنجاح." });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "حدث خطأ أثناء الخروج." }, { status: 400 });
  }
}
