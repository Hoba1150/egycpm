import { NextResponse } from "next/server";
import { handleCustomerLogin, handleAdminLogin } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, isAdminLogin } = body;

    if (!email || !password) {
      return NextResponse.json(
        { message: "يرجى إدخال البريد الإلكتروني وكلمة المرور." },
        { status: 400 }
      );
    }

    if (isAdminLogin) {
      const user = await handleAdminLogin(email, password);
      return NextResponse.json({ success: true, user });
    }

    const user = await handleCustomerLogin(email, password);
    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    console.error("Auth error:", error);
    return NextResponse.json(
      { message: error.message || "حدث خطأ أثناء تسجيل الدخول." },
      { status: 400 }
    );
  }
}
