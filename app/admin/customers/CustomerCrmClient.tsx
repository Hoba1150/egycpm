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
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  LayoutList,
  LayoutGrid,
  Copy,
  Check,
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
  const [copiedPwdId, setCopiedPwdId] = useState<string | null>(null);

  const handleCopyPassword = (userId: string, pwd: string) => {
    if (!pwd || pwd === "غير محددة" || pwd.includes("مشفرة")) {
      toast.error("لا توجد كلمة مرور صريحة قابلة للنسخ");
      return;
    }

    const doSuccess = () => {
      setCopiedPwdId(userId);
      toast.success("تم نسخ كلمة المرور بنجاح 📋");
      setTimeout(() => setCopiedPwdId(null), 2000);
    };

    if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
      navigator.clipboard
        .writeText(pwd)
        .then(doSuccess)
        .catch(() => fallbackCopy(pwd, doSuccess));
    } else {
      fallbackCopy(pwd, doSuccess);
    }
  };

  const fallbackCopy = (text: string, onSuccess: () => void) => {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      textArea.setAttribute("readonly", "");
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand("copy");
      textArea.remove();
      if (successful) {
        onSuccess();
      } else {
        toast.error("تعذر النسخ تلقائياً، يرجى تحديد كلمة المرور ونسخها يدوياً");
      }
    } catch (err) {
      toast.error("تعذر النسخ تلقائياً، يرجى تحديد كلمة المرور ونسخها يدوياً");
    }
  };

  // Mobile Accordion & Filter State
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<"ALL" | "WITH_BALANCE" | "WITH_ORDERS" | "ADMINS">("ALL");
  const [mobileViewMode, setMobileViewMode] = useState<"COMPACT" | "CARDS">("COMPACT");

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

  // Counts for quick touch filters
  const counts = {
    all: customers.length,
    withBalance: customers.filter((c) => (c.wallet?.balance || 0) > 0 || (c.wallet?.giftBalance || 0) > 0).length,
    withOrders: customers.filter((c) => (c._count?.orders || 0) > 0).length,
    admins: customers.filter((c) => c.role !== "CUSTOMER").length,
  };

  const filtered = customers.filter((c) => {
    const matchesSearch =
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      (c.name && c.name.toLowerCase().includes(search.toLowerCase())) ||
      (c.phone && c.phone.includes(search));

    if (!matchesSearch) return false;

    if (filterTab === "WITH_BALANCE") return (c.wallet?.balance || 0) > 0 || (c.wallet?.giftBalance || 0) > 0;
    if (filterTab === "WITH_ORDERS") return (c._count?.orders || 0) > 0;
    if (filterTab === "ADMINS") return c.role !== "CUSTOMER";

    return true;
  });

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
      {/* Search & Mobile Controls Header */}
      <div className="flex flex-col gap-3 border-b border-gray-800 pb-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center justify-between w-full sm:w-auto gap-2">
            <span className="text-xs font-bold text-gray-300">
              إجمالي الحسابات: <strong className="text-white font-mono">{filtered.length}</strong> من أصل {customers.length}
            </span>

            {/* Mobile View Toggle Switch */}
            <div className="md:hidden flex items-center gap-1 p-1 rounded-xl bg-[#161b24] border border-gray-700">
              <button
                type="button"
                onClick={() => setMobileViewMode("COMPACT")}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                  mobileViewMode === "COMPACT"
                    ? "bg-cyan-500 text-black font-black shadow-sm"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <LayoutList className="w-3.5 h-3.5" />
                <span>مدمج</span>
              </button>
              <button
                type="button"
                onClick={() => setMobileViewMode("CARDS")}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                  mobileViewMode === "CARDS"
                    ? "bg-cyan-500 text-black font-black shadow-sm"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>كروت</span>
              </button>
            </div>
          </div>

          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder="ابحث بالاسم، الإيميل، أو الهاتف..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 bg-[#12161f] border border-gray-700 rounded-xl text-xs text-white placeholder-gray-500 focus:border-cyan-400 text-right"
            />
            <Search className="w-4 h-4 absolute right-3.5 top-3 text-gray-400" />
          </div>
        </div>

        {/* Quick Touch Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <button
            type="button"
            onClick={() => setFilterTab("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              filterTab === "ALL"
                ? "bg-white text-black font-black shadow-sm"
                : "bg-[#141a24] text-gray-400 hover:text-white border border-gray-800"
            }`}
          >
            <span>الكل</span>
            <span className="px-1.5 py-0.2 rounded-full bg-black/40 text-[10px] font-mono">
              {counts.all}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterTab("WITH_BALANCE")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
              filterTab === "WITH_BALANCE"
                ? "bg-emerald-500 text-black font-black border-emerald-400 shadow-md shadow-emerald-500/20"
                : "bg-emerald-950/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-950/40"
            }`}
          >
            <span>لديهم رصيد 💰</span>
            <span className="px-1.5 py-0.2 rounded-full bg-black/40 text-[10px] font-mono">
              {counts.withBalance}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterTab("WITH_ORDERS")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
              filterTab === "WITH_ORDERS"
                ? "bg-cyan-500 text-black font-black border-cyan-400 shadow-md shadow-cyan-500/20"
                : "bg-cyan-950/20 text-cyan-400 border-cyan-500/40 hover:bg-cyan-950/40"
            }`}
          >
            <span>أصحاب طلبات 📦</span>
            <span className="px-1.5 py-0.2 rounded-full bg-black/40 text-[10px] font-mono">
              {counts.withOrders}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilterTab("ADMINS")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
              filterTab === "ADMINS"
                ? "bg-amber-500 text-black font-black border-amber-400 shadow-md shadow-amber-500/20"
                : "bg-amber-950/20 text-amber-400 border-amber-500/40 hover:bg-amber-950/40"
            }`}
          >
            <span>الطاقم الإداري 👑</span>
            <span className="px-1.5 py-0.2 rounded-full bg-black/40 text-[10px] font-mono">
              {counts.admins}
            </span>
          </button>
        </div>
      </div>

      {/* ═══ Mobile Customer Views (md:hidden) ═══ */}
      <div className="md:hidden space-y-2.5">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-gray-500 text-xs bg-[#12161f] rounded-2xl border border-gray-800">
            لا توجد حسابات مطابقة للبحث أو الفلتر المحدد.
          </div>
        ) : mobileViewMode === "COMPACT" ? (
          /* 📱 MODE 1: COMPACT ACCORDION ROWS (High Efficiency) */
          filtered.map((c) => {
            const isExpanded = expandedId === c.id;
            const isRevealed = revealedPasswords[c.id];
            const displayPwd = c.decryptedPassword || (c.passwordHash ? "[مشفرة]" : "غير محددة");

            return (
              <div
                key={c.id}
                className={`bg-[#12161f] rounded-2xl border transition overflow-hidden ${
                  isExpanded
                    ? "border-cyan-500/60 shadow-lg shadow-cyan-500/10 bg-gradient-to-b from-[#141b27] to-[#12161f]"
                    : "border-gray-800/80 hover:border-gray-700"
                }`}
              >
                {/* Compact Clickable Summary Bar (~52px height) */}
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : c.id)}
                  className="w-full p-3 flex items-center justify-between gap-2.5 text-right transition"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <img
                      src={c.image || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80"}
                      alt={c.name}
                      className="w-9 h-9 rounded-xl object-cover border border-gray-700 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-white text-xs truncate max-w-[130px]">
                          {c.name || "جيمر"}
                        </span>
                        {c.role !== "CUSTOMER" && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 text-[9px] font-mono font-bold shrink-0 border border-amber-500/40">
                            {c.role}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-400 font-mono block truncate max-w-[160px]">
                        {c.phone ? `📱 ${c.phone}` : c.email}
                      </span>
                    </div>
                  </div>

                  {/* Balance & Orders + Chevron */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-left">
                      <span className="text-xs font-black text-emerald-400 font-mono block">
                        {formatCurrency(c.wallet?.balance || 0)}
                      </span>
                      <span className="text-[9px] text-gray-400 font-mono">
                        {c._count?.orders || 0} طلب
                      </span>
                    </div>

                    <div
                      className={`p-1.5 rounded-lg bg-[#1a2230] text-gray-400 transition-transform duration-200 ${
                        isExpanded ? "rotate-180 text-cyan-400 bg-cyan-950/40" : ""
                      }`}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>
                </button>

                {/* Expanded Details Drawer */}
                {isExpanded && (
                  <div className="px-3.5 pb-4 pt-2 border-t border-gray-800/80 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Full Email if different from phone */}
                    <div className="flex items-center justify-between text-[11px] px-2 py-1.5 rounded-xl bg-[#0c1017] border border-gray-800">
                      <span className="text-gray-400">البريد الإلكتروني:</span>
                      <span className="text-gray-200 font-mono text-[10px] select-all">{c.email}</span>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-[#0c1017] rounded-xl p-2 text-center border border-gray-800/60">
                        <span className="text-[9px] text-gray-400 block mb-0.5">الهدايا 🎁</span>
                        <span className="text-xs font-black text-amber-400 font-mono">
                          {formatCurrency(c.wallet?.giftBalance || 0)}
                        </span>
                      </div>
                      <div className="bg-[#0c1017] rounded-xl p-2 text-center border border-gray-800/60">
                        <span className="text-[9px] text-gray-400 block mb-0.5">المشتريات 🛒</span>
                        <span className="text-xs font-black text-gray-200 font-mono">
                          {formatCurrency(c.wallet?.totalSpent || 0)}
                        </span>
                      </div>
                    </div>

                    {/* Dedicated Full-Width Password Bar with One-Touch Copy */}
                    <div className="p-2.5 rounded-xl bg-[#0a0d13] border border-orange-500/30 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-400 shrink-0">
                          <Lock className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                            <span>كلمة المرور الحالية:</span>
                            {!c.plainPasswordEncrypted && c.passwordHash && (
                              <span className="text-[9px] text-amber-500/80">(مشفرة قديماً)</span>
                            )}
                          </div>
                          <div className="text-xs font-mono font-bold text-orange-400 select-all break-all mt-0.5 leading-relaxed">
                            {isRevealed ? displayPwd : "••••••••••••"}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => togglePasswordReveal(c.id)}
                          className="p-1.5 rounded-lg bg-[#141a24] hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700/60 transition active:scale-95"
                          title={isRevealed ? "إخفاء كلمة المرور" : "كشف كلمة المرور"}
                        >
                          {isRevealed ? <EyeOff className="w-4 h-4 text-orange-400" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyPassword(c.id, displayPwd)}
                          className={`px-2.5 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition active:scale-95 ${
                            copiedPwdId === c.id
                              ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/30"
                              : "bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/40"
                          }`}
                          title="نسخ كلمة المرور"
                        >
                          {copiedPwdId === c.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span className="text-[11px] font-sans font-bold">{copiedPwdId === c.id ? "تم النسخ" : "نسخ"}</span>
                        </button>
                      </div>
                    </div>

                    {/* Action Buttons Grid */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setGiftCustomer(c)}
                        className="py-2 px-2 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-bold flex items-center justify-center gap-1.5 transition hover:bg-orange-500/20"
                      >
                        <Gift className="w-3.5 h-3.5" />
                        <span>منح هدية 🎁</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setAdjustCustomer(c);
                          setAdjustType("MANUAL_CREDIT");
                          setAdjustAmount(100);
                          setAdjustReason("");
                        }}
                        className="py-2 px-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-center gap-1.5 transition hover:bg-emerald-500/20"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>تعديل الرصيد</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setPwdCustomer(c);
                          setNewPassword("");
                        }}
                        className="py-2 px-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold flex items-center justify-center gap-1.5 transition hover:bg-cyan-500/20"
                      >
                        <Key className="w-3.5 h-3.5" />
                        <span>تغيير الباسورد</span>
                      </button>

                      {isSuperAdmin && (
                        <button
                          type="button"
                          onClick={() => {
                            setRoleCustomer(c);
                            setSelectedRole(c.role);
                          }}
                          className={`py-2 px-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                            c.role !== "CUSTOMER"
                              ? "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20"
                              : "bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500/20"
                          }`}
                        >
                          <Crown className="w-3.5 h-3.5" />
                          <span>{c.role !== "CUSTOMER" ? "تعديل الرتبة" : "ترقية أدمن"}</span>
                        </button>
                      )}

                      {c.role !== "SUPER_ADMIN" && (
                        <button
                          type="button"
                          onClick={() => setDeleteUser(c)}
                          className="py-2 px-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold flex items-center justify-center gap-1.5 transition hover:bg-red-500/20 col-span-2"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>حذف الحساب نهائياً</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          /* 📋 MODE 2: CLASSIC FULL CARDS VIEW */
          filtered.map((c) => {
            const isRevealed = revealedPasswords[c.id];
            const displayPwd = c.decryptedPassword || (c.passwordHash ? "[مشفرة]" : "غير محددة");

            return (
              <div key={c.id} className="bg-[#12161f] border border-gray-800 rounded-2xl overflow-hidden">
                {/* Card Header */}
                <div className="p-4 flex items-center gap-3">
                  <img
                    src={c.image || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80"}
                    alt={c.name}
                    className="w-11 h-11 rounded-xl object-cover border border-gray-700 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-black text-white text-sm">{c.name || "جيمر"}</span>
                      {c.role !== "CUSTOMER" && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 text-[9px] font-mono font-bold shrink-0 border border-amber-500/30">
                          {c.role}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-gray-400 font-mono block truncate">{c.email}</span>
                    {c.phone && (
                      <span className="text-[10px] text-cyan-400 font-mono flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" />
                        <span>{c.phone}</span>
                      </span>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-base font-black text-emerald-400 font-mono block">
                      {formatCurrency(c.wallet?.balance || 0)}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">{c._count?.orders || 0} طلب</span>
                  </div>
                </div>

                {/* Stats Row */}
                <div className="px-4 pb-3 grid grid-cols-2 gap-2">
                  <div className="bg-[#0d1117] rounded-xl p-2 text-center border border-gray-800/60">
                    <span className="text-[9px] text-gray-400 block mb-0.5">الهدايا 🎁</span>
                    <span className="text-xs font-black text-amber-400 font-mono">
                      {formatCurrency(c.wallet?.giftBalance || 0)}
                    </span>
                  </div>
                  <div className="bg-[#0d1117] rounded-xl p-2 text-center border border-gray-800/60">
                    <span className="text-[9px] text-gray-400 block mb-0.5">المشتريات 🛒</span>
                    <span className="text-xs font-black text-gray-200 font-mono">
                      {formatCurrency(c.wallet?.totalSpent || 0)}
                    </span>
                  </div>
                </div>

                {/* Dedicated Full-Width Password Bar with One-Touch Copy */}
                <div className="mx-4 mb-3 p-2.5 rounded-xl bg-[#0a0d13] border border-orange-500/30 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-400 shrink-0">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                        <span>كلمة المرور الحالية:</span>
                        {!c.plainPasswordEncrypted && c.passwordHash && (
                          <span className="text-[9px] text-amber-500/80">(مشفرة قديماً)</span>
                        )}
                      </div>
                      <div className="text-xs font-mono font-bold text-orange-400 select-all break-all mt-0.5 leading-relaxed">
                        {isRevealed ? displayPwd : "••••••••••••"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => togglePasswordReveal(c.id)}
                      className="p-1.5 rounded-lg bg-[#141a24] hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700/60 transition active:scale-95"
                      title={isRevealed ? "إخفاء كلمة المرور" : "كشف كلمة المرور"}
                    >
                      {isRevealed ? <EyeOff className="w-4 h-4 text-orange-400" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopyPassword(c.id, displayPwd)}
                      className={`px-2.5 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition active:scale-95 ${
                        copiedPwdId === c.id
                          ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/30"
                          : "bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/40"
                      }`}
                      title="نسخ كلمة المرور"
                    >
                      {copiedPwdId === c.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span className="text-[11px] font-sans font-bold">{copiedPwdId === c.id ? "تم النسخ" : "نسخ"}</span>
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="px-3 pb-4 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setGiftCustomer(c)}
                    className="py-2.5 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-bold flex items-center justify-center gap-1.5 transition hover:bg-orange-500/20"
                  >
                    <Gift className="w-3.5 h-3.5" />
                    <span>هدية رصيد 🎁</span>
                  </button>

                  <button
                    onClick={() => {
                      setAdjustCustomer(c);
                      setAdjustType("MANUAL_CREDIT");
                      setAdjustAmount(100);
                      setAdjustReason("");
                    }}
                    className="py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-center gap-1.5 transition hover:bg-emerald-500/20"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>تعديل الرصيد</span>
                  </button>

                  <button
                    onClick={() => {
                      setPwdCustomer(c);
                      setNewPassword("");
                    }}
                    className="py-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold flex items-center justify-center gap-1.5 transition hover:bg-cyan-500/20"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>تغيير كلمة المرور</span>
                  </button>

                  {isSuperAdmin && (
                    <button
                      onClick={() => {
                        setRoleCustomer(c);
                        setSelectedRole(c.role);
                      }}
                      className={`py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                        c.role !== "CUSTOMER"
                          ? "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20"
                          : "bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500/20"
                      }`}
                    >
                      <Crown className="w-3.5 h-3.5" />
                      <span>{c.role !== "CUSTOMER" ? "تعديل الرتبة" : "ترقية أدمن"}</span>
                    </button>
                  )}

                  {c.role !== "SUPER_ADMIN" && (
                    <button
                      onClick={() => setDeleteUser(c)}
                      className="py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold flex items-center justify-center gap-1.5 transition hover:bg-red-500/20 col-span-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف الحساب نهائياً</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ═══ Desktop Table (hidden on mobile) ═══ */}
      <div className="hidden md:block rounded-2xl bg-[#12161f] border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-gray-800 bg-[#0c1017] text-gray-400 font-bold">
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
                              <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[9px] font-mono font-bold border border-amber-500/30">
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

                    {/* Password View, Copy & Edit */}
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 font-mono">
                        <span className="text-orange-400 font-bold bg-[#0c1017] px-2.5 py-1 rounded-lg border border-gray-800 text-[11px] select-all max-w-[180px] break-all">
                          {isRevealed ? displayPwd : "••••••••"}
                        </span>
                        <button
                          type="button"
                          onClick={() => togglePasswordReveal(c.id)}
                          className="p-1.5 rounded-lg bg-[#1a202c] hover:bg-gray-700 text-gray-300 hover:text-white transition"
                          title={isRevealed ? "إخفاء كلمة المرور" : "كشف كلمة المرور"}
                        >
                          {isRevealed ? <EyeOff className="w-3.5 h-3.5 text-orange-400" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyPassword(c.id, displayPwd)}
                          className={`p-1.5 rounded-lg transition ${
                            copiedPwdId === c.id
                              ? "bg-emerald-500 text-black shadow-sm"
                              : "bg-[#1a202c] hover:bg-gray-700 text-gray-300 hover:text-white"
                          }`}
                          title="نسخ كلمة المرور"
                        >
                          {copiedPwdId === c.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPwdCustomer(c);
                            setNewPassword("");
                          }}
                          className="p-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 transition"
                          title="تغيير كلمة مرور العميل"
                        >
                          <Key className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    {/* Balances */}
                    <td className="p-4 font-bold text-sm text-emerald-400 font-mono">
                      {formatCurrency(c.wallet?.balance || 0)}
                    </td>
                    <td className="p-4 font-bold text-sm text-amber-400 font-mono">
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
                          className="px-2 py-1 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20 text-xs font-bold transition flex items-center gap-1"
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
                          className="px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition flex items-center gap-1"
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
                                : "bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border-purple-500/30"
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
          <div className="relative max-w-md w-full bg-[#0c1017] border border-cyan-500/30 rounded-2xl p-6 text-right space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Key className="w-5 h-5 text-cyan-400" />
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
                  className="w-full px-3.5 py-2.5 bg-[#12161f] border border-gray-700 rounded-xl text-xs text-white focus:border-cyan-400 text-right font-mono"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="flex-1 py-2.5 rounded-xl bg-cyan-500 text-black font-extrabold text-xs transition disabled:opacity-50"
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
          <div className="relative max-w-md w-full bg-[#0c1017] border border-amber-500/30 rounded-2xl p-6 text-right space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Gift className="w-5 h-5 text-amber-400" />
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
                  className="w-full px-3.5 py-2.5 bg-[#12161f] border border-gray-700 rounded-xl text-xs text-white focus:border-amber-400 text-right font-mono font-bold"
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
                  className="w-full px-3.5 py-2.5 bg-[#12161f] border border-gray-700 rounded-xl text-xs text-white focus:border-amber-400 text-right"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-black font-extrabold text-xs transition disabled:opacity-50"
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
          <div className="relative max-w-md w-full bg-[#0c1017] border border-emerald-500/30 rounded-2xl p-6 text-right space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">
              تعديل رصيد العميل ({adjustCustomer.name || adjustCustomer.email})
            </h3>

            <form onSubmit={handleAdjustBalance} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">نوع العملية:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType("MANUAL_CREDIT")}
                    className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition ${
                      adjustType === "MANUAL_CREDIT"
                        ? "bg-emerald-500 text-black font-extrabold"
                        : "bg-[#12161f] text-gray-400 border border-gray-700"
                    }`}
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>إيداع يدوي (+)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType("MANUAL_DEDUCTION")}
                    className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition ${
                      adjustType === "MANUAL_DEDUCTION"
                        ? "bg-red-500 text-white font-extrabold"
                        : "bg-[#12161f] text-gray-400 border border-gray-700"
                    }`}
                  >
                    <MinusCircle className="w-3.5 h-3.5" />
                    <span>خصم رصيد (-)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">المبلغ (بالجنيه):</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value ? Number(e.target.value) : "")}
                  className="w-full px-3.5 py-2.5 bg-[#12161f] border border-gray-700 rounded-xl text-xs text-white focus:border-emerald-400 text-right font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">السبب التوضيحي (Audit Log):</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: تسوية إيداع فودافون كاش، تعويض طلب..."
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#12161f] border border-gray-700 rounded-xl text-xs text-white focus:border-emerald-400 text-right"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-black font-extrabold text-xs transition disabled:opacity-50"
                >
                  {isProcessing ? "جاري التعديل..." : "تأكيد العملية"}
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

      {/* Role Management Modal */}
      {roleCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative max-w-md w-full bg-[#0c1017] border border-amber-500/30 rounded-2xl p-6 text-right space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-400" />
              <span>تغيير رتبة الحساب ({roleCustomer.name || roleCustomer.email})</span>
            </h3>

            <p className="text-xs text-gray-300">
              اختر الرتبة الإدارية أو أعد الحساب كعميل عادي (CUSTOMER).
            </p>

            <form onSubmit={handleUpdateRole} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">الرتبة الجديدة:</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#12161f] border border-gray-700 rounded-xl text-xs text-white focus:border-amber-400 text-right font-bold"
                >
                  <option value="CUSTOMER">عميل عادي (CUSTOMER)</option>
                  <option value="SUPPORT">دعم فني (SUPPORT)</option>
                  <option value="ORDER_MANAGER">مسؤول طلبات (ORDER_MANAGER)</option>
                  <option value="ADMIN">أدمن عام (ADMIN)</option>
                  <option value="SUPER_ADMIN">سوبر أدمن (SUPER_ADMIN)</option>
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 text-black font-extrabold text-xs transition disabled:opacity-50"
                >
                  {isProcessing ? "جاري الحفظ..." : "حفظ الرتبة الجديدة 👑"}
                </button>
                <button
                  type="button"
                  onClick={() => setRoleCustomer(null)}
                  className="px-4 py-2.5 rounded-xl bg-[#1a202c] text-gray-300 text-xs font-bold"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="relative max-w-md w-full bg-[#0c1017] border border-red-500/40 rounded-2xl p-6 text-right space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-white">تأكيد حذف حساب العميل نهائياً</h3>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              هل أنت متأكد تماماً من رغبتك في حذف حساب العميل{" "}
              <strong className="text-white">({deleteUser.name || deleteUser.email})</strong>؟
              <br />
              <span className="text-red-400 font-bold block mt-1">
                ⚠️ تحذير: سيتم حذف بيانات المحفظة والطلبات المرتبطة نهائياً ولا يمكن التراجع عن هذا الإجراء!
              </span>
            </p>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleDeleteCustomer}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs transition disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>نعم، احذف الحساب نهائياً</span>
              </button>
              <button
                type="button"
                onClick={() => setDeleteUser(null)}
                className="px-4 py-2.5 rounded-xl bg-[#1a202c] text-gray-300 text-xs font-bold"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
