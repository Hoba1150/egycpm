"use client";

import React, { useState } from "react";
import {
  updateTelegramBotConfig,
  resetTelegramBotConfig,
} from "@/lib/actions/telegram-bot-settings";
import {
  TelegramBotConfig,
  DEFAULT_TELEGRAM_BOT_CONFIG,
  interpolateTemplate,
} from "@/lib/telegram-bot-config";
import { toast } from "sonner";
import {
  Save,
  RotateCcw,
  Bot,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Smartphone,
  Eye,
  Sliders,
  HelpCircle,
  ShoppingBag,
  Gamepad2,
  Wallet,
  UserCheck,
  Headphones,
  Check,
  Copy,
  ExternalLink,
} from "lucide-react";

interface Props {
  initialConfig: TelegramBotConfig;
}

type PreviewKey =
  | "welcomeLinked"
  | "welcomeUnlinked"
  | "linkingSuccess"
  | "linkingFailed"
  | "orderCreatedPending"
  | "paymentSuccess"
  | "orderStatusUpdate"
  | "orderDelivered"
  | "balanceMessage"
  | "supportMessage";

const MOCK_VARS: Record<string, string> = {
  name: "أحمد علي",
  email: "ahmed@example.com",
  balance: "1,450",
  giftBalance: "150",
  totalBalance: "1,600",
  ordersCount: "4",
  orderNumber: "CPM-98124",
  amount: "350",
  status: "قيد التنفيذ باللعبة ⚙️",
  siteUrl: "https://egycpm.com",
};

export default function TelegramBotManagerClient({ initialConfig }: Props) {
  const [config, setConfig] = useState<TelegramBotConfig>(initialConfig);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [activeTab, setActiveTab] = useState<"welcome" | "linking" | "orders" | "screens" | "buttons">("welcome");
  const [previewKey, setPreviewKey] = useState<PreviewKey>("welcomeLinked");
  const [mobilePane, setMobilePane] = useState<"editor" | "preview">("editor");

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const res = await updateTelegramBotConfig(config);
      if (res?.success) {
        toast.success("تم حفظ إعدادات ونصوص بوت تيليجرام بنجاح!");
      }
    } catch (err: any) {
      toast.error(err?.message || "حدث خطأ غير متوقع أثناء الحفظ");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm("هل أنت متأكد من رغبتك في إعادة ضبط جميع نصوص وأزرار البوت إلى الإعدادات الافتراضية؟")) {
      return;
    }
    try {
      setIsResetting(true);
      const res = await resetTelegramBotConfig();
      if (res?.success && res.config) {
        setConfig(res.config);
        toast.success("تمت استعادة الإعدادات الافتراضية بنجاح.");
      }
    } catch (err: any) {
      toast.error(err?.message || "حدث خطأ أثناء استعادة الإعدادات");
    } finally {
      setIsResetting(false);
    }
  };

  const copyVariable = (varName: string) => {
    const text = `{${varName}}`;
    navigator.clipboard.writeText(text);
    toast.success(`تم نسخ المتغير: ${text}`, { duration: 1500 });
  };

  // Helper to render current preview text with HTML formatting simulation
  const getPreviewText = () => {
    const rawTemplate = config[previewKey] || "";
    return interpolateTemplate(rawTemplate, MOCK_VARS);
  };

  // Build simulator buttons based on current preview key
  const getPreviewButtons = () => {
    const btns = config.buttons;
    if (previewKey === "welcomeLinked") {
      const keyboard: { text: string; primary?: boolean }[][] = [];
      const row1 = [];
      if (btns.store.enabled) row1.push({ text: btns.store.label });
      if (btns.cpm2.enabled) row1.push({ text: btns.cpm2.label });
      if (row1.length) keyboard.push(row1);

      const row2 = [];
      if (btns.orders.enabled) row2.push({ text: btns.orders.label });
      if (btns.balance.enabled) row2.push({ text: btns.balance.label });
      if (row2.length) keyboard.push(row2);

      const row3 = [];
      if (btns.account.enabled) row3.push({ text: btns.account.label });
      if (btns.support.enabled) row3.push({ text: btns.support.label });
      if (row3.length) keyboard.push(row3);
      return keyboard;
    }

    if (previewKey === "welcomeUnlinked") {
      const keyboard: { text: string; primary?: boolean }[][] = [];
      const row1 = [];
      if (btns.store.enabled) row1.push({ text: btns.store.label });
      if (btns.cpm2.enabled) row1.push({ text: btns.cpm2.label });
      if (row1.length) keyboard.push(row1);

      if (btns.account.enabled) keyboard.push([{ text: btns.account.label, primary: true }]);
      if (btns.support.enabled) keyboard.push([{ text: btns.support.label }]);
      return keyboard;
    }

    if (previewKey === "linkingSuccess") {
      const keyboard: { text: string; primary?: boolean }[][] = [
        [{ text: "🛒 إتمام عملية الدفع الآن", primary: true }],
      ];
      const row2 = [];
      if (btns.orders.enabled) row2.push({ text: btns.orders.label });
      if (btns.balance.enabled) row2.push({ text: btns.balance.label });
      if (row2.length) keyboard.push(row2);
      keyboard.push([{ text: "🏠 القائمة الرئيسية للبوت" }]);
      return keyboard;
    }

    if (previewKey === "linkingFailed") {
      return [[{ text: btns.store.enabled ? btns.store.label : "🛒 فتح المتجر", primary: true }]];
    }

    if (previewKey === "orderCreatedPending") {
      return [
        [{ text: "⭐ دفع 350 نجمة تيليجرام", primary: true }],
        [{ text: "📋 مراجعة الطلب بالموقع" }],
      ];
    }

    if (previewKey === "paymentSuccess") {
      return [
        [{ text: "📋 عرض تفاصيل الطلب واستلام الحساب 🚀", primary: true }],
        [{ text: btns.store.enabled ? btns.store.label : "🛒 العودة إلى المتجر" }],
      ];
    }

    if (previewKey === "orderStatusUpdate" || previewKey === "orderDelivered") {
      return [
        [{ text: "📋 تفاصيل الطلب والتسليم", primary: true }],
        [{ text: "🏠 القائمة الرئيسية للبوت" }],
      ];
    }

    if (previewKey === "balanceMessage") {
      return [
        [{ text: "➕ شحن رصيد الآن", primary: true }, { text: btns.store.label }],
        [{ text: "🔄 تحديث الرصيد" }, { text: "🔙 القائمة الرئيسية" }],
      ];
    }

    if (previewKey === "supportMessage") {
      return [
        [{ text: "🎫 فتح تذكرة دعم فني", primary: true }, { text: "❓ الأسئلة الشائعة" }],
        [{ text: btns.store.label }, { text: "🔙 القائمة الرئيسية" }],
      ];
    }

    return [];
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="bg-[#0b0e14] border border-gray-800/80 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-black text-white">
                تخصيص هوية ورسائل البوت
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                قراءة ديناميكية مباشرة
              </span>
            </div>
            <p className="text-xs text-gray-400">
              أي تعديل يتم حفظه هنا يطبّق فوراً على جميع عملاء البوت بدون توقف للخدمة.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 mr-auto">
          <button
            type="button"
            onClick={handleReset}
            disabled={isResetting || isSaving}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-gray-400 bg-gray-900/80 border border-gray-800 hover:text-white hover:border-gray-700 transition disabled:opacity-50"
            title="استعادة النصوص الافتراضية"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? "animate-spin" : ""}`} />
            <span>استعادة الافتراضي</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || isResetting}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-black text-black bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 shadow-[0_4px_20px_rgba(249,115,22,0.3)] transition active:scale-95 disabled:opacity-50"
          >
            <Save className={`w-4 h-4 ${isSaving ? "animate-spin" : ""}`} />
            <span>{isSaving ? "جاري الحفظ..." : "حفظ التعديلات"}</span>
          </button>
        </div>
      </div>

      {/* Mobile Switcher Tab (Editor vs Preview) */}
      <div className="lg:hidden flex rounded-xl bg-gray-900/90 p-1 border border-gray-800">
        <button
          type="button"
          onClick={() => setMobilePane("editor")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition ${
            mobilePane === "editor"
              ? "bg-orange-500 text-black shadow"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>تحرير الإعدادات</span>
        </button>
        <button
          type="button"
          onClick={() => setMobilePane("preview")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition ${
            mobilePane === "preview"
              ? "bg-blue-500 text-white shadow"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <Eye className="w-4 h-4" />
          <span>المعاينة المباشرة 📱</span>
        </button>
      </div>

      {/* Main Grid: Controls vs Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Tabs and Inputs (Col 1-7) */}
        <div className={`space-y-5 lg:col-span-7 ${mobilePane === "preview" ? "hidden lg:block" : "block"}`}>
          {/* Section Navigation Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-gray-800 pb-3">
            <button
              type="button"
              onClick={() => {
                setActiveTab("welcome");
                setPreviewKey("welcomeLinked");
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === "welcome"
                  ? "bg-orange-500/10 text-orange-400 border border-orange-500/30"
                  : "bg-gray-900/50 text-gray-400 hover:text-white border border-gray-800"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>رسائل الترحيب (/start)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("linking");
                setPreviewKey("linkingSuccess");
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === "linking"
                  ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30"
                  : "bg-gray-900/50 text-gray-400 hover:text-white border border-gray-800"
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>ربط وتوثيق الحساب</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("orders");
                setPreviewKey("paymentSuccess");
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === "orders"
                  ? "bg-purple-500/10 text-purple-400 border border-purple-500/30"
                  : "bg-gray-900/50 text-gray-400 hover:text-white border border-gray-800"
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>الطلبات والنجوم</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("screens");
                setPreviewKey("balanceMessage");
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === "screens"
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                  : "bg-gray-900/50 text-gray-400 hover:text-white border border-gray-800"
              }`}
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>المحفظة والدعم</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("buttons")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === "buttons"
                  ? "bg-blue-500/10 text-blue-400 border border-blue-500/30"
                  : "bg-gray-900/50 text-gray-400 hover:text-white border border-gray-800"
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>تخصيص الأزرار والقوائم</span>
            </button>
          </div>

          {/* TAB 1: Welcome Messages */}
          {activeTab === "welcome" && (
            <div className="space-y-6">
              {/* Linked User Welcome */}
              <div className="bg-[#0b0e14] border border-gray-800/80 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <h3 className="text-sm font-black text-white">
                      رسالة الترحيب للعميل المرتبط (الموثق)
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPreviewKey("welcomeLinked")}
                    className="text-xs font-bold text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>معاينة في المحاكي</span>
                  </button>
                </div>

                <p className="text-xs text-gray-400">
                  تظهر عند إرسال أمر <code className="text-orange-400 font-mono">/start</code> من عميل قام بربط حسابه مسبقاً. تدعم أوسمة HTML مثل <code className="text-gray-300 font-mono">&lt;b&gt;, &lt;i&gt;, &lt;code&gt;</code>.
                </p>

                {/* Dynamic Variables helper */}
                <div className="flex flex-wrap items-center gap-1.5 p-2.5 rounded-xl bg-gray-900/50 border border-gray-800">
                  <span className="text-[11px] font-bold text-gray-400 ml-1">المتغيرات المتاحة:</span>
                  {["name", "email", "balance", "ordersCount", "siteUrl"].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => copyVariable(v)}
                      className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-gray-800 text-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-300 transition flex items-center gap-1 border border-gray-700/60"
                      title="اضغط للنسخ"
                    >
                      <Copy className="w-2.5 h-2.5" />
                      <span>{`{${v}}`}</span>
                    </button>
                  ))}
                </div>

                <textarea
                  rows={9}
                  dir="ltr"
                  value={config.welcomeLinked}
                  onChange={(e) => {
                    setConfig({ ...config, welcomeLinked: e.target.value });
                    setPreviewKey("welcomeLinked");
                  }}
                  className="w-full text-xs font-mono bg-black/50 border border-gray-800 rounded-xl p-3.5 text-gray-200 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 leading-relaxed text-right"
                />
              </div>

              {/* Unlinked User Welcome */}
              <div className="bg-[#0b0e14] border border-gray-800/80 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <h3 className="text-sm font-black text-white">
                      رسالة الترحيب للزائر الجديد (غير المرتبط)
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPreviewKey("welcomeUnlinked")}
                    className="text-xs font-bold text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>معاينة في المحاكي</span>
                  </button>
                </div>

                <p className="text-xs text-gray-400">
                  تظهر عند فتح البوت لأول مرة من مستخدم تيليجرام لم يربط حسابه بعد لتشجيعه على الربط السريع.
                </p>

                <div className="flex flex-wrap items-center gap-1.5 p-2.5 rounded-xl bg-gray-900/50 border border-gray-800">
                  <span className="text-[11px] font-bold text-gray-400 ml-1">المتغيرات المتاحة:</span>
                  {["name", "siteUrl"].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => copyVariable(v)}
                      className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-gray-800 text-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-300 transition flex items-center gap-1 border border-gray-700/60"
                      title="اضغط للنسخ"
                    >
                      <Copy className="w-2.5 h-2.5" />
                      <span>{`{${v}}`}</span>
                    </button>
                  ))}
                </div>

                <textarea
                  rows={8}
                  dir="ltr"
                  value={config.welcomeUnlinked}
                  onChange={(e) => {
                    setConfig({ ...config, welcomeUnlinked: e.target.value });
                    setPreviewKey("welcomeUnlinked");
                  }}
                  className="w-full text-xs font-mono bg-black/50 border border-gray-800 rounded-xl p-3.5 text-gray-200 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 leading-relaxed text-right"
                />
              </div>
            </div>
          )}

          {/* TAB 2: Linking Messages */}
          {activeTab === "linking" && (
            <div className="space-y-6">
              {/* Linking Success */}
              <div className="bg-[#0b0e14] border border-gray-800/80 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-sm font-black text-white">
                      رسالة نجاح توثيق وربط الحساب
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPreviewKey("linkingSuccess")}
                    className="text-xs font-bold text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>معاينة</span>
                  </button>
                </div>

                <p className="text-xs text-gray-400">
                  تُرسل للعميل فوراً داخل تيليجرام بمجرد الضغط على رابط الربط القادم من المتجر أو صفحة الدفع.
                </p>

                <div className="flex flex-wrap items-center gap-1.5 p-2.5 rounded-xl bg-gray-900/50 border border-gray-800">
                  <span className="text-[11px] font-bold text-gray-400 ml-1">المتغيرات:</span>
                  {["name", "email", "siteUrl"].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => copyVariable(v)}
                      className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-gray-800 text-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-300 transition flex items-center gap-1 border border-gray-700/60"
                      title="اضغط للنسخ"
                    >
                      <Copy className="w-2.5 h-2.5" />
                      <span>{`{${v}}`}</span>
                    </button>
                  ))}
                </div>

                <textarea
                  rows={6}
                  dir="ltr"
                  value={config.linkingSuccess}
                  onChange={(e) => {
                    setConfig({ ...config, linkingSuccess: e.target.value });
                    setPreviewKey("linkingSuccess");
                  }}
                  className="w-full text-xs font-mono bg-black/50 border border-gray-800 rounded-xl p-3.5 text-gray-200 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 leading-relaxed text-right"
                />
              </div>

              {/* Linking Failed / Expired */}
              <div className="bg-[#0b0e14] border border-gray-800/80 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-black text-white">
                      رسالة فشل أو انتهاء صلاحية رابط الربط
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPreviewKey("linkingFailed")}
                    className="text-xs font-bold text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>معاينة</span>
                  </button>
                </div>

                <p className="text-xs text-gray-400">
                  تظهر إذا نقر العميل على رابط ربط منتهي الصلاحية (أكثر من 15 دقيقة) أو رمز مستخدم سابقاً.
                </p>

                <div className="flex flex-wrap items-center gap-1.5 p-2.5 rounded-xl bg-gray-900/50 border border-gray-800">
                  <span className="text-[11px] font-bold text-gray-400 ml-1">المتغيرات:</span>
                  {["siteUrl"].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => copyVariable(v)}
                      className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-gray-800 text-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-300 transition flex items-center gap-1 border border-gray-700/60"
                      title="اضغط للنسخ"
                    >
                      <Copy className="w-2.5 h-2.5" />
                      <span>{`{${v}}`}</span>
                    </button>
                  ))}
                </div>

                <textarea
                  rows={4}
                  dir="ltr"
                  value={config.linkingFailed}
                  onChange={(e) => {
                    setConfig({ ...config, linkingFailed: e.target.value });
                    setPreviewKey("linkingFailed");
                  }}
                  className="w-full text-xs font-mono bg-black/50 border border-gray-800 rounded-xl p-3.5 text-gray-200 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 leading-relaxed text-right"
                />
              </div>
            </div>
          )}

          {/* TAB 3: Orders & Stars Payment Notifications */}
          {activeTab === "orders" && (
            <div className="space-y-6">
              {/* Payment Success */}
              <div className="bg-[#0b0e14] border border-gray-800/80 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-black text-white">
                      رسالة تأكيد نجاح الدفع بنجوم تيليجرام ⭐
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPreviewKey("paymentSuccess")}
                    className="text-xs font-bold text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>معاينة</span>
                  </button>
                </div>

                <p className="text-xs text-gray-400">
                  تُرسل تلقائياً للعميل فور نجاح عملية الدفع عبر Telegram Stars مباشرة.
                </p>

                <div className="flex flex-wrap items-center gap-1.5 p-2.5 rounded-xl bg-gray-900/50 border border-gray-800">
                  <span className="text-[11px] font-bold text-gray-400 ml-1">المتغيرات:</span>
                  {["orderNumber", "amount", "siteUrl"].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => copyVariable(v)}
                      className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-gray-800 text-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-300 transition flex items-center gap-1 border border-gray-700/60"
                    >
                      <Copy className="w-2.5 h-2.5" />
                      <span>{`{${v}}`}</span>
                    </button>
                  ))}
                </div>

                <textarea
                  rows={6}
                  dir="ltr"
                  value={config.paymentSuccess}
                  onChange={(e) => {
                    setConfig({ ...config, paymentSuccess: e.target.value });
                    setPreviewKey("paymentSuccess");
                  }}
                  className="w-full text-xs font-mono bg-black/50 border border-gray-800 rounded-xl p-3.5 text-gray-200 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 leading-relaxed text-right"
                />
              </div>

              {/* Order Created / Pending Invoice */}
              <div className="bg-[#0b0e14] border border-gray-800/80 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-purple-400" />
                    <h3 className="text-sm font-black text-white">
                      إشعار إنشاء فاتورة دفع Stars جديدة
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPreviewKey("orderCreatedPending")}
                    className="text-xs font-bold text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>معاينة</span>
                  </button>
                </div>

                <p className="text-xs text-gray-400">
                  نص الإشعار المرسل للعميل عندما ينشئ طلباً بنجوم تيليجرام ويطلب فاتورة للسداد.
                </p>

                <div className="flex flex-wrap items-center gap-1.5 p-2.5 rounded-xl bg-gray-900/50 border border-gray-800">
                  <span className="text-[11px] font-bold text-gray-400 ml-1">المتغيرات:</span>
                  {["orderNumber", "amount", "siteUrl"].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => copyVariable(v)}
                      className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-gray-800 text-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-300 transition flex items-center gap-1 border border-gray-700/60"
                    >
                      <Copy className="w-2.5 h-2.5" />
                      <span>{`{${v}}`}</span>
                    </button>
                  ))}
                </div>

                <textarea
                  rows={5}
                  dir="ltr"
                  value={config.orderCreatedPending}
                  onChange={(e) => {
                    setConfig({ ...config, orderCreatedPending: e.target.value });
                    setPreviewKey("orderCreatedPending");
                  }}
                  className="w-full text-xs font-mono bg-black/50 border border-gray-800 rounded-xl p-3.5 text-gray-200 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 leading-relaxed text-right"
                />
              </div>

              {/* Order Status Update */}
              <div className="bg-[#0b0e14] border border-gray-800/80 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 text-blue-400" />
                    <h3 className="text-sm font-black text-white">
                      إشعار تحديث حالة الطلب
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPreviewKey("orderStatusUpdate")}
                    className="text-xs font-bold text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>معاينة</span>
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 p-2.5 rounded-xl bg-gray-900/50 border border-gray-800">
                  <span className="text-[11px] font-bold text-gray-400 ml-1">المتغيرات:</span>
                  {["orderNumber", "status", "siteUrl"].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => copyVariable(v)}
                      className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-gray-800 text-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-300 transition flex items-center gap-1 border border-gray-700/60"
                    >
                      <Copy className="w-2.5 h-2.5" />
                      <span>{`{${v}}`}</span>
                    </button>
                  ))}
                </div>

                <textarea
                  rows={4}
                  dir="ltr"
                  value={config.orderStatusUpdate}
                  onChange={(e) => {
                    setConfig({ ...config, orderStatusUpdate: e.target.value });
                    setPreviewKey("orderStatusUpdate");
                  }}
                  className="w-full text-xs font-mono bg-black/50 border border-gray-800 rounded-xl p-3.5 text-gray-200 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 leading-relaxed text-right"
                />
              </div>

              {/* Order Delivered */}
              <div className="bg-[#0b0e14] border border-gray-800/80 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-sm font-black text-white">
                      إشعار اكتمال وتسليم الطلب
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPreviewKey("orderDelivered")}
                    className="text-xs font-bold text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>معاينة</span>
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 p-2.5 rounded-xl bg-gray-900/50 border border-gray-800">
                  <span className="text-[11px] font-bold text-gray-400 ml-1">المتغيرات:</span>
                  {["orderNumber", "siteUrl"].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => copyVariable(v)}
                      className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-gray-800 text-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-300 transition flex items-center gap-1 border border-gray-700/60"
                    >
                      <Copy className="w-2.5 h-2.5" />
                      <span>{`{${v}}`}</span>
                    </button>
                  ))}
                </div>

                <textarea
                  rows={4}
                  dir="ltr"
                  value={config.orderDelivered}
                  onChange={(e) => {
                    setConfig({ ...config, orderDelivered: e.target.value });
                    setPreviewKey("orderDelivered");
                  }}
                  className="w-full text-xs font-mono bg-black/50 border border-gray-800 rounded-xl p-3.5 text-gray-200 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 leading-relaxed text-right"
                />
              </div>
            </div>
          )}

          {/* TAB 4: Balance & Support Screens */}
          {activeTab === "screens" && (
            <div className="space-y-6">
              {/* Balance Screen */}
              <div className="bg-[#0b0e14] border border-gray-800/80 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-sm font-black text-white">
                      نص شاشة الرصيد والمحفظة (/balance)
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPreviewKey("balanceMessage")}
                    className="text-xs font-bold text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>معاينة</span>
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 p-2.5 rounded-xl bg-gray-900/50 border border-gray-800">
                  <span className="text-[11px] font-bold text-gray-400 ml-1">المتغيرات:</span>
                  {["name", "balance", "giftBalance", "totalBalance", "siteUrl"].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => copyVariable(v)}
                      className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-gray-800 text-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-300 transition flex items-center gap-1 border border-gray-700/60"
                    >
                      <Copy className="w-2.5 h-2.5" />
                      <span>{`{${v}}`}</span>
                    </button>
                  ))}
                </div>

                <textarea
                  rows={8}
                  dir="ltr"
                  value={config.balanceMessage}
                  onChange={(e) => {
                    setConfig({ ...config, balanceMessage: e.target.value });
                    setPreviewKey("balanceMessage");
                  }}
                  className="w-full text-xs font-mono bg-black/50 border border-gray-800 rounded-xl p-3.5 text-gray-200 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 leading-relaxed text-right"
                />
              </div>

              {/* Support Screen */}
              <div className="bg-[#0b0e14] border border-gray-800/80 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Headphones className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-sm font-black text-white">
                      نص شاشة الدعم الفني والمساعدة (/support)
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPreviewKey("supportMessage")}
                    className="text-xs font-bold text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>معاينة</span>
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 p-2.5 rounded-xl bg-gray-900/50 border border-gray-800">
                  <span className="text-[11px] font-bold text-gray-400 ml-1">المتغيرات:</span>
                  {["siteUrl"].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => copyVariable(v)}
                      className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-gray-800 text-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-300 transition flex items-center gap-1 border border-gray-700/60"
                    >
                      <Copy className="w-2.5 h-2.5" />
                      <span>{`{${v}}`}</span>
                    </button>
                  ))}
                </div>

                <textarea
                  rows={8}
                  dir="ltr"
                  value={config.supportMessage}
                  onChange={(e) => {
                    setConfig({ ...config, supportMessage: e.target.value });
                    setPreviewKey("supportMessage");
                  }}
                  className="w-full text-xs font-mono bg-black/50 border border-gray-800 rounded-xl p-3.5 text-gray-200 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 leading-relaxed text-right"
                />
              </div>
            </div>
          )}

          {/* TAB 5: Custom Buttons & Menu Toggles */}
          {activeTab === "buttons" && (
            <div className="bg-[#0b0e14] border border-gray-800/80 rounded-2xl p-5 space-y-5">
              <div>
                <h3 className="text-sm font-black text-white">
                  أزرار وقوائم البوت (تعديل التسميات والتحكم بالظهور)
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  يمكنك تفعيل أو إخفاء أي زر من أزرار القائمة الرئيسية أو تعديل نصه ليتوافق مع حملاتك التسويقية.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Store Button */}
                <div className="p-4 rounded-xl bg-gray-900/40 border border-gray-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-orange-400" />
                      <span className="text-xs font-black text-white">زر المتجر الرئيسي</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.buttons.store.enabled}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            buttons: {
                              ...config.buttons,
                              store: { ...config.buttons.store, enabled: e.target.checked },
                            },
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500"></div>
                    </label>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 mb-1">نص الزر:</label>
                    <input
                      type="text"
                      value={config.buttons.store.label}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          buttons: {
                            ...config.buttons,
                            store: { ...config.buttons.store, label: e.target.value },
                          },
                        })
                      }
                      className="w-full text-xs bg-black/50 border border-gray-800 rounded-lg px-3 py-2 text-white focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* CPM2 Button */}
                <div className="p-4 rounded-xl bg-gray-900/40 border border-gray-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Gamepad2 className="w-4 h-4 text-purple-400" />
                      <span className="text-xs font-black text-white">زر قسم CPM2</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.buttons.cpm2.enabled}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            buttons: {
                              ...config.buttons,
                              cpm2: { ...config.buttons.cpm2, enabled: e.target.checked },
                            },
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-500"></div>
                    </label>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 mb-1">نص الزر:</label>
                    <input
                      type="text"
                      value={config.buttons.cpm2.label}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          buttons: {
                            ...config.buttons,
                            cpm2: { ...config.buttons.cpm2, label: e.target.value },
                          },
                        })
                      }
                      className="w-full text-xs bg-black/50 border border-gray-800 rounded-lg px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Orders Button */}
                <div className="p-4 rounded-xl bg-gray-900/40 border border-gray-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs font-black text-white">زر طلباتي الأخيرة</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.buttons.orders.enabled}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            buttons: {
                              ...config.buttons,
                              orders: { ...config.buttons.orders, enabled: e.target.checked },
                            },
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
                    </label>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 mb-1">نص الزر:</label>
                    <input
                      type="text"
                      value={config.buttons.orders.label}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          buttons: {
                            ...config.buttons,
                            orders: { ...config.buttons.orders, label: e.target.value },
                          },
                        })
                      }
                      className="w-full text-xs bg-black/50 border border-gray-800 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Balance Button */}
                <div className="p-4 rounded-xl bg-gray-900/40 border border-gray-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-black text-white">زر رصيدي ومحفظتي</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.buttons.balance.enabled}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            buttons: {
                              ...config.buttons,
                              balance: { ...config.buttons.balance, enabled: e.target.checked },
                            },
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 mb-1">نص الزر:</label>
                    <input
                      type="text"
                      value={config.buttons.balance.label}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          buttons: {
                            ...config.buttons,
                            balance: { ...config.buttons.balance, label: e.target.value },
                          },
                        })
                      }
                      className="w-full text-xs bg-black/50 border border-gray-800 rounded-lg px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Account Button */}
                <div className="p-4 rounded-xl bg-gray-900/40 border border-gray-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-black text-white">زر إدارة الحساب والربط</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.buttons.account.enabled}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            buttons: {
                              ...config.buttons,
                              account: { ...config.buttons.account, enabled: e.target.checked },
                            },
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500"></div>
                    </label>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 mb-1">نص الزر:</label>
                    <input
                      type="text"
                      value={config.buttons.account.label}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          buttons: {
                            ...config.buttons,
                            account: { ...config.buttons.account, label: e.target.value },
                          },
                        })
                      }
                      className="w-full text-xs bg-black/50 border border-gray-800 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Support Button */}
                <div className="p-4 rounded-xl bg-gray-900/40 border border-gray-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Headphones className="w-4 h-4 text-pink-400" />
                      <span className="text-xs font-black text-white">زر الدعم الفني</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.buttons.support.enabled}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            buttons: {
                              ...config.buttons,
                              support: { ...config.buttons.support, enabled: e.target.checked },
                            },
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-pink-500"></div>
                    </label>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 mb-1">نص الزر:</label>
                    <input
                      type="text"
                      value={config.buttons.support.label}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          buttons: {
                            ...config.buttons,
                            support: { ...config.buttons.support, label: e.target.value },
                          },
                        })
                      }
                      className="w-full text-xs bg-black/50 border border-gray-800 rounded-lg px-3 py-2 text-white focus:border-pink-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live Telegram Simulator (Col 8-12) */}
        <div className={`lg:col-span-5 ${mobilePane === "editor" ? "hidden lg:block" : "block"}`}>
          <div className="sticky top-20 space-y-3">
            {/* Simulator Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-black text-white">محاكي Telegram المباشر</span>
              </div>
              <div className="text-[10px] text-gray-400 font-mono">
                Live Chat Simulator
              </div>
            </div>

            {/* Scenario Selector Dropdown */}
            <div className="bg-[#0b0e14] border border-gray-800 rounded-xl p-2.5">
              <label className="block text-[10px] font-bold text-gray-400 mb-1">
                اختر الرسالة المراد محاكاتها:
              </label>
              <select
                value={previewKey}
                onChange={(e) => setPreviewKey(e.target.value as PreviewKey)}
                className="w-full text-xs bg-black/60 border border-gray-800 rounded-lg px-2.5 py-1.5 text-white focus:border-blue-500 focus:outline-none cursor-pointer"
              >
                <option value="welcomeLinked">💬 رسالة الترحيب (حساب موثق ومرتبط)</option>
                <option value="welcomeUnlinked">👋 رسالة الترحيب (زائر غير مرتبط)</option>
                <option value="linkingSuccess">🎉 نجاح ربط وتوثيق الحساب</option>
                <option value="linkingFailed">⚠️ فشل أو انتهاء رابط الربط</option>
                <option value="paymentSuccess">⭐ تأكيد نجاح الدفع بالنجوم</option>
                <option value="orderCreatedPending">📦 فاتورة بانتظار دفع Stars</option>
                <option value="orderStatusUpdate">🔄 تحديث حالة الطلب</option>
                <option value="orderDelivered">🚀 تسليم واكتمال الطلب</option>
                <option value="balanceMessage">💰 شاشة الرصيد والمحفظة</option>
                <option value="supportMessage">💬 شاشة الدعم والمساعدة</option>
              </select>
            </div>

            {/* Realistic Telegram Phone / Chat Box */}
            <div className="rounded-3xl border-2 border-gray-800/80 bg-[#0e1621] overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.6)]">
              {/* Telegram Top Header Bar */}
              <div className="bg-[#17212b] px-4 py-3 border-b border-gray-800/60 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-black font-black text-xs shadow">
                    CPM
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-black text-white">EgyCPM Bot</span>
                      <span className="w-3.5 h-3.5 rounded-full bg-blue-500 flex items-center justify-center text-[9px] text-white">
                        ✓
                      </span>
                    </div>
                    <span className="text-[10px] text-blue-400 font-mono">bot</span>
                  </div>
                </div>
                <div className="text-[10px] px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
                  @egycpm_bot
                </div>
              </div>

              {/* Chat Canvas (Telegram Dark Wallpaper Pattern) */}
              <div
                className="p-4 space-y-3 min-h-[380px] max-h-[550px] overflow-y-auto"
                style={{
                  backgroundColor: "#0e1621",
                  backgroundImage: "radial-gradient(#17212b 1px, transparent 1px)",
                  backgroundSize: "16px 16px",
                }}
              >
                {/* Date bubble */}
                <div className="flex justify-center">
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#17212b]/80 text-gray-400 shadow-sm">
                    اليوم
                  </span>
                </div>

                {/* Bot Message Bubble */}
                <div className="max-w-[92%] mr-auto rounded-2xl rounded-tr-sm bg-[#182533] p-3.5 text-right border border-blue-900/20 shadow-md space-y-2.5">
                  {/* Message Body with HTML Simulation */}
                  <div
                    className="text-xs text-[#e4ecf2] leading-relaxed break-words whitespace-pre-wrap font-sans"
                    dangerouslySetInnerHTML={{
                      __html: getPreviewText()
                        .replace(/\n/g, "<br/>")
                        .replace(/<b>(.*?)<\/b>/g, "<strong>$1</strong>")
                        .replace(/<i>(.*?)<\/i>/g, "<em>$1</em>")
                        .replace(/<code>(.*?)<\/code>/g, "<code class='bg-[#242f3d] px-1 py-0.5 rounded text-amber-300 font-mono text-[11px]'>$1</code>")
                        .replace(/<a href="(.*?)">(.*?)<\/a>/g, "<span class='text-[#64b5f6] underline cursor-pointer'>$2</span>"),
                    }}
                  />

                  {/* Timestamp */}
                  <div className="text-[10px] text-gray-500 text-left font-mono">
                    12:45 PM
                  </div>
                </div>

                {/* Inline Action Buttons (Keyboard) */}
                {getPreviewButtons().length > 0 && (
                  <div className="max-w-[92%] mr-auto space-y-1.5 pt-1">
                    {getPreviewButtons().map((row, rIdx) => (
                      <div key={rIdx} className="flex gap-1.5">
                        {row.map((btn, bIdx) => (
                          <button
                            key={bIdx}
                            type="button"
                            className={`flex-1 py-2 px-2.5 rounded-xl text-[11px] font-bold transition flex items-center justify-center text-center truncate ${
                              btn.primary
                                ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-sm hover:brightness-110"
                                : "bg-[#242f3d]/90 hover:bg-[#2b3749] text-[#64b5f6] border border-blue-900/30"
                            }`}
                          >
                            <span className="truncate">{btn.text}</span>
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Fake Telegram Chat Input Field */}
              <div className="bg-[#17212b] px-3 py-2 border-t border-gray-800/60 flex items-center gap-2">
                <div className="flex-1 rounded-xl bg-[#242f3d] px-3 py-1.5 text-xs text-gray-400 text-right">
                  اكتب رسالة...
                </div>
                <div className="w-7 h-7 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs">
                  ➤
                </div>
              </div>
            </div>

            {/* Hint alert */}
            <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/15 text-[11px] text-gray-400 leading-relaxed flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <span>
                المحاكي يقرأ المتغيرات التجريبية الحية ({`{name}`}, {`{amount}`}, {`{orderNumber}`}) والأزرار النشطة لديك فورياً لمعاينة تجربة العميل قبل الحفظ.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
