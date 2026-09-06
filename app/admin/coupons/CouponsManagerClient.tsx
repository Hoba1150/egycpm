"use client";

import React, { useState } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { createCoupon, deleteCoupon, toggleCouponStatus } from "@/lib/actions/coupon";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Plus, Tag, Trash2, CheckCircle2, XCircle, X, Loader2 } from "lucide-react";

export default function CouponsManagerClient({ initialCoupons }: { initialCoupons: any[] }) {
  const router = useRouter();
  const [coupons, setCoupons] = useState(initialCoupons);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState<number | "">(15);
  const [minOrderValue, setMinOrderValue] = useState<number | "">(100);
  const [maxDiscount, setMaxDiscount] = useState<number | "">(150);
  const [maxUses, setMaxUses] = useState<number | "">(200);

  // Independent Stars Discount
  const [hasStarsDiscount, setHasStarsDiscount] = useState(false);
  const [starsDiscountType, setStarsDiscountType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
  const [starsDiscountValue, setStarsDiscountValue] = useState<number | "">("");
  const [starsMinOrderValue, setStarsMinOrderValue] = useState<number | "">("");
  const [starsMaxDiscount, setStarsMaxDiscount] = useState<number | "">("");

  const [isSaving, setIsSaving] = useState(false);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setIsSaving(true);
    try {
      await createCoupon({
        code: code.trim().toUpperCase(),
        discountType,
        discountValue: Number(discountValue),
        minOrderValue: minOrderValue ? Number(minOrderValue) : undefined,
        maxDiscount: maxDiscount ? Number(maxDiscount) : undefined,
        starsDiscountType: hasStarsDiscount ? starsDiscountType : undefined,
        starsDiscountValue: hasStarsDiscount && starsDiscountValue !== "" ? Number(starsDiscountValue) : undefined,
        starsMinOrderValue: hasStarsDiscount && starsMinOrderValue !== "" ? Number(starsMinOrderValue) : undefined,
        starsMaxDiscount: hasStarsDiscount && starsMaxDiscount !== "" ? Number(starsMaxDiscount) : undefined,
        maxUses: maxUses ? Number(maxUses) : 100,
      });
      toast.success("تم إنشاء الكوبون بنجاح!");
      setIsAddModalOpen(false);
      setCode("");
      setHasStarsDiscount(false);
      setStarsDiscountValue("");
      setStarsMinOrderValue("");
      setStarsMaxDiscount("");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "فشل إنشاء الكوبون.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = async (id: string, current: boolean) => {
    try {
      await toggleCouponStatus(id, !current);
      toast.success("تم تغيير حالة الكوبون.");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "فشل تغيير الحالة.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الكوبون؟")) return;
    try {
      await deleteCoupon(id);
      toast.success("تم حذف الكوبون.");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "فشل حذف الكوبون.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center border-b border-gray-800 pb-4">
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-5 py-2.5 rounded-xl bg-orange-500 text-black font-extrabold text-xs flex items-center gap-1.5 hover:scale-105 transition"
        >
          <Plus className="w-4 h-4" />
          <span>إنشاء كود خصم جديد +</span>
        </button>
      </div>

      <div className="rounded-2xl bg-[#12161f] border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-gray-800 bg-garage-950/60 text-gray-400 font-bold">
                <th className="p-4">كود الكوبون</th>
                <th className="p-4">نوع وقيمة الخصم</th>
                <th className="p-4">الحد الأدنى للطلب</th>
                <th className="p-4">مرات الاستخدام</th>
                <th className="p-4">الحالة</th>
                <th className="p-4">تاريخ الإنشاء</th>
                <th className="p-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {coupons.map((c) => (
                <tr key={c.id} className="hover:bg-[#1a202c]/50 transition">
                  <td className="p-4 font-mono font-black text-sm text-orange-500">{c.code}</td>
                  <td className="p-4 font-bold text-white">
                    <div className="space-y-1">
                      <div className="text-orange-400 font-bold">
                        {c.discountType === "PERCENTAGE" ? `${c.discountValue}%` : `${c.discountValue} ج.م`}
                      </div>
                      {c.starsDiscountValue && c.starsDiscountValue > 0 ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-mono font-bold">
                          <span>⭐</span>
                          <span>
                            {c.starsDiscountType === "PERCENTAGE" ? `${c.starsDiscountValue}%` : `${c.starsDiscountValue} نجمة`}
                          </span>
                        </span>
                      ) : (
                        <span className="text-[10px] text-gray-500 block font-mono">
                          ⭐ تلقائي ({c.discountType === "PERCENTAGE" ? `${c.discountValue}%` : "تناسبي"})
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-gray-300 font-mono">
                    {c.minOrderValue ? `${c.minOrderValue} ج.م` : "بدون حد أدنى"}
                  </td>
                  <td className="p-4 font-mono">
                    <span className="text-green-400 font-bold">{c.usedCount}</span> / {c.maxUses || "∞"}
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleToggle(c.id, c.isActive)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                        c.isActive
                          ? "bg-green-500/20 text-green-400 border border-green-500/30"
                          : "bg-red-500/20 text-red-400 border border-red-500/30"
                      }`}
                    >
                      {c.isActive ? "نشط ومفعل" : "معطل"}
                    </button>
                  </td>
                  <td className="p-4 text-[10px] text-gray-500 font-mono">{formatDate(c.createdAt)}</td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition"
                      title="حذف"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Coupon Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative max-w-md w-full bg-[#0c1017] border border-orange-500/30 rounded-2xl p-6 text-right space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="text-base font-bold text-white">إنشاء كوبون خصم جديد</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">كود الكوبون *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: DRIFT2026"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2 bg-[#12161f] border border-gray-700 rounded-xl text-xs text-white focus:border-orange-500 uppercase font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">نوع الخصم</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#12161f] border border-gray-700 rounded-xl text-xs text-white text-right"
                  >
                    <option value="PERCENTAGE">نسبة مئوية (%)</option>
                    <option value="FIXED">مبلغ ثابت (ج.م)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">قيمة الخصم *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#12161f] border border-gray-700 rounded-xl text-xs text-white text-right font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">الحد الأدنى للطلب (ج.م)</label>
                  <input
                    type="number"
                    value={minOrderValue}
                    onChange={(e) => setMinOrderValue(e.target.value ? Number(e.target.value) : "")}
                    className="w-full px-3 py-2 bg-[#12161f] border border-gray-700 rounded-xl text-xs text-white text-right font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">أقصى مرات استخدام</label>
                  <input
                    type="number"
                    value={maxUses}
                    onChange={(e) => setMaxUses(e.target.value ? Number(e.target.value) : "")}
                    className="w-full px-3 py-2 bg-[#12161f] border border-gray-700 rounded-xl text-xs text-white text-right font-mono"
                  />
                </div>
              </div>

              {/* Independent Stars Discount Section */}
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">⭐</span>
                    <div>
                      <span className="text-xs font-black text-amber-300 block">خصم مخصص لنجوم تيليجرام (Stars)</span>
                      <span className="text-[10px] text-gray-400">تحديد نسبة مئوية أو عدد نجوم مستقل عن الجنيهات</span>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasStarsDiscount}
                      onChange={(e) => setHasStarsDiscount(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>

                {hasStarsDiscount && (
                  <div className="space-y-3 pt-2 border-t border-amber-500/20">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1">نوع خصم النجوم</label>
                        <select
                          value={starsDiscountType}
                          onChange={(e) => setStarsDiscountType(e.target.value as any)}
                          className="w-full px-3 py-2 bg-[#12161f] border border-gray-700 rounded-xl text-xs text-white text-right"
                        >
                          <option value="PERCENTAGE">نسبة مئوية (%)</option>
                          <option value="FIXED">عدد نجوم ثابت (⭐ Stars)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1">
                          قيمة خصم النجوم {starsDiscountType === "PERCENTAGE" ? "(%)" : "(⭐ نجوم)"} *
                        </label>
                        <input
                          type="number"
                          required={hasStarsDiscount}
                          min={1}
                          placeholder={starsDiscountType === "PERCENTAGE" ? "مثال: 20" : "مثال: 15"}
                          value={starsDiscountValue}
                          onChange={(e) => setStarsDiscountValue(e.target.value ? Number(e.target.value) : "")}
                          className="w-full px-3 py-2 bg-[#12161f] border border-gray-700 rounded-xl text-xs text-white text-right font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1">الحد الأدنى بالنجوم (اختياري)</label>
                        <input
                          type="number"
                          min={0}
                          placeholder="مثال: 50 ⭐"
                          value={starsMinOrderValue}
                          onChange={(e) => setStarsMinOrderValue(e.target.value ? Number(e.target.value) : "")}
                          className="w-full px-3 py-2 bg-[#12161f] border border-gray-700 rounded-xl text-xs text-white text-right font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1">أقصى خصم بالنجوم (اختياري)</label>
                        <input
                          type="number"
                          min={1}
                          placeholder="مثال: 100 ⭐"
                          value={starsMaxDiscount}
                          onChange={(e) => setStarsMaxDiscount(e.target.value ? Number(e.target.value) : "")}
                          className="w-full px-3 py-2 bg-[#12161f] border border-gray-700 rounded-xl text-xs text-white text-right font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-3 border-t border-gray-800">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2.5 rounded-xl bg-orange-500 text-black font-bold text-xs transition disabled:opacity-50"
                >
                  {isSaving ? "جاري الإنشاء..." : "إنشاء الكوبون"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-[#1a202c] text-gray-300 text-xs font-bold"
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
