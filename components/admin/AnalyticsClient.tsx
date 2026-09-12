"use client";

import React, { useState, useEffect, useTransition } from "react";
import { getVisitorAnalytics } from "@/lib/actions/analytics";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";
import {
  Eye,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  Compass,
  TrendingUp,
  RefreshCw,
  ExternalLink,
  Calendar,
  Layers,
  Activity,
  Shield,
  Clock,
  Radio,
  ArrowUpRight,
} from "lucide-react";

// Emoji flag helper
function getCountryFlag(code?: string | null) {
  if (!code || code === "UN") return "🌐";
  const c = code.toUpperCase();
  const flags: Record<string, string> = {
    EG: "🇪🇬",
    SA: "🇸🇦",
    AE: "🇦🇪",
    IQ: "🇮🇶",
    KW: "🇰🇼",
    QA: "🇶🇦",
    OM: "🇴🇲",
    BH: "🇧🇭",
    JO: "🇯🇴",
    LB: "🇱🇧",
    PS: "🇵🇸",
    SY: "🇸🇾",
    YE: "🇾🇪",
    DZ: "🇩🇿",
    MA: "🇲🇦",
    TN: "🇹🇳",
    LY: "🇱🇾",
    SD: "🇸🇩",
    US: "🇺🇸",
    GB: "🇬🇧",
    DE: "🇩🇪",
    FR: "🇫🇷",
    TR: "🇹🇷",
    RU: "🇷🇺",
  };
  return flags[c] || "🌐";
}

interface AnalyticsClientProps {
  initialData: any;
}

export default function AnalyticsClient({ initialData }: AnalyticsClientProps) {
  const [data, setData] = useState(initialData);
  const [range, setRange] = useState<"today" | "7d" | "30d" | "all">("7d");
  const [isPending, startTransition] = useTransition();
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Refetch when range changes
  const handleRangeChange = (newRange: "today" | "7d" | "30d" | "all") => {
    setRange(newRange);
    startTransition(async () => {
      try {
        const res = await getVisitorAnalytics(newRange);
        setData(res);
      } catch {
        toast.error("فشل تحديث البيانات.");
      }
    });
  };

  const refreshData = () => {
    startTransition(async () => {
      try {
        const res = await getVisitorAnalytics(range);
        setData(res);
        toast.success("تم تحديث إحصائيات الزوار لايف ⚡");
      } catch {
        toast.error("فشل التحديث.");
      }
    });
  };

  // Auto polling every 20 seconds for live visits
  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(() => {
      getVisitorAnalytics(range)
        .then((res) => setData(res))
        .catch(() => {});
    }, 20000);
    return () => clearInterval(timer);
  }, [range, autoRefresh]);

  const maxChartCount = Math.max(...data.chartData.map((d: any) => d.count), 1);

  return (
    <div className="space-y-6 text-right">
      {/* Top Filter & Live Toggle Bar */}
      <div className="p-4 rounded-2xl bg-[#0e121a] border border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-gray-400 ml-1">النطاق الزمني:</span>
          {(
            [
              { id: "today", label: "اليوم ☀️" },
              { id: "7d", label: "آخر 7 أيام 📅" },
              { id: "30d", label: "آخر 30 يوماً 🗓️" },
              { id: "all", label: "كافة الأوقات 🌐" },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleRangeChange(item.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                range === item.id
                  ? "bg-cyan-500 text-black font-black shadow-md shadow-cyan-500/20"
                  : "bg-[#161b24] text-gray-300 hover:text-white border border-gray-700"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          {/* Live Pulse Indicator */}
          <button
            type="button"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition border ${
              autoRefresh
                ? "bg-emerald-950/40 text-emerald-400 border-emerald-500/40"
                : "bg-gray-800/40 text-gray-400 border-gray-700"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${autoRefresh ? "bg-emerald-400 animate-pulse" : "bg-gray-500"}`} />
            <span>{autoRefresh ? "تحديث تلقائي (لايف)" : "تحديث يدوي"}</span>
          </button>

          <button
            type="button"
            onClick={refreshData}
            disabled={isPending}
            className="p-2 rounded-xl bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700 transition disabled:opacity-50"
            title="تحديث الآن"
          >
            <RefreshCw className={`w-4 h-4 ${isPending ? "animate-spin text-cyan-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Pageviews */}
        <div className="p-5 rounded-2xl bg-[#0e121a] border border-cyan-500/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400">إجمالي مشاهدات الصفحات</span>
            <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Eye className="w-4 h-4" />
            </span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-cyan-400 font-mono">
            {data.totalViews.toLocaleString()}
          </h3>
          <p className="text-[11px] text-gray-500">تم تسجيلها بمجرد فتح المتجر</p>
        </div>

        {/* Today's Views */}
        <div className="p-5 rounded-2xl bg-[#0e121a] border border-emerald-500/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400">زيارات اليوم (24h)</span>
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Activity className="w-4 h-4" />
            </span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
            {data.todayViews.toLocaleString()}
          </h3>
          <p className="text-[11px] text-gray-500">زائر تصفح المتجر اليوم</p>
        </div>

        {/* Weekly Views */}
        <div className="p-5 rounded-2xl bg-[#0e121a] border border-purple-500/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400">زيارات آخر 7 أيام</span>
            <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-purple-400 font-mono">
            {data.weekViews.toLocaleString()}
          </h3>
          <p className="text-[11px] text-gray-500">معدل نشاط المتجر الأسبوعي</p>
        </div>

        {/* Top Country */}
        <div className="p-5 rounded-2xl bg-[#0e121a] border border-amber-500/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400">الدولة الأكثر زيارة</span>
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Globe className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{getCountryFlag(data.countries[0]?.code)}</span>
            <h3 className="text-lg font-black text-amber-300 truncate">
              {data.countries[0]?.name || "بانتظار البيانات"}
            </h3>
          </div>
          <p className="text-[11px] text-gray-500">
            {data.countries[0] ? `${data.countries[0].count} زيارة (${data.countries[0].percentage}%)` : "—"}
          </p>
        </div>
      </div>

      {/* Traffic Trend Chart (14 Days) */}
      <div className="p-6 rounded-2xl bg-[#0e121a] border border-gray-800 space-y-4">
        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <span>مؤشر نمو الزيارات اليومي (آخر 14 يوماً)</span>
          </h3>
          <span className="text-xs text-gray-400 font-mono">تتبع فوري بدون تسجيل</span>
        </div>

        <div className="flex items-end gap-1.5 sm:gap-3 h-44 border-b border-gray-800 pb-2 pt-6">
          {data.chartData.map((d: any, idx: number) => {
            const heightPct = maxChartCount > 0 ? Math.max(8, (d.count / maxChartCount) * 100) : 8;
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                <span className="text-[10px] text-cyan-400 font-mono opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                  {d.count}
                </span>
                <div
                  style={{ height: `${heightPct}%` }}
                  className="w-full rounded-t-lg bg-gradient-to-t from-cyan-600 via-cyan-400 to-sky-300 group-hover:from-cyan-400 group-hover:to-white transition-all duration-300 min-h-[8px] shadow-sm shadow-cyan-500/20"
                />
                <span className="text-[9px] text-gray-400 font-mono truncate max-w-[45px] text-center">
                  {d.label.split(" ")[0]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid: Geo Breakdown & Top Pages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 🌍 Geographic Distribution */}
        <div className="p-6 rounded-2xl bg-[#0e121a] border border-gray-800 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-amber-400" />
              <span>توزيع الزوار حسب الدول والموقع الجغرافي</span>
            </h3>
            <span className="text-xs text-gray-500">أعلى 10 دول</span>
          </div>

          {data.countries.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-8">لا توجد بيانات مسجلة بعد.</p>
          ) : (
            <div className="space-y-3">
              {data.countries.map((item: any, i: number) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 font-bold text-gray-200">
                      <span className="text-base">{getCountryFlag(item.code)}</span>
                      <span>{item.name}</span>
                    </span>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-amber-400 font-black">{item.count} زيارة</span>
                      <span className="text-gray-500 text-[10px]">({item.percentage}%)</span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-gray-800 overflow-hidden">
                    <div
                      style={{ width: `${Math.max(4, item.percentage)}%` }}
                      className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 📄 Top Visited Pages */}
        <div className="p-6 rounded-2xl bg-[#0e121a] border border-gray-800 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>الصفحات والأقسام الأكثر زيارة في المتجر</span>
            </h3>
            <span className="text-xs text-gray-500">أعلى الصفحات</span>
          </div>

          {data.pages.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-8">لا توجد صفحات مسجلة بعد.</p>
          ) : (
            <div className="space-y-3">
              {data.pages.map((item: any, i: number) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-mono text-[10px] font-bold">
                        #{i + 1}
                      </span>
                      <span className="font-mono text-gray-200 truncate dir-ltr text-left">
                        {item.path === "/" ? "/ (الرئيسية)" : item.path}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 font-mono shrink-0">
                      <span className="text-cyan-400 font-black">{item.count} مشاهدة</span>
                      <span className="text-gray-500 text-[10px]">({item.percentage}%)</span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-gray-800 overflow-hidden">
                    <div
                      style={{ width: `${Math.max(4, item.percentage)}%` }}
                      className="h-full bg-gradient-to-r from-cyan-500 to-sky-300 rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Grid: Devices, Browsers & Traffic Sources */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 📱 Devices Breakdown */}
        <div className="p-5 rounded-2xl bg-[#0e121a] border border-gray-800 space-y-3">
          <h3 className="text-xs font-bold text-white flex items-center gap-2 border-b border-gray-800 pb-2">
            <Smartphone className="w-4 h-4 text-pink-400" />
            <span>نوع الجهاز (Device Type)</span>
          </h3>

          <div className="space-y-2.5">
            {data.devices.map((d: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-xs p-2 rounded-xl bg-[#141a26]">
                <span className="flex items-center gap-2 text-gray-300 font-bold">
                  {d.name === "Mobile" ? (
                    <Smartphone className="w-3.5 h-3.5 text-pink-400" />
                  ) : d.name === "Tablet" ? (
                    <Tablet className="w-3.5 h-3.5 text-amber-400" />
                  ) : (
                    <Monitor className="w-3.5 h-3.5 text-cyan-400" />
                  )}
                  <span>{d.name === "Mobile" ? "هاتف ذكي (Mobile)" : d.name === "Desktop" ? "حاسوب (Desktop)" : d.name}</span>
                </span>
                <span className="font-mono font-bold text-white">{d.count} ({d.percentage}%)</span>
              </div>
            ))}
          </div>
        </div>

        {/* 🌐 Browsers Breakdown */}
        <div className="p-5 rounded-2xl bg-[#0e121a] border border-gray-800 space-y-3">
          <h3 className="text-xs font-bold text-white flex items-center gap-2 border-b border-gray-800 pb-2">
            <Compass className="w-4 h-4 text-emerald-400" />
            <span>المتصفح (Browsers)</span>
          </h3>

          <div className="space-y-2.5">
            {data.browsers.map((b: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-xs p-2 rounded-xl bg-[#141a26]">
                <span className="text-gray-300 font-bold">{b.name}</span>
                <span className="font-mono font-bold text-emerald-400">{b.count} ({b.percentage}%)</span>
              </div>
            ))}
          </div>
        </div>

        {/* 🔗 Traffic Sources */}
        <div className="p-5 rounded-2xl bg-[#0e121a] border border-gray-800 space-y-3">
          <h3 className="text-xs font-bold text-white flex items-center gap-2 border-b border-gray-800 pb-2">
            <Radio className="w-4 h-4 text-purple-400" />
            <span>مصدر الزيارة (Traffic Source)</span>
          </h3>

          <div className="space-y-2.5">
            {data.referrers.map((r: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-xs p-2 rounded-xl bg-[#141a26]">
                <span className="text-gray-300 font-bold truncate max-w-[140px]">{r.name}</span>
                <span className="font-mono font-bold text-purple-400">{r.count} ({r.percentage}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 📋 Live Recent Visits Log (Table of Last 60 Visits) */}
      <div className="p-6 rounded-2xl bg-[#0e121a] border border-gray-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <h3 className="text-sm font-bold text-white">
              سجل الزيارات المباشر واللحظي (Live Activity Feed)
            </h3>
          </div>
          <span className="text-xs text-gray-400 font-mono">
            عرض آخر {data.recentVisits.length} زيارة لحظية تمت للمتجر
          </span>
        </div>

        {data.recentVisits.length === 0 ? (
          <p className="text-xs text-gray-500 text-center py-8">لا توجد زيارات مسجلة بعد.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 font-mono text-[11px]">
                  <th className="pb-2.5 font-bold">التوقيت</th>
                  <th className="pb-2.5 font-bold">الدولة / المدينة</th>
                  <th className="pb-2.5 font-bold">الصفحة المزارة</th>
                  <th className="pb-2.5 font-bold">الجهاز والمتصفح</th>
                  <th className="pb-2.5 font-bold">المصدر</th>
                  <th className="pb-2.5 font-bold text-left font-mono">IP الزائر</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {data.recentVisits.map((v: any) => (
                  <tr key={v.id} className="hover:bg-white/[0.02] transition">
                    {/* Time */}
                    <td className="py-3 text-gray-400 font-mono text-[11px]">
                      {new Date(v.createdAt).toLocaleTimeString("ar-EG", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </td>

                    {/* Country & City */}
                    <td className="py-3 font-bold text-white">
                      <span className="flex items-center gap-1.5">
                        <span className="text-base">{getCountryFlag(v.countryCode)}</span>
                        <span>{v.country || "غير محدد"}</span>
                        {v.city && v.city !== "Unknown" && (
                          <span className="text-[10px] text-gray-400 font-normal">({v.city})</span>
                        )}
                      </span>
                    </td>

                    {/* Path */}
                    <td className="py-3 font-mono text-cyan-300">
                      <span className="px-2 py-0.5 rounded bg-cyan-950/40 border border-cyan-500/20 inline-block max-w-[180px] truncate dir-ltr text-left">
                        {v.path}
                      </span>
                    </td>

                    {/* Device & Browser */}
                    <td className="py-3 text-gray-300">
                      <span className="flex items-center gap-1">
                        <span>{v.device === "Mobile" ? "📱 هاتف" : "💻 كمبيوتر"}</span>
                        <span className="text-gray-500">·</span>
                        <span className="text-[11px] text-gray-400">{v.browser}</span>
                      </span>
                    </td>

                    {/* Referrer */}
                    <td className="py-3 text-gray-400 text-[11px]">
                      <span className="truncate max-w-[120px] block">{v.referrer || "مباشر"}</span>
                    </td>

                    {/* IP */}
                    <td className="py-3 font-mono text-gray-500 text-[11px] text-left">
                      {v.ip || "127.0.0.1"}
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
