"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { updateAdSettings } from "@/lib/actions/settings";
import { toast } from "sonner";
import {
  Sparkles,
  Megaphone,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Upload,
  Clock,
  RefreshCw,
  Layers,
  Flame,
  MessageCircle,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Phone,
  Loader2,
  Smartphone,
  Eye,
  Sliders,
  Save,
  Info,
  Ratio,
  Maximize2,
} from "lucide-react";

interface AdsManagerClientProps {
  initialSettings?: Record<string, string>;
  settings?: Record<string, string>;
  handleChange?: (key: string, value: string) => void;
}

export default function AdsManagerClient({
  initialSettings = {},
  settings: externalSettings,
  handleChange: externalHandleChange,
}: AdsManagerClientProps) {
  const router = useRouter();
  const [internalSettings, setInternalSettings] = useState<Record<string, string>>(
    externalSettings || initialSettings || {}
  );
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const settings = externalSettings || internalSettings;

  const handleChange = (key: string, value: string) => {
    if (externalHandleChange) {
      externalHandleChange(key, value);
    }
    setInternalSettings((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  // Section-specific independent saving handler
  const handleSaveSection = async (
    section: "hero" | "stories" | "top" | "mid" | "feed" | "mobile" | "whatsapp" | "all"
  ) => {
    setSavingSection(section);
    try {
      const keysMap: Record<string, string[]> = {
        hero: ["ad_hero_enabled", "hero_billboard_ads", "hero_slider_autoplay", "hero_slider_interval"],
        stories: ["ad_stories_enabled", "ad_stories_items"],
        top: [
          "ad_top_enabled",
          "ad_top_items",
          "ad_top_badge",
          "ad_top_text",
          "ad_top_link",
          "ad_top_cta",
          "ad_top_dismissible",
        ],
        mid: [
          "ad_mid_enabled",
          "ad_mid_items",
          "ad_mid_title",
          "ad_mid_desc",
          "ad_mid_link",
          "ad_mid_image",
          "ad_mid_cta",
          "ad_mid_show_pages",
        ],
        feed: [
          "ad_feed_enabled",
          "ad_feed_items",
          "ad_feed_badge",
          "ad_feed_title",
          "ad_feed_desc",
          "ad_feed_link",
          "ad_feed_image",
          "ad_feed_cta",
        ],
        mobile: [
          "ad_mobile_bar_enabled",
          "ad_mobile_items",
          "ad_mobile_bar_badge",
          "ad_mobile_bar_text",
          "ad_mobile_bar_link",
        ],
        whatsapp: ["ad_booking_whatsapp"],
      };

      let targetKeys: string[] = [];
      if (section === "all") {
        targetKeys = Object.keys(settings).filter((k) => k.startsWith("ad_") || k.startsWith("hero_"));
        if (settings.ad_booking_whatsapp) targetKeys.push("ad_booking_whatsapp");
      } else {
        targetKeys = keysMap[section] || [];
      }

      const payload: Record<string, string> = {};
      targetKeys.forEach((k) => {
        if (settings[k] !== undefined) {
          payload[k] = settings[k];
        }
      });

      await updateAdSettings(payload);

      const sectionNames: Record<string, string> = {
        hero: "👑 المساحة الرئيسية (Billboard)",
        stories: "🟣 قصص الرعاة (Stories 12h)",
        top: "🔵 شريط البانوراما العلوي",
        mid: "🟢 البانر الأوسط الترويجي",
        feed: "🔴 بطاقة المنتجات المدمجة",
        mobile: "🟠 شريط الموبايل العائم",
        whatsapp: "💬 واتساب حجز الإعلانات",
        all: "كافة المساحات الإعلانية",
      };

      toast.success(`تم حفظ ونشر ${sectionNames[section]} بنجاح فائق! 🚀`);
      setHasChanges(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء حفظ الإعدادات.");
    } finally {
      setSavingSection(null);
    }
  };

  const [activeSubTab, setActiveSubTab] = useState<
    "ALL" | "HERO" | "STORIES" | "TOP" | "MID" | "FEED" | "MOBILE" | "WHATSAPP"
  >("ALL");

  const [uploadingKey, setUploadingKey] = useState<string | null>(null);

  // Generic direct Cloudinary upload helper
  const handleFileUpload = async (
    onSuccess: (url: string) => void,
    e: React.ChangeEvent<HTMLInputElement>,
    keyId: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setUploadingKey(keyId);
    toast.loading("جاري رفع الصورة إلى السحابة...", { id: "upload-status" });
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.message || "فشل رفع الصورة.");
      onSuccess(data.url);
      toast.success("تم رفع الصورة بنجاح! 📸", { id: "upload-status" });
    } catch (err: any) {
      toast.error(err.message || "فشل رفع الصورة.", { id: "upload-status" });
    } finally {
      setUploadingKey(null);
      e.target.value = "";
    }
  };

  /* -------------------------------------------------------------
   * 1. HERO BILLBOARD ADS (Multi-Ad Carousel - Purely Dynamic)
   * ----------------------------------------------------------- */
  const getHeroAds = () => {
    try {
      if (settings.hero_billboard_ads !== undefined) {
        const p = JSON.parse(settings.hero_billboard_ads);
        if (Array.isArray(p)) return p;
      }
    } catch {}
    if (settings.ad_hero_image) {
      return [
        {
          id: "hero_legacy",
          image: settings.ad_hero_image,
          link: settings.ad_hero_link || "",
          title: settings.ad_hero_title || "",
          desc: settings.ad_hero_desc || "",
          badge: settings.ad_hero_badge || "SPONSORED VIP ⭐",
          sponsor: settings.ad_hero_sponsor || "راعي معتمد",
          cta: settings.ad_hero_cta || "زيارة العرض ↗",
          enabled: true,
        },
      ];
    }
    return [];
  };

  const heroAds = getHeroAds();
  const setHeroAds = (list: any[]) => handleChange("hero_billboard_ads", JSON.stringify(list));

  const addHeroAd = () => {
    const item = {
      id: "hero_" + Date.now(),
      image: "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=1200",
      link: "",
      title: "",
      desc: "",
      badge: "إعلان جديد ⭐",
      sponsor: "",
      cta: "زيارة العرض ↗",
      enabled: true,
    };
    setHeroAds([...heroAds, item]);
    toast.success("تمت إضافة إعلان جديد للمساحة الرئيسية!");
  };

  const moveHeroAd = (index: number, dir: "up" | "down") => {
    const target = dir === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= heroAds.length) return;
    const copy = [...heroAds];
    const temp = copy[index];
    copy[index] = copy[target];
    copy[target] = temp;
    setHeroAds(copy);
  };

  /* -------------------------------------------------------------
   * 2. STORIES (Multi-Story, 12H Auto-Expiry - Purely Dynamic)
   * ----------------------------------------------------------- */
  const getStories = () => {
    try {
      if (settings.ad_stories_items !== undefined) {
        const p = JSON.parse(settings.ad_stories_items);
        if (Array.isArray(p)) return p;
      }
    } catch {}
    return [];
  };

  const stories = getStories();
  const setStories = (list: any[]) => handleChange("ad_stories_items", JSON.stringify(list));

  const addStory = () => {
    const item = {
      id: "story_" + Date.now(),
      name: "قصة راعي جديدة",
      image: "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=500",
      link: "",
      createdAt: Date.now(),
      durationHours: 12,
      enabled: true,
    };
    setStories([...stories, item]);
    toast.success("تمت إضافة قصة جديدة مؤقتة لـ 12 ساعة!");
  };

  const renewStory = (index: number) => {
    const updated = [...stories];
    updated[index].createdAt = Date.now();
    updated[index].durationHours = 12;
    setStories(updated);
    toast.success("تم تجديد صلاحية القصة لمدة 12 ساعة إضافية من الآن! ⏱️");
  };

  /* -------------------------------------------------------------
   * 3. TOP PANORAMA ADS (Multi-Ad Carousel - Purely Dynamic)
   * ----------------------------------------------------------- */
  const getTopAds = () => {
    try {
      if (settings.ad_top_items !== undefined) {
        const p = JSON.parse(settings.ad_top_items);
        if (Array.isArray(p)) return p;
      }
    } catch {}
    if (settings.ad_top_text) {
      return [
        {
          id: "top_legacy",
          badge: settings.ad_top_badge || "عرض اليوم ⚡",
          text: settings.ad_top_text,
          link: settings.ad_top_link || "",
          cta: settings.ad_top_cta || "انضم للديسكورد ↗",
          enabled: true,
        },
      ];
    }
    return [];
  };

  const topAds = getTopAds();
  const setTopAds = (list: any[]) => handleChange("ad_top_items", JSON.stringify(list));

  const addTopAd = () => {
    const item = {
      id: "top_" + Date.now(),
      badge: "عرض جديد 🌟",
      text: "خصم حصري على شحن الكوينز والكاش لفترة محدودة!",
      link: "",
      cta: "شاهد العرض ↗",
      enabled: true,
    };
    setTopAds([...topAds, item]);
    toast.success("تمت إضافة إعلان جديد للشريط العلوي!");
  };

  /* -------------------------------------------------------------
   * 4. MID LEADERBOARD ADS (Multi-Ad Carousel - Purely Dynamic)
   * ----------------------------------------------------------- */
  const getMidBanners = () => {
    try {
      if (settings.ad_mid_items !== undefined) {
        const p = JSON.parse(settings.ad_mid_items);
        if (Array.isArray(p)) return p;
      }
    } catch {}
    if (settings.ad_mid_image || settings.ad_mid_title) {
      return [
        {
          id: "mid_legacy",
          title: settings.ad_mid_title || "",
          desc: settings.ad_mid_desc || "",
          image: settings.ad_mid_image || "",
          link: settings.ad_mid_link || "",
          cta: settings.ad_mid_cta || "حجز مساحة إعلانية 💬",
          enabled: true,
        },
      ];
    }
    return [];
  };

  const midBanners = getMidBanners();
  const setMidBanners = (list: any[]) => handleChange("ad_mid_items", JSON.stringify(list));

  const addMidBanner = () => {
    const item = {
      id: "mid_" + Date.now(),
      title: "بانر إعلاني جديد",
      desc: "وصف الإعلان الترويجي يظهر هنا بشكل واضح وجذاب للمتصفحين.",
      image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200",
      link: "",
      cta: "زيارة الراعي ↗",
      enabled: true,
    };
    setMidBanners([...midBanners, item]);
    toast.success("تمت إضافة بانر جديد للمساحة الوسطى!");
  };

  /* -------------------------------------------------------------
   * 5. IN-FEED PRODUCT CARD ADS (Multi-Ad Carousel - Purely Dynamic)
   * ----------------------------------------------------------- */
  const getFeedCards = () => {
    try {
      if (settings.ad_feed_items !== undefined) {
        const p = JSON.parse(settings.ad_feed_items);
        if (Array.isArray(p)) return p;
      }
    } catch {}
    if (settings.ad_feed_image) {
      return [
        {
          id: "feed_legacy",
          badge: settings.ad_feed_badge || "SPONSORED STORE 💎",
          title: settings.ad_feed_title || "",
          desc: settings.ad_feed_desc || "",
          image: settings.ad_feed_image,
          link: settings.ad_feed_link || "",
          cta: settings.ad_feed_cta || "انضم الآن 🚀",
          enabled: true,
        },
      ];
    }
    return [];
  };

  const feedCards = getFeedCards();
  const setFeedCards = (list: any[]) => handleChange("ad_feed_items", JSON.stringify(list));

  const addFeedCard = () => {
    const item = {
      id: "feed_" + Date.now(),
      badge: "شريك مميز ⭐",
      title: "اسم الراعي / المتجر",
      desc: "نبذة عن منتجات وخدمات الشريك تظهر وسط شبكة السيارات.",
      image: "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=800",
      link: "",
      cta: "زيارة العرض ↗",
      enabled: true,
    };
    setFeedCards([...feedCards, item]);
    toast.success("تمت إضافة بطاقة منتجات ترويجية جديدة!");
  };

  /* -------------------------------------------------------------
   * 6. STICKY MOBILE BAR (Multi-Ad Carousel - Purely Dynamic)
   * ----------------------------------------------------------- */
  const getMobileAds = () => {
    try {
      if (settings.ad_mobile_items !== undefined) {
        const p = JSON.parse(settings.ad_mobile_items);
        if (Array.isArray(p)) return p;
      }
    } catch {}
    if (settings.ad_mobile_bar_text) {
      return [
        {
          id: "mobile_legacy",
          badge: settings.ad_mobile_bar_badge || "إعلان مميز 🔥",
          text: settings.ad_mobile_bar_text,
          link: settings.ad_mobile_bar_link || "",
          enabled: true,
        },
      ];
    }
    return [];
  };

  const mobileAds = getMobileAds();
  const setMobileAds = (list: any[]) => handleChange("ad_mobile_items", JSON.stringify(list));

  const addMobileAd = () => {
    const item = {
      id: "mobile_" + Date.now(),
      badge: "تنويه جديد ⚡",
      text: "سحب جوائز أسبوعي للمشتركين!",
      link: "",
      enabled: true,
    };
    setMobileAds([...mobileAds, item]);
    toast.success("تمت إضافة إعلان جديد لشريط الموبايل السفلي!");
  };

  return (
    <div className="space-y-6 text-right">
      {/* Visual Sub-Tabs Navigation (Color Coded & Easy Distinction) */}
      <div className="p-3 bg-[#0f1218] border border-gray-800 rounded-2xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
          <span className="text-xs font-black text-white flex items-center gap-1.5">
            <Megaphone className="w-4 h-4 text-amber-400" />
            <span>اختر المساحة الإعلانية لضبطها وحفظها بشكل مستقل:</span>
          </span>
          <button
            type="button"
            onClick={() => handleSaveSection("all")}
            disabled={savingSection !== null}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-xs shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition disabled:opacity-50"
          >
            {savingSection === "all" ? (
              <Loader2 className="w-4 h-4 animate-spin text-black" />
            ) : (
              <Save className="w-4 h-4 text-black" />
            )}
            <span>{savingSection === "all" ? "جاري الحفظ الشامل..." : "حفظ جميع المساحات دفعة واحدة 🚀"}</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Sub-Tab: ALL */}
          <button
            type="button"
            onClick={() => setActiveSubTab("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeSubTab === "ALL"
                ? "bg-white text-black font-black shadow-sm"
                : "bg-[#161b24] text-gray-400 hover:text-white border border-gray-700"
            }`}
          >
            <span>عرض الكل 📋</span>
          </button>

          {/* Sub-Tab 1: HERO */}
          <button
            type="button"
            onClick={() => setActiveSubTab("HERO")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
              activeSubTab === "HERO"
                ? "bg-amber-500 text-black font-black border-amber-400 shadow-md shadow-amber-500/20"
                : "bg-amber-950/20 text-amber-400 border-amber-500/40 hover:bg-amber-950/40"
            }`}
          >
            <span>👑 المساحة الرئيسية (Billboard)</span>
            <span className="px-1.5 py-0.2 rounded-full bg-black/40 text-[10px] font-mono">
              {heroAds.length}
            </span>
          </button>

          {/* Sub-Tab 2: STORIES */}
          <button
            type="button"
            onClick={() => setActiveSubTab("STORIES")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
              activeSubTab === "STORIES"
                ? "bg-pink-600 text-white font-black border-pink-400 shadow-md shadow-pink-600/20"
                : "bg-pink-950/20 text-pink-400 border-pink-500/40 hover:bg-pink-950/40"
            }`}
          >
            <span>🟣 قصص الرعاة (Stories - 12h)</span>
            <span className="px-1.5 py-0.2 rounded-full bg-black/40 text-[10px] font-mono">
              {stories.length}
            </span>
          </button>

          {/* Sub-Tab 3: TOP */}
          <button
            type="button"
            onClick={() => setActiveSubTab("TOP")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
              activeSubTab === "TOP"
                ? "bg-cyan-600 text-white font-black border-cyan-400 shadow-md shadow-cyan-600/20"
                : "bg-cyan-950/20 text-cyan-400 border-cyan-500/40 hover:bg-cyan-950/40"
            }`}
          >
            <span>🔵 شريط البانوراما العلوي</span>
            <span className="px-1.5 py-0.2 rounded-full bg-black/40 text-[10px] font-mono">
              {topAds.length}
            </span>
          </button>

          {/* Sub-Tab 4: MID */}
          <button
            type="button"
            onClick={() => setActiveSubTab("MID")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
              activeSubTab === "MID"
                ? "bg-emerald-600 text-white font-black border-emerald-400 shadow-md shadow-emerald-600/20"
                : "bg-emerald-950/20 text-emerald-400 border-emerald-500/40 hover:bg-emerald-950/40"
            }`}
          >
            <span>🟢 البانر الأوسط بين الأقسام</span>
            <span className="px-1.5 py-0.2 rounded-full bg-black/40 text-[10px] font-mono">
              {midBanners.length}
            </span>
          </button>

          {/* Sub-Tab 5: FEED */}
          <button
            type="button"
            onClick={() => setActiveSubTab("FEED")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
              activeSubTab === "FEED"
                ? "bg-rose-600 text-white font-black border-rose-400 shadow-md shadow-rose-600/20"
                : "bg-rose-950/20 text-rose-400 border-rose-500/40 hover:bg-rose-950/40"
            }`}
          >
            <span>🔴 بطاقة المنتجات المدمجة</span>
            <span className="px-1.5 py-0.2 rounded-full bg-black/40 text-[10px] font-mono">
              {feedCards.length}
            </span>
          </button>

          {/* Sub-Tab 6: MOBILE */}
          <button
            type="button"
            onClick={() => setActiveSubTab("MOBILE")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
              activeSubTab === "MOBILE"
                ? "bg-orange-600 text-white font-black border-orange-400 shadow-md shadow-orange-600/20"
                : "bg-orange-950/20 text-orange-400 border-orange-500/40 hover:bg-orange-950/40"
            }`}
          >
            <span>🟠 شريط الموبايل العائم</span>
            <span className="px-1.5 py-0.2 rounded-full bg-black/40 text-[10px] font-mono">
              {mobileAds.length}
            </span>
          </button>

          {/* Sub-Tab 7: WHATSAPP */}
          <button
            type="button"
            onClick={() => setActiveSubTab("WHATSAPP")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
              activeSubTab === "WHATSAPP"
                ? "bg-green-600 text-white font-black border-green-400 shadow-md shadow-green-600/20"
                : "bg-green-950/20 text-green-400 border-green-500/40 hover:bg-green-950/40"
            }`}
          >
            <span>💬 واتساب الحجز الموحد</span>
          </button>
        </div>
      </div>

      {/* =============================================================
          SECTION 1: HERO BILLBOARD (GOLD THEME)
         ============================================================= */}
      {(activeSubTab === "ALL" || activeSubTab === "HERO") && (
        <div className="p-6 rounded-2xl bg-gradient-to-b from-[#181308] to-[#12161f] border-2 border-amber-500/60 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-500/30 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </span>
                <h3 className="text-base font-black text-amber-300">
                  1. المساحة الإعلانية الرئيسية المميزة (Main Hero Ad Billboard)
                </h3>
              </div>
              <p className="text-xs text-gray-300">
                تدعم وضع عدة إعلانات ورعاة مع التنقل التلقائي، والضغط على كامل الإعلان للتحويل، وإخفاء النصوص تماماً لعدم حجب تصميم البانر.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleSaveSection("hero")}
                disabled={savingSection !== null}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition disabled:opacity-50"
              >
                {savingSection === "hero" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />
                ) : (
                  <Save className="w-3.5 h-3.5 text-black" />
                )}
                <span>حفظ المساحة الرئيسية 💾</span>
              </button>

              <div className="flex items-center gap-2 pr-2 border-r border-amber-500/30">
                <span className="text-xs font-bold text-gray-300">
                  {settings.ad_hero_enabled !== "false" ? "مفعلة ✅" : "معطلة ❌"}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    handleChange(
                      "ad_hero_enabled",
                      settings.ad_hero_enabled === "false" ? "true" : "false"
                    )
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.ad_hero_enabled !== "false" ? "bg-amber-500" : "bg-gray-700"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.ad_hero_enabled !== "false" ? "translate-x-1" : "translate-x-6"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* DIMENSION & DESIGN GUIDE BADGE */}
          <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/40 text-xs space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="p-1 rounded bg-amber-500/20 text-amber-300 font-black flex items-center gap-1">
                <Ratio className="w-3.5 h-3.5" />
                <span>المقاس الموصى به:</span>
              </span>
              <span className="font-mono font-black text-white bg-black/60 px-2 py-0.5 rounded border border-amber-500/40">
                1200 × 450 بكسل
              </span>
              <span className="text-gray-300 text-[11px]">
                (أو 1920 × 600 بكسل لشاشات FHD - نسبة عرض سينمائية 2.6:1 أو 16:9)
              </span>
            </div>
            <p className="text-[11px] text-amber-200/80 leading-relaxed">
              💡 <strong>نصيحة التصميم:</strong> اجعل العناصر الهامة والنصوص في منتصف التصميم حتى تظهر واضحة بدون اقتصاص على شاشات الجوال وأجهزة الكمبيوتر معاً.
            </p>
          </div>

          {/* Autoplay Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-[#0d1017] border border-amber-500/20">
            <div>
              <label className="block text-xs font-bold text-amber-200 mb-1">
                التنقل التلقائي بين الإعلانات (Autoplay)
              </label>
              <select
                value={settings.hero_slider_autoplay || "true"}
                onChange={(e) => handleChange("hero_slider_autoplay", e.target.value)}
                className="w-full px-3 py-2 bg-[#161b24] border border-gray-700 rounded-xl text-xs text-white"
              >
                <option value="true">تفعيل التنقل التلقائي (مستحسن)</option>
                <option value="false">تعطيل (تنقل يدوي فقط بالسحب)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-amber-200 mb-1">
                سرعة تبديل الإعلان (بالثواني)
              </label>
              <select
                value={settings.hero_slider_interval || "4"}
                onChange={(e) => handleChange("hero_slider_interval", e.target.value)}
                className="w-full px-3 py-2 bg-[#161b24] border border-gray-700 rounded-xl text-xs text-white font-mono"
              >
                <option value="3">3 ثوانٍ (سريع)</option>
                <option value="4">4 ثوانٍ (افتراضي مثالي)</option>
                <option value="6">6 ثوانٍ (هادئ ومريح)</option>
                <option value="8">8 ثوانٍ (بطيء)</option>
              </select>
            </div>
          </div>

          {/* Ads List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-amber-300">
                الإعلانات المضافة للمساحة الرئيسية ({heroAds.length}):
              </span>
              <button
                type="button"
                onClick={addHeroAd}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs flex items-center gap-1.5 transition shadow-lg shadow-amber-500/20"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة إعلان جديد للمساحة الرئيسية +</span>
              </button>
            </div>

            {heroAds.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-[#0a0d13] border border-dashed border-amber-500/30 space-y-3">
                <p className="text-xs text-amber-200/80 font-bold">لا توجد إعلانات في المساحة الرئيسية حالياً (المساحة مخفية من المتجر تلقائياً).</p>
                <p className="text-[11px] text-gray-400">عند إضافة إعلان هنا سيبدأ في الظهور والتنقل فوراً على المتجر.</p>
                <button
                  type="button"
                  onClick={addHeroAd}
                  className="px-4 py-2 rounded-xl bg-amber-500 text-black font-black text-xs inline-flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة أول إعلان للمساحة الرئيسية</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {heroAds.map((ad: any, idx: number) => (
                <div
                  key={ad.id || idx}
                  className="p-5 rounded-2xl bg-[#0f1218] border border-amber-500/30 space-y-4 relative"
                >
                  {/* Card Header & Controls */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-800 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-400 text-xs font-mono font-bold">
                        #{idx + 1}
                      </span>
                      <span className="text-xs font-bold text-white">
                        {ad.title || ad.sponsor || `إعلان رئيسي #${idx + 1}`}
                      </span>
                      {ad.badge && (
                        <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 text-[10px] font-bold border border-amber-500/20">
                          {ad.badge}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...heroAds];
                          updated[idx].enabled = !updated[idx].enabled;
                          setHeroAds(updated);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition border ${
                          ad.enabled !== false
                            ? "bg-emerald-950/40 text-emerald-400 border-emerald-500/40"
                            : "bg-red-950/40 text-red-400 border-red-500/40"
                        }`}
                      >
                        {ad.enabled !== false ? "نشط ✅" : "معطل ⏸️"}
                      </button>

                      <button
                        type="button"
                        onClick={() => moveHeroAd(idx, "up")}
                        disabled={idx === 0}
                        title="تحريك لأعلى"
                        className="p-1.5 rounded-lg bg-gray-800 text-gray-300 hover:text-white disabled:opacity-30"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveHeroAd(idx, "down")}
                        disabled={idx === heroAds.length - 1}
                        title="تحريك لأسفل"
                        className="p-1.5 rounded-lg bg-gray-800 text-gray-300 hover:text-white disabled:opacity-30"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (heroAds.length <= 1) {
                            toast.warning("يجب الإبقاء على إعلان واحد على الأقل.");
                            return;
                          }
                          setHeroAds(heroAds.filter((_: any, i: number) => i !== idx));
                          toast.info("تم حذف الإعلان.");
                        }}
                        title="حذف الإعلان"
                        className="p-1.5 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white border border-red-500/30"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Image and Upload */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <div className="md:col-span-2 space-y-2">
                      <label className="block text-xs font-bold text-gray-300">
                        رابط صورة الإعلان (Banner Image URL)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="https://..."
                          value={ad.image || ""}
                          onChange={(e) => {
                            const updated = [...heroAds];
                            updated[idx].image = e.target.value;
                            setHeroAds(updated);
                          }}
                          className="flex-1 px-3 py-2 bg-[#161b24] border border-gray-700 rounded-xl text-xs text-white text-left font-mono"
                        />
                        <label className="px-3 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500 hover:text-black font-bold text-xs cursor-pointer flex items-center gap-1 shrink-0 transition">
                          {uploadingKey === `hero_img_${idx}` ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Upload className="w-4 h-4" />
                          )}
                          <span>رفع 📸</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={uploadingKey !== null}
                            onChange={(e) =>
                              handleFileUpload(
                                (url) => {
                                  const updated = [...heroAds];
                                  updated[idx].image = url;
                                  setHeroAds(updated);
                                },
                                e,
                                `hero_img_${idx}`
                              )
                            }
                          />
                        </label>
                      </div>
                      <span className="text-[10px] text-gray-400 block">
                        المقاس المثالي: 1200×450 بكسل (PNG, JPG, WebP أو GIF متحرك).
                      </span>
                    </div>

                    {/* Image Preview */}
                    <div className="h-24 rounded-xl border border-gray-800 bg-black/40 overflow-hidden relative flex items-center justify-center">
                      {ad.image ? (
                        <img
                          src={ad.image}
                          alt="Hero Preview"
                          className="w-full h-full object-cover rounded-xl"
                        />
                      ) : (
                        <span className="text-[10px] text-gray-500">لا توجد صورة</span>
                      )}
                    </div>
                  </div>

                  {/* Settings Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {/* Link */}
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-gray-300 mb-1">
                        رابط التحويل عند الضغط (Destination URL)
                      </label>
                      <input
                        type="text"
                        placeholder="https://t.me/... أو https://discord.gg/..."
                        value={ad.link || ""}
                        onChange={(e) => {
                          const updated = [...heroAds];
                          updated[idx].link = e.target.value;
                          setHeroAds(updated);
                        }}
                        className="w-full px-3 py-2 bg-[#161b24] border border-gray-700 rounded-xl text-xs text-white text-left font-mono"
                      />
                      <span className="text-[10px] text-gray-400">
                        عند وضع الرابط، يصبح كامل البانر قابلاً للضغط والانتقال مباشرة.
                      </span>
                    </div>

                    {/* CTA Button Text */}
                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-1">
                        نص زر التحويل (اختياري)
                      </label>
                      <input
                        type="text"
                        placeholder="زيارة العرض ↗"
                        value={ad.cta || ""}
                        onChange={(e) => {
                          const updated = [...heroAds];
                          updated[idx].cta = e.target.value;
                          setHeroAds(updated);
                        }}
                        className="w-full px-3 py-2 bg-[#161b24] border border-gray-700 rounded-xl text-xs text-white text-right"
                      />
                    </div>

                    {/* Title */}
                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-1">
                        العنوان الترويجي (اتركه فارغاً لإخفائه)
                      </label>
                      <input
                        type="text"
                        placeholder="مثال: خصم 50% على سيارات CPM 2"
                        value={ad.title || ""}
                        onChange={(e) => {
                          const updated = [...heroAds];
                          updated[idx].title = e.target.value;
                          setHeroAds(updated);
                        }}
                        className="w-full px-3 py-2 bg-[#161b24] border border-gray-700 rounded-xl text-xs text-white text-right"
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-1">
                        الوصف الفرعي (اتركه فارغاً لإخفائه)
                      </label>
                      <input
                        type="text"
                        placeholder="مثال: لفترة محدودة لجميع المشتركين"
                        value={ad.desc || ""}
                        onChange={(e) => {
                          const updated = [...heroAds];
                          updated[idx].desc = e.target.value;
                          setHeroAds(updated);
                        }}
                        className="w-full px-3 py-2 bg-[#161b24] border border-gray-700 rounded-xl text-xs text-white text-right"
                      />
                    </div>

                    {/* Badge */}
                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-1">
                        شارة الإعلان (Badge)
                      </label>
                      <input
                        type="text"
                        placeholder="مثال: SPONSORED VIP ⭐"
                        value={ad.badge || ""}
                        onChange={(e) => {
                          const updated = [...heroAds];
                          updated[idx].badge = e.target.value;
                          setHeroAds(updated);
                        }}
                        className="w-full px-3 py-2 bg-[#161b24] border border-gray-700 rounded-xl text-xs text-white text-right"
                      />
                    </div>

                    {/* Sponsor */}
                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-1">
                        اسم الراعي / المعلن (اختياري)
                      </label>
                      <input
                        type="text"
                        placeholder="مثال: متجر فالكون أوفيشال"
                        value={ad.sponsor || ""}
                        onChange={(e) => {
                          const updated = [...heroAds];
                          updated[idx].sponsor = e.target.value;
                          setHeroAds(updated);
                        }}
                        className="w-full px-3 py-2 bg-[#161b24] border border-gray-700 rounded-xl text-xs text-white text-right"
                      />
                    </div>
                  </div>
                </div>
              ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =============================================================
          SECTION 2: STORIES (PINK/MAGENTA THEME - 12H AUTO EXPIRY)
         ============================================================= */}
      {(activeSubTab === "ALL" || activeSubTab === "STORIES") && (
        <div className="p-6 rounded-2xl bg-gradient-to-b from-[#1c0818] to-[#12161f] border-2 border-pink-500/60 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-pink-500/30 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-pink-500/20 text-pink-400 border border-pink-500/40">
                  <Flame className="w-5 h-5" />
                </span>
                <h3 className="text-base font-black text-pink-300">
                  2. قصص الرعاة والشركاء المعتمدين (Stories - حذف تلقائي بعد 12 ساعة)
                </h3>
              </div>
              <p className="text-xs text-gray-300">
                دوائر قصص متناسقة تماماً ومضبوطة للهاتف. تظهر كل قصة لمدة 12 ساعة من إنشائها وتختفي تلقائياً، مع إمكانية التجديد أو الحذف اليدوي الفوري في أي وقت.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleSaveSection("stories")}
                disabled={savingSection !== null}
                className="px-3.5 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-black text-xs shadow-md shadow-pink-600/20 flex items-center gap-1.5 transition disabled:opacity-50"
              >
                {savingSection === "stories" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                ) : (
                  <Save className="w-3.5 h-3.5 text-white" />
                )}
                <span>حفظ القصص 💾</span>
              </button>

              <div className="flex items-center gap-2 pr-2 border-r border-pink-500/30">
                <span className="text-xs font-bold text-gray-300">
                  {settings.ad_stories_enabled === "true" ? "مفعلة ✅" : "معطلة ❌"}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    handleChange(
                      "ad_stories_enabled",
                      settings.ad_stories_enabled === "true" ? "false" : "true"
                    )
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.ad_stories_enabled === "true" ? "bg-pink-600" : "bg-gray-700"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.ad_stories_enabled === "true" ? "translate-x-1" : "translate-x-6"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* DIMENSION & DESIGN GUIDE BADGE */}
          <div className="p-3.5 rounded-xl bg-pink-950/30 border border-pink-500/40 text-xs space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="p-1 rounded bg-pink-500/20 text-pink-300 font-black flex items-center gap-1">
                <Ratio className="w-3.5 h-3.5" />
                <span>المقاس الموصى به:</span>
              </span>
              <span className="font-mono font-black text-white bg-black/60 px-2 py-0.5 rounded border border-pink-500/40">
                صورة القصة: 1080 × 1920 بكسل (9:16)
              </span>
              <span className="font-mono font-black text-pink-300 bg-black/60 px-2 py-0.5 rounded border border-pink-500/40">
                الأيقونة الدائرية: 500 × 500 بكسل (1:1)
              </span>
            </div>
            <p className="text-[11px] text-pink-200/80 leading-relaxed">
              💡 <strong>نصيحة التصميم:</strong> تُعرض الدائرة بمقاس 58 بكسل في الشريط العلوي بنمط إنستغرام وسناب شات. وعند الضغط عليها يفتح الرابط الخارجي فوراً.
            </p>
          </div>

          {/* Stories List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-pink-300">
                قائمة قصص الرعاة الحالية ({stories.length}):
              </span>
              <button
                type="button"
                onClick={addStory}
                className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-black text-xs flex items-center gap-1.5 transition shadow-lg shadow-pink-600/20"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة قصة راعي جديدة (12 ساعة) +</span>
              </button>
            </div>

            {stories.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-[#0a0d13] border border-dashed border-pink-500/30 space-y-3">
                <p className="text-xs text-pink-200/80 font-bold">لا توجد أي قصص رعاة حالياً (شريط القصص مخفي من المتجر تلقائياً).</p>
                <p className="text-[11px] text-gray-400">عند إنشاء قصة جديدة ستظهر في المتجر لمدة 12 ساعة وتختفي تلقائياً، أو يمكنك حذفها في أي وقت.</p>
                <button
                  type="button"
                  onClick={addStory}
                  className="px-4 py-2 rounded-xl bg-pink-600 text-white font-black text-xs inline-flex items-center gap-1.5 shadow-md shadow-pink-600/20"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة أول قصة راعي الآن (12 ساعة)</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stories.map((story: any, idx: number) => {
                const now = Date.now();
                const createdAt = Number(story.createdAt) || now;
                const durationHours = Number(story.durationHours) || 12;
                const elapsedMs = now - createdAt;
                const totalMs = durationHours * 3600 * 1000;
                const remainingMs = Math.max(0, totalMs - elapsedMs);
                const remainingHours = Math.floor(remainingMs / (3600 * 1000));
                const remainingMins = Math.floor((remainingMs % (3600 * 1000)) / (60 * 1000));
                const isExpired = remainingMs === 0;

                return (
                  <div
                    key={story.id || idx}
                    className={`p-4 rounded-2xl bg-[#0f1218] border transition space-y-3.5 relative ${
                      isExpired ? "border-red-500/40 opacity-75" : "border-pink-500/40"
                    }`}
                  >
                    {/* Story Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {/* Circular Avatar Preview */}
                        <div
                          style={{ width: 44, height: 44, minWidth: 44, minHeight: 44 }}
                          className="rounded-full p-[2px] bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 flex items-center justify-center shrink-0"
                        >
                          <img
                            src={story.image}
                            alt={story.name}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            className="rounded-full"
                          />
                        </div>
                        <span className="text-xs font-black text-white truncate max-w-[120px]">
                          {story.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => renewStory(idx)}
                          title="تجديد لـ 12 ساعة إضافية من الآن"
                          className="p-1.5 rounded-lg bg-pink-600/20 text-pink-300 hover:bg-pink-600 hover:text-white border border-pink-500/30 text-xs flex items-center gap-1"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setStories(stories.filter((_: any, i: number) => i !== idx));
                            toast.info("تم حذف القصة يدوياً.");
                          }}
                          title="حذف القصة الآن"
                          className="p-1.5 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white border border-red-500/30 text-xs"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Expiration Timer Indicator */}
                    <div className="flex items-center justify-between text-[11px] p-2 rounded-xl bg-[#161b24] border border-gray-800">
                      <span className="text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-pink-400" />
                        <span>الوقت المتبقي:</span>
                      </span>
                      {isExpired ? (
                        <span className="font-bold text-red-400">
                          منتهية الصلاحية ⏱️ (مخفية تلقائياً)
                        </span>
                      ) : (
                        <span className="font-bold text-emerald-400 font-mono">
                          {remainingHours}س {remainingMins}د
                        </span>
                      )}
                    </div>

                    {/* Fields */}
                    <div className="space-y-2 text-right">
                      <div>
                        <label className="block text-[11px] text-gray-400 mb-0.5">اسم الراعي / المتجر</label>
                        <input
                          type="text"
                          value={story.name || ""}
                          onChange={(e) => {
                            const updated = [...stories];
                            updated[idx].name = e.target.value;
                            setStories(updated);
                          }}
                          className="w-full px-2.5 py-1.5 bg-[#161b24] border border-gray-700 rounded-lg text-xs text-white text-right"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-gray-400 mb-0.5">رابط التحويل</label>
                        <input
                          type="text"
                          placeholder="https://..."
                          value={story.link || ""}
                          onChange={(e) => {
                            const updated = [...stories];
                            updated[idx].link = e.target.value;
                            setStories(updated);
                          }}
                          className="w-full px-2.5 py-1.5 bg-[#161b24] border border-gray-700 rounded-lg text-xs text-white text-left font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-gray-400 mb-0.5">صورة الراعي (Avatar)</label>
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            value={story.image || ""}
                            onChange={(e) => {
                              const updated = [...stories];
                              updated[idx].image = e.target.value;
                              setStories(updated);
                            }}
                            className="flex-1 px-2.5 py-1.5 bg-[#161b24] border border-gray-700 rounded-lg text-xs text-white text-left font-mono"
                          />
                          <label className="px-2.5 py-1.5 rounded-lg bg-pink-600/20 text-pink-300 hover:bg-pink-600 hover:text-white font-bold text-xs cursor-pointer flex items-center gap-1 shrink-0 border border-pink-500/40">
                            {uploadingKey === `story_img_${idx}` ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Upload className="w-3.5 h-3.5" />
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              disabled={uploadingKey !== null}
                              onChange={(e) =>
                                handleFileUpload(
                                  (url) => {
                                    const updated = [...stories];
                                    updated[idx].image = url;
                                    setStories(updated);
                                  },
                                  e,
                                  `story_img_${idx}`
                                )
                              }
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =============================================================
          SECTION 3: TOP PANORAMA BAR (CYAN/SKY THEME)
         ============================================================= */}
      {(activeSubTab === "ALL" || activeSubTab === "TOP") && (
        <div className="p-6 rounded-2xl bg-gradient-to-b from-[#08181c] to-[#12161f] border-2 border-cyan-500/60 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-cyan-500/30 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                  <Megaphone className="w-5 h-5" />
                </span>
                <h3 className="text-base font-black text-cyan-300">
                  3. شريط البانوراما الإعلاني العلوي (Top Panorama Banner)
                </h3>
              </div>
              <p className="text-xs text-gray-300">
                شريط ترويجي عريض بأعلى الموقع، يدعم عدة إعلانات تتبدل تلقائياً كل 4.5 ثوانٍ مع أزرار تحويل وخيار الإغلاق.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleSaveSection("top")}
                disabled={savingSection !== null}
                className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs shadow-md shadow-cyan-600/20 flex items-center gap-1.5 transition disabled:opacity-50"
              >
                {savingSection === "top" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                ) : (
                  <Save className="w-3.5 h-3.5 text-white" />
                )}
                <span>حفظ الشريط العلوي 💾</span>
              </button>

              <div className="flex items-center gap-2 pr-2 border-r border-cyan-500/30">
                <span className="text-xs font-bold text-gray-300">
                  {settings.ad_top_enabled === "true" ? "مفعل ✅" : "معطل ❌"}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    handleChange(
                      "ad_top_enabled",
                      settings.ad_top_enabled === "true" ? "false" : "true"
                    )
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.ad_top_enabled === "true" ? "bg-cyan-600" : "bg-gray-700"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.ad_top_enabled === "true" ? "translate-x-1" : "translate-x-6"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* DIMENSION & DESIGN GUIDE BADGE */}
          <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/40 text-xs space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="p-1 rounded bg-cyan-500/20 text-cyan-300 font-black flex items-center gap-1">
                <Ratio className="w-3.5 h-3.5" />
                <span>المقاس الموصى به:</span>
              </span>
              <span className="font-mono font-black text-white bg-black/60 px-2 py-0.5 rounded border border-cyan-500/40">
                1200 × 100 بكسل
              </span>
              <span className="text-gray-300 text-[11px]">
                (أو 1920 × 120 بكسل - شريط نحيف بانورامي فائق العرض 10:1 أو نصوص مع زر تحويل)
              </span>
            </div>
            <p className="text-[11px] text-cyan-200/80 leading-relaxed">
              💡 <strong>نصيحة الاستخدام:</strong> ممتاز للتنبيهات العاجلة، إعلانات السيرفرات، عروض الشحن، وقنوات التليجرام.
            </p>
          </div>

          {/* Top Ads List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-cyan-300">
                الإعلانات المضافة للشريط العلوي ({topAds.length}):
              </span>
              <button
                type="button"
                onClick={addTopAd}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs flex items-center gap-1.5 transition shadow-lg shadow-cyan-600/20"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة إعلان جديد للشريط العلوي +</span>
              </button>
            </div>

            <div className="space-y-3">
              {topAds.map((item: any, idx: number) => (
                <div
                  key={item.id || idx}
                  className="p-4 rounded-xl bg-[#0f1218] border border-cyan-500/30 space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-xs font-mono font-bold">
                        #{idx + 1}
                      </span>
                      <span className="text-xs font-bold text-white">
                        {item.badge || item.text?.substring(0, 30) || "إعلان علوي"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...topAds];
                          updated[idx].enabled = !updated[idx].enabled;
                          setTopAds(updated);
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          item.enabled !== false
                            ? "bg-emerald-950/40 text-emerald-400 border-emerald-500/40"
                            : "bg-red-950/40 text-red-400 border-red-500/40"
                        }`}
                      >
                        {item.enabled !== false ? "نشط" : "معطل"}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          
                          setTopAds(topAds.filter((_: any, i: number) => i !== idx));
                          toast.info("تم حذف الإعلان.");
                        }}
                        className="p-1 rounded bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white border border-red-500/30 text-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-right">
                    <div>
                      <label className="block text-[11px] text-gray-400 mb-0.5">شارة الإعلان (Badge)</label>
                      <input
                        type="text"
                        placeholder="عرض اليوم ⚡"
                        value={item.badge || ""}
                        onChange={(e) => {
                          const updated = [...topAds];
                          updated[idx].badge = e.target.value;
                          setTopAds(updated);
                        }}
                        className="w-full px-2.5 py-1.5 bg-[#161b24] border border-gray-700 rounded-lg text-xs text-white text-right"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-gray-400 mb-0.5">نص زر التحويل (CTA)</label>
                      <input
                        type="text"
                        placeholder="انضم الآن ↗"
                        value={item.cta || ""}
                        onChange={(e) => {
                          const updated = [...topAds];
                          updated[idx].cta = e.target.value;
                          setTopAds(updated);
                        }}
                        className="w-full px-2.5 py-1.5 bg-[#161b24] border border-gray-700 rounded-lg text-xs text-white text-right"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-gray-400 mb-0.5">رابط التحويل</label>
                      <input
                        type="text"
                        placeholder="https://..."
                        value={item.link || ""}
                        onChange={(e) => {
                          const updated = [...topAds];
                          updated[idx].link = e.target.value;
                          setTopAds(updated);
                        }}
                        className="w-full px-2.5 py-1.5 bg-[#161b24] border border-gray-700 rounded-lg text-xs text-white text-left font-mono"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-[11px] text-gray-400 mb-0.5">النص الترويجي للشريط</label>
                      <input
                        type="text"
                        placeholder="انضم لأقوى عروض السيرفرات والسيارات الآن!"
                        value={item.text || ""}
                        onChange={(e) => {
                          const updated = [...topAds];
                          updated[idx].text = e.target.value;
                          setTopAds(updated);
                        }}
                        className="w-full px-3 py-2 bg-[#161b24] border border-gray-700 rounded-lg text-xs text-white text-right"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =============================================================
          SECTION 4: MID LEADERBOARD (EMERALD THEME)
         ============================================================= */}
      {(activeSubTab === "ALL" || activeSubTab === "MID") && (
        <div className="p-6 rounded-2xl bg-gradient-to-b from-[#081c12] to-[#12161f] border-2 border-emerald-500/60 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-500/30 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  <Layers className="w-5 h-5" />
                </span>
                <h3 className="text-base font-black text-emerald-300">
                  4. البانر الإعلاني الأوسط بين الأقسام (Mid Leaderboard Banner)
                </h3>
              </div>
              <p className="text-xs text-gray-300">
                بانر مستطيل عريض وجذاب يتوسط المنتجات وسلايدرات السيارات، يدعم عدة إعلانات ورعاة مع التبديل التلقائي.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleSaveSection("mid")}
                disabled={savingSection !== null}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition disabled:opacity-50"
              >
                {savingSection === "mid" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                ) : (
                  <Save className="w-3.5 h-3.5 text-white" />
                )}
                <span>حفظ البانر الأوسط 💾</span>
              </button>

              <div className="flex items-center gap-2 pr-2 border-r border-emerald-500/30">
                <span className="text-xs font-bold text-gray-300">
                  {settings.ad_mid_enabled === "true" ? "مفعل ✅" : "معطل ❌"}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    handleChange(
                      "ad_mid_enabled",
                      settings.ad_mid_enabled === "true" ? "false" : "true"
                    )
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.ad_mid_enabled === "true" ? "bg-emerald-600" : "bg-gray-700"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.ad_mid_enabled === "true" ? "translate-x-1" : "translate-x-6"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* DIMENSION & DESIGN GUIDE BADGE */}
          <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-xs space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="p-1 rounded bg-emerald-500/20 text-emerald-300 font-black flex items-center gap-1">
                <Ratio className="w-3.5 h-3.5" />
                <span>المقاس الموصى به:</span>
              </span>
              <span className="font-mono font-black text-white bg-black/60 px-2 py-0.5 rounded border border-emerald-500/40">
                1200 × 300 بكسل
              </span>
              <span className="text-gray-300 text-[11px]">
                (أو 900 × 250 بكسل - نسبة مستطيل عريض 4:1 يملأ العرض بانسيابية)
              </span>
            </div>
            <p className="text-[11px] text-emerald-200/80 leading-relaxed">
              💡 <strong>نصيحة التصميم:</strong> ضع محتوى الإعلان بخلفية غامقة أو صورة سيارة مشوقة لجذب الزائر أثناء تصفحه لمنتجات المتجر.
            </p>
          </div>

          {/* Mid Banners List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-emerald-300">
                الإعلانات المضافة للبانر الأوسط ({midBanners.length}):
              </span>
              <button
                type="button"
                onClick={addMidBanner}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 transition shadow-lg shadow-emerald-600/20"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة بانر جديد +</span>
              </button>
            </div>

            <div className="space-y-4">
              {midBanners.map((item: any, idx: number) => (
                <div
                  key={item.id || idx}
                  className="p-5 rounded-2xl bg-[#0f1218] border border-emerald-500/30 space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-xs font-mono font-bold">
                        #{idx + 1}
                      </span>
                      <span className="text-xs font-bold text-white">
                        {item.title || "بانر أوسط"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...midBanners];
                          updated[idx].enabled = !updated[idx].enabled;
                          setMidBanners(updated);
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          item.enabled !== false
                            ? "bg-emerald-950/40 text-emerald-400 border-emerald-500/40"
                            : "bg-red-950/40 text-red-400 border-red-500/40"
                        }`}
                      >
                        {item.enabled !== false ? "نشط" : "معطل"}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          
                          setMidBanners(midBanners.filter((_: any, i: number) => i !== idx));
                          toast.info("تم حذف البانر.");
                        }}
                        className="p-1 rounded bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white border border-red-500/30 text-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Image & URL */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                    <div className="md:col-span-2 space-y-1.5">
                      <label className="block text-xs font-bold text-gray-300">صورة البانر</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={item.image || ""}
                          onChange={(e) => {
                            const updated = [...midBanners];
                            updated[idx].image = e.target.value;
                            setMidBanners(updated);
                          }}
                          className="flex-1 px-3 py-2 bg-[#161b24] border border-gray-700 rounded-xl text-xs text-white text-left font-mono"
                        />
                        <label className="px-3 py-2 rounded-xl bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600 hover:text-white font-bold text-xs cursor-pointer flex items-center gap-1 shrink-0 border border-emerald-500/40">
                          {uploadingKey === `mid_img_${idx}` ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Upload className="w-4 h-4" />
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={uploadingKey !== null}
                            onChange={(e) =>
                              handleFileUpload(
                                (url) => {
                                  const updated = [...midBanners];
                                  updated[idx].image = url;
                                  setMidBanners(updated);
                                },
                                e,
                                `mid_img_${idx}`
                              )
                            }
                          />
                        </label>
                      </div>
                    </div>

                    <div className="h-20 rounded-xl border border-gray-800 bg-black/40 overflow-hidden relative flex items-center justify-center">
                      {item.image ? (
                        <img src={item.image} alt="Mid Preview" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[10px] text-gray-500">لا توجد صورة</span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-right">
                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-1">عنوان البانر</label>
                      <input
                        type="text"
                        value={item.title || ""}
                        onChange={(e) => {
                          const updated = [...midBanners];
                          updated[idx].title = e.target.value;
                          setMidBanners(updated);
                        }}
                        className="w-full px-3 py-2 bg-[#161b24] border border-gray-700 rounded-xl text-xs text-white text-right"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-1">نص زر التحويل</label>
                      <input
                        type="text"
                        value={item.cta || ""}
                        onChange={(e) => {
                          const updated = [...midBanners];
                          updated[idx].cta = e.target.value;
                          setMidBanners(updated);
                        }}
                        className="w-full px-3 py-2 bg-[#161b24] border border-gray-700 rounded-xl text-xs text-white text-right"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-1">رابط التحويل</label>
                      <input
                        type="text"
                        value={item.link || ""}
                        onChange={(e) => {
                          const updated = [...midBanners];
                          updated[idx].link = e.target.value;
                          setMidBanners(updated);
                        }}
                        className="w-full px-3 py-2 bg-[#161b24] border border-gray-700 rounded-xl text-xs text-white text-left font-mono"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-xs font-bold text-gray-300 mb-1">الوصف الفرعي للبانر</label>
                      <input
                        type="text"
                        value={item.desc || ""}
                        onChange={(e) => {
                          const updated = [...midBanners];
                          updated[idx].desc = e.target.value;
                          setMidBanners(updated);
                        }}
                        className="w-full px-3 py-2 bg-[#161b24] border border-gray-700 rounded-xl text-xs text-white text-right"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =============================================================
          SECTION 5: IN-FEED PRODUCT CARD (ROSE/RED THEME)
         ============================================================= */}
      {(activeSubTab === "ALL" || activeSubTab === "FEED") && (
        <div className="p-6 rounded-2xl bg-gradient-to-b from-[#1c080e] to-[#12161f] border-2 border-rose-500/60 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rose-500/30 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/40">
                  <Flame className="w-5 h-5" />
                </span>
                <h3 className="text-base font-black text-rose-300">
                  5. بطاقة المنتجات الترويجية المدمجة (In-Feed Sponsor Card)
                </h3>
              </div>
              <p className="text-xs text-gray-300">
                تظهر كبطاقة منتج راعي VIP مدمجة بشكل احترافي وسلس داخل شبكة منتجات وسيارات المتجر لجذب أعلى نسبة نقرات.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleSaveSection("feed")}
                disabled={savingSection !== null}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-md shadow-rose-600/20 flex items-center gap-1.5 transition disabled:opacity-50"
              >
                {savingSection === "feed" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                ) : (
                  <Save className="w-3.5 h-3.5 text-white" />
                )}
                <span>حفظ بطاقة المنتجات 💾</span>
              </button>

              <div className="flex items-center gap-2 pr-2 border-r border-rose-500/30">
                <span className="text-xs font-bold text-gray-300">
                  {settings.ad_feed_enabled === "true" ? "مفعلة ✅" : "معطلة ❌"}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    handleChange(
                      "ad_feed_enabled",
                      settings.ad_feed_enabled === "true" ? "false" : "true"
                    )
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.ad_feed_enabled === "true" ? "bg-rose-600" : "bg-gray-700"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.ad_feed_enabled === "true" ? "translate-x-1" : "translate-x-6"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* DIMENSION & DESIGN GUIDE BADGE */}
          <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/40 text-xs space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="p-1 rounded bg-rose-500/20 text-rose-300 font-black flex items-center gap-1">
                <Ratio className="w-3.5 h-3.5" />
                <span>المقاس الموصى به:</span>
              </span>
              <span className="font-mono font-black text-white bg-black/60 px-2 py-0.5 rounded border border-rose-500/40">
                600 × 750 بكسل
              </span>
              <span className="text-gray-300 text-[11px]">
                (أو 400 × 500 بكسل - نسبة عمودية 4:5 متطابقة مع حجم بطاقات كروت السيارات في المتجر)
              </span>
            </div>
            <p className="text-[11px] text-rose-200/80 leading-relaxed">
              💡 <strong>نصيحة التصميم:</strong> صمم البطاقة لتبدو كعرض VIP حصري يحتوي على صورة سيارة أو شعار سيرفر مع نص دعائي محفز.
            </p>
          </div>

          {/* Feed Cards List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-rose-300">
                البطاقات المضافة ({feedCards.length}):
              </span>
              <button
                type="button"
                onClick={addFeedCard}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs flex items-center gap-1.5 transition shadow-lg shadow-rose-600/20"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة بطاقة راعي جديدة +</span>
              </button>
            </div>

            <div className="space-y-4">
              {feedCards.map((item: any, idx: number) => (
                <div
                  key={item.id || idx}
                  className="p-5 rounded-2xl bg-[#0f1218] border border-rose-500/30 space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-xs font-mono font-bold">
                        #{idx + 1}
                      </span>
                      <span className="text-xs font-bold text-white">
                        {item.title || "بطاقة منتجات ترويجية"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...feedCards];
                          updated[idx].enabled = !updated[idx].enabled;
                          setFeedCards(updated);
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          item.enabled !== false
                            ? "bg-emerald-950/40 text-emerald-400 border-emerald-500/40"
                            : "bg-red-950/40 text-red-400 border-red-500/40"
                        }`}
                      >
                        {item.enabled !== false ? "نشط" : "معطل"}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          
                          setFeedCards(feedCards.filter((_: any, i: number) => i !== idx));
                          toast.info("تم حذف البطاقة.");
                        }}
                        className="p-1 rounded bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white border border-red-500/30 text-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Image & URL */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                    <div className="md:col-span-2 space-y-1.5">
                      <label className="block text-xs font-bold text-gray-300">صورة البطاقة</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={item.image || ""}
                          onChange={(e) => {
                            const updated = [...feedCards];
                            updated[idx].image = e.target.value;
                            setFeedCards(updated);
                          }}
                          className="flex-1 px-3 py-2 bg-[#161b24] border border-gray-700 rounded-xl text-xs text-white text-left font-mono"
                        />
                        <label className="px-3 py-2 rounded-xl bg-rose-600/20 text-rose-300 hover:bg-rose-600 hover:text-white font-bold text-xs cursor-pointer flex items-center gap-1 shrink-0 border border-rose-500/40">
                          {uploadingKey === `feed_img_${idx}` ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Upload className="w-4 h-4" />
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={uploadingKey !== null}
                            onChange={(e) =>
                              handleFileUpload(
                                (url) => {
                                  const updated = [...feedCards];
                                  updated[idx].image = url;
                                  setFeedCards(updated);
                                },
                                e,
                                `feed_img_${idx}`
                              )
                            }
                          />
                        </label>
                      </div>
                    </div>

                    <div className="h-20 rounded-xl border border-gray-800 bg-black/40 overflow-hidden relative flex items-center justify-center">
                      {item.image ? (
                        <img src={item.image} alt="Feed Preview" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[10px] text-gray-500">لا توجد صورة</span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-right">
                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-1">شارة البطاقة (Badge)</label>
                      <input
                        type="text"
                        placeholder="SPONSORED STORE 💎"
                        value={item.badge || ""}
                        onChange={(e) => {
                          const updated = [...feedCards];
                          updated[idx].badge = e.target.value;
                          setFeedCards(updated);
                        }}
                        className="w-full px-3 py-2 bg-[#161b24] border border-gray-700 rounded-xl text-xs text-white text-right"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-1">عنوان البطاقة</label>
                      <input
                        type="text"
                        value={item.title || ""}
                        onChange={(e) => {
                          const updated = [...feedCards];
                          updated[idx].title = e.target.value;
                          setFeedCards(updated);
                        }}
                        className="w-full px-3 py-2 bg-[#161b24] border border-gray-700 rounded-xl text-xs text-white text-right"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-1">نص زر التحويل</label>
                      <input
                        type="text"
                        value={item.cta || ""}
                        onChange={(e) => {
                          const updated = [...feedCards];
                          updated[idx].cta = e.target.value;
                          setFeedCards(updated);
                        }}
                        className="w-full px-3 py-2 bg-[#161b24] border border-gray-700 rounded-xl text-xs text-white text-right"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-gray-300 mb-1">الوصف الفرعي للبطاقة</label>
                      <input
                        type="text"
                        value={item.desc || ""}
                        onChange={(e) => {
                          const updated = [...feedCards];
                          updated[idx].desc = e.target.value;
                          setFeedCards(updated);
                        }}
                        className="w-full px-3 py-2 bg-[#161b24] border border-gray-700 rounded-xl text-xs text-white text-right"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-1">رابط التحويل</label>
                      <input
                        type="text"
                        value={item.link || ""}
                        onChange={(e) => {
                          const updated = [...feedCards];
                          updated[idx].link = e.target.value;
                          setFeedCards(updated);
                        }}
                        className="w-full px-3 py-2 bg-[#161b24] border border-gray-700 rounded-xl text-xs text-white text-left font-mono"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =============================================================
          SECTION 6: MOBILE STICKY BAR (ORANGE THEME)
         ============================================================= */}
      {(activeSubTab === "ALL" || activeSubTab === "MOBILE") && (
        <div className="p-6 rounded-2xl bg-gradient-to-b from-[#1c1208] to-[#12161f] border-2 border-orange-500/60 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-orange-500/30 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/40">
                  <Smartphone className="w-5 h-5" />
                </span>
                <h3 className="text-base font-black text-orange-300">
                  6. شريط الإعلانات العائم للهواتف الذكية (Mobile Floating Sticky Bar)
                </h3>
              </div>
              <p className="text-xs text-gray-300">
                شريط عائم يظهر في أسفل شاشات الموبايل فقط، خفيف وسريع ويدعم عدة إعلانات مع زر إغلاق لتجربة مستخدم مريحة.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleSaveSection("mobile")}
                disabled={savingSection !== null}
                className="px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black text-xs shadow-md shadow-orange-600/20 flex items-center gap-1.5 transition disabled:opacity-50"
              >
                {savingSection === "mobile" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                ) : (
                  <Save className="w-3.5 h-3.5 text-white" />
                )}
                <span>حفظ شريط الموبايل 💾</span>
              </button>

              <div className="flex items-center gap-2 pr-2 border-r border-orange-500/30">
                <span className="text-xs font-bold text-gray-300">
                  {settings.ad_mobile_bar_enabled === "true" ? "مفعل ✅" : "معطل ❌"}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    handleChange(
                      "ad_mobile_bar_enabled",
                      settings.ad_mobile_bar_enabled === "true" ? "false" : "true"
                    )
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.ad_mobile_bar_enabled === "true" ? "bg-orange-600" : "bg-gray-700"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.ad_mobile_bar_enabled === "true" ? "translate-x-1" : "translate-x-6"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* DIMENSION & DESIGN GUIDE BADGE */}
          <div className="p-3.5 rounded-xl bg-orange-950/30 border border-orange-500/40 text-xs space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="p-1 rounded bg-orange-500/20 text-orange-300 font-black flex items-center gap-1">
                <Ratio className="w-3.5 h-3.5" />
                <span>المقاس وطريقة العرض:</span>
              </span>
              <span className="font-mono font-black text-white bg-black/60 px-2 py-0.5 rounded border border-orange-500/40">
                نصوص مختصرة ذكية + زر CTA تحويل
              </span>
            </div>
            <p className="text-[11px] text-orange-200/80 leading-relaxed">
              💡 <strong>نصيحة الاستخدام:</strong> يظهر بارتفاع 44 بكسل فقط لعدم حجب محتوى المتجر، مع تأثير وميض وزر إغلاق مرن.
            </p>
          </div>

          {/* Mobile Ads List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-orange-300">
                الإعلانات المضافة للشريط ({mobileAds.length}):
              </span>
              <button
                type="button"
                onClick={addMobileAd}
                className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black text-xs flex items-center gap-1.5 transition shadow-lg shadow-orange-600/20"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة إعلان موبايل جديد +</span>
              </button>
            </div>

            <div className="space-y-3">
              {mobileAds.map((item: any, idx: number) => (
                <div
                  key={item.id || idx}
                  className="p-4 rounded-xl bg-[#0f1218] border border-orange-500/30 space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-orange-500/20 text-orange-300 text-xs font-mono font-bold">
                        #{idx + 1}
                      </span>
                      <span className="text-xs font-bold text-white">
                        {item.badge || item.text?.substring(0, 30) || "إعلان موبايل"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...mobileAds];
                          updated[idx].enabled = !updated[idx].enabled;
                          setMobileAds(updated);
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          item.enabled !== false
                            ? "bg-emerald-950/40 text-emerald-400 border-emerald-500/40"
                            : "bg-red-950/40 text-red-400 border-red-500/40"
                        }`}
                      >
                        {item.enabled !== false ? "نشط" : "معطل"}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          
                          setMobileAds(mobileAds.filter((_: any, i: number) => i !== idx));
                          toast.info("تم حذف الإعلان.");
                        }}
                        className="p-1 rounded bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white border border-red-500/30 text-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-right">
                    <div>
                      <label className="block text-[11px] text-gray-400 mb-0.5">شارة الإعلان (Badge)</label>
                      <input
                        type="text"
                        placeholder="إعلان مميز 🔥"
                        value={item.badge || ""}
                        onChange={(e) => {
                          const updated = [...mobileAds];
                          updated[idx].badge = e.target.value;
                          setMobileAds(updated);
                        }}
                        className="w-full px-2.5 py-1.5 bg-[#161b24] border border-gray-700 rounded-lg text-xs text-white text-right"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-gray-400 mb-0.5">رابط التحويل</label>
                      <input
                        type="text"
                        placeholder="https://..."
                        value={item.link || ""}
                        onChange={(e) => {
                          const updated = [...mobileAds];
                          updated[idx].link = e.target.value;
                          setMobileAds(updated);
                        }}
                        className="w-full px-2.5 py-1.5 bg-[#161b24] border border-gray-700 rounded-lg text-xs text-white text-left font-mono"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] text-gray-400 mb-0.5">النص الترويجي للشريط</label>
                      <input
                        type="text"
                        placeholder="انضم لأقوى عروض السيرفرات والسيارات الآن!"
                        value={item.text || ""}
                        onChange={(e) => {
                          const updated = [...mobileAds];
                          updated[idx].text = e.target.value;
                          setMobileAds(updated);
                        }}
                        className="w-full px-3 py-2 bg-[#161b24] border border-gray-700 rounded-lg text-xs text-white text-right"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =============================================================
          SECTION 7: WHATSAPP DIRECT BOOKING (GREEN THEME)
         ============================================================= */}
      {(activeSubTab === "ALL" || activeSubTab === "WHATSAPP") && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-green-950/40 via-[#12161f] to-emerald-950/30 border-2 border-green-500/60 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-green-500/30 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-green-500/20 text-green-400 border border-green-500/40">
                  <Phone className="w-5 h-5" />
                </span>
                <h3 className="text-base font-black text-green-300">
                  7. مركز واتساب حجز الإعلانات والتواصل مع الرعاة
                </h3>
              </div>
              <p className="text-xs text-gray-300">
                الرقم الموحد الذي يتم تحويل كافة الزوار والمعلنين إليه فوراً عند الضغط على أزرار &quot;أعلن هنا 💎&quot; أو &quot;+ أعلن هنا&quot; أو حجز مساحة.
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleSaveSection("whatsapp")}
              disabled={savingSection !== null}
              className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white font-black text-xs shadow-md shadow-green-600/20 flex items-center gap-1.5 transition disabled:opacity-50 shrink-0"
            >
              {savingSection === "whatsapp" ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Save className="w-4 h-4 text-white" />
              )}
              <span>حفظ رقم الواتساب 💾</span>
            </button>
          </div>

          <div className="w-full sm:w-80 space-y-1.5">
            <label className="block text-xs font-bold text-green-300">
              رقم واتساب استلام طلبات الإعلانات
            </label>
            <input
              type="text"
              placeholder="01288212101"
              value={settings.ad_booking_whatsapp || "01288212101"}
              onChange={(e) => handleChange("ad_booking_whatsapp", e.target.value)}
              className="w-full px-3 py-2 bg-[#0f1218] border border-green-500/40 rounded-xl text-xs text-white text-left font-mono focus:border-green-400"
            />
            <span className="text-[10px] text-gray-400 block">
              اكتب الرقم بالصيغة المحلية (01288212101) وسيتم توليد رابط الواتساب الدولي تلقائياً.
            </span>
          </div>
        </div>
      )}

      {/* Sticky Bottom Actions Bar for Instant Application */}
      <div className="sticky bottom-4 z-30 p-4 rounded-2xl bg-[#121620]/95 backdrop-blur-md border border-amber-500/40 shadow-[0_10px_30px_rgba(0,0,0,0.8)] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-3 h-3 rounded-full ${
              hasChanges ? "bg-amber-400 animate-pulse" : "bg-emerald-400"
            }`}
          />
          <span className="text-xs font-bold text-gray-200">
            {hasChanges
              ? "⚠️ توجد تعديلات إعلانية جديدة بانتظار الاعتماد والحفظ"
              : "✅ كافة المساحات الإعلانية نشطة ومطابقة للواجهة الحية"}
          </span>
        </div>

        <button
          type="button"
          onClick={() => handleSaveSection("all")}
          disabled={savingSection !== null}
          className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-400 hover:to-red-400 text-black font-black text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition disabled:opacity-50"
        >
          {savingSection === "all" ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-black" />
              <span>جاري الحفظ والتطبيق الشامل...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4 text-black" />
              <span>حفظ جميع المساحات الإعلانية ⚡</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
