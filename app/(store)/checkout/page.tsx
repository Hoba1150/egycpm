"use client";

import React, { useState, useEffect } from "react";
import { useCartStore } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import { createOrder } from "@/lib/actions/order";
import { validateCouponCode } from "@/lib/actions/coupon";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import Link from "next/link";
import {
  Wallet,
  ShieldCheck,
  Zap,
  AlertTriangle,
  Loader2,
  Gamepad2,
  Tag,
  User as UserIcon,
  Phone,
  CheckCircle2,
} from "lucide-react";
import AuthModal from "@/components/shared/AuthModal";

export default function CheckoutPage() {
  const router = useRouter();
  const {
    items,
    appliedCoupon,
    applyCoupon,
    getSubtotal,
    getDiscount,
    getTotal,
    clearCart,
  } = useCartStore();

  const [user, setUser] = useState<any>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Form Fields
  const [fulfillmentType, setFulfillmentType] = useState<
    "EXISTING_ACCOUNT" | "NEW_ACCOUNT_CUSTOM" | "NEW_ACCOUNT_AUTO"
  >("EXISTING_ACCOUNT");
  const [gameUsername, setGameUsername] = useState("");
  const [gamePassword, setGamePassword] = useState("");
  const [gamePlayerId, setGamePlayerId] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");

  // Game Account specific fields (Name & Phone only)
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  // Coupon code input in checkout
  const [couponInput, setCouponInput] = useState("");
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if any item in cart is a Game Account
  const isGameAccountOrder = items.some(
    (it) => it.productType === "GAME_ACCOUNT" || it.productType === "ACCOUNT"
  );

  const subtotal = getSubtotal();
  const discount = getDiscount();
  const total = getTotal();

  // Fetch session & live wallet
  const fetchSession = async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        if (data.user?.name && !customerName) setCustomerName(data.user.name);
        if (data.user?.phone && !customerPhone) setCustomerPhone(data.user.phone);
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingUser(false);
    }
  };

  useEffect(() => {
    fetchSession();

    window.addEventListener("cpm_auth_changed", fetchSession);
    window.addEventListener("focus", fetchSession);

    return () => {
      window.removeEventListener("cpm_auth_changed", fetchSession);
      window.removeEventListener("focus", fetchSession);
    };
  }, []);

  const walletBalance = user?.wallet?.totalAvailable || 0;
  const isBalanceSufficient = walletBalance >= total;
  const remainingBalance = Math.max(0, walletBalance - total);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;

    setIsValidatingCoupon(true);
    try {
      const res = await validateCouponCode(couponInput, subtotal);
      if (res.valid) {
        applyCoupon({
          code: res.code!,
          discountType: res.discountType as any,
          discountValue: res.discountValue!,
          discountAmount: res.discountAmount!,
        });
        toast.success(res.message);
        setCouponInput("");
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("فشل تطبيق الكوبون.");
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleConfirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    if (items.length === 0) {
      toast.error("سلة التسوق فارغة.");
      router.push("/shop");
      return;
    }

    if (!isBalanceSufficient) {
      toast.error("رصيد المحفظة غير كافٍ لإتمام عملية الشراء. يرجى شحن محفظتك أولاً.");
      return;
    }

    // Validation
    if (isGameAccountOrder) {
      if (!customerName.trim()) {
        toast.error("يرجى إدخال اسمك للتسجيل.");
        return;
      }
      if (!customerPhone.trim() || customerPhone.trim().length < 8) {
        toast.error("يرجى إدخال رقم هاتف صحيح.");
        return;
      }
    } else {
      if (fulfillmentType === "EXISTING_ACCOUNT") {
        if (!gameUsername.trim() || !gameUsername.includes("@")) {
          toast.error("يرجى إدخال البريد الإلكتروني المسجل في حساب اللعبة الحالي.");
          return;
        }
        if (!gamePassword || gamePassword.trim().length < 3) {
          toast.error("يرجى إدخال كلمة مرور حساب اللعبة.");
          return;
        }
      } else if (fulfillmentType === "NEW_ACCOUNT_CUSTOM") {
        if (!gameUsername.trim() || !gameUsername.includes("@")) {
          toast.error("يرجى إدخال البريد الإلكتروني المطلوب للحساب الجديد.");
          return;
        }
        if (!gamePassword || gamePassword.trim().length < 4) {
          toast.error("يرجى إدخال كلمة المرور المطلوبة للحساب الجديد (4 أحرف/أرقام على الأقل).");
          return;
        }
      }
    }

    setIsSubmitting(true);
    try {
      const formattedNotes = isGameAccountOrder
        ? `الاسم: ${customerName} | الهاتف: ${customerPhone}${customerNotes.trim() ? ` | ملاحظات: ${customerNotes.trim()}` : ""}`
        : customerNotes.trim() || null;

      const res = await createOrder({
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        couponCode: appliedCoupon?.code || null,
        fulfillmentType: isGameAccountOrder ? "INSTANT_GAME_ACCOUNT" : fulfillmentType,
        gameUsername: isGameAccountOrder || fulfillmentType === "NEW_ACCOUNT_AUTO" ? null : gameUsername.trim(),
        gamePassword: isGameAccountOrder || fulfillmentType === "NEW_ACCOUNT_AUTO" ? null : gamePassword,
        gamePlayerId: isGameAccountOrder ? null : (gamePlayerId.trim() || null),
        customerNotes: formattedNotes,
      });

      if (res.success && res.order) {
        try {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {
          // ignore
        }

        toast.success(
          isGameAccountOrder
            ? `🎉 تم شراء الحساب بنجاح! تم إرسال بيانات الدخول إلى مركز الإشعارات.`
            : `تم إنشاء الطلب رقم ${res.order.orderNumber} بنجاح! 🚀`
        );
        clearCart();
        router.push(`/orders/${res.order.orderNumber}`);
      }
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء معالجة الطلب.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0 && !isSubmitting) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-black text-white">لا توجد منتجات للدفع</h2>
        <p className="text-xs text-gray-400">سلتك فارغة، أضف بعض المنتجات أولاً للمتابعة.</p>
        <Link href="/shop" className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-black font-black text-xs inline-block shadow-sm">
          العودة للمتجر
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-right space-y-6">
        {/* Header */}
        <div className="space-y-1 border-b border-gray-800 pb-4">
          <span className="text-xs font-mono font-bold text-orange-500 uppercase">
            Safe Checkout
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            تأكيد الدفع وإنشاء الطلب
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Form Info */}
          <div className="lg:col-span-7 space-y-6">
            {/* User Identification Notice */}
            {!user ? (
              <div className="p-5 rounded-2xl bg-[#0f1218] border border-orange-500/30 flex items-center justify-between shadow-sm">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">يجب تسجيل الدخول أولاً</h4>
                  <p className="text-xs text-gray-400">لحفظ طلباتك وإتمام الدفع من رصيد محفظتك</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAuthModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-black font-black text-xs transition"
                >
                  تسجيل الدخول
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-[#0f1218] border border-gray-800 flex items-center gap-3 shadow-sm">
                <img
                  src={user.image || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"}
                  alt={user.name}
                  className="w-10 h-10 rounded-xl object-cover border border-orange-500/40"
                />
                <div>
                  <span className="text-[10px] text-gray-400 block">حساب المشتري:</span>
                  <h4 className="text-xs font-bold text-white">{user.name} ({user.email})</h4>
                </div>
              </div>
            )}

            {/* If Order is a GAME ACCOUNT: Simple Name & Phone form */}
            {isGameAccountOrder ? (
              <div className="p-6 rounded-2xl bg-[#0f1218] border border-purple-500/40 shadow-sm space-y-4 relative overflow-hidden card-drift-accent">
                <div className="flex items-center gap-2 text-white font-black text-sm">
                  <Gamepad2 className="w-5 h-5 text-purple-400" />
                  <span>بيانات استلام حساب اللعبة (تسليم فوري 🎮)</span>
                </div>

                <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-xs text-purple-300 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-white">
                    <CheckCircle2 className="w-4 h-4 text-purple-400" />
                    <span>تسليم إلكتروني مباشر وتلقائي:</span>
                  </div>
                  <p className="text-[11px] text-gray-300 leading-relaxed">
                    هذا المنتج عبارة عن <strong>حساب جاهز</strong>. ستستلم (البريد الإلكتروني وكلمة المرور) فوراً داخل <strong>مركز الإشعارات</strong> وصفحة الطلب بمجرد تأكيد الدفع من رصيد محفظتك، دون انتظار أي موافقة.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1 flex items-center gap-1">
                      <UserIcon className="w-3.5 h-3.5 text-purple-400" />
                      <span>الاسم الكامل *</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="اسمك الكريم"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#161b24] border border-gray-700 rounded-xl text-xs text-white placeholder-gray-500 focus:border-purple-500 text-right"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-purple-400" />
                      <span>رقم الهاتف / واتساب *</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="01xxxxxxxxx"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#161b24] border border-gray-700 rounded-xl text-xs text-white placeholder-gray-500 focus:border-purple-500 text-right font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">
                    ملاحظات إضافية (اختياري)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="اكتب أي ملاحظة إن رغبت..."
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    className="w-full p-3 bg-[#161b24] border border-gray-700 rounded-xl text-xs text-white placeholder-gray-500 focus:border-purple-500 text-right"
                  />
                </div>

                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2.5 text-xs text-emerald-400">
                  <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-gray-300">
                    <strong>حماية ضد الشراء المزدوج:</strong> يتم حجز الحساب وإيقافه عن أي مشترٍ آخر فور إتمام عملية الشراء بنجاح.
                  </p>
                </div>
              </div>
            ) : (
              /* Regular Products Fulfillment Form */
              <div className="p-6 rounded-2xl bg-[#0f1218] border border-gray-800 shadow-sm space-y-4 relative overflow-hidden card-drift-accent">
                <div className="flex items-center gap-2 text-white font-black text-sm">
                  <Gamepad2 className="w-5 h-5 text-orange-500" />
                  <span>طريقة تسليم وتنفيذ الطلب في لعبة Car Parking</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setFulfillmentType("EXISTING_ACCOUNT")}
                    className={`p-3.5 rounded-xl border text-right transition flex flex-col justify-between gap-1.5 ${
                      fulfillmentType === "EXISTING_ACCOUNT"
                        ? "bg-orange-500/10 border-orange-500 text-white shadow-[0_0_15px_rgba(255,102,0,0.15)]"
                        : "bg-[#12161f] border-gray-800 text-gray-400 hover:border-gray-700 hover:text-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-white">1. حسابي الحالي في اللعبة</span>
                      <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${fulfillmentType === "EXISTING_ACCOUNT" ? "border-orange-500 bg-orange-500" : "border-gray-600"}`}>
                        {fulfillmentType === "EXISTING_ACCOUNT" && <span className="w-1.5 h-1.5 bg-black rounded-full" />}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400">
                      شحن أو تسليم السيارات مباشرة داخل حسابك الحالي المسجل.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFulfillmentType("NEW_ACCOUNT_AUTO")}
                    className={`p-3.5 rounded-xl border text-right transition flex flex-col justify-between gap-1.5 ${
                      fulfillmentType.startsWith("NEW_ACCOUNT")
                        ? "bg-orange-500/10 border-orange-500 text-white shadow-[0_0_15px_rgba(255,102,0,0.15)]"
                        : "bg-[#12161f] border-gray-800 text-gray-400 hover:border-gray-700 hover:text-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-white">2. أريد حساب جديد للعبة 🔑</span>
                      <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${fulfillmentType.startsWith("NEW_ACCOUNT") ? "border-orange-500 bg-orange-500" : "border-gray-600"}`}>
                        {fulfillmentType.startsWith("NEW_ACCOUNT") && <span className="w-1.5 h-1.5 bg-black rounded-full" />}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400">
                      إنشاء حساب جديد بالكامل يحتوي على طلبك واستلام بيانات الدخول.
                    </p>
                  </button>
                </div>

                {/* Sub Options for NEW_ACCOUNT */}
                {fulfillmentType.startsWith("NEW_ACCOUNT") && (
                  <div className="p-3 rounded-xl bg-[#161b24] border border-gray-700 space-y-2 text-xs">
                    <span className="font-bold text-gray-300 block">خيارات الحساب الجديد:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <label
                        onClick={() => setFulfillmentType("NEW_ACCOUNT_AUTO")}
                        className={`p-2.5 rounded-lg border cursor-pointer transition flex items-center gap-2 ${
                          fulfillmentType === "NEW_ACCOUNT_AUTO"
                            ? "bg-orange-500/20 border-orange-500 text-white"
                            : "bg-[#12161f] border-gray-800 text-gray-400 hover:text-white"
                        }`}
                      >
                        <input
                          type="radio"
                          name="newAccOption"
                          checked={fulfillmentType === "NEW_ACCOUNT_AUTO"}
                          onChange={() => setFulfillmentType("NEW_ACCOUNT_AUTO")}
                          className="accent-orange-500"
                        />
                        <span className="text-[11px] font-bold">دع الإدارة تنشئ وتحدد البيانات تلقائياً</span>
                      </label>

                      <label
                        onClick={() => setFulfillmentType("NEW_ACCOUNT_CUSTOM")}
                        className={`p-2.5 rounded-lg border cursor-pointer transition flex items-center gap-2 ${
                          fulfillmentType === "NEW_ACCOUNT_CUSTOM"
                            ? "bg-orange-500/20 border-orange-500 text-white"
                            : "bg-[#12161f] border-gray-800 text-gray-400 hover:text-white"
                        }`}
                      >
                        <input
                          type="radio"
                          name="newAccOption"
                          checked={fulfillmentType === "NEW_ACCOUNT_CUSTOM"}
                          onChange={() => setFulfillmentType("NEW_ACCOUNT_CUSTOM")}
                          className="accent-orange-500"
                        />
                        <span className="text-[11px] font-bold">سأحدد إيميل وباسورد الحساب بنفسي</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Dynamic Form Inputs */}
                <div className="space-y-3 pt-2">
                  {fulfillmentType !== "NEW_ACCOUNT_AUTO" && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-gray-300 mb-1">
                          {fulfillmentType === "EXISTING_ACCOUNT"
                            ? "البريد الإلكتروني المسجل في حساب اللعبة (Game Email) *"
                            : "البريد الإلكتروني المطلوب للحساب الجديد *"}
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="example@gmail.com"
                          value={gameUsername}
                          onChange={(e) => setGameUsername(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-[#161b24] border border-gray-700 rounded-xl text-xs text-white placeholder-gray-500 focus:border-orange-500 text-right dir-ltr font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-300 mb-1">
                          {fulfillmentType === "EXISTING_ACCOUNT"
                            ? "كلمة مرور حساب اللعبة (Game Password) *"
                            : "كلمة المرور المطلوبة للحساب الجديد *"}
                        </label>
                        <input
                          type="password"
                          required
                          placeholder="••••••••"
                          value={gamePassword}
                          onChange={(e) => setGamePassword(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-[#161b24] border border-gray-700 rounded-xl text-xs text-white placeholder-gray-500 focus:border-orange-500 text-right dir-ltr font-mono"
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1">
                      ملاحظات أو طلبات خاصة لفريق التنفيذ (اختياري)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="اكتب أي تعليمات إضافية..."
                      value={customerNotes}
                      onChange={(e) => setCustomerNotes(e.target.value)}
                      className="w-full p-3 bg-[#161b24] border border-gray-700 rounded-xl text-xs text-white placeholder-gray-500 focus:border-orange-500 text-right"
                    />
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2.5 text-xs text-emerald-500 mt-4">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <p className="leading-relaxed text-[11px] text-gray-300 font-medium">
                    <strong>تأكيد الأمان والسرية التامة:</strong> بيانات حسابك مشفرة بالكامل بتشفير AES-256، وتستخدم آلياً لتنفيذ طلبك فقط ولا يتم مشاركتها مطلقاً.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Wallet Deduction, Coupon & Order Summary */}
          <div className="lg:col-span-5 space-y-6">
            {/* Wallet Balance Card */}
            <div className="p-5 sm:p-6 rounded-2xl bg-[#0f1218] border border-gray-800 shadow-sm space-y-4 relative overflow-hidden card-drift-accent">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-orange-500" />
                  <h3 className="font-black text-sm text-white">الدفع من رصيد المحفظة</h3>
                </div>
                <span className="text-[10px] text-orange-500 font-bold bg-orange-500/10 px-2 py-0.5 rounded-md border border-orange-500/20">
                  الوسيلة المعتمدة
                </span>
              </div>

              {/* Financial Balance Overview */}
              <div className="p-4 rounded-xl bg-[#161b24] border border-gray-700 space-y-3 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 font-medium">رصيد محفظتك الحالي:</span>
                  <span className="font-black text-base text-orange-500 font-mono">
                    {formatCurrency(walletBalance)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-400 font-medium">إجمالي الطلب المطلوب:</span>
                  <span className="font-black text-base text-red-500 font-mono">
                    -{formatCurrency(total)}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-gray-700 text-sm">
                  <span className="font-bold text-gray-300">الرصيد المتبقي بعد الشراء:</span>
                  <span className={`font-black font-mono text-base ${isBalanceSufficient ? "text-white" : "text-red-500"}`}>
                    {formatCurrency(remainingBalance)}
                  </span>
                </div>
              </div>

              {/* Insufficient Balance Alert */}
              {!isBalanceSufficient && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-red-500">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>رصيد المحفظة غير كافٍ لإتمام عملية الشراء.</span>
                  </div>
                  <p className="text-[11px] text-gray-300">
                    المبلغ المتبقي للشحن: <strong className="font-mono font-black text-white">{formatCurrency(total - walletBalance)}</strong>
                  </p>
                  <Link
                    href="/deposit"
                    className="w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-black font-black text-xs text-center block shadow-sm transition"
                  >
                    شحن رصيد المحفظة الآن ⚡
                  </Link>
                </div>
              )}

              {/* COUPON CODE FORM (Exclusively in Checkout) */}
              <div className="pt-2 border-t border-gray-800 space-y-2">
                <label className="block text-xs font-bold text-gray-300">هل لديك كود خصم؟</label>
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-3.5 h-3.5 absolute right-3 top-3 text-gray-500" />
                    <input
                      type="text"
                      placeholder="أدخل كود الخصم"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      className="w-full pl-3 pr-8 py-2 bg-[#161b24] border border-gray-700 rounded-xl text-xs text-white uppercase font-mono"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isValidatingCoupon || !couponInput.trim()}
                    className="px-3.5 py-2 bg-orange-500 hover:bg-orange-600 text-black rounded-xl text-xs font-black transition disabled:opacity-50"
                  >
                    {isValidatingCoupon ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "تطبيق"}
                  </button>
                </form>

                {appliedCoupon && (
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-400 font-bold">
                    <span>كوبون: <strong>{appliedCoupon.code}</strong> (-{formatCurrency(appliedCoupon.discountAmount)})</span>
                    <button
                      type="button"
                      onClick={() => applyCoupon(null)}
                      className="text-gray-400 hover:text-red-400 text-[11px]"
                    >
                      إزالة
                    </button>
                  </div>
                )}
              </div>

              {/* Pricing breakdown */}
              <div className="space-y-1.5 pt-2 border-t border-gray-800 text-xs text-gray-300">
                <div className="flex justify-between">
                  <span>المجموع الفرعي:</span>
                  <span className="font-mono text-white">{formatCurrency(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-400 font-bold">
                    <span>خصم الكوبون:</span>
                    <span className="font-mono">-{formatCurrency(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-white pt-1 text-sm">
                  <span>الإجمالي:</span>
                  <span className="text-orange-500 text-base font-mono">{formatCurrency(total)}</span>
                </div>
              </div>

              {/* Products Mini List */}
              <div className="space-y-2 pt-2 border-t border-gray-800 text-xs">
                <span className="text-gray-400 font-bold block mb-1">عناصر الطلب ({items.length}):</span>
                {items.map((it) => (
                  <div key={it.productId} className="flex justify-between text-gray-300">
                    <span className="truncate max-w-[200px]">{it.name} (x{it.quantity})</span>
                    <span className="font-black text-orange-500 font-mono text-xs">{formatCurrency(it.price * it.quantity)}</span>
                  </div>
                ))}
              </div>

              {/* Confirm and Pay Button */}
              <button
                type="button"
                onClick={handleConfirmOrder}
                disabled={isSubmitting || (!isBalanceSufficient && Boolean(user))}
                className="w-full py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-black font-black text-sm shadow-sm active:scale-[0.98] transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>تأكيد الخصم والشراء الفوري ({formatCurrency(total)})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
}

