"use server";

import { prisma } from "@/lib/prisma";
import { requireAdminRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";

/**
 * Get all store settings
 */
export async function getStoreSettings() {
  const settings = await prisma.storeSetting.findMany({});
  const map: Record<string, string> = {};
  settings.forEach((s) => {
    map[s.key] = s.value;
  });
  return map;
}

/**
 * Admin: Update Store Settings
 */
export async function updateStoreSettings(updates: Record<string, string>) {
  const admin = await requireAdminRole(["SUPER_ADMIN", "ADMIN"]);

  for (const [key, value] of Object.entries(updates)) {
    await prisma.storeSetting.upsert({
      where: { key },
      create: { key, value: String(value) },
      update: { value: String(value) },
    });
  }

  await prisma.auditLog.create({
    data: {
      adminId: admin.id,
      adminEmail: admin.email,
      action: "UPDATE_STORE_SETTINGS",
      targetType: "SETTINGS",
      targetId: "GLOBAL_SETTINGS",
      afterValue: JSON.stringify(updates),
    },
  });

  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/admin/settings");
  revalidatePath("/shop");
  return { success: true };
}

/**
 * Admin: Get Audit Logs
 */
export async function getAuditLogs(page: number = 1, limit: number = 50) {
  await requireAdminRole(["SUPER_ADMIN", "ADMIN"]);

  const [logs, totalCount] = await Promise.all([
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.auditLog.count(),
  ]);

  return {
    logs,
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
    currentPage: page,
  };
}

/**
 * Admin: Get Dashboard Analytics
 */
export async function getAdminAnalytics() {
  await requireAdminRole(["SUPER_ADMIN", "ADMIN", "ORDER_MANAGER", "SUPPORT"]);

  const [
    totalOrdersCount,
    completedOrdersCount,
    pendingOrdersCount,
    totalRevenueRaw,
    totalCustomersCount,
    pendingDepositsCount,
    approvedDepositsRaw,
    totalProductsCount,
    walletLiabilitiesRaw,
    recentOrders,
    recentDeposits,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: "COMPLETED" } }),
    prisma.order.count({ where: { status: { in: ["PAID", "PROCESSING", "IN_PROGRESS"] } } }),
    prisma.order.aggregate({
      _sum: { total: true },
      where: { status: { in: ["PAID", "PROCESSING", "IN_PROGRESS", "COMPLETED"] } },
    }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.depositRequest.count({ where: { status: "PENDING" } }),
    prisma.depositRequest.aggregate({
      _sum: { amount: true },
      where: { status: "APPROVED" },
    }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.wallet.aggregate({
      _sum: { balance: true, giftBalance: true },
    }),
    prisma.order.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
        items: true,
      },
    }),
    prisma.depositRequest.findMany({
      where: { status: "PENDING" },
      take: 6,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
      },
    }),
  ]);

  const totalRevenue = totalRevenueRaw._sum.total || 0;
  const totalApprovedDeposits = approvedDepositsRaw._sum.amount || 0;
  const totalWalletLiabilities = (walletLiabilitiesRaw._sum.balance || 0) + (walletLiabilitiesRaw._sum.giftBalance || 0);

  // Sales Chart simulation based on real data
  const chartData = [
    { name: "السبت", revenue: Math.round(totalRevenue * 0.12), orders: Math.max(1, Math.round(totalOrdersCount * 0.1)) },
    { name: "الأحد", revenue: Math.round(totalRevenue * 0.18), orders: Math.max(2, Math.round(totalOrdersCount * 0.15)) },
    { name: "الاثنين", revenue: Math.round(totalRevenue * 0.15), orders: Math.max(1, Math.round(totalOrdersCount * 0.12)) },
    { name: "الثلاثاء", revenue: Math.round(totalRevenue * 0.22), orders: Math.max(3, Math.round(totalOrdersCount * 0.2)) },
    { name: "الأربعاء", revenue: Math.round(totalRevenue * 0.14), orders: Math.max(2, Math.round(totalOrdersCount * 0.14)) },
    { name: "الخميس", revenue: Math.round(totalRevenue * 0.28), orders: Math.max(4, Math.round(totalOrdersCount * 0.25)) },
    { name: "الجمعة", revenue: Math.round(totalRevenue * 0.32), orders: Math.max(5, Math.round(totalOrdersCount * 0.3)) },
  ];

  return {
    totalRevenue,
    totalOrdersCount,
    completedOrdersCount,
    pendingOrdersCount,
    totalCustomersCount,
    pendingDepositsCount,
    totalApprovedDeposits,
    totalProductsCount,
    totalWalletLiabilities,
    recentOrders,
    recentDeposits,
    chartData,
  };
}

/**
 * Admin: Get live notification counts for admin sidebar badges
 */
export async function getAdminSidebarCounts() {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);

    const [
      pendingOrders,
      pendingDeposits,
      openTickets,
      activeGiveaways,
      newCustomers,
      cpm2Products,
      totalReviews,
      newOrdersToday,
    ] = await Promise.all([
      // Active/pending orders needing action
      prisma.order.count({
        where: { status: { in: ["PAID", "PROCESSING", "IN_PROGRESS"] } },
      }),
      // Pending deposit requests
      prisma.depositRequest.count({
        where: { status: "PENDING" },
      }),
      // Open support tickets
      prisma.supportTicket.count({
        where: { status: "OPEN" },
      }),
      // Active giveaways
      prisma.giveaway.count({
        where: { isActive: true },
      }),
      // New customers in last 7 days
      prisma.user.count({
        where: {
          role: "CUSTOMER",
          createdAt: { gte: weekStart },
        },
      }),
      // CPM2 products (active category or productType)
      prisma.product.count({
        where: {
          OR: [
            { productType: "CPM2" },
            { category: { slug: "cpm-2" } },
          ],
        },
      }),
      // Unapproved/visible reviews
      prisma.review.count({
        where: { isHidden: false, isApproved: false },
      }),
      // New orders today
      prisma.order.count({
        where: { createdAt: { gte: todayStart } },
      }),
    ]);

    return {
      "/admin/orders": pendingOrders,
      "/admin/deposits": pendingDeposits,
      "/admin/tickets": openTickets,
      "/admin/giveaways": activeGiveaways,
      "/admin/customers": newCustomers,
      "/admin/cpm2": cpm2Products,
      "/admin/reviews": totalReviews,
      "_newOrdersToday": newOrdersToday,
    };
  } catch {
    return {};
  }
}
