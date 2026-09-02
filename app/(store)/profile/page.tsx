import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import {
  User as UserIcon,
  Wallet,
  ShoppingBag,
  ShieldCheck,
  Calendar,
  Mail,
  Zap,
  Key,
  Flame,
  ArrowLeft,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) {
    redirect("/");
  }

  const [dbUser, ordersCount, ticketsCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: sessionUser.id },
      include: { wallet: true },
    }),
    prisma.order.count({ where: { userId: sessionUser.id } }),
    prisma.supportTicket.count({ where: { userId: sessionUser.id } }),
  ]);

  if (!dbUser) {
    redirect("/");
  }

  const wallet = dbUser.wallet;
  const totalAvailable = (wallet?.balance || 0) + (wallet?.giftBalance || 0);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-right space-y-10">
      {/* Header Profile Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-garage-900 border border-cyan-500/30 shadow-glow-cyan-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
          {/* Avatar */}
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden bg-garage-950 border-2 border-cyan-500 shadow-glow-cyan shrink-0">
            <img
              src={dbUser.image || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200"}
              alt={dbUser.name || "User"}
              className="w-full h-full object-cover"
            />
          </div>

          {/* User Bio */}
          <div className="flex-1 text-center sm:text-right space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-white">{dbUser.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-neon-cyan border border-cyan-500/40 text-xs font-bold">
                {dbUser.role === "SUPER_ADMIN" ? "المالك / Super Admin" : dbUser.role === "ORDER_MANAGER" ? "مسؤول تنفيذ الطلبات" : "لاعب معتمد (Racer)"}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-green-500/20 text-neon-green border border-green-500/40 text-xs font-bold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>حساب نشط</span>
              </span>
            </div>

            <p className="text-xs text-gray-400 font-mono flex items-center justify-center sm:justify-start gap-1">
              <Mail className="w-3.5 h-3.5" />
              <span>{dbUser.email}</span>
            </p>

            <p className="text-[11px] text-gray-500 font-mono flex items-center justify-center sm:justify-start gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>عضو منذ: {formatDate(dbUser.createdAt)}</span>
            </p>

            <div className="pt-2 text-[10px] text-gray-500 font-mono">
              معرف الحساب الداخلي: {dbUser.id}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-garage-900 border border-cyan-500/20 text-right space-y-1">
          <span className="text-[11px] text-gray-400 block">إجمالي الرصيد المتاح</span>
          <span className="text-lg sm:text-xl font-black text-neon-green font-mono">
            {formatCurrency(totalAvailable)}
          </span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-garage-900 border border-purple-500/20 text-right space-y-1">
          <span className="text-[11px] text-gray-400 block">رصيد الهدايا</span>
          <span className="text-lg sm:text-xl font-black text-neon-purple font-mono">
            {formatCurrency(wallet?.giftBalance || 0)}
          </span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-garage-900 border border-gray-800 text-right space-y-1">
          <span className="text-[11px] text-gray-400 block">عدد الطلبات المكتملة</span>
          <span className="text-lg sm:text-xl font-black text-white font-mono">
            {ordersCount} طلبات
          </span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-garage-900 border border-gray-800 text-right space-y-1">
          <span className="text-[11px] text-gray-400 block">تذاكر الدعم المفتوحة</span>
          <span className="text-lg sm:text-xl font-black text-neon-amber font-mono">
            {ticketsCount} تذاكر
          </span>
        </div>
      </div>

      {/* Quick Navigation Links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/wallet"
          className="p-5 rounded-2xl bg-garage-900/90 border border-gray-800 hover:border-cyan-500/40 transition flex items-center justify-between group"
        >
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white group-hover:text-neon-cyan">تفاصيل المحفظة</h3>
            <p className="text-[11px] text-gray-400">سجل الشحن والخصومات</p>
          </div>
          <Wallet className="w-5 h-5 text-neon-green" />
        </Link>

        <Link
          href="/orders"
          className="p-5 rounded-2xl bg-garage-900/90 border border-gray-800 hover:border-cyan-500/40 transition flex items-center justify-between group"
        >
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white group-hover:text-neon-cyan">طلباتي السابقة</h3>
            <p className="text-[11px] text-gray-400">تتبع واستلام الخدمات</p>
          </div>
          <ShoppingBag className="w-5 h-5 text-neon-cyan" />
        </Link>

        <Link
          href="/support"
          className="p-5 rounded-2xl bg-garage-900/90 border border-gray-800 hover:border-cyan-500/40 transition flex items-center justify-between group"
        >
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white group-hover:text-neon-cyan">الدعم الفني</h3>
            <p className="text-[11px] text-gray-400">فتح تذكرة استفسار أو مشكلة</p>
          </div>
          <Zap className="w-5 h-5 text-neon-amber" />
        </Link>
      </div>
    </div>
  );
}
