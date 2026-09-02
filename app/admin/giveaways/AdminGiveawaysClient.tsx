"use client";

import React, { useState } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { createGiveaway, drawGiveawayWinner, deleteGiveaway } from "@/lib/actions/giveaway";
import { toast } from "sonner";
import { Plus, Trophy, Trash2, Users, Clock, Gift, X, Sparkles, Upload } from "lucide-react";

export default function AdminGiveawaysClient({
  giveaways,
}: {
  giveaways: any[];
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [prizeName, setPrizeName] = useState("");
  const [prizeImage, setPrizeImage] = useState("");
  const [entryFee, setEntryFee] = useState<number | "">(0);
  const [endDate, setEndDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedWinnerModal, setSelectedWinnerModal] = useState<any>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !prizeName.trim() || !endDate) {
      toast.error("يرجى إدخال البيانات الأساسية وتاريخ انتهاء السحب.");
      return;
    }

    setIsLoading(true);
    try {
      await createGiveaway({
        title,
        description,
        prizeName,
        prizeImage,
        entryFee: Number(entryFee) || 0,
        endDate,
      });

      toast.success("تم إنشاء السحب الجديد بنجاح!");
      setIsModalOpen(false);
      setTitle("");
      setDescription("");
      setPrizeName("");
      setPrizeImage("");
      setEntryFee(0);
      setEndDate("");
    } catch (err: any) {
      toast.error(err.message || "فشل إنشاء السحب.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrawRandom = async (id: string) => {
    if (!confirm("هل أنت متأكد من إجراء السحب العشوائي الآن واختيار الفائز؟")) return;
    try {
      const res = await drawGiveawayWinner(id);
      toast.success(`تم اختيار الفائز بالسحب: ${res.winner.winnerName} 🎉`);
    } catch (err: any) {
      toast.error(err.message || "فشل إجراء السحب.");
    }
  };

  const handlePickManualWinner = async (giveawayId: string, entryId: string) => {
    try {
      const res = await drawGiveawayWinner(giveawayId, entryId);
      toast.success(`تم تحديد الفائز يدوياً: ${res.winner.winnerName} 👑`);
      setSelectedWinnerModal(null);
    } catch (err: any) {
      toast.error(err.message || "فشل تحديد الفائز.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا السحب نهائياً؟")) return;
    try {
      await deleteGiveaway(id);
      toast.success("تم حذف السحب بنجاح.");
    } catch (err: any) {
      toast.error(err.message || "فشل حذف السحب.");
    }
  };

  return (
    <div className="space-y-6 text-right">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white">إدارة السحوبات والجوائز (Giveaways)</h1>
          <p className="text-xs text-gray-400">إنشاء سحوبات مجانية أو مدفوعة، وإجراء السحب العشوائي أو اليدوي</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-black font-bold text-xs rounded-xl flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>إنشاء سحب جديد</span>
        </button>
      </div>

      {/* Giveaways List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {giveaways.map((g) => {
          const isFinished = g.status === "COMPLETED";

          return (
            <div key={g.id} className="p-4 rounded-2xl bg-[#12161f] border border-gray-800 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                <span className="text-xs font-bold text-white">{g.title}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isFinished ? "bg-green-500/20 text-green-400" : "bg-orange-500/20 text-orange-400"}`}>
                  {isFinished ? "مكتمل" : "نشط"}
                </span>
              </div>

              <div className="text-xs space-y-1.5 text-gray-300">
                <p><strong className="text-white">الجائزة:</strong> {g.prizeName}</p>
                <p><strong className="text-white">رسوم الدخول:</strong> {g.entryFee > 0 ? formatCurrency(g.entryFee) : "مجاني"}</p>
                <p><strong className="text-white">المشتركين:</strong> {g.entries?.length || g._count?.entries || 0} لاعب</p>
                <p><strong className="text-white">تاريخ الانتهاء:</strong> {formatDate(g.endDate)}</p>

                {g.winnerName && (
                  <div className="p-2.5 rounded-lg bg-green-950/40 border border-green-500/40 text-green-300 text-xs">
                    👑 الفائز المعلن: <strong>{g.winnerName}</strong> (ID: {g.winnerGameId} / هاتف: {g.winnerPhone})
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-gray-800 flex items-center gap-2">
                {!isFinished && (
                  <>
                    <button
                      onClick={() => handleDrawRandom(g.id)}
                      className="flex-1 py-1.5 px-2 bg-orange-500 hover:bg-orange-600 text-black font-bold text-xs rounded-lg flex items-center justify-center gap-1"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>سحب عشوائي</span>
                    </button>

                    <button
                      onClick={() => setSelectedWinnerModal(g)}
                      className="py-1.5 px-2.5 bg-[#1a202c] hover:bg-gray-700 text-white font-bold text-xs rounded-lg"
                    >
                      اختيار يدوي
                    </button>
                  </>
                )}

                <button
                  onClick={() => handleDelete(g.id)}
                  className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg"
                  title="حذف"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Giveaway Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="max-w-lg w-full rounded-2xl bg-[#12161f] border border-orange-500/40 p-5 text-right space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-2">
              <h3 className="text-base font-bold text-white">إنشاء سحب جديد</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">عنوان السحب *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: سحب سيارة بورش 911 معدلة 1695HP"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1a202c] border border-gray-700 rounded-lg text-xs text-white text-right"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">اسم الجائزة بالتفصيل *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: Porsche 911 GT3 RS W16"
                  value={prizeName}
                  onChange={(e) => setPrizeName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1a202c] border border-gray-700 rounded-lg text-xs text-white text-right"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">رسوم الاشتراك (ج.م)</label>
                  <input
                    type="number"
                    min={0}
                    placeholder="0 = مجاني"
                    value={entryFee}
                    onChange={(e) => setEntryFee(e.target.value ? Number(e.target.value) : "")}
                    className="w-full px-3 py-2 bg-[#1a202c] border border-gray-700 rounded-lg text-xs text-white text-right font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">تاريخ ووقت الانتهاء *</label>
                  <input
                    type="datetime-local"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1a202c] border border-gray-700 rounded-lg text-xs text-white text-right font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">صورة الجائزة</label>
                <div className="space-y-1.5">
                  <input
                    type="file"
                    accept="image/*"
                    id="prize-img-upload"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => setPrizeImage(ev.target?.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <label
                    htmlFor="prize-img-upload"
                    className="px-3 py-1.5 bg-orange-500/20 text-orange-400 border border-orange-500/40 text-xs font-bold rounded-lg cursor-pointer inline-flex items-center gap-1"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>رفع صورة من الجهاز</span>
                  </label>
                  <input
                    type="text"
                    placeholder="أو رابط الصورة..."
                    value={prizeImage}
                    onChange={(e) => setPrizeImage(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1a202c] border border-gray-700 rounded-lg text-xs text-white text-right dir-ltr font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">وصف وشروط السحب</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="اكتب تفاصيل وشروط الاستلام..."
                  className="w-full px-3 py-2 bg-[#1a202c] border border-gray-700 rounded-lg text-xs text-white text-right"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-black font-extrabold text-xs transition"
                >
                  {isLoading ? "جاري الإنشاء..." : "نشر السحب في المتجر"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#1a202c] text-gray-300 text-xs font-bold"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Winner Pick Modal */}
      {selectedWinnerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="max-w-md w-full rounded-2xl bg-[#12161f] border border-orange-500/40 p-5 text-right space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-800 pb-2">
              <h3 className="text-sm font-bold text-white">اختيار الفائز يدوياً ({selectedWinnerModal.title})</h3>
              <button onClick={() => setSelectedWinnerModal(null)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {selectedWinnerModal.entries?.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">لا يوجد مسجلين حتى الآن في هذا السحب.</p>
            ) : (
              <div className="space-y-2">
                {selectedWinnerModal.entries?.map((entry: any) => (
                  <div key={entry.id} className="p-2.5 rounded-xl bg-[#1a202c] border border-gray-700 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white">{entry.userName}</h4>
                      <p className="text-[10px] text-gray-400">ID: {entry.gameId} | هاتف: {entry.phone}</p>
                    </div>
                    <button
                      onClick={() => handlePickManualWinner(selectedWinnerModal.id, entry.id)}
                      className="px-3 py-1 bg-green-500 hover:bg-green-600 text-black font-bold text-[11px] rounded-lg"
                    >
                      تتويج كفائز 👑
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
