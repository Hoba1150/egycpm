"use client";

import React, { useState, useEffect } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { approveDeposit, rejectDeposit } from "@/lib/actions/wallet";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  X,
  Loader2,
  Check,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";

export default function DepositQueueClient({ initialDeposits }: { initialDeposits: any[] }) {
  const router = useRouter();
  const [filterStatus, setFilterStatus] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("PENDING");
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Auto-refresh every 20 seconds for new deposit requests
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 20000);
    return () => clearInterval(interval);
  }, [router]);

  // Reject modal state
  const [rejectModalId, setRejectModalId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const filtered = initialDeposits.filter((d) => {
    if (filterStatus === "ALL") return true;
    return d.status === filterStatus;
  });

  const handleApprove = async (depositId: string, amount: number, senderName: string) => {
    if (!confirm(`هل أنت متأكد من قبول إيداع بمبلغ ${amount} ج.م للعميل "${senderName}"؟`)) {
      return;
    }

    setIsProcessing(true);
    try {
      await approveDeposit(depositId, "تم التحقق والاعتماد المباشر من الإدارة");
      toast.success(`تم اعتماد الإيداع بنجاح وإضافة ${amount} ج.م إلى محفظة العميل! 💰`);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "فشل اعتماد الإيداع.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModalId) return;

    setIsProcessing(true);
    try {
      await rejectDeposit(rejectModalId, rejectReason || "لم يتم العثور على التحويل أو البيانات غير متطابقة");
      toast.error("تم رفض طلب الإيداع وإشعار العميل.");
      setRejectModalId(null);
      setRejectReason("");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "فشل رفض الإيداع.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-800 pb-3">
        {[
          { key: "PENDING", label: "قيد المراجعة ⏳" },
          { key: "APPROVED", label: "المقبولة ✅" },
          { key: "REJECTED", label: "المرفوضة ❌" },
          { key: "ALL", label: "جميع الطلبات" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterStatus(tab.key as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              filterStatus === tab.key
                ? "bg-orange-500 text-black "
                : "bg-[#12161f] text-gray-300 hover:text-white border border-gray-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table Container */}
      <div className="rounded-2xl bg-[#12161f] border border-gray-800 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-500 text-xs">
            لا توجد طلبات إيداع في هذا التصنيف.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-gray-800 bg-garage-950/60 text-gray-400 font-bold">
                  <th className="p-4">رقم الطلب</th>
                  <th className="p-4">العميل</th>
                  <th className="p-4">بيانات الراسل</th>
                  <th className="p-4">المبلغ</th>
                  <th className="p-4">المحفظة</th>
                  <th className="p-4">صورة التحويل</th>
                  <th className="p-4">الحالة</th>
                  <th className="p-4">التاريخ</th>
                  <th className="p-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {filtered.map((d) => (
                  <tr key={d.id} className="hover:bg-[#1a202c]/50 transition">
                    <td className="p-4 font-mono font-bold text-orange-500">{d.requestNumber}</td>
                    <td className="p-4">
                      <div className="space-y-0.5">
                        <span className="font-bold text-white block">{d.user?.name || "عميل"}</span>
                        <span className="text-[10px] text-gray-400 font-mono">{d.user?.email}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-0.5">
                        <span className="font-bold text-white block">{d.senderName}</span>
                        <span className="text-[11px] text-green-400 font-mono">{d.senderPhone}</span>
                      </div>
                    </td>
                    <td className="p-4 font-bold text-sm text-green-400 font-mono">
                      {formatCurrency(d.amount)}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded bg-[#1a202c] text-[10px] text-gray-300 font-mono">
                        {d.method}
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => setLightboxImage(d.screenshotUrl)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-500/10 text-orange-500 hover:bg-orange-500/10 transition text-xs font-bold"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>معاينة</span>
                      </button>
                    </td>
                    <td className="p-4">
                      {d.status === "APPROVED" ? (
                        <span className="px-2 py-0.5 rounded bg-green-500/20 text-green-400 text-[10px] font-bold">
                          مقبول ✅
                        </span>
                      ) : d.status === "REJECTED" ? (
                        <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 text-[10px] font-bold">
                          مرفوض ❌
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-yellow-400 text-[10px] font-bold animate-pulse">
                          قيد المراجعة ⏳
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-[10px] text-gray-400 font-mono">{formatDate(d.createdAt)}</td>
                    <td className="p-4">
                      {d.status === "PENDING" && (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            disabled={isProcessing}
                            onClick={() => handleApprove(d.id, d.amount, d.senderName)}
                            className="px-3 py-1.5 rounded-lg bg-neon-green text-black font-bold text-xs hover: transition disabled:opacity-50 flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>قبول +</span>
                          </button>

                          <button
                            disabled={isProcessing}
                            onClick={() => {
                              setRejectModalId(d.id);
                              setRejectReason("");
                            }}
                            className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 font-bold text-xs border border-red-500/30 transition disabled:opacity-50"
                          >
                            رفض
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Lightbox Image Preview Modal */}
      {lightboxImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="relative max-w-2xl w-full bg-[#0c1017] border border-orange-500/30 rounded-2xl p-4 text-right space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-2">
              <span className="text-xs font-bold text-orange-500">معاينة إثبات التحويل (Screenshot)</span>
              <button
                onClick={() => setLightboxImage(null)}
                className="p-1 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative max-h-[70vh] overflow-auto flex items-center justify-center bg-black/60 rounded-2xl p-2">
              <img
                src={lightboxImage}
                alt="Transfer Screenshot"
                className="max-h-[65vh] w-auto object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectModalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative max-w-md w-full bg-[#0c1017] border border-red-500/40 rounded-2xl p-6 text-right space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <span>تأكيد رفض طلب الإيداع</span>
            </h3>

            <form onSubmit={handleReject} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  سبب الرفض (سيصل كإشعار للعميل):
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="مثال: لم يتم العثور على المبلغ في حساب الكاش، أو الرقم المحول منه غير مطابق..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full p-3 bg-[#12161f] border border-gray-700 rounded-xl text-xs text-white focus:border-neon-red text-right"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition disabled:opacity-50"
                >
                  {isProcessing ? "جاري الرفض..." : "تأكيد الرفض"}
                </button>
                <button
                  type="button"
                  onClick={() => setRejectModalId(null)}
                  className="px-4 py-2.5 rounded-xl bg-[#1a202c] text-gray-300 text-xs font-bold hover:bg-garage-700"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
