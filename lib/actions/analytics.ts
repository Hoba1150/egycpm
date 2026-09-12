"use server";

import { prisma } from "@/lib/prisma";
import { requireAdminRole } from "@/lib/auth";

export async function getVisitorAnalytics(range: "today" | "7d" | "30d" | "all" = "7d") {
  await requireAdminRole(["SUPER_ADMIN", "ADMIN"]);

  const now = new Date();
  let startDate = new Date();

  if (range === "today") {
    startDate.setHours(0, 0, 0, 0);
  } else if (range === "7d") {
    startDate.setDate(now.getDate() - 7);
  } else if (range === "30d") {
    startDate.setDate(now.getDate() - 30);
  } else {
    startDate = new Date(0); // all time
  }

  const whereClause = range === "all" ? {} : { createdAt: { gte: startDate } };

  // 1. Total counts
  const [
    totalViews,
    todayViews,
    weekViews,
    recentVisits,
  ] = await Promise.all([
    prisma.pageView.count({ where: whereClause }),
    prisma.pageView.count({
      where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
    }),
    prisma.pageView.count({
      where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
    }),
    prisma.pageView.findMany({
      where: whereClause,
      take: 60,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // 2. Aggregate breakdown
  // Countries
  const countryCounts = await prisma.pageView.groupBy({
    by: ["country", "countryCode"],
    where: whereClause,
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 10,
  });

  // Top Pages
  const pageCounts = await prisma.pageView.groupBy({
    by: ["path"],
    where: whereClause,
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 10,
  });

  // Devices
  const deviceCounts = await prisma.pageView.groupBy({
    by: ["device"],
    where: whereClause,
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
  });

  // Browsers
  const browserCounts = await prisma.pageView.groupBy({
    by: ["browser"],
    where: whereClause,
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 6,
  });

  // Referrers
  const referrerCounts = await prisma.pageView.groupBy({
    by: ["referrer"],
    where: whereClause,
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 6,
  });

  // 3. Daily Chart for the last 14 days
  const dailyStats: Record<string, number> = {};
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    dailyStats[key] = 0;
  }

  const chartStart = new Date();
  chartStart.setDate(chartStart.getDate() - 14);

  const rawDaily = await prisma.pageView.findMany({
    where: { createdAt: { gte: chartStart } },
    select: { createdAt: true },
  });

  rawDaily.forEach((item) => {
    const key = item.createdAt.toISOString().split("T")[0];
    if (dailyStats[key] !== undefined) {
      dailyStats[key]++;
    }
  });

  const chartData = Object.entries(dailyStats).map(([date, count]) => {
    const d = new Date(date);
    const dayNames = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
    const dayName = dayNames[d.getDay()];
    return {
      date,
      label: `${dayName} (${d.getDate()}/${d.getMonth() + 1})`,
      count,
    };
  });

  // Unique IP count (approximate)
  const uniqueIps = new Set(recentVisits.map((v) => v.ip).filter(Boolean)).size;

  return {
    totalViews,
    todayViews,
    weekViews,
    uniqueVisitorsApprox: uniqueIps,
    countries: countryCounts.map((c) => ({
      name: c.country || "غير محدد",
      code: c.countryCode || "UN",
      count: c._count.id,
      percentage: totalViews > 0 ? Math.round((c._count.id / totalViews) * 100) : 0,
    })),
    pages: pageCounts.map((p) => ({
      path: p.path,
      count: p._count.id,
      percentage: totalViews > 0 ? Math.round((p._count.id / totalViews) * 100) : 0,
    })),
    devices: deviceCounts.map((d) => ({
      name: d.device || "Desktop",
      count: d._count.id,
      percentage: totalViews > 0 ? Math.round((d._count.id / totalViews) * 100) : 0,
    })),
    browsers: browserCounts.map((b) => ({
      name: b.browser || "Other",
      count: b._count.id,
      percentage: totalViews > 0 ? Math.round((b._count.id / totalViews) * 100) : 0,
    })),
    referrers: referrerCounts.map((r) => ({
      name: r.referrer || "Direct",
      count: r._count.id,
      percentage: totalViews > 0 ? Math.round((r._count.id / totalViews) * 100) : 0,
    })),
    chartData,
    recentVisits,
  };
}
