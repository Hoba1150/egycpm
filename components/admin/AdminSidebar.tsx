"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  ShoppingBag,
  Car,
  FolderTree,
  Users,
  Tag,
  Headphones,
  Star,
  Shield,
  Settings,
  ExternalLink,
  Gift,
  Gamepad2,
  TrendingUp,
  X,
} from "lucide-react";
import { getAdminSidebarCounts } from "@/lib/actions/settings";

export default function AdminSidebar({ user }: { user: any }) {
  const pathname = usePathname();
  const userRole = user?.role || "CUSTOMER";
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const refreshCounts = useCallback(() => {
    getAdminSidebarCounts().then(setCounts).catch(() => {});
  }, []);

  useEffect(() => {
    refreshCounts();
    // Poll every 90s — TopBar already polls at 60s; combined DB load stays well within pool limits
    const interval = setInterval(refreshCounts, 90000);
    return () => clearInterval(interval);
  }, [refreshCounts]);

  // Role permissions map
  const rolePermissions: Record<string, string[]> = {
    SUPER_ADMIN: ["/admin", "/admin/deposits", "/admin/orders", "/admin/giveaways", "/admin/products", "/admin/categories", "/admin/cpm2", "/admin/customers", "/admin/coupons", "/admin/tickets", "/admin/reviews", "/admin/audit-logs", "/admin/settings"],
    ADMIN: ["/admin", "/admin/deposits", "/admin/orders", "/admin/giveaways", "/admin/products", "/admin/categories", "/admin/cpm2", "/admin/customers", "/admin/coupons", "/admin/tickets", "/admin/reviews", "/admin/audit-logs"],
    ORDER_MANAGER: ["/admin", "/admin/orders", "/admin/giveaways", "/admin/products", "/admin/cpm2", "/admin/tickets"],
    SUPPORT: ["/admin", "/admin/tickets", "/admin/orders"],
  };

  const allowedHrefs = rolePermissions[userRole] || ["/admin"];

  const mainLinks = [
    { name: "مركز القيادة والإحصائيات", href: "/admin", icon: LayoutDashboard },
    { name: "إدارة السحوبات والجوائز", href: "/admin/giveaways", icon: Gift },
    { name: "مراجعة طلبات الإيداع", href: "/admin/deposits", icon: Wallet },
    { name: "إدارة وتنفيذ الطلبات", href: "/admin/orders", icon: ShoppingBag },
    { name: "إدارة المنتجات والسيارات", href: "/admin/products", icon: Car },
    { name: "الأقسام والتصنيفات", href: "/admin/categories", icon: FolderTree },
    { name: "إدارة العملاء والمحافظ", href: "/admin/customers", icon: Users },
    { name: "كوبونات الخصم", href: "/admin/coupons", icon: Tag },
    { name: "تذاكر الدعم الفني", href: "/admin/tickets", icon: Headphones },
    { name: "تقييمات وآراء العملاء", href: "/admin/reviews", icon: Star },
    { name: "سجل العمليات (Audit Logs)", href: "/admin/audit-logs", icon: Shield },
    { name: "إعدادات المتجر والتصميم", href: "/admin/settings", icon: Settings },
  ];

  const cpm2Links = [
    { name: "إدارة CPM 2", href: "/admin/cpm2", icon: Gamepad2 },
  ];

  const visibleMainLinks = mainLinks.filter((l) => allowedHrefs.includes(l.href));
  const visibleCpm2Links = cpm2Links.filter((l) => allowedHrefs.includes(l.href));

  const renderLink = (link: { name: string; href: string; icon: any }) => {
    const Icon = link.icon;
    const isActive = pathname === link.href || (link.href !== "/admin" && pathname.startsWith(link.href));
    const badgeCount = counts[link.href];
    const isCpm2 = link.href.startsWith("/admin/cpm2");

    return (
      <Link
        key={link.href}
        href={link.href}
        className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition ${
          isActive
            ? isCpm2
              ? "bg-purple-500/10 text-purple-400 border-r-2 border-purple-500"
              : "bg-orange-500/10 text-orange-500 border-r-2 border-orange-500"
            : "text-gray-400 hover:text-white hover:bg-[#161b22]"
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Icon className={`w-4 h-4 shrink-0 ${isActive ? (isCpm2 ? "text-purple-400" : "text-orange-500") : ""}`} />
          <span className="truncate">{link.name}</span>
        </div>

        {badgeCount !== undefined && badgeCount > 0 && (
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black shadow-sm shrink-0 ${
            isCpm2 ? "bg-purple-500 text-white" : "bg-orange-500 text-black"
          }`}>
            {badgeCount}
          </span>
        )}
      </Link>
    );
  };

  return (
    <>
      {/* ─── Mobile: Floating Nav FAB + Full-Screen Drawer ─── */}
      <div className="md:hidden">
        {/* Floating Nav Button — fixed bottom-left above BottomNav */}
        <button
          onClick={() => setMobileNavOpen(true)}
          className="fixed bottom-[72px] left-4 z-40 w-12 h-12 rounded-2xl bg-orange-500 shadow-[0_4px_20px_rgba(249,115,22,0.5)] flex items-center justify-center transition active:scale-90 hover:bg-orange-400"
          aria-label="قائمة أقسام الإدارة"
        >
          <LayoutDashboard className="w-5 h-5 text-black" />
          {/* Badge if any pending */}
          {Object.values(counts).some((v) => v > 0) && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center font-mono">
              {Object.values(counts).reduce((a, b) => a + (b > 0 ? b : 0), 0)}
            </span>
          )}
        </button>

        {/* Slide-Up Full Drawer */}
        {mobileNavOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
              onClick={() => setMobileNavOpen(false)}
            />

            {/* Drawer Panel */}
            <div className="fixed inset-x-0 bottom-0 z-50 bg-[#0d1117] rounded-t-3xl border-t border-gray-800 shadow-2xl text-right max-h-[80vh] overflow-y-auto">
              {/* Handle + Header */}
              <div className="sticky top-0 bg-[#0d1117] border-b border-gray-800 px-5 pt-4 pb-3 rounded-t-3xl">
                <div className="w-10 h-1.5 bg-gray-700 rounded-full mx-auto mb-3" />
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setMobileNavOpen(false)}
                    className="p-1.5 rounded-xl bg-gray-800 text-gray-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div>
                    <span className="text-xs font-mono font-bold text-orange-500 block text-right">ADMIN NAVIGATION</span>
                    <h3 className="text-sm font-black text-white text-right">أقسام لوحة الإدارة</h3>
                  </div>
                </div>
              </div>

              {/* Nav Links Grid */}
              <div className="p-4 grid grid-cols-2 gap-2.5">
                {visibleMainLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href || (link.href !== "/admin" && pathname.startsWith(link.href));
                  const badgeCount = counts[link.href];

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileNavOpen(false)}
                      className={`relative flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border text-center transition active:scale-95 ${
                        isActive
                          ? "bg-orange-500/15 border-orange-500/50 text-orange-400"
                          : "bg-[#161b22] border-gray-800 text-gray-300 hover:text-white hover:border-gray-700"
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? "text-orange-500" : "text-gray-400"}`} />
                      <span className="text-[11px] font-bold leading-tight">
                        {link.name.replace(/إدارة |مركز |مراجعة |تقييمات و|سجل |\(Audit Logs\)/g, "").trim()}
                      </span>
                      {badgeCount !== undefined && badgeCount > 0 && (
                        <span className="absolute top-2 right-2 min-w-[20px] h-5 px-1.5 rounded-full bg-orange-500 text-black text-[10px] font-black font-mono flex items-center justify-center">
                          {badgeCount}
                        </span>
                      )}
                    </Link>
                  );
                })}

                {visibleCpm2Links.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname.startsWith(link.href);
                  const badgeCount = counts[link.href];

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileNavOpen(false)}
                      className={`relative flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border text-center transition active:scale-95 ${
                        isActive
                          ? "bg-purple-500/15 border-purple-500/50 text-purple-400"
                          : "bg-purple-950/40 border-purple-800/30 text-purple-300 hover:text-white"
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? "text-purple-400" : "text-purple-400/70"}`} />
                      <span className="text-[11px] font-bold leading-tight">إدارة CPM 2</span>
                      {badgeCount !== undefined && badgeCount > 0 && (
                        <span className="absolute top-2 right-2 min-w-[20px] h-5 px-1.5 rounded-full bg-purple-500 text-white text-[10px] font-black font-mono flex items-center justify-center">
                          {badgeCount}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>

              {/* User & Store Visit */}
              <div className="px-4 pb-6 pt-1 border-t border-gray-800 mt-1 flex gap-2">
                <Link
                  href="/"
                  target="_blank"
                  onClick={() => setMobileNavOpen(false)}
                  className="flex-1 py-3 px-4 rounded-2xl bg-[#161b22] border border-gray-700 text-xs font-bold text-gray-300 text-center hover:text-white transition flex items-center justify-center gap-1.5"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>زيارة المتجر</span>
                </Link>
                <div className="flex-1 py-3 px-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-xs font-bold text-orange-400 text-center flex items-center justify-center gap-1.5">
                  <Shield className="w-4 h-4" />
                  <span className="truncate">{user?.name || user?.email}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ─── Desktop Standard Sidebar ─── */}
      <aside className="hidden md:flex md:w-64 lg:w-72 bg-[#0d1117] border-l border-gray-800 flex-col justify-between shrink-0 min-h-screen">
        {/* Top Brand */}
        <div className="p-4 border-b border-gray-800">
          <Link href="/admin" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-500 flex items-center justify-center">
              <Car className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white">لوحة الإدارة والتحكم</h2>
              <span className="text-[10px] text-orange-500 font-mono font-bold">
                EGY CPM COMMAND
              </span>
            </div>
          </Link>

          {/* Live Stats Bar */}
          {(counts as any)["_newOrdersToday"] !== undefined && (
            <div className="mt-2 flex items-center gap-1.5 text-[10px] text-gray-400">
              <TrendingUp className="w-3 h-3 text-green-400" />
              <span className="text-green-400 font-bold">{(counts as any)["_newOrdersToday"]}</span>
              <span>طلب جديد اليوم</span>
            </div>
          )}
        </div>

        {/* Nav Menu */}
        <nav className="p-2 space-y-1 flex-1 overflow-y-auto">
          {/* Main Store Links */}
          {visibleMainLinks.map(renderLink)}

          {/* CPM 2 Section (if allowed) */}
          {visibleCpm2Links.length > 0 && (
            <>
              <div className="pt-3 pb-1 px-3">
                <span className="text-[9px] font-mono font-black text-purple-500/70 uppercase tracking-widest">
                  ━ CPM 2 Section ━
                </span>
              </div>
              {visibleCpm2Links.map(renderLink)}
            </>
          )}
        </nav>

        {/* Bottom User Bar */}
        <div className="p-3 border-t border-gray-800 bg-[#07080b] space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-white truncate">{user?.name || user?.email}</h4>
              <span className="text-[10px] text-orange-500 font-mono font-bold">{user?.role}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              target="_blank"
              className="flex-1 py-1.5 px-2 rounded-lg bg-[#161b22] hover:bg-[#21262d] text-gray-300 hover:text-white text-[11px] font-semibold flex items-center justify-center gap-1 border border-gray-700 transition"
            >
              <span>زيارة المتجر</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}

