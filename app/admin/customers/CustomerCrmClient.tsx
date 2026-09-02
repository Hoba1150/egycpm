"use client";

import React, { useState, useEffect } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  grantGiftBalance,
  manualBalanceAdjustment,
  adminUpdateCustomerPassword,
  adminDeleteCustomer,
  adminUpdateUserRole,
} from "@/lib/actions/wallet";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Gift,
  PlusCircle,
  MinusCircle,
  Eye,
  EyeOff,
  Key,
  Edit2,
  Lock,
  Wallet,
  ShoppingBag,
  Sparkles,
  Search,
  CheckCircle2,
  X,
  Loader2,
  Phone,
  Trash2,
  AlertTriangle,
  ShieldCheck,
  Crown,
} from "lucide-react";

export default function CustomerCrmClient({
  initialCustomers,
  isSuperAdmin,
}: {
  initialCustomers: any[];
  isSuperAdmin: boolean;
}) {
  const router = useRouter();
  const [customers, setCustomers] = useState(initialCustomers);
  const [search, setSearch] = useState("");
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setCustomers(initialCustomers);
  }, [initialCustomers]);

  // Gift Modal
  const [giftCustomer, setGiftCustomer] = useState<any | null>(null);
  const [giftAmount, setGiftAmount] = useState<number | "">(50);
  const [giftReason, setGiftReason] = useState("مكافأة افتتاحية للعميل المتميز 🎁");
  const [isProcessing, setIsProcessing] = useState(false);

  // Manual Adjust Modal
  const [adjustCustomer, setAdjustCustomer] = useState<any | null>(null);
  const [adjustType, setAdjustType] = useState<"MANUAL_CREDIT" | "MANUAL_DEDUCTION">("MANUAL_CREDIT");
  const [adjustAmount, setAdjustAmount] = useState<number | "">(100);
  const [adjustReason, setAdjustReason] = useState("");

  // Password Change Modal
  const [pwdCustomer, setPwdCustomer] = useState<any | null>(null);
  const [newPassword, setNewPassword] = useState("");

  // Delete Customer Modal
  const [deleteUser, setDeleteUser] = useState<any | null>(null);

  // Role Management Modal
  const [roleCustomer, setRoleCustomer] = useState<any | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("ADMIN");

  const togglePasswordReveal = (userId: string) => {
    setRevealedPasswords((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleCustomer) return;
    setIsProcessing(true);
    try {
      await adminUpdateUserRole(roleCustomer.id, selectedRole);
      toast.success(`تم تغيير رتبة الحساب (${roleCustomer.name || roleCustomer.email}) إلى ${selectedRole} بنجاح 👑`);
      setRoleCustomer(null);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "فشل تغيير الرتبة.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!deleteUser) return;
    setIsProcessing(true);
    try {
      await adminDeleteCustomer(deleteUser.id);
      toast.success(`تم حذف حساب العميل ${deleteUser.name || deleteUser.email} نهائياً بنجاح.`);
      setDeleteUser(null);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "فشل حذف الحساب.");
    } finally {
      setIsProcessing(false);
    }
  };

  const filtered = customers.filter(
    (c) =>
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      (c.name && c.name.toLowerCase().includes(search.toLowerCase())) ||
      (c.phone && c.phone.includes(search))
  );

  const handleGrantGift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!giftCustomer || !giftAmount) return;

    setIsProcessing(true);
    try {
      await grantGiftBalance({
        userId: giftCustomer.id,
        amount: Number(giftAmount),
        reason: giftReason.trim() || "رصيد هدية خاص من الإدارة",
      });
      toast.success(`تمت إضافة ${giftAmount} ج.م رصيد هدية لحساب ${giftCustomer.name || giftCustomer.email} 🎁`);
      setGiftCustomer(null);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "فشل منح الهدية.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAdjustBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustCustomer || !adjustAmount || !adjustReason.trim()) {
      toast.error("يرجى إدخال المبلغ والسبب التوضيحي.");
      return;
    }

    setIsProcessing(true);
    try {
      await manualBalanceAdjustment({
        userId: adjustCustomer.id,
        type: adjustType,
        amount: Number(adjustAmount),
        reason: adjustReason.trim(),
      });
      toast.success("تم تعديل رصيد العميل وتوثيق العملية في سجل Audit Log.");
      setAdjustCustomer(null);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "فشل تعديل الرصيد.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwdCustomer || !newPassword || newPassword.length < 5) {
      toast.error("كلمة المرور يجب ألا تقل عن 5 أحرف.");
      return;
    }

    setIsProcessing(true);
    try {
      await adminUpdateCustomerPassword(pwdCustomer.id, newPassword);
      toast.success(`تم تغيير كلمة مرور العميل ${pwdCustomer.name || pwdCustomer.email} بنجاح 🔑`);
      setPwdCustomer(null);
      setNewPassword("");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "فشل تغيير كلمة المرور.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-gray-800 pb-4">
        <span className="text-xs text-gray-400">إجمالي الحسابات المسجلة: {customers.length}</span>
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="ابحث بالاسم، الإيميل، أو رقم الهاتف..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-4 pr-10 py-2.5 bg-[#12161f] border border-gray-700 rounded-xl text-xs text-white placeholder-gray-500 focus:border-orange-500 text-right"
          />
          <Search className="w-4 h-4 absolute right-3.5 top-3 text-gray-400" />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-[#12161f] border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-gray-800 bg-garage-950/80 text-gray-400 font-bold">
                <th className="p-4">بيانات العميل</th>
                <th className="p-4">كلمة المرور (Decrypted)</th>
                <th className="p-4">الرصيد المتاح</th>
                <th className="p-4">رصيد الهدايا</th>
                <th className="p-4">إجمالي المشتريات</th>
                <th className="p-4">الطلبات</th>
                <th className="p-4">تاريخ التسجيل</th>
                <th className="p-4 text-center">إجراءات الحساب</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {filtered.map((c) => {
                const isRevealed = revealedPasswords[c.id];
                const displayPwd = c.decryptedPassword || (c.passwordHash ? "[مشفرة bcrypt]" : "غير محددة");

                return (
                  <tr key={c.id} className="hover:bg-[#1a202c]/50 transition">
                    {/* User Info */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={c.image || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80"}
                          alt={c.name}
                          className="w-9 h-9 rounded-xl object-cover border border-gray-700 shrink-0"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white block">{c.name || "جيمر"}</span>
                            {c.role !== "CUSTOMER" && (
                              <span className="px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-500 text-[9px] font-mono font-bold">
                                {c.role}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-gray-400 font-mono block">{c.email}</span>
                          {c.phone && (
                            <span className="text-[10px] text-cyan-400 font-mono flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3" />
                              <span>{c.phone}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Password View & Edit */}
                    <td className="p-4">
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-orange-500 font-bold bg-garage-950 px-2 py-1 rounded-lg border border-gray-800 text-[11px]">
                          {isRevealed ? displayPwd : "••••••••"}
                        </span>
                        <button
                          type="button"
                          onClick={() => togglePasswordReveal(c.id)}
                          className="p-1 rounded-lg bg-[#1a202c] hover:bg-gray-700 text-gray-300 hover:text-white transition"
                          title={isRevealed ? "إخفاء كلمة المرور" : "كشف كلمة المرور"}
                        >
                          {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPwdCustomer(c);
                            setNewPassword("");
                          }}
                          className="p-1 rounded-lg bg-orange-500/10 hover:bg-orange-500/10 text-orange-500 border border-orange-500/30 transition"
                          title="تغيير كلمة مرور العميل"
                        >
                          <Key className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    {/* Balances */}
                    <td className="p-4 font-bold text-sm text-green-400 font-mono">
                      {formatCurrency(c.wallet?.balance || 0)}
                    </td>
                    <td className="p-4 font-bold text-sm text-orange-400 font-mono">
                      {formatCurrency(c.wallet?.giftBalance || 0)}
                    </td>
                    <td className="p-4 text-gray-300 font-mono text-xs">
                      {formatCurrency(c.wallet?.totalSpent || 0)}
                    </td>
                    <td className="p-4 font-mono font-bold text-white">
                      {c._count?.orders || 0}
                    </td>
                    <td className="p-4 text-[10px] text-gray-500 font-mono">{formatDate(c.createdAt)}</td>

                    {/* Action Buttons */}
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setGiftCustomer(c)}
                          className="px-2 py-1 rounded-lg bg-orange-500/10 hover:bg-orange-500/10 text-orange-400 border border-orange-500/20 text-xs font-bold transition flex items-center gap-1"
                          title="منح رصيد هدية"
                        >
                          <Gift className="w-3.5 h-3.5" />
                          <span>هدية 🎁</span>
                        </button>

                        <button
                          onClick={() => {
                            setAdjustCustomer(c);
                            setAdjustType("MANUAL_CREDIT");
                            setAdjustAmount(100);
                            setAdjustReason("");
                          }}
                          className="px-2 py-1 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30 text-xs font-bold transition flex items-center gap-1"
                          title="تعديل الرصيد يدوياً"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>تعديل الرصيد</span>
                        </button>

                        {isSuperAdmin && (
                          <button
                            onClick={() => {
                              setRoleCustomer(c);
                              setSelectedRole(c.role);
                            }}
                            className={`px-2 py-1 rounded-lg border text-xs font-bold transition flex items-center gap-1 ${
                              c.role !== "CUSTOMER"
                                ? "bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/30"
                                : "bg-orange-500/10 hover:bg-orange-500/10 text-orange-500 border-orange-500/30"
                            }`}
                            title="تغيير رتبة وصلاحيات الحساب"
                          >
                            <Crown className="w-3.5 h-3.5" />
                            <span>{c.role !== "CUSTOMER" ? "الرتبة" : "ترقية أدمن"}</span>
                          </button>
                        )}

                        {c.role !== "SUPER_ADMIN" && (
                          <button
                            onClick={() => setDeleteUser(c)}
                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold transition flex items-center gap-1"
                            title="حذف حساب العميل نهائياً"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>حذف</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Change Password Modal */}
      {pwdCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="relative max-w-md w-full bg-[#0c1017] border border-orange-500/30 rounded-2xl p-6 text-right space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Key className="w-5 h-5 text-orange-500" />
              <span>تغيير كلمة مرور العميل ({pwdCustomer.name || pwdCustomer.email})</span>
            </h3>

            <p className="text-xs text-gray-300">
              سيتم تعيين كلمة المرور الجديدة وتشفيرها وتحديثها فوراً للعميل.
            </p>

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  كلمة المرور الجديدة:
                </label>
                <input
                  type="text"
                  required
                  minLength={5}
                  placeholder="اكتب كلمة مرور جديدة..."
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#12161f] border border-gray-700 rounded-xl text-xs text-white focus:border-orange-500 text-right font-mono"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="flex-1 py-2.5 rounded-xl bg-orange-500 text-black font-extrabold text-xs transition disabled:opacity-50"
                >
                  {isProcessing ? "جاري الحفظ..." : "حفظ كلمة المرور الجديدة 🔑"}
                </button>
                <button
                  type="button"
                  onClick={() => setPwdCustomer(null)}
                  className="px-4 py-2.5 rounded-xl bg-[#1a202c] text-gray-300 text-xs font-bold"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Gift Balance Modal */}
      {giftCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative max-w-md w-full bg-[#0c1017] border border-orange-500/30 rounded-2xl p-6 text-right space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Gift className="w-5 h-5 text-orange-400" />
              <span>منح رصيد هدية لحساب ({giftCustomer.name || giftCustomer.email})</span>
            </h3>

            <form onSubmit={handleGrantGift} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  مبلغ الهدية (بالجنيه):
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={giftAmount}
                  onChange={(e) => setGiftAmount(e.target.value ? Number(e.target.value) : "")}
                  className="w-full px-3.5 py-2.5 bg-[#12161f] border border-gray-700 rounded-xl text-xs text-white focus:border-neon-purple text-right font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  سبب أو مناسبة الهدية (ستصل في إشعار للعميل):
                </label>
                <input
                  type="text"
                  required
                  value={giftReason}
                  onChange={(e) => setGiftReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#12161f] border border-gray-700 rounded-xl text-xs text-white focus:border-neon-purple text-right"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-neon-purple to-neon-pink text-white font-bold text-xs transition disabled:opacity-50"
                >
                  {isProcessing ? "جاري الإضافة..." : "منح الهدية الآن 🎁"}
                </button>
                <button
                  type="button"
                  onClick={() => setGiftCustomer(null)}
                  className="px-4 py-2.5 rounded-xl bg-[#1a202c] text-gray-300 text-xs font-bold"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Adjustment Modal */}
      {adjustCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative max-w-md w-full bg-[#0c1017] border border-orange-500/30 rounded-2xl p-6 text-right space-y-4">
            <h3 className="text-base font-bold text-white">
              تعديل رصيد العميل ({adjustCustomer.name || adjustCustomer.email})
            </h3>

            <form onSubmit={handleAdjustBalance} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">نوع العملية</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType("MANUAL_CREDIT")}
                    className={`py-2 rounded-xl text-xs font-bold transition ${
                      adjustType === "MANUAL_CREDIT"
                        ? "bg-neon-green text-black"
                        : "bg-[#12161f] text-gray-300 border border-gray-700"
                    }`}
                  >
                    إضافة رصيد (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType("MANUAL_DEDUCTION")}
                    className={`py-2 rounded-xl text-xs font-bold transition ${
                      adjustType === "MANUAL_DEDUCTION"
                        ? "bg-neon-red text-white"
                        : "bg-[#12161f] text-gray-300 border border-gray-700"
                    }`}
                  >
                    خصم رصيد (-)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">المبلغ (ج.م):</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value ? Number(e.target.value) : "")}
                  className="w-full px-3.5 py-2 bg-[#12161f] border border-gray-700 rounded-xl text-xs text-white text-right font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  السبب المالي الإلزامي (سيسجل في Audit Log):
                </label>
                <textarea
                  required
                  rows={2}
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="سبب التعديل اليدوي..."
                  className="w-full p-3 bg-[#12161f] border border-gray-700 rounded-xl text-xs text-white text-right"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="flex-1 py-2.5 rounded-xl bg-orange-500 text-black font-bold text-xs transition disabled:opacity-50"
                >
                  {isProcessing ? "جاري المعالجة..." : "تنفيذ وتوثيق العملية"}
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustCustomer(null)}
                  className="px-4 py-2.5 rounded-xl bg-[#1a202c] text-gray-300 text-xs font-bold"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Customer Confirmation Modal */}
      {deleteUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="relative max-w-md w-full bg-[#0c1017] border border-red-500/50 rounded-2xl p-6 shadow-2xl text-right space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center mx-auto border border-red-500/40">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-white">
                تأكيد حذف حساب العميل نهائياً
              </h3>
              <p className="text-xs text-gray-400">
                أنت على وشك حذف حساب{" "}
                <strong className="text-white font-mono">{deleteUser.name || deleteUser.email}</strong>
              </p>
            </div>

            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-[11px] text-red-300 space-y-1">
              <p>⚠️ <strong>تحذير هام:</strong> سيتم حذف المحفظة والطلبات والتذاكر المرتبطة بهذا الحساب نهائياً من قاعدة البيانات ولا يمكن التراجع عن هذا الإجراء.</p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleDeleteCustomer}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white font-black text-xs shadow-lg hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>نعم، حذف الحساب نهائياً</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setDeleteUser(null)}
                className="px-5 py-3 rounded-xl bg-[#1a202c] hover:bg-garage-750 text-gray-300 text-xs font-bold transition"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Management Modal */}
      {roleCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="relative max-w-md w-full bg-[#0c1017] border border-cyan-500/50 rounded-2xl p-6 text-right space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Crown className="w-5 h-5 text-orange-500" />
                <span>تعيين رتبة وصلاحيات الحساب</span>
              </h3>
              <button onClick={() => setRoleCustomer(null)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-[#12161f] border border-gray-800 space-y-1">
              <p className="text-xs font-bold text-white">{roleCustomer.name || "جيمر"}</p>
              <p className="text-[11px] text-gray-400 font-mono dir-ltr">{roleCustomer.email}</p>
            </div>

            <form onSubmit={handleUpdateRole} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-2">
                  اختر الرتبة والصلاحية المطلوبة:
                </label>
                <div className="space-y-2">
                  {[
                    {
                      role: "ADMIN",
                      label: "👑 مدير كامل (ADMIN)",
                      desc: "صلاحية كاملة لإدارة الطلبات، المنتجات، الإيداعات، والعملاء.",
                    },
                    {
                      role: "ORDER_MANAGER",
                      label: "📦 مدير تنفيذ الطلبات (ORDER_MANAGER)",
                      desc: "الاطلاع على الطلبات وتنفيذها وتغيير حالتها والتسليم.",
                    },
                    {
                      role: "SUPPORT",
                      label: "🎧 مسؤول الدعم الفني (SUPPORT)",
                      desc: "الرد على تذاكر الدعم الفني ومراجعة التقييمات.",
                    },
                    {
                      role: "CUSTOMER",
                      label: "🎮 عميل عادي (CUSTOMER)",
                      desc: "حساب مستخدم عادي للمشتريات وشحن المحفظة فقط.",
                    },
                  ].map((r) => (
                    <label
                      key={r.role}
                      className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition ${
                        selectedRole === r.role
                          ? "bg-orange-500/10 border-cyan-500/60  text-white"
                          : "bg-[#12161f] border-gray-800 text-gray-400 hover:text-white"
                      }`}
                    >
                      <input
                        type="radio"
                        name="userRole"
                        value={r.role}
                        checked={selectedRole === r.role}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        className="mt-1 accent-orange-500"
                      />
                      <div>
                        <span className="text-xs font-bold block">{r.label}</span>
                        <span className="text-[10px] text-gray-400 block mt-0.5">{r.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-gray-800">
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="flex-1 py-3 rounded-xl bg-orange-500 text-black font-extrabold text-xs transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>حفظ وتطبيق الرتبة فوراً</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setRoleCustomer(null)}
                  className="px-5 py-3 rounded-xl bg-[#1a202c] text-gray-300 text-xs font-bold"
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
