import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import NotificationDetailClient from "./NotificationDetailClient";

export const dynamic = "force-dynamic";

interface NotificationDetailPageProps {
  params: {
    id: string;
  };
}

export default async function NotificationDetailPage({
  params,
}: NotificationDetailPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/");
  }

  const notification = await prisma.notification.findFirst({
    where: {
      id: params.id,
      userId: user.id,
    },
  });

  if (!notification) {
    notFound();
  }

  // Mark as read automatically when viewed in full page
  if (!notification.isRead) {
    await prisma.notification.update({
      where: { id: notification.id },
      data: { isRead: true },
    }).catch(() => {});
  }

  return (
    <NotificationDetailClient
      notification={{
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        isRead: true,
        link: notification.link,
        createdAt: notification.createdAt.toISOString(),
      }}
    />
  );
}
