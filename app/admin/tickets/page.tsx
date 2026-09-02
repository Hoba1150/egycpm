import React from "react";
import { getCurrentAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { Headphones, Clock, CheckCircle2, MessageSquare, ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminTicketsPage() {
  const user = await getCurrentAdminUser();
  if (!user || !["SUPER_ADMIN", "ADMIN", "SUPPORT"].includes(user.role)) {
    redirect("/admin/login");
  }

  const tickets = await prisma.supportTicket.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      user: { select: { name: true, email: true } },
      messages: { take: 1, orderBy: { createdAt: "desc" } },
    },
    take: 100,
  });

  return (
    <div className="space-y-6 text-right">
      <div className="space-y-1 border-b border-gray-800 pb-4">
        <span className="text-xs font-mono font-bold text-orange-400 uppercase">
          Helpdesk Desk & Support Inquiries
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-white">
          تذاكر الدعم الفني واستفسارات العملاء
        </h1>
        <p className="text-xs text-gray-400">
          الرد على استفسارات اللاعبين ومتابعة مشاكل التسليم وشحن المحفظة.
        </p>
      </div>

      <div className="rounded-2xl bg-[#12161f] border border-gray-800 overflow-hidden">
        {tickets.length === 0 ? (
          <div className="p-12 text-center text-gray-500 text-xs">
            لا توجد أي تذاكر دعم فني حالياً.
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {tickets.map((t) => (
              <div
                key={t.id}
                className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-[#1a202c]/50 transition"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-orange-500 text-xs">#{t.ticketNumber}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        t.status === "OPEN"
                          ? "bg-amber-500/20 text-yellow-400 animate-pulse"
                          : t.status === "ANSWERED"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-gray-800 text-gray-400"
                      }`}
                    >
                      {t.status}
                    </span>
                    <span className="text-[10px] text-gray-400">القسم: {t.category}</span>
                  </div>

                  <h3 className="text-sm font-bold text-white truncate">{t.subject}</h3>
                  <p className="text-xs text-gray-400">
                    العميل: <strong>{t.user?.name || t.user?.email}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-4 self-end sm:self-auto">
                  <span className="text-[10px] text-gray-500 font-mono">{formatDate(t.updatedAt)}</span>
                  <Link
                    href={`/support/${t.ticketNumber}`}
                    className="px-4 py-2 rounded-xl bg-[#1a202c] hover:bg-orange-500/10 border border-gray-700 text-xs font-bold text-orange-500 transition flex items-center gap-1.5"
                  >
                    <span>فتح والمحادثة</span>
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
