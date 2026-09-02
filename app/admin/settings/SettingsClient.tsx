"use client";

import React, { useState } from "react";
import { updateStoreSettings } from "@/lib/actions/settings";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Save,
  Download,
  Database,
  Loader2,
  Palette,
  Type,
  CreditCard,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Sliders,
  Image as ImageIcon,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Upload,
  Layers,
  HelpCircle,
  ShieldCheck,
  Zap,
  Car,
} from "lucide-react";

export default function SettingsClient({ initialSettings }: { initialSettings: Record<string, string> }) {
  const router = useRouter();
  const [settings, setSettings] = useState(initialSettings);
  const [activeTab, setActiveTab] = useState<"SLIDER" | "LOGO" | "TEXTS" | "THEME" | "PAYMENT" | "BACKUP">("LOGO");
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState("");

  const handleChange = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setIsUploadingLogo(true);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.message || "فشل رفع صورة اللوجو.");
      }
      handleChange("store_logo_url", data.url);
      toast.success("تم رفع اللوجو بنجاح إلى Cloudinary CDN وتعيينه للمتجر! 🏎️");
    } catch (err: any) {
      toast.error(err.message || "فشل رفع اللوجو.");
    } finally {
      setIsUploadingLogo(false);
      e.target.value = "";
    }
  };

  // Parse hero images list
  const getHeroImages = (): string[] => {
    try {
      if (!settings.hero_images) {
        return [
          "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800",
          "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800",
          "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=800",
        ];
      }
      const parsed = JSON.parse(settings.hero_images);
      return Array.isArray(parsed) && parsed.length > 0
        ? parsed
        : ["https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800"];
    } catch {
      return [
        "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800",
      ];
    }
  };

  const currentHeroImages = getHeroImages();

  const setHeroImages = (images: string[]) => {
    handleChange("hero_images", JSON.stringify(images));
  };

  const handleAddImage = () => {
    if (!newImageUrl.trim()) {
      toast.error("يرجى إدخال رابط الصورة.");
      return;
    }
    const updated = [...currentHeroImages, newImageUrl.trim()];
    setHeroImages(updated);
    setNewImageUrl("");
    toast.success("تمت إضافة الصورة لقائمة السلايدر!");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setIsUploading(true);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.message || "فشل رفع الصورة.");
      }
      const updated = [...currentHeroImages, data.url];
      setHeroImages(updated);
      toast.success("تم رفع الصورة بنجاح وإضافتها للسلايدر! 🚗");
    } catch (err: any) {
      toast.error(err.message || "فشل رفع الملف.");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleDeleteImage = (index: number) => {
    if (currentHeroImages.length <= 1) {
      toast.warning("يجب الإبقاء على صورة واحدة على الأقل في السلايدر.");
      return;
    }
    const updated = currentHeroImages.filter((_, idx) => idx !== index);
    setHeroImages(updated);
    toast.info("تم حذف الصورة.");
  };

  const handleMoveImage = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentHeroImages.length) return;

    const updated = [...currentHeroImages];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setHeroImages(updated);
  };

  const handleResetTheme = () => {
    setSettings((prev) => ({
      ...prev,
      theme_primary_color: "#ff6600",
      theme_btn_color: "#ff6600",
      theme_success_color: "#10b981",
      theme_warning_color: "#f59e0b",
      theme_error_color: "#ef4444",
    }));
    toast.info("تمت استعادة الألوان الافتراضية. اضغط حفظ لتطبيقها.");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateStoreSettings(settings);
      toast.success("تم حفظ التعديلات وتطبيقها فوراً على كامل المتجر! 🚀");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "فشل حفظ الإعدادات.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadBackup = async () => {
    setIsExporting(true);
    try {
      const res = await fetch("/api/backup");
      if (!res.ok) throw new Error("فشل توليد النسخة الاحتياطية.");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `egy_cpm_backup_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success("تم تنزيل النسخة الاحتياطية لقاعدة البيانات بنجاح 💾");
    } catch (err: any) {
      toast.error(err.message || "فشل تنزيل النسخة الاحتياطية.");
    } finally {
      setIsExporting(false);
    }
  };

  const colorPresets = [
    { name: "برتقالي رياضي (الافتراضي)", color: "#ff6600" },
    { name: "أزرق ملكي", color: "#3b82f6" },
    { name: "أخضر نيون", color: "#10b981" },
    { name: "أحمر رياضي", color: "#ef4444" },
    { name: "بنفسجي سايبر", color: "#8b5cf6" },
  ];

  return (
    <div className="space-y-6 text-right">
      {/* Navigation Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 p-1.5 bg-[#12161f] border border-gray-800 rounded-2xl">
        <button
          type="button"
          onClick={() => setActiveTab("LOGO")}
          className={`py-3 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeTab === "LOGO"
              ? "bg-red-600 text-white shadow-sm ring-1 ring-red-400"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <Car className="w-4 h-4 text-red-400" />
          <span>لوجو وشعار المتجر ⭐</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("SLIDER")}
          className={`py-3 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeTab === "SLIDER"
              ? "bg-red-600 text-white shadow-sm"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>سلايدر صور الواجهة</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("TEXTS")}
          className={`py-3 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeTab === "TEXTS"
              ? "bg-orange-500 text-black shadow-sm"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <Type className="w-4 h-4" />
          <span>نصوص وهوية المتجر (CMS)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("THEME")}
          className={`py-3 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeTab === "THEME"
              ? "bg-orange-500 text-black shadow-sm"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>الألوان والثيم</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("PAYMENT")}
          className={`py-3 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeTab === "PAYMENT"
              ? "bg-orange-500 text-black shadow-sm"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>أرقام الدفع والكاش</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("BACKUP")}
          className={`py-3 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 col-span-2 sm:col-span-1 ${
            activeTab === "BACKUP"
              ? "bg-orange-500 text-black shadow-sm"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <Database className="w-4 h-4" />
          <span>النسخ الاحتياطي</span>
        </button>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* TAB 0: STORE LOGO */}
        {activeTab === "LOGO" && (
          <div className="p-6 rounded-2xl bg-[#12161f] border border-gray-800 space-y-6">
            <div className="border-b border-gray-800 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Car className="w-5 h-5 text-red-500" />
                  <span>تعديل وتحميل لوجو المتجر الرسمي (Store Logo)</span>
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  ارفع صورة لوجو مخصصة لمتجرك من جهازك مباشرة؛ تُحفظ وتُرفع تلقائياً عبر مسار Cloudinary CDN فائق السرعة وبدون استهلاك لسيرفرك.
                </p>
              </div>
              <span className="px-3 py-1 rounded-lg bg-red-600/10 border border-red-500/30 text-red-400 font-mono text-xs font-black shrink-0">
                Cloudinary CDN 🚀
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center p-4 rounded-xl bg-[#161b24] border border-gray-800">
              {/* Logo Live Preview */}
              <div className="md:col-span-4 flex flex-col items-center justify-center p-6 rounded-2xl bg-[#0f1218] border border-gray-800 space-y-3">
                <span className="text-xs text-gray-300 font-bold">معاينة الشعار الحالية:</span>
                <div className="w-32 h-32 rounded-2xl bg-[#161b24] border-2 border-red-500/40 p-3 flex items-center justify-center overflow-hidden shadow-[0_0_20px_rgba(220,38,38,0.25)]">
                  {settings.store_logo_url ? (
                    <img
                      src={settings.store_logo_url}
                      alt="Store Logo"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-center text-gray-500 text-xs">
                      <Car className="w-12 h-12 mx-auto text-red-500 mb-1 opacity-80" />
                      <span className="font-bold">الشعار الافتراضي</span>
                    </div>
                  )}
                </div>
                {settings.store_logo_url && (
                  <button
                    type="button"
                    onClick={() => {
                      handleChange("store_logo_url", "");
                      toast.info("تمت إزالة الشعار واستعادة الأيقونة الافتراضية. اضغط حفظ لتطبيق التغيير.");
                    }}
                    className="text-xs text-red-400 hover:text-red-300 hover:underline flex items-center gap-1.5 pt-1 font-bold"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>إزالة الشعار واستعادة الافتراضي</span>
                  </button>
                )}
              </div>

              {/* Upload & Link Controls */}
              <div className="md:col-span-8 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-200 mb-2">
                    1. رفع لوجو جديد من جهازك (يُرفع تلقائياً على Cloudinary CDN):
                  </label>
                  <label
                    className={`w-full py-4 px-4 rounded-xl border-2 border-dashed border-red-500/50 bg-[#0f1218] hover:bg-red-500/10 transition cursor-pointer flex items-center justify-center gap-2.5 text-xs font-black ${
                      isUploadingLogo ? "opacity-60 pointer-events-none" : "text-white"
                    }`}
                  >
                    <Upload className="w-5 h-5 text-red-500" />
                    <span>
                      {isUploadingLogo ? "جاري رفع اللوجو مباشرة إلى Cloudinary..." : "اضغط هنا لاختيار صورة اللوجو (PNG, JPG, WebP)"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      disabled={isUploadingLogo}
                      className="hidden"
                    />
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5">
                    2. أو ضع رابط الشعار المباشر (URL):
                  </label>
                  <input
                    type="text"
                    placeholder="https://res.cloudinary.com/..."
                    value={settings.store_logo_url || ""}
                    onChange={(e) => handleChange("store_logo_url", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#0f1218] border border-gray-700 rounded-xl text-xs text-white focus:border-red-500 text-left font-mono"
                    dir="ltr"
                  />
                </div>

                <div className="p-3 rounded-xl bg-red-950/20 border border-red-500/30 text-xs text-gray-300 space-y-1">
                  <p className="font-bold text-red-400">⚡ ميزات الشعار في المتجر:</p>
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    يظهر اللوجو في أعلى المتجر (الهيدر)، والفوتر، وصفحات الطلبات، ويتم تحميله مباشرة وبسرعة فائقة من سيرفرات Cloudinary العالمية بدون أي استهلاك لباقة Vercel أو قاعدة بيانات Supabase.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* TAB 1: HERO SLIDER & VEHICLE IMAGES */}
        {activeTab === "SLIDER" && (
          <div className="p-6 rounded-2xl bg-[#12161f] border border-gray-800 space-y-6">
            <div className="border-b border-gray-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-orange-500" />
                <span>إدارة صور وسلايدر الواجهة الرئيسية (Hero Images Slider)</span>
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                ارفع عدة صور سيارات، غيّر ترتيبها، احذف منها، واضبط خيارات التنقل التلقائي لتظهر في سلايدر متجاوب وخفيف في واجهة المتجر.
              </p>
            </div>

            {/* Slider Settings Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-[#161b24] border border-gray-800">
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">التنقل التلقائي (Autoplay)</label>
                <select
                  value={settings.hero_slider_autoplay || "true"}
                  onChange={(e) => handleChange("hero_slider_autoplay", e.target.value)}
                  className="w-full px-3 py-2 bg-[#0f1218] border border-gray-700 rounded-xl text-xs text-white"
                >
                  <option value="true">تفعيل التنقل التلقائي (مستحسن)</option>
                  <option value="false">تعطيل (تنقل يدوي فقط بالأزرار)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">سرعة التنقل (ثواني)</label>
                <select
                  value={settings.hero_slider_interval || "4"}
                  onChange={(e) => handleChange("hero_slider_interval", e.target.value)}
                  className="w-full px-3 py-2 bg-[#0f1218] border border-gray-700 rounded-xl text-xs text-white font-mono"
                >
                  <option value="3">3 ثوانٍ (سريع)</option>
                  <option value="4">4 ثوانٍ (افتراضي مثالي)</option>
                  <option value="6">6 ثوانٍ (هادئ)</option>
                  <option value="8">8 ثوانٍ (بطيء)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">نوع الحركة (Transition)</label>
                <select
                  value={settings.hero_slider_transition || "fade"}
                  onChange={(e) => handleChange("hero_slider_transition", e.target.value)}
                  className="w-full px-3 py-2 bg-[#0f1218] border border-gray-700 rounded-xl text-xs text-white"
                >
                  <option value="fade">تلاشي ناعم (Smooth Fade)</option>
                  <option value="slide">انزلاق سلس (Slide)</option>
                </select>
              </div>
            </div>

            {/* Add New Image Tool */}
            <div className="p-4 rounded-xl bg-[#161b24] border border-gray-800 space-y-3">
              <label className="block text-xs font-bold text-white">إضافة صورة جديدة للسلايدر:</label>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="ضع رابط الصورة المباشر هنا (https://...)"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 bg-[#0f1218] border border-gray-700 rounded-xl text-xs text-white placeholder-gray-500 dir-ltr text-left font-mono"
                />
                <button
                  type="button"
                  onClick={handleAddImage}
                  className="px-4 py-2.5 bg-[#1e2430] hover:bg-gray-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shrink-0"
                >
                  <Plus className="w-4 h-4 text-orange-500" />
                  <span>إضافة بالرابط</span>
                </button>

                <label className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-black rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0">
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  <span>{isUploading ? "جارٍ الرفع..." : "رفع صورة من جهازك"}</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/jpg"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={isUploading}
                  />
                </label>
              </div>
            </div>

            {/* Current Images List with Reorder & Delete */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-300">
                  الصور الحالية في السلايدر ({currentHeroImages.length} صور):
                </span>
                <span className="text-[11px] text-gray-500">
                  استخدم الأسهم للترتيب، واضغط حفظ بعد الانتهاء
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {currentHeroImages.map((url, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-[#161b24] border border-gray-800 flex flex-col justify-between space-y-2.5 group relative"
                  >
                    <div className="relative aspect-[16/10] rounded-lg overflow-hidden bg-black/40 border border-gray-800">
                      <img
                        src={url}
                        alt={`Slide ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-md bg-black/80 text-orange-500 font-mono font-bold text-[10px]">
                        #{idx + 1}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-1 pt-1 border-t border-gray-800">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleMoveImage(idx, "up")}
                          disabled={idx === 0}
                          className="p-1.5 rounded-lg bg-[#0f1218] border border-gray-700 text-gray-300 hover:text-white disabled:opacity-30"
                          title="تحريك لأول الترتيب"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveImage(idx, "down")}
                          disabled={idx === currentHeroImages.length - 1}
                          className="p-1.5 rounded-lg bg-[#0f1218] border border-gray-700 text-gray-300 hover:text-white disabled:opacity-30"
                          title="تحريك لأسفل"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteImage(idx)}
                        className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-xs flex items-center gap-1"
                        title="حذف الصورة"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>حذف</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: STORE TEXTS & CMS */}
        {activeTab === "TEXTS" && (
          <div className="p-6 rounded-2xl bg-[#12161f] border border-gray-800 space-y-6">
            <div className="border-b border-gray-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Type className="w-5 h-5 text-orange-500" />
                <span>نصوص وهوية المتجر والشاشة الرئيسية (CMS)</span>
              </h3>
              <p className="text-xs text-gray-400">
                تحكم كامل في كافة النصوص الظاهرة للعميل في الصفحة الرئيسية والأقسام والفوتر بدون تعديل الكود
              </p>
            </div>

            {/* SECTION 1: HERO COPY */}
            <div className="space-y-4 p-4 rounded-xl bg-[#161b24] border border-gray-800">
              <h4 className="text-xs font-extrabold text-red-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                <span>1. نصوص الواجهة والبانر الرئيسي (Hero Section)</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">اسم المتجر الأساسي</label>
                  <input
                    type="text"
                    value={settings.store_name || "EGY CPM"}
                    onChange={(e) => handleChange("store_name", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#0f1218] border border-gray-700 rounded-xl text-xs text-white focus:border-orange-500 text-right font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">الشعار اللفظي (Slogan)</label>
                  <input
                    type="text"
                    value={settings.store_slogan || "Car Parking Marketplace"}
                    onChange={(e) => handleChange("store_slogan", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#0f1218] border border-gray-700 rounded-xl text-xs text-white focus:border-orange-500 text-right font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">شارة البانر العلوية (Hero Badge)</label>
                <input
                  type="text"
                  value={settings.hero_badge || "متجر وورشة Car Parking Multiplayer الرسمية"}
                  onChange={(e) => handleChange("hero_badge", e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#0f1218] border border-gray-700 rounded-xl text-xs text-white focus:border-orange-500 text-right"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">العنوان الرئيسي الملون (Hero Title)</label>
                <input
                  type="text"
                  value={settings.hero_title || "المنصة الأولى لخدمات وتعديل سيارات اللعبة"}
                  onChange={(e) => handleChange("hero_title", e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#0f1218] border border-gray-700 rounded-xl text-xs text-white focus:border-orange-500 text-right font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">الوصف الترويجي في الشاشة الرئيسية</label>
                <textarea
                  rows={3}
                  value={settings.hero_description || "المتجر الرائد لتعديل محركات السيارات 1695HP، وتصاميم الفينيل الحصرية، وشحن الكاش والكوينز وتفعيل الكينج رانك، مع حماية تامة وأمان معتمد 100%."}
                  onChange={(e) => handleChange("hero_description", e.target.value)}
                  className="w-full p-3 bg-[#0f1218] border border-gray-700 rounded-xl text-xs text-white focus:border-orange-500 text-right leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">نص زر الإجراء الأول (CTA Button 1)</label>
                  <input
                    type="text"
                    value={settings.hero_cta1_text || "شحن رصيد المحفظة"}
                    onChange={(e) => handleChange("hero_cta1_text", e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#0f1218] border border-gray-700 rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">نص زر الإجراء الثاني (CTA Button 2)</label>
                  <input
                    type="text"
                    value={settings.hero_cta2_text || "تصفح المتجر الكامل"}
                    onChange={(e) => handleChange("hero_cta2_text", e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#0f1218] border border-gray-700 rounded-xl text-xs text-white"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: QUICK 4 SERVICES */}
            <div className="space-y-4 p-4 rounded-xl bg-[#161b24] border border-gray-800">
              <h4 className="text-xs font-extrabold text-orange-400 flex items-center gap-1.5">
                <Layers className="w-4 h-4" />
                <span>2. بطاقات الخدمات الأربعة السريعة (Quick Services Cards)</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-[#0f1218] border border-gray-800 space-y-2">
                  <label className="block text-[11px] font-bold text-white">بطاقة 1: السيارات المعدلة</label>
                  <input
                    type="text"
                    placeholder="العنوان"
                    value={settings.srv1_title || "سيارات معدلة 1695HP"}
                    onChange={(e) => handleChange("srv1_title", e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#161b24] border border-gray-700 rounded-lg text-xs text-white"
                  />
                  <input
                    type="text"
                    placeholder="الوصف"
                    value={settings.srv1_desc || "أقوى سيارات دريفت وسرعة بأعلى تظبيط للمحركات"}
                    onChange={(e) => handleChange("srv1_desc", e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#161b24] border border-gray-700 rounded-lg text-xs text-white"
                  />
                </div>

                <div className="p-3 rounded-lg bg-[#0f1218] border border-gray-800 space-y-2">
                  <label className="block text-[11px] font-bold text-white">بطاقة 2: سيارات الرسم والفينيل</label>
                  <input
                    type="text"
                    placeholder="العنوان"
                    value={settings.srv2_title || "سيارات رسم وفينيل حصري"}
                    onChange={(e) => handleChange("srv2_title", e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#161b24] border border-gray-700 rounded-lg text-xs text-white"
                  />
                  <input
                    type="text"
                    placeholder="الوصف"
                    value={settings.srv2_desc || "تصاميم مرسومة بدقة واحترافية عالية"}
                    onChange={(e) => handleChange("srv2_desc", e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#161b24] border border-gray-700 rounded-lg text-xs text-white"
                  />
                </div>

                <div className="p-3 rounded-lg bg-[#0f1218] border border-gray-800 space-y-2">
                  <label className="block text-[11px] font-bold text-white">بطاقة 3: خدمات الشحن والكوينز</label>
                  <input
                    type="text"
                    placeholder="العنوان"
                    value={settings.srv3_title || "خدمات شحن الكاش والكوينز"}
                    onChange={(e) => handleChange("srv3_title", e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#161b24] border border-gray-700 rounded-lg text-xs text-white"
                  />
                  <input
                    type="text"
                    placeholder="الوصف"
                    value={settings.srv3_desc || "شحن كاش 50M وكوينز ذهبي وتفعيل الكينج رانك"}
                    onChange={(e) => handleChange("srv3_desc", e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#161b24] border border-gray-700 rounded-lg text-xs text-white"
                  />
                </div>

                <div className="p-3 rounded-lg bg-[#0f1218] border border-gray-800 space-y-2">
                  <label className="block text-[11px] font-bold text-white">بطاقة 4: الحسابات الجاهزة</label>
                  <input
                    type="text"
                    placeholder="العنوان"
                    value={settings.srv4_title || "حسابات جاهزة VIP"}
                    onChange={(e) => handleChange("srv4_title", e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#161b24] border border-gray-700 rounded-lg text-xs text-white"
                  />
                  <input
                    type="text"
                    placeholder="الوصف"
                    value={settings.srv4_desc || "حسابات بكامل السيارات المعدلة والأموال"}
                    onChange={(e) => handleChange("srv4_desc", e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#161b24] border border-gray-700 rounded-lg text-xs text-white"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 3: HOW IT WORKS */}
            <div className="space-y-4 p-4 rounded-xl bg-[#161b24] border border-gray-800">
              <h4 className="text-xs font-extrabold text-orange-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>3. قسم كيف يعمل المتجر (How It Works)</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">شارة القسم</label>
                  <input
                    type="text"
                    value={settings.how_badge || "خطوات الشراء والتسليم"}
                    onChange={(e) => handleChange("how_badge", e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#0f1218] border border-gray-700 rounded-lg text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">عنوان القسم</label>
                  <input
                    type="text"
                    value={settings.how_title || "كيف يعمل المتجر؟"}
                    onChange={(e) => handleChange("how_title", e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#0f1218] border border-gray-700 rounded-lg text-xs text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">وصف القسم</label>
                  <input
                    type="text"
                    value={settings.how_subtitle || "4 خطوات سهلة ومباشرة تفصلك عن استلام وتطوير سيارتك"}
                    onChange={(e) => handleChange("how_subtitle", e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#0f1218] border border-gray-700 rounded-lg text-xs text-white"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 4: WHY CHOOSE US */}
            <div className="space-y-4 p-4 rounded-xl bg-[#161b24] border border-gray-800">
              <h4 className="text-xs font-extrabold text-orange-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>4. قسم لماذا تختارنا (Why Choose Us)</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">شارة القسم</label>
                  <input
                    type="text"
                    value={settings.why_badge || "لماذا تختار ورشة ومتجر EGY CPM؟"}
                    onChange={(e) => handleChange("why_badge", e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#0f1218] border border-gray-700 rounded-lg text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">عنوان القسم</label>
                  <input
                    type="text"
                    value={settings.why_title || "المتجر المعتمد للاعبي Car Parking"}
                    onChange={(e) => handleChange("why_title", e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#0f1218] border border-gray-700 rounded-lg text-xs text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">وصف القسم</label>
                  <input
                    type="text"
                    value={settings.why_subtitle || "أمان فائق، دقة في التنفيذ، وأعلى جودة في السيارات والتعديلات الحصرية."}
                    onChange={(e) => handleChange("why_subtitle", e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#0f1218] border border-gray-700 rounded-lg text-xs text-white"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 5: FOOTER COPY */}
            <div className="space-y-4 p-4 rounded-xl bg-[#161b24] border border-gray-800">
              <h4 className="text-xs font-extrabold text-orange-400 flex items-center gap-1.5">
                <span>5. نصوص الفوتر وحقوق الملكية (Footer)</span>
              </h4>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">الوصف التعريفي في الفوتر (Footer Bio)</label>
                <textarea
                  rows={2}
                  value={settings.footer_bio || "المتجر الأول والمتخصص في خدمات لعبة Car Parking Multiplayer على الهواتف. سيارات مرسومة، تعديل محركات 1695HP، كينج رانك، شحن كاش وكوينز بأمان 100%."}
                  onChange={(e) => handleChange("footer_bio", e.target.value)}
                  className="w-full p-3 bg-[#0f1218] border border-gray-700 rounded-xl text-xs text-white focus:border-orange-500 text-right leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">نص شارة الضمان في الفوتر</label>
                  <input
                    type="text"
                    value={settings.footer_guarantee || "ضمان ضد الباند 100% وتسليم فوري"}
                    onChange={(e) => handleChange("footer_guarantee", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#0f1218] border border-gray-700 rounded-xl text-xs text-white focus:border-orange-500 text-right"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">حقوق الملكية (Copyright)</label>
                  <input
                    type="text"
                    value={settings.footer_copyright || "© 2026 EGY CPM. جميع الحقوق محفوظة لمتجر كار باركينج."}
                    onChange={(e) => handleChange("footer_copyright", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#0f1218] border border-gray-700 rounded-xl text-xs text-white focus:border-orange-500 text-right"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: THEME & COLORS */}
        {activeTab === "THEME" && (
          <div className="p-6 rounded-2xl bg-[#12161f] border border-gray-800 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="space-y-0.5">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Palette className="w-5 h-5 text-orange-500" />
                  <span>إدارة ألوان وثيم المتجر بالكامل</span>
                </h3>
                <p className="text-xs text-gray-400">
                  تحكم مباشر في ألوان المتجر، الأزرار، والبطاقات مع الثيم الليلي الدائم الفاخر
                </p>
              </div>

              <button
                type="button"
                onClick={handleResetTheme}
                className="px-3 py-1.5 rounded-xl bg-[#161b24] hover:bg-gray-800 text-gray-300 text-xs font-bold border border-gray-700 flex items-center gap-1.5 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>استعادة الإعدادات الافتراضية</span>
              </button>
            </div>

            {/* Quick Color Presets */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-300">
                أنماط ألوان جاهزة سريعة (Color Presets):
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {colorPresets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      handleChange("theme_primary_color", preset.color);
                      handleChange("theme_btn_color", preset.color);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#161b24] border border-gray-700 hover:border-gray-500 text-xs font-bold text-gray-200 flex items-center gap-2 transition"
                  >
                    <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: preset.color }} />
                    <span>{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Color Pickers Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-[#161b24] border border-gray-800 space-y-2">
                <label className="block text-xs font-bold text-white">اللون الأساسي (Primary Color)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.theme_primary_color || "#ff6600"}
                    onChange={(e) => handleChange("theme_primary_color", e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <input
                    type="text"
                    value={settings.theme_primary_color || "#ff6600"}
                    onChange={(e) => handleChange("theme_primary_color", e.target.value)}
                    className="flex-1 px-3 py-2 bg-[#0f1218] border border-gray-700 rounded-lg text-xs text-white font-mono text-center"
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#161b24] border border-gray-800 space-y-2">
                <label className="block text-xs font-bold text-white">لون الأزرار الرئيسية (Button Color)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.theme_btn_color || "#ff6600"}
                    onChange={(e) => handleChange("theme_btn_color", e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <input
                    type="text"
                    value={settings.theme_btn_color || "#ff6600"}
                    onChange={(e) => handleChange("theme_btn_color", e.target.value)}
                    className="flex-1 px-3 py-2 bg-[#0f1218] border border-gray-700 rounded-lg text-xs text-white font-mono text-center"
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#161b24] border border-gray-800 space-y-2">
                <label className="block text-xs font-bold text-white">لون حالة النجاح (Success Color)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.theme_success_color || "#10b981"}
                    onChange={(e) => handleChange("theme_success_color", e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <input
                    type="text"
                    value={settings.theme_success_color || "#10b981"}
                    onChange={(e) => handleChange("theme_success_color", e.target.value)}
                    className="flex-1 px-3 py-2 bg-[#0f1218] border border-gray-700 rounded-lg text-xs text-white font-mono text-center"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PAYMENT & CASH NUMBERS */}
        {activeTab === "PAYMENT" && (
          <div className="p-6 rounded-2xl bg-[#12161f] border border-gray-800 space-y-5">
            <div className="border-b border-gray-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-orange-500" />
                <span>أرقام التحويل وطرق الدفع والاتصال</span>
              </h3>
              <p className="text-xs text-gray-400">
                تعديل أرقام فودافون كاش، اتصالات، أورنج، وي باي، وقنوات الدعم
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">رقم فودافون كاش</label>
                <input
                  type="text"
                  value={settings.vodafone_cash || "01288212101"}
                  onChange={(e) => handleChange("vodafone_cash", e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#0f1218] border border-gray-700 rounded-xl text-xs text-white focus:border-orange-500 text-right dir-ltr font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">رقم أورنج كاش</label>
                <input
                  type="text"
                  value={settings.orange_cash || "01288212101"}
                  onChange={(e) => handleChange("orange_cash", e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#0f1218] border border-gray-700 rounded-xl text-xs text-white focus:border-orange-500 text-right dir-ltr font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">رقم اتصالات كاش</label>
                <input
                  type="text"
                  value={settings.etisalat_cash || "01288212101"}
                  onChange={(e) => handleChange("etisalat_cash", e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#0f1218] border border-gray-700 rounded-xl text-xs text-white focus:border-orange-500 text-right dir-ltr font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">رقم وي باي (WE Pay)</label>
                <input
                  type="text"
                  value={settings.we_pay || "01288212101"}
                  onChange={(e) => handleChange("we_pay", e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#0f1218] border border-gray-700 rounded-xl text-xs text-white focus:border-orange-500 text-right dir-ltr font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">الحد الأدنى للشحن (ج.م)</label>
                <input
                  type="number"
                  value={settings.min_deposit || "50"}
                  onChange={(e) => handleChange("min_deposit", e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#0f1218] border border-gray-700 rounded-xl text-xs text-white focus:border-orange-500 text-right font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">الحد الأقصى للشحن (ج.م)</label>
                <input
                  type="number"
                  value={settings.max_deposit || "20000"}
                  onChange={(e) => handleChange("max_deposit", e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#0f1218] border border-gray-700 rounded-xl text-xs text-white focus:border-orange-500 text-right font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: BACKUP */}
        {activeTab === "BACKUP" && (
          <div className="p-6 rounded-2xl bg-[#12161f] border border-gray-800 space-y-4">
            <div className="flex items-center gap-2 text-orange-400 font-bold text-sm">
              <Database className="w-5 h-5" />
              <span>النسخ الاحتياطي لقاعدة البيانات (Database Backup)</span>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              تحميل نسخة احتياطية كاملة بصيغة JSON تحتوي على كافة بيانات المستخدمين، المحافظ، المعاملات، السيارات، والطلبات لحمايتها من أي فقدان.
            </p>

            <button
              type="button"
              onClick={handleDownloadBackup}
              disabled={isExporting}
              className="w-full py-3.5 rounded-xl bg-orange-500 text-black font-bold text-xs flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.98] transition disabled:opacity-50"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>تنزيل نسخة احتياطية كاملة الآن 💾</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Submit Save Button */}
        {activeTab !== "BACKUP" && (
          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-4 rounded-2xl bg-orange-500 hover:bg-orange-600 text-black font-black text-sm hover:scale-[1.01] active:scale-[0.98] transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-md"
          >
            {isSaving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>حفظ التعديلات وتطبيقها فوراً على المتجر 🚀</span>
              </>
            )}
          </button>
        )}
      </form>
    </div>
  );
}

