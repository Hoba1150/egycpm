import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { PlusCircle, MessageSquare } from "lucide-react";
import { formatDate } from "@/lib/utils";
import NewTicketForm from "./NewTicketForm";
import { getStoreSettings } from "@/lib/actions/settings";

export const dynamic = "force-dynamic";

interface SupportPageProps {
  searchParams: {
    relatedId?: string;
  };
}

export default async function SupportPage({ searchParams }: SupportPageProps) {
  const user = await getCurrentUser();

  const settings: Record<string, string> = await getStoreSettings().catch(() => ({}));
  const pageTitle = settings.page_support_title || "الدعم الفني والمساعدة";
  const pageDesc = settings.page_support_desc || "فريق الدعم متاح 24/7 للرد على استفساراتك ومتابعة كافة الطلبات";

  const tickets = user
    ? await prisma.supportTicket.findMany({
        where: { userId: user.id },
        orderBy: { updatedAt: "desc" },
        include: {
          messages: {
            take: 1,
            orderBy: { createdAt: "desc" },
          },
        },
      })
    : [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ANSWERED":
        return <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 text-xs font-bold">تم الرد 💬</span>;
      case "CLOSED":
        return <span className="px-2 py-0.5 rounded-lg bg-gray-800 text-gray-400 text-xs font-medium">مغلقة</span>;
      default:
        return <span className="px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/30 text-xs font-bold">قيد المراجعة ⏳</span>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-8 text-right space-y-6">
      {/* Header */}
      <div className="space-y-1 border-b border-gray-800 pb-4">
        <span className="text-xs font-mono font-bold text-orange-500 uppercase">
          Help Center
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{pageTitle}</h1>
        <p className="text-xs sm:text-sm text-gray-400">
          {pageDesc}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Create Ticket Form (Right) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-5 sm:p-6 rounded-2xl bg-[#0f1218] border border-gray-800 shadow-sm space-y-4">
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-orange-500" />
              <span>فتح تذكرة دعم فني جديدة</span>
            </h2>

            <NewTicketForm user={user} defaultRelatedId={searchParams.relatedId} />
          </div>
        </div>

        {/* Existing Tickets List (Left) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-5 sm:p-6 rounded-2xl bg-[#0f1218] border border-gray-800 shadow-sm space-y-4">
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-orange-500" />
              <span>تذاكري السابقة ({tickets.length})</span>
            </h2>

            {!user ? (
              <p className="text-xs text-gray-400 py-6 text-center">
                يرجى تسجيل الدخول لمشاهدة تذاكرك السابقة.
              </p>
            ) : tickets.length === 0 ? (
              <p className="text-xs text-gray-400 py-6 text-center">
                لا توجد تذاكر مفتوحة حالياً. يمكنك فتح تذكرة جديدة وسنرد عليك فوراً.
              </p>
            ) : (
              <div className="space-y-3">
                {tickets.map((t) => (
                  <Link
                    key={t.id}
                    href={`/support/${t.ticketNumber}`}
                    className="p-4 rounded-xl bg-[#161b24] border border-gray-700 hover:border-orange-500/50 transition block space-y-2 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-orange-500">
                        #{t.ticketNumber}
                      </span>
                      {getStatusBadge(t.status)}
                    </div>

                    <h4 className="text-xs sm:text-sm font-extrabold text-white group-hover:text-orange-500 transition">
                      {t.subject}
                    </h4>

                    {t.messages[0] && (
                      <p className="text-xs text-gray-400 line-clamp-1">
                        {t.messages[0].senderName}: {t.messages[0].message}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-gray-700/80 text-[10px] text-gray-500">
                      <span>القسم: {t.category}</span>
                      <span>{formatDate(t.updatedAt)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
