import { NextResponse } from "next/server";
import { handleCustomerRegister } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, phone } = body;

    if (!email || !password) {
      return NextResponse.json(
        { message: "يرجى إدخال البريد الإلكتروني وكلمة المرور." },
        { status: 400 }
      );
    }

    if (password.length < 5) {
      return NextResponse.json(
        { message: "كلمة المرور يجب ألا تقل عن 5 أحرف أو أرقام." },
        { status: 400 }
      );
    }

    const user = await handleCustomerRegister({
      name: name || email.split("@")[0],
      email,
      password,
      phone,
    });

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    console.error("Register error:", error);
    return NextResponse.json(
      { message: error.message || "حدث خطأ أثناء إنشاء الحساب." },
      { status: 400 }
    );
  }
}
