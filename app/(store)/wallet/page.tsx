import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { getMyWallet } from "@/lib/actions/wallet";
import { redirect } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import {
  Wallet,
  Gift,
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  XCircle,
  PlusCircle,
  History,
  Zap,
} from "lucide-react";
import { getStoreSettings } from "@/lib/actions/settings";

export const dynamic = "force-dynamic";

export default async function WalletPage() {
  const user = await getCurrentUser();

  const settings: Record<string, string> = await getStoreSettings().catch(() => ({}));
  const pageTitle = settings.page_wallet_title || "المحفظة وسجل المعاملات المالية";
  const pageDesc = settings.page_wallet_desc || "تتبع رصيدك وجميع عمليات الشحن والسحب والشراء";
  if (!user) {
    redirect("/");
  }

  const walletData = await getMyWallet();
  const wallet = walletData?.wallet;
  const transactions = wallet?.transactions || [];
  const depositRequests = walletData?.depositRequests || [];

  const totalAvailable = (wallet?.balance || 0) + (wallet?.giftBalance || 0);

  const getTransactionBadge = (type: string) => {
    switch (type) {
      case "DEPOSIT":
        return <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 text-xs font-bold">إيداع رصيد +</span>;
      case "PURCHASE":
        return <span className="px-2.5 py-1 rounded-lg bg-orange-500/10 text-orange-500 border border-orange-500/30 text-xs font-bold">شراء طلب -</span>;
      case "GIFT":
        return <span className="px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/30 text-xs font-bold">رصيد هدية 🎁</span>;
      case "REFUND":
        return <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/30 text-xs font-bold">استرجاع مالي 💰</span>;
      case "MANUAL_CREDIT":
        return <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/30 text-xs font-bold">إضافة يدوية +</span>;
      default:
        return <span className="px-2.5 py-1 rounded-lg bg-red-500/10 text-red-500 border border-red-500/30 text-xs font-bold">خصم يدوي -</span>;
    }
  };

  const getDepositStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1 text-emerald-500 text-xs font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>مقبول ومضاف</span>
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1 text-red-500 text-xs font-bold bg-red-500/10 px-2 py-0.5 rounded-md border border-red-500/30">
            <XCircle className="w-3.5 h-3.5" />
            <span>مرفوض</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-amber-500 text-xs font-bold bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/30">
            <Clock className="w-3.5 h-3.5" />
            <span>قيد المراجعة</span>
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-8 text-right space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-4">
        <div>
          <span className="text-xs font-mono font-bold text-orange-500 uppercase">
            Customer Wallet
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white">{pageTitle}</h1>
          <p className="text-xs text-gray-400 mt-0.5">{pageDesc}</p>
        </div>

        <Link
          href="/deposit"
          className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-black font-extrabold text-xs transition flex items-center justify-center gap-2 self-start sm:self-auto shadow-sm"
        >
          <PlusCircle className="w-4 h-4" />
          <span>شحن رصيد جديد</span>
        </Link>
      </div>

      {/* Balance Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Available Balance */}
        <div className="p-5 rounded-2xl bg-[#0f1218] border border-orange-500/30 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-gray-400 text-xs font-medium">
            <span>إجمالي الرصيد المتاح</span>
            <Wallet className="w-4 h-4 text-orange-500" />
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-orange-500 font-mono">
            {formatCurrency(totalAvailable)}
          </h3>
          <p className="text-[11px] text-emerald-500 font-medium">جاهز للشراء الفوري لكافة الخدمات</p>
        </div>

        {/* Regular Balance */}
        <div className="p-5 rounded-2xl bg-[#0f1218] border border-gray-800 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-gray-400 text-xs font-medium">
            <span>الرصيد المشحون</span>
            <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-white font-mono">
            {formatCurrency(wallet?.balance || 0)}
          </h3>
          <p className="text-[11px] text-gray-400">تم شحنه عبر الكاش</p>
        </div>

        {/* Gift Balance */}
        <div className="p-5 rounded-2xl bg-[#0f1218] border border-gray-800 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-gray-400 text-xs font-medium">
            <span>رصيد الهدايا المجاني</span>
            <Gift className="w-4 h-4 text-purple-400" />
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-purple-400 font-mono">
            {formatCurrency(wallet?.giftBalance || 0)}
          </h3>
          <p className="text-[11px] text-gray-400">مكافآت وهدايا من الإدارة 🎁</p>
        </div>

        {/* Total Spent */}
        <div className="p-5 rounded-2xl bg-[#0f1218] border border-gray-800 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-gray-400 text-xs font-medium">
            <span>إجمالي المشتريات</span>
            <ArrowUpRight className="w-4 h-4 text-amber-500" />
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-white font-mono">
            {formatCurrency(wallet?.totalSpent || 0)}
          </h3>
          <p className="text-[11px] text-gray-400">إجمالي ما تم إنفاقه</p>
        </div>
      </div>

      {/* Deposit Requests Section */}
      {depositRequests.length > 0 && (
        <div className="p-5 sm:p-6 rounded-2xl bg-[#0f1218] border border-gray-800 space-y-4 shadow-sm">
          <h3 className="text-base font-extrabold text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-orange-500" />
            <span>طلبات الشحن الأخيرة</span>
          </h3>

          <div className="divide-y divide-gray-800">
            {depositRequests.map((req) => (
              <div key={req.id} className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white">{req.requestNumber}</span>
                    {getDepositStatusBadge(req.status)}
                  </div>
                  <p className="text-gray-400">
                    تحويل من: <strong>{req.senderName}</strong> ({req.senderPhone}) عبر {req.method}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <span className="font-black text-sm text-emerald-500 font-mono">
                    {formatCurrency(req.amount)}
                  </span>
                  <span className="text-[11px] text-gray-500">{formatDate(req.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transaction History Table */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#0f1218] border border-gray-800 space-y-4 shadow-sm">
        <h3 className="text-base font-extrabold text-white flex items-center gap-2">
          <History className="w-4 h-4 text-orange-500" />
          <span>سجل المعاملات والعمليات ({transactions.length})</span>
        </h3>

        {transactions.length === 0 ? (
          <p className="text-xs text-gray-500 py-6 text-center">
            لا توجد أي معاملات مسجلة في محفظتك حتى الآن.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 font-bold">
                  <th className="pb-3">نوع العملية</th>
                  <th className="pb-3">المبلغ</th>
                  <th className="pb-3">الرصيد قبل</th>
                  <th className="pb-3">الرصيد بعد</th>
                  <th className="pb-3">الوصف والتفاصيل</th>
                  <th className="pb-3">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-800/20 transition">
                    <td className="py-3">{getTransactionBadge(tx.type)}</td>
                    <td className="py-3 font-black font-mono text-white">
                      {formatCurrency(tx.amount)}
                    </td>
                    <td className="py-3 text-gray-400 font-mono">
                      {formatCurrency(tx.beforeBalance + tx.beforeGiftBalance)}
                    </td>
                    <td className="py-3 text-orange-500 font-mono font-bold">
                      {formatCurrency(tx.afterBalance + tx.afterGiftBalance)}
                    </td>
                    <td className="py-3 text-gray-300 max-w-xs">{tx.description}</td>
                    <td className="py-3 text-gray-500 font-mono">{formatDate(tx.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
