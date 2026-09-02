"use client";

import React, { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { enterGiveaway } from "@/lib/actions/giveaway";
import { toast } from "sonner";
import { Gift, Clock, Trophy } from "lucide-react";
import AuthModal from "@/components/shared/AuthModal";

export default function GiveawaysClient({
  giveaways,
  user,
}: {
  giveaways: any[];
  user: any;
}) {
  const [selectedGiveaway, setSelectedGiveaway] = useState<any>(null);
  const [userName, setUserName] = useState(user?.name || "");
  const [gameId, setGameId] = useState("");
  const [phone, setPhone] = useState(user?.phone || "");
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const handleOpenJoin = (g: any) => {
    setSelectedGiveaway(g);
    setUserName(user?.name || "");
    setPhone(user?.phone || "");
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !gameId.trim() || !phone.trim()) {
      toast.error("يرجى ملء جميع الحقول المطلوبة.");
      return;
    }

    if (selectedGiveaway.entryFee > 0 && !user) {
      setIsAuthOpen(true);
      return;
    }

    setIsLoading(true);
    try {
      await enterGiveaway({
        giveawayId: selectedGiveaway.id,
        userName,
        gameId,
        phone,
        userId: user?.id,
      });

      toast.success("تم تسجيلك في السحب بنجاح! نتمنى لك التوفيق.");
      setSelectedGiveaway(null);
      setGameId("");
    } catch (err: any) {
      toast.error(err.message || "فشل التسجيل في السحب.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-right">
      {giveaways.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-[#0f1218] border border-gray-800 shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-orange-500 mx-auto flex items-center justify-center">
            <Gift className="w-6 h-6" />
          </div>
          <h3 className="text-base font-extrabold text-white">لا توجد سحوبات نشطة حالياً</h3>
          <p className="text-xs text-gray-400">تابعنا دائماً، يتم إطلاق سحوبات كبرى على سيارات 1695HP وحسابات VIP باستمرار!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {giveaways.map((g) => {
            const hasEndedByTime = g.endDate ? new Date().getTime() > new Date(g.endDate).getTime() : false;
            const isFinished = g.status === "COMPLETED" || (g.status !== "ACTIVE" && hasEndedByTime);
            const isWinnerAnnounced = Boolean(g.winnerName);

            return (
              <div
                key={g.id}
                className={`rounded-2xl border p-4 sm:p-5 flex flex-col justify-between space-y-4 transition shadow-sm ${
                  isWinnerAnnounced
                    ? "bg-emerald-950/20 bg-emerald-950/20 border-emerald-500/40"
                    : "bg-[#0f1218] bg-[#0f1218] border-gray-800 border-gray-800 hover:border-orange-500/40"
                }`}
              >
                <div className="space-y-3">
                  {/* Top Status & Winner Header */}
                  <div className="flex items-center justify-between border-b border-gray-800/80 pb-2.5">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#161b24] text-gray-400">
                      {g._count?.entries || 0} مشترك
                    </span>

                    {isWinnerAnnounced ? (
                      <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-500 font-bold text-xs flex items-center gap-1">
                        <Trophy className="w-3.5 h-3.5" />
                        <span>تم إعلان الفائز</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-md bg-orange-500/20 text-orange-500 font-bold text-xs flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>سحب نشط ومفتوح</span>
                      </span>
                    )}
                  </div>

                  {/* Winner Box If Completed */}
                  {isWinnerAnnounced && (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-1">
                      <span className="text-[11px] text-emerald-500 block font-bold">الفائز المحظوظ بالسحب</span>
                      <h4 className="text-base font-black text-white">
                        مبروك للأخ: <span className="text-emerald-500">{g.winnerName}</span>
                      </h4>
                      <p className="text-[10px] text-gray-400 font-mono">
                        Game ID: {g.winnerGameId || "مسجل"}
                      </p>
                    </div>
                  )}

                  {/* Prize & Info */}
                  <div className="flex gap-3 items-center">
                    {g.prizeImage ? (
                      <img
                        src={g.prizeImage}
                        alt={g.prizeName}
                        className="w-16 h-16 rounded-xl object-cover border border-gray-700 shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-500 flex items-center justify-center shrink-0">
                        <Gift className="w-8 h-8" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-sm sm:text-base font-extrabold text-white">{g.title}</h3>
                      <p className="text-xs text-orange-500 font-bold mt-0.5">الجائزة: {g.prizeName}</p>
                      <p className="text-[11px] text-gray-400 line-clamp-2 mt-1 leading-relaxed">{g.description}</p>
                    </div>
                  </div>
                </div>

                {/* Footer Details & Action Button */}
                <div className="pt-3 border-t border-gray-800/80 flex items-center justify-between">
                  <div className="text-right">
                    <span className="text-[10px] text-gray-400 block font-medium">رسوم الاشتراك:</span>
                    <span className="text-xs font-black text-white font-mono">
                      {g.entryFee > 0 ? `${formatCurrency(g.entryFee)} (بالمحفظة)` : "مجاني 100%"}
                    </span>
                  </div>

                  {!isFinished ? (
                    <button
                      onClick={() => handleOpenJoin(g)}
                      className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-black font-extrabold text-xs transition shadow-sm"
                    >
                      اشترك في السحب الآن
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-gray-500">السحب مغلق</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Join Giveaway Modal */}
      {selectedGiveaway && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="max-w-md w-full rounded-2xl bg-[#0f1218] border border-gray-800 p-5 text-right space-y-4 shadow-xl">
            <div className="border-b border-gray-800 pb-2.5">
              <h3 className="text-base font-extrabold text-white">التسجيل في {selectedGiveaway.title}</h3>
              <p className="text-xs text-orange-500 font-bold">الجائزة: {selectedGiveaway.prizeName}</p>
            </div>

            <form onSubmit={handleJoin} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">الاسم الكريم *</label>
                <input
                  type="text"
                  required
                  placeholder="اسمك الثلاثي أو المستعار..."
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#161b24] border border-gray-700 rounded-xl text-xs text-white text-right"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">حسابك في اللعبة (Game ID / Username) *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: CPM_PLAYER_99"
                  value={gameId}
                  onChange={(e) => setGameId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#161b24] border border-gray-700 rounded-xl text-xs text-white text-right dir-ltr font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">رقم الواتساب للتواصل والتسليم *</label>
                <input
                  type="tel"
                  required
                  placeholder="01xxxxxxxxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-[#161b24] border border-gray-700 rounded-xl text-xs text-white text-right dir-ltr font-mono"
                />
              </div>

              {selectedGiveaway.entryFee > 0 && (
                <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/30 text-[11px] text-orange-400">
                  رسوم الاشتراك <strong>{formatCurrency(selectedGiveaway.entryFee)}</strong> سيتم خصمها من رصيد محفظتك تلقائياً.
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-black font-extrabold text-xs transition shadow-sm"
                >
                  {isLoading ? "جاري التسجيل..." : "تأكيد الاشتراك في السحب"}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedGiveaway(null)}
                  className="px-4 py-2.5 rounded-xl bg-[#161b24] border border-gray-700 text-gray-300 text-xs font-bold"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </div>
  );
}
