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
} from "lucide-react";
import { getAdminSidebarCounts } from "@/lib/actions/settings";

export default function AdminSidebar({ user }: { user: any }) {
  const pathname = usePathname();
  const userRole = user?.role || "CUSTOMER";
  const [counts, setCounts] = useState<Record<string, number>>({});

  const refreshCounts = useCallback(() => {
    getAdminSidebarCounts().then(setCounts).catch(() => {});
  }, []);

  useEffect(() => {
    refreshCounts();
    // Poll every 8 seconds for near-real-time updates
    const interval = setInterval(refreshCounts, 8000);
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
    <aside className="w-full md:w-64 lg:w-72 bg-[#0d1117] border-b md:border-b-0 md:border-l border-gray-800 flex flex-col justify-between shrink-0">
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
  );
}

