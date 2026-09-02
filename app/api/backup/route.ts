import { NextResponse } from "next/server";
import { requireAdminRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await requireAdminRole(["SUPER_ADMIN"]);

    const [
      users,
      wallets,
      transactions,
      products,
      categories,
      orders,
      depositRequests,
      coupons,
      settings,
      auditLogs,
    ] = await Promise.all([
      prisma.user.findMany(),
      prisma.wallet.findMany(),
      prisma.walletTransaction.findMany(),
      prisma.product.findMany(),
      prisma.category.findMany(),
      prisma.order.findMany({ include: { items: true } }),
      prisma.depositRequest.findMany(),
      prisma.coupon.findMany(),
      prisma.storeSetting.findMany(),
      prisma.auditLog.findMany({ take: 500, orderBy: { createdAt: "desc" } }),
    ]);

    const backupData = {
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      data: {
        users,
        wallets,
        transactions,
        products,
        categories,
        orders,
        depositRequests,
        coupons,
        settings,
        auditLogs,
      },
    };

    return new NextResponse(JSON.stringify(backupData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="cpm_garage_backup_${Date.now()}.json"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "فشل إنشاء النسخة الاحتياطية" }, { status: 403 });
  }
}
