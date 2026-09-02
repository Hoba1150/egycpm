"use client";

import React, { useState } from "react";
import { formatDate } from "@/lib/utils";
import { moderateReview } from "@/lib/actions/review";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Star, Eye, EyeOff, Trash2 } from "lucide-react";

export default function ReviewsModeratorClient({ initialReviews }: { initialReviews: any[] }) {
  const router = useRouter();
  const [reviews, setReviews] = useState(initialReviews);

  const handleAction = async (id: string, action: "HIDE" | "UNHIDE" | "DELETE") => {
    if (action === "DELETE" && !confirm("هل أنت متأكد من حذف هذا التقييم؟")) return;

    try {
      await moderateReview(id, action);
      toast.success("تم تحديث حالة التقييم بنجاح.");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "فشل تنفيذ الإجراء.");
    }
  };

  return (
    <div className="rounded-2xl bg-[#12161f] border border-gray-800 overflow-hidden">
      {reviews.length === 0 ? (
        <div className="p-12 text-center text-gray-500 text-xs">
          لا توجد تقييمات مضافة حالياً.
        </div>
      ) : (
        <div className="divide-y divide-gray-800">
          {reviews.map((r) => (
            <div
              key={r.id}
              className={`p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition ${
                r.isHidden ? "bg-garage-950/80 opacity-60" : "hover:bg-[#1a202c]/50"
              }`}
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-white text-xs">{r.user?.name || "عميل"}</span>
                  <div className="flex items-center gap-0.5 text-yellow-400">
                    {[...Array(r.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-neon-amber" />
                    ))}
                  </div>
                  <span className="text-[10px] text-orange-500 font-mono">
                    المنتج: {r.product?.name}
                  </span>
                  {r.isHidden && (
                    <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 text-[10px] font-bold">
                      مخفي
                    </span>
                  )}
                </div>

                <p className="text-xs text-gray-300 leading-relaxed italic">
                  &quot;{r.comment || "بدون تعليق مكتوب"}&quot;
                </p>
                <span className="text-[10px] text-gray-500 font-mono block">
                  {formatDate(r.createdAt)}
                </span>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  onClick={() => handleAction(r.id, r.isHidden ? "UNHIDE" : "HIDE")}
                  className="p-2 rounded-xl bg-[#1a202c] hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-700 transition text-xs flex items-center gap-1 font-semibold"
                >
                  {r.isHidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span>{r.isHidden ? "إظهار" : "إخفاء"}</span>
                </button>

                <button
                  onClick={() => handleAction(r.id, "DELETE")}
                  className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition text-xs"
                  title="حذف"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
