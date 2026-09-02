import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { Headphones, ArrowRight, ShieldCheck, UserCheck, MessageSquare, Send } from "lucide-react";
import TicketChatClient from "./TicketChatClient";

export const dynamic = "force-dynamic";

interface TicketDetailPageProps {
  params: {
    ticketNumber: string;
  };
}

export default async function TicketDetailPage({ params }: TicketDetailPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/");
  }

  const ticket = await prisma.supportTicket.findUnique({
    where: { ticketNumber: params.ticketNumber },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
      user: {
        select: { id: true, name: true, image: true, email: true },
      },
    },
  });

  if (!ticket) {
    notFound();
  }

  const isAdmin = ["SUPER_ADMIN", "ADMIN", "SUPPORT", "ORDER_MANAGER"].includes(user.role);
  if (ticket.userId !== user.id && !isAdmin) {
    redirect("/support");
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-right space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-neon-cyan mb-1">
            <Link href="/support" className="hover:underline flex items-center gap-1">
              <span>مركز الدعم</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <span>/</span>
            <span>تذكرة #{ticket.ticketNumber}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">{ticket.subject}</h1>
          <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
            <span>القسم: <strong>{ticket.category}</strong></span>
            {ticket.relatedId && <span>الرقم المرتبط: <strong>{ticket.relatedId}</strong></span>}
            <span>الحالة: <strong className="text-neon-cyan">{ticket.status}</strong></span>
          </div>
        </div>
      </div>

      {/* Messages Thread Container */}
      <div className="p-6 rounded-3xl bg-garage-900/90 border border-gray-800 space-y-6">
        <div className="space-y-4">
          {ticket.messages.map((msg) => {
            const isSupport = msg.senderRole !== "CUSTOMER";
            return (
              <div
                key={msg.id}
                className={`p-4 rounded-2xl border transition ${
                  isSupport
                    ? "bg-cyan-950/30 border-cyan-500/40 mr-4 sm:mr-8"
                    : "bg-garage-850 border-gray-800 ml-4 sm:ml-8"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-white flex items-center gap-1">
                      {isSupport ? (
                        <>
                          <Headphones className="w-3.5 h-3.5 text-neon-cyan" />
                          <span className="text-neon-cyan">{msg.senderName} (فريق الدعم)</span>
                        </>
                      ) : (
                        <>
                          <UserCheck className="w-3.5 h-3.5 text-gray-400" />
                          <span>{msg.senderName}</span>
                        </>
                      )}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-500 font-mono">
                    {formatDate(msg.createdAt)}
                  </span>
                </div>

                <p className="text-xs text-gray-200 leading-relaxed whitespace-pre-line">
                  {msg.message}
                </p>
              </div>
            );
          })}
        </div>

        {/* Reply Box (Client Component) */}
        <TicketChatClient ticketNumber={ticket.ticketNumber} isClosed={ticket.status === "CLOSED"} />
      </div>
    </div>
  );
}
