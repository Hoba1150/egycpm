"use client";

import React, { useState, useTransition } from "react";
import { sendPushBroadcastAction } from "@/lib/actions/push";
import { toast } from "sonner";
import {
  Bell,
  BellRing,
  Send,
  Sparkles,
  Smartphone,
  Layers,
  Image as ImageIcon,
  ExternalLink,
  Upload,
  CheckCircle2,
  Users,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Tag,
  Gift,
  Flame,
  Zap,
} from "lucide-react";

interface PushBroadcastClientProps {
  initialStats: {
    totalCount: number;
    recentSubs: any[];
  };
}

export default function PushBroadcastClient({ initialStats }: PushBroadcastClientProps) {
  const [stats, setStats] = useState(initialStats);
  const [isPending, startTransition] = useTransition();

  // Campaign state
  const [title, setTitle] = useState("🔥 سيارة بوجاتي نادرة متوفرة الآن بالمتجر!");
  const [body, setBody] = useState("خصم 30% لأول 5 مشترين فقط! اضغط هنا واطلب سيارتك واستلمها فوراً في دقائق 🚗⚡");
  const [url, setUrl] = useState("/shop");
  const [image, setImage] = useState("https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800");
  const [uploadingImage, setUploadingImage] = useState(false);

  // Quick Templates
  const applyTemplate = (t: { title: string; body: string; url: string; image?: string }) => {
    setTitle(t.title);
    setBody(t.body);
    setUrl(t.url);
    if (t.image) setImage(t.image);
    toast.success("تم تطبيق القالب بنجاح!");
  };

  const templates = [
    {
      name: "⚡ عرض سيارة نادرة",
      icon: Flame,
      color: "border-amber-500/40 text-amber-300 bg-amber-950/20",
      title: "🔥 سيارة بوجاتي نادرة متوفرة الآن بالمتجر!",
      body: "خصم 30% لأول 5 مشترين فقط! اضغط هنا واطلب سيارتك واستلمها فوراً في دقائق 🚗⚡",
      url: "/shop",
      image: "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800",
    },
    {
      name: "🎁 سحب كوينز وجوائز",
      icon: Gift,
      color: "border-purple-500/40 text-purple-300 bg-purple-950/20",
      title: "🎉 بدء سحب أسبوعي على 10,000 كوينز مجاناً!",
      body: "سارع بالدخول والمشاركة برقم هاتفك أو أيدي حسابك وكن أحد الفائزين الكبار بالجوائز!",
      url: "/giveaways",
      image: "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=800",
    },
    {
      name: "🎟️ كود خصم حصري",
      icon: Tag,
      color: "border-emerald-500/40 text-emerald-300 bg-emerald-950/20",
      title: "🎟️ كود خصم جديد متاح الآن: VIP30",
      body: "استخدم الكود عند الدفع واحصل على خصم فوري على كافة سيارات وخدمات CPM 2!",
      url: "/cpm2",
      image: "",
    },
    {
      name: "🚗 سيارات وتحديث جديد",
      icon: Zap,
      color: "border-cyan-500/40 text-cyan-300 bg-cyan-950/20",
      title: "🚗 توفر محركات 1695HP وتصاميم فينيل جديدة!",
      body: "تم تحديث جراج المتجر بأقوى الموديلات والتصاميم الحصرية الجاهزة للتسليم الفوري.",
      url: "/cpm2",
      image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800",
    },
  ];

  // Image Upload helper
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setUploadingImage(true);
    toast.loading("جاري رفع صورة الإشعار...", { id: "upload-push" });
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.message || "فشل الرفع");
      setImage(data.url);
      toast.success("تم رفع صورة الإشعار بنجاح! 📸", { id: "upload-push" });
    } catch (err: any) {
      toast.error(err.message || "فشل رفع الصورة", { id: "upload-push" });
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  const handleSendBroadcast = () => {
    if (!title.trim() || !body.trim()) {
      toast.error("يرجى كتابة عنوان الإشعار ونص الرسالة.");
      return;
    }

    if (stats.totalCount === 0) {
      toast.warning("لا يوجد أي أجهزة مشتركة حالياً لإرسال الإشعار إليها.");
      return;
    }

    const confirmSend = window.confirm(
      `هل أنت متأكد من إرسال هذا الإشعار الآن إلى كافة الأجهزة المشتركة (${stats.totalCount} جهاز)؟`
    );
    if (!confirmSend) return;

    startTransition(async () => {
      try {
        const res = await sendPushBroadcastAction({
          title,
          body,
          url,
          image: image || undefined,
        });

        toast.success(
          `تم إرسال وبث الإشعار بنجاح! تم الوصول إلى ${res.successCount} جهاز من أصل ${res.total} 🚀`
        );
      } catch (err: any) {
        toast.error(err.message || "حدث خطأ أثناء إرسال الإشعار.");
      }
    });
  };

  return (
    <div className="space-y-6 text-right">
      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Subscribers */}
        <div className="p-5 rounded-2xl bg-[#0e121a] border border-cyan-500/40 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400">إجمالي الأجهزة المشتركة</span>
            <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <h3 className="text-3xl font-black text-cyan-400 font-mono">
            {stats.totalCount.toLocaleString()}
          </h3>
          <p className="text-[11px] text-gray-500">هواتف وحواسيب تستقبل إشعاراتك فوراً</p>
        </div>

        {/* Engine Status */}
        <div className="p-5 rounded-2xl bg-[#0e121a] border border-emerald-500/40 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400">حالة محرك VAPID Push</span>
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <h3 className="text-lg font-black text-emerald-400">نشط وجاهز للإرسال ✅</h3>
          </div>
          <p className="text-[11px] text-gray-500">مشفر بمعايير Web Push الرسمية</p>
        </div>

        {/* Reach */}
        <div className="p-5 rounded-2xl bg-[#0e121a] border border-amber-500/40 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400">الوصول الفوري (Reach)</span>
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Sparkles className="w-4 h-4" />
            </span>
          </div>
          <h3 className="text-3xl font-black text-amber-300 font-mono">100%</h3>
          <p className="text-[11px] text-gray-500">يظهر على الشاشة حتى والمتجر مغلق</p>
        </div>
      </div>

      {/* Quick Templates Bar */}
      <div className="p-4 rounded-2xl bg-[#0e121a] border border-gray-800 space-y-3">
        <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>قوالب إشعارات سريعة وجاهزة للاستخدام (1-Click Templates):</span>
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {templates.map((tpl, i) => {
            const Icon = tpl.icon;
            return (
              <button
                key={i}
                type="button"
                onClick={() => applyTemplate(tpl)}
                className={`p-3 rounded-xl border text-right transition flex items-center gap-2.5 hover:scale-[1.02] ${tpl.color}`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="text-xs font-bold truncate">{tpl.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Campaign Builder & Live Phone Mockup Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form: Campaign Details (7 Cols) */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-[#0e121a] border border-gray-800 space-y-5">
          <div className="border-b border-gray-800 pb-3">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <BellRing className="w-5 h-5 text-cyan-400" />
              <span>إنشاء حملة إشعار جديدة (Push Campaign)</span>
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              سيصل هذا الإشعار لجميع المشتركين مباشرة على شاشات هواتفهم وحواسيبهم.
            </p>
          </div>

          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">
                عنوان الإشعار (Notification Title) *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: 🔥 خصم 50% على سيارات CPM 2"
                className="w-full px-3.5 py-2.5 bg-[#161b24] border border-gray-700 rounded-xl text-xs text-white text-right font-bold focus:border-cyan-400"
              />
            </div>

            {/* Body */}
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">
                نص ورسالة الإشعار (Message Body) *
              </label>
              <textarea
                rows={3}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="اكتب تفاصيل العرض بشكل محفز وجذاب..."
                className="w-full px-3.5 py-2.5 bg-[#161b24] border border-gray-700 rounded-xl text-xs text-white text-right leading-relaxed focus:border-cyan-400"
              />
            </div>

            {/* Target URL */}
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">
                رابط التحويل عند الضغط (Destination URL)
              </label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="/shop أو /product/slug أو /giveaways"
                className="w-full px-3.5 py-2.5 bg-[#161b24] border border-gray-700 rounded-xl text-xs text-white text-left font-mono focus:border-cyan-400"
              />
              <span className="text-[10px] text-gray-400 mt-1 block">
                عند ضغط العميل على الإشعار، يفتح المتصفح هذه الصفحة مباشرة.
              </span>
            </div>

            {/* Image URL & Upload */}
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1">
                صورة الإشعار الكبيرة (اختياري - تظهر في الإشعار)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 px-3.5 py-2.5 bg-[#161b24] border border-gray-700 rounded-xl text-xs text-white text-left font-mono focus:border-cyan-400"
                />
                <label className="px-3.5 py-2.5 rounded-xl bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500 hover:text-black border border-cyan-500/40 text-xs font-bold cursor-pointer flex items-center gap-1.5 transition shrink-0">
                  {uploadingImage ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  <span>رفع صورة 📸</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingImage}
                    onChange={handleImageUpload}
                  />
                </label>
              </div>
            </div>

            {/* Send Button */}
            <div className="pt-3 border-t border-gray-800">
              <button
                type="button"
                onClick={handleSendBroadcast}
                disabled={isPending}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-400 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-black font-black text-sm shadow-xl shadow-cyan-500/20 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition disabled:opacity-50"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-black" />
                    <span>جاري تشفير وبث الإشعار لجميع الأجهزة...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-black" />
                    <span>إرسال وبث الإشعار لجميع المشتركين الآن ({stats.totalCount}) 🚀</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Live Phone Mockup Preview (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-4 rounded-2xl bg-[#0e121a] border border-gray-800 space-y-3">
            <div className="flex items-center justify-between border-b border-gray-800 pb-2">
              <span className="text-xs font-black text-white flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-cyan-400" />
                <span>معاينة حية للموبايل (Live Notification Preview)</span>
              </span>
              <span className="text-[10px] text-gray-500 font-mono">Android / iOS / Desktop</span>
            </div>

            {/* Realistic Smartphone Lock Screen / Notification Panel */}
            <div className="p-4 rounded-2xl bg-gradient-to-b from-[#090c12] to-[#121620] border-2 border-gray-700 shadow-2xl relative overflow-hidden space-y-3">
              {/* Phone Status Bar */}
              <div className="flex items-center justify-between text-[10px] text-gray-400 px-1 border-b border-gray-800/60 pb-1.5 font-mono">
                <span>04:20 PM</span>
                <div className="flex items-center gap-1.5">
                  <span>5G</span>
                  <span>100% 🔋</span>
                </div>
              </div>

              {/* Notification Bubble */}
              <div className="p-3.5 rounded-2xl bg-[#1c2333]/90 backdrop-blur-md border border-cyan-500/40 shadow-lg space-y-2 text-right">
                {/* Notification App Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-md bg-gradient-to-tr from-cyan-500 to-sky-400 flex items-center justify-center text-[10px] font-black text-black">
                      🚗
                    </span>
                    <span className="text-[11px] font-black text-white">EgyCPM Store</span>
                    <span className="text-[9px] text-gray-400">· الآن</span>
                  </div>
                  <Bell className="w-3.5 h-3.5 text-cyan-400" />
                </div>

                {/* Title & Body */}
                <div className="space-y-0.5">
                  <h5 className="text-xs font-black text-white leading-snug">{title || "عنوان الإشعار"}</h5>
                  <p className="text-[11px] text-gray-300 leading-relaxed line-clamp-2">
                    {body || "نص الإشعار يظهر هنا..."}
                  </p>
                </div>

                {/* Optional Image Preview */}
                {image && (
                  <div className="h-28 rounded-xl overflow-hidden border border-gray-700 bg-black/40">
                    <img src={image} alt="Push Preview" className="w-full h-full object-cover" />
                  </div>
                )}

                {/* Action Button */}
                <div className="pt-1.5 border-t border-gray-700/60 flex justify-end">
                  <span className="text-[10px] font-black text-cyan-400 flex items-center gap-1">
                    <span>مشاهدة العرض</span>
                    <ExternalLink className="w-3 h-3" />
                  </span>
                </div>
              </div>

              <div className="text-center">
                <span className="text-[10px] text-gray-500">هكذا سيظهر الإشعار على شاشات هواتف عملائك بالضبط ✨</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Subscribers List */}
      <div className="p-6 rounded-2xl bg-[#0e121a] border border-gray-800 space-y-4">
        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span>آخر الأجهزة المسجلة بالإشعارات ({stats.recentSubs.length})</span>
          </h3>
          <span className="text-xs text-gray-400">تحديث فوري</span>
        </div>

        {stats.recentSubs.length === 0 ? (
          <p className="text-xs text-gray-500 text-center py-6">
            لا توجد أجهزة مسجلة بعد. عند زيارة أي عميل للمتجر والموافقة على التنبيهات، سيظهر هنا فوراً.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 font-mono text-[11px]">
                  <th className="pb-2 font-bold">تاريخ الاشتراك</th>
                  <th className="pb-2 font-bold">المستخدم / العميل</th>
                  <th className="pb-2 font-bold">معلومات الجهاز</th>
                  <th className="pb-2 font-bold text-left">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {stats.recentSubs.map((sub: any) => (
                  <tr key={sub.id} className="hover:bg-white/[0.02]">
                    <td className="py-2.5 font-mono text-gray-400 text-[11px]">
                      {new Date(sub.createdAt).toLocaleDateString("ar-EG")} -{" "}
                      {new Date(sub.createdAt).toLocaleTimeString("ar-EG", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-2.5 font-bold text-white">
                      {sub.user ? (
                        <span className="text-cyan-300">{sub.user.name || sub.user.email}</span>
                      ) : (
                        <span className="text-gray-400">زائر للمتجر (Guest)</span>
                      )}
                    </td>
                    <td className="py-2.5 text-gray-400 text-[11px] truncate max-w-[250px]">
                      {sub.userAgent || "Web Push Browser"}
                    </td>
                    <td className="py-2.5 text-left font-mono">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                        نشط ✅
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
