"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getActiveGiveaways() {
  try {
    return await prisma.giveaway.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { entries: true },
        },
      },
    });
  } catch (error) {
    console.error("Error fetching giveaways:", error);
    return [];
  }
}

export async function enterGiveaway(data: {
  giveawayId: string;
  userName: string;
  gameId: string;
  phone: string;
  userId?: string;
}) {
  try {
    const giveaway = await prisma.giveaway.findUnique({
      where: { id: data.giveawayId },
    });

    if (!giveaway) throw new Error("السحب غير موجود.");
    if (giveaway.status !== "ACTIVE") {
      throw new Error("عذراً، هذا السحب منتهي أو غير نشط.");
    }

    // Check duplicate phone entry
    const existing = await prisma.giveawayEntry.findUnique({
      where: {
        giveawayId_phone: {
          giveawayId: data.giveawayId,
          phone: data.phone.trim(),
        },
      },
    });

    if (existing) {
      throw new Error("هذا الرقم مسجل بالفعل في هذا السحب!");
    }

    // If entry fee > 0, deduct from wallet
    if (giveaway.entryFee > 0) {
      if (!data.userId) {
        throw new Error("يجب تسجيل الدخول للاشتراك في السحوبات المدفوعة عبر المحفظة.");
      }

      const wallet = await prisma.wallet.findUnique({
        where: { userId: data.userId },
      });

      const totalAvailable = (wallet?.balance || 0) + (wallet?.giftBalance || 0);
      if (!wallet || totalAvailable < giveaway.entryFee) {
        throw new Error(`رصيد المحفظة غير كافٍ. رسوم الاشتراك: ${giveaway.entryFee} ج.م.`);
      }

      // Deduct fee
      let remainingFee = giveaway.entryFee;
      let newGift = wallet.giftBalance;
      let newBalance = wallet.balance;

      if (newGift >= remainingFee) {
        newGift -= remainingFee;
      } else {
        remainingFee -= newGift;
        newGift = 0;
        newBalance -= remainingFee;
      }

      await prisma.wallet.update({
        where: { userId: data.userId },
        data: {
          balance: newBalance,
          giftBalance: newGift,
          totalSpent: { increment: giveaway.entryFee },
          transactions: {
            create: {
              type: "PURCHASE",
              amount: giveaway.entryFee,
              beforeBalance: wallet.balance,
              afterBalance: newBalance,
              beforeGiftBalance: wallet.giftBalance,
              afterGiftBalance: newGift,
              description: `رسوم الاشتراك في سحب: ${giveaway.title}`,
            },
          },
        },
      });
    }

    // Register Entry
    const entry = await prisma.giveawayEntry.create({
      data: {
        giveawayId: data.giveawayId,
        userName: data.userName.trim(),
        gameId: data.gameId.trim(),
        phone: data.phone.trim(),
        userId: data.userId || null,
      },
    });

    revalidatePath("/giveaways");
    return { success: true, entry };
  } catch (error: any) {
    throw new Error(error.message || "فشل الاشتراك في السحب.");
  }
}

// Admin Actions
export async function createGiveaway(data: {
  title: string;
  description: string;
  prizeName: string;
  prizeImage?: string;
  entryFee: number;
  endDate: string;
}) {
  try {
    const giveaway = await prisma.giveaway.create({
      data: {
        title: data.title,
        description: data.description,
        prizeName: data.prizeName,
        prizeImage: data.prizeImage || null,
        entryFee: Number(data.entryFee) || 0,
        endDate: new Date(data.endDate),
        status: "ACTIVE",
      },
    });

    revalidatePath("/giveaways");
    revalidatePath("/admin/giveaways");
    return { success: true, giveaway };
  } catch (error: any) {
    throw new Error(error.message || "فشل إنشاء السحب.");
  }
}

export async function drawGiveawayWinner(giveawayId: string, winnerEntryId?: string) {
  try {
    const entries = await prisma.giveawayEntry.findMany({
      where: { giveawayId },
    });

    if (entries.length === 0) {
      throw new Error("لا يوجد مشتركين في هذا السحب بعد!");
    }

    let winner;
    if (winnerEntryId) {
      winner = entries.find((e) => e.id === winnerEntryId);
    } else {
      // Random draw
      const randomIndex = Math.floor(Math.random() * entries.length);
      winner = entries[randomIndex];
    }

    if (!winner) throw new Error("تعذر تحديد الفائز.");

    const updated = await prisma.giveaway.update({
      where: { id: giveawayId },
      data: {
        status: "COMPLETED",
        winnerName: winner.userName,
        winnerGameId: winner.gameId,
        winnerPhone: winner.phone,
        winnerUserId: winner.userId,
      },
    });

    revalidatePath("/giveaways");
    revalidatePath("/admin/giveaways");
    return { success: true, winner: updated };
  } catch (error: any) {
    throw new Error(error.message || "فشل إجراء السحب.");
  }
}

export async function deleteGiveaway(giveawayId: string) {
  try {
    await prisma.giveaway.delete({
      where: { id: giveawayId },
    });
    revalidatePath("/giveaways");
    revalidatePath("/admin/giveaways");
    return { success: true };
  } catch (error: any) {
    throw new Error(error.message || "فشل حذف السحب.");
  }
}
