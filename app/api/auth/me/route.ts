import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ user: null });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: session.id },
      include: {
        wallet: true,
      },
    });

    if (!dbUser || dbUser.status === "BANNED") {
      return NextResponse.json({ user: null });
    }

    const balance = dbUser.wallet?.balance ?? 0;
    const giftBalance = dbUser.wallet?.giftBalance ?? 0;
    const totalAvailable = Number((balance + giftBalance).toFixed(2));

    return NextResponse.json({
      user: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        image: dbUser.image,
        role: dbUser.role,
        status: dbUser.status,
        wallet: {
          balance,
          giftBalance,
          totalAvailable,
          totalDeposited: dbUser.wallet?.totalDeposited ?? 0,
          totalSpent: dbUser.wallet?.totalSpent ?? 0,
        },
      },
    });
  } catch (error) {
    console.error("Fetch /api/auth/me error:", error);
    return NextResponse.json({ user: null });
  }
}
