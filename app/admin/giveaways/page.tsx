import React from "react";
import { getCurrentAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import AdminGiveawaysClient from "./AdminGiveawaysClient";

export const dynamic = "force-dynamic";

export default async function AdminGiveawaysPage() {
  const user = await getCurrentAdminUser();
  if (!user || !["SUPER_ADMIN", "ADMIN"].includes(user.role)) {
    redirect("/admin/login");
  }

  const giveaways = await prisma.giveaway.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      entries: true,
      _count: {
        select: { entries: true },
      },
    },
  });

  return (
    <div className="space-y-6">
      <AdminGiveawaysClient giveaways={giveaways} />
    </div>
  );
}
