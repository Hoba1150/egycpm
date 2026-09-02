"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireAdminRole } from "@/lib/auth";
import { generateTicketNumber } from "@/lib/utils";
import { revalidatePath } from "next/cache";

/**
 * Customer: Create Support Ticket
 */
export async function createSupportTicket(data: {
  subject: string;
  category: "ORDER" | "DEPOSIT" | "WALLET" | "PRODUCT" | "GENERAL";
  relatedId?: string;
  message: string;
  priority?: string;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("يجب تسجيل الدخول لفتح تذكرة دعم.");

  if (!data.subject || data.subject.trim().length < 4) {
    throw new Error("يرجى إدخال عنوان واضح للتذكرة.");
  }

  if (!data.message || data.message.trim().length < 10) {
    throw new Error("يرجى كتابة تفاصيل المشكلة أو الاستفسار (10 أحرف على الأقل).");
  }

  const ticketNumber = generateTicketNumber();

  const ticket = await prisma.supportTicket.create({
    data: {
      ticketNumber,
      userId: user.id,
      subject: data.subject.trim(),
      category: data.category,
      relatedId: data.relatedId || null,
      priority: data.priority || "MEDIUM",
      status: "OPEN",
      messages: {
        create: {
          senderId: user.id,
          senderRole: user.role,
          senderName: user.name || "العميل",
          message: data.message.trim(),
        },
      },
    },
    include: {
      messages: true,
    },
  });

  // Create notification
  await prisma.notification.create({
    data: {
      userId: user.id,
      title: "تم فتح تذكرة دعم فني جديدة 🎫",
      message: `تذكرتك رقم ${ticketNumber} بعنوان (${data.subject}) تم استلامها وجاري الرد من قبل فريق الدعم.`,
      type: "SYSTEM",
      link: `/support/${ticketNumber}`,
    },
  });

  revalidatePath("/support");
  revalidatePath("/admin/tickets");
  return { success: true, ticket };
}

/**
 * Send Reply in Support Ticket
 */
export async function replyToTicket(ticketNumber: string, message: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("يجب تسجيل الدخول للرد.");

  if (!message || !message.trim()) {
    throw new Error("لا يمكن إرسال رسالة فارغة.");
  }

  const ticket = await prisma.supportTicket.findUnique({
    where: { ticketNumber },
    include: { user: true },
  });

  if (!ticket) throw new Error("التذكرة غير موجودة.");

  const isAdmin = ["SUPER_ADMIN", "ADMIN", "SUPPORT", "ORDER_MANAGER"].includes(user.role);
  if (ticket.userId !== user.id && !isAdmin) {
    throw new Error("غير مصرح لك بالرد على هذه التذكرة.");
  }

  const newStatus = isAdmin ? "ANSWERED" : "OPEN";

  const [msg] = await Promise.all([
    prisma.ticketMessage.create({
      data: {
        ticketId: ticket.id,
        senderId: user.id,
        senderRole: user.role,
        senderName: user.name || (isAdmin ? "الدعم الفني" : "العميل"),
        message: message.trim(),
      },
    }),
    prisma.supportTicket.update({
      where: { id: ticket.id },
      data: {
        status: newStatus,
        updatedAt: new Date(),
      },
    }),
  ]);

  if (isAdmin) {
    await prisma.notification.create({
      data: {
        userId: ticket.userId,
        title: "رد جديد من الدعم الفني 💬",
        message: `قام فريق الدعم بالرد على تذكرتك رقم ${ticket.ticketNumber}.`,
        type: "SYSTEM",
        link: `/support/${ticket.ticketNumber}`,
      },
    });
  }

  revalidatePath(`/support/${ticketNumber}`);
  revalidatePath("/admin/tickets");
  return { success: true, message: msg };
}

/**
 * Admin: Close / Update Ticket Status
 */
export async function updateTicketStatus(ticketNumber: string, status: "OPEN" | "ANSWERED" | "CLOSED") {
  await requireAdminRole(["SUPER_ADMIN", "ADMIN", "SUPPORT"]);

  const ticket = await prisma.supportTicket.update({
    where: { ticketNumber },
    data: { status },
  });

  revalidatePath(`/support/${ticketNumber}`);
  revalidatePath("/admin/tickets");
  return { success: true, ticket };
}
