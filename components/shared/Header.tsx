"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCartStore } from "@/lib/store";
import {
  Car,
  ShoppingCart,
  User,
  Wallet,
  LogOut,
  Menu,
  X,
  Search,
  ChevronDown,
  ShieldAlert,
  Zap,
  Headphones,
  CheckSquare,
  Home,
  Gift,
  ShoppingBag,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import NotificationsDropdown from "@/components/shared/NotificationsDropdown";
import AuthModal from "@/components/shared/AuthModal";
import { toast } from "sonner";
import { useSettings } from "@/lib/context/SettingsContext";

/** Inline logo emblem — rendered inside the flush header slot */
function LogoEmblem() {
  const settings = useSettings();
  const storeName = settings.store_name || "EGY CPM";
  const customLogoUrl = settings.store_logo_url;

  return (
    <div className="flex items-center gap-2.5 select-none">
      {/* Icon / Image */}
      {customLogoUrl ? (
        <img
          src={customLogoUrl}
          alt={storeName}
          className="h-8 sm:h-9 w-auto max-w-[110px] object-contain"
        />
      ) : (
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br from-[var(--red-hi)] to-[var(--red)] flex items-center justify-center border border-white/10 shadow-[0_0_12px_rgba(192,18,26,0.5)] shrink-0 group-hover:shadow-[0_0_18px_rgba(192,18,26,0.7)] transition-shadow">
          <Car className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>
      )}

      {/* Name */}
      <div className="text-right leading-none">
        <span className="text-sm sm:text-base font-black text-white tracking-tight block group-hover:text-[var(--red-hi)] transition-colors">
          {storeName}
        </span>
        <span className="text-[9px] font-mono text-[var(--red-hi)] uppercase tracking-[0.1em] block mt-0.5 font-bold opacity-90 truncate max-w-[140px]">
          {settings.store_slogan || "Car Parking"}
        </span>
      </div>
    </div>
  );
}

export default function Header() {

  const pathname = usePathname();
  const router = useRouter();

  const { getItemCount, setIsOpen: setCartOpen } = useCartStore();
  const itemCount = getItemCount();

  // Read settings from server-injected Context (no FOUC, no extra API call)
  const settings = useSettings();

  const [user, setUser] = useState<any>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = sessionStorage.getItem("cpm_cached_user");
        if (cached) return JSON.parse(cached);
      } catch {}
    }
    return null;
  });
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userDropdown, setUserDropdown] = useState(false);

  const fetchSession = async () => {
    try {
      const resAuth = await fetch("/api/auth/me", { cache: "no-store" });
      if (resAuth.ok) {
        const data = await resAuth.json();
        setUser(data.user);
        try {
          if (data.user) {
            sessionStorage.setItem("cpm_cached_user", JSON.stringify(data.user));
          } else {
            sessionStorage.removeItem("cpm_cached_user");
          }
        } catch {}
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchSession();
    const handleAuthEvent = () => fetchSession();
    window.addEventListener("cpm_auth_changed", handleAuthEvent);
    return () => {
      window.removeEventListener("cpm_auth_changed", handleAuthEvent);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      setUserDropdown(false);
      try {
        sessionStorage.removeItem("cpm_cached_user");
      } catch {}
      toast.success("تم تسجيل الخروج بنجاح.");
      router.refresh();
    } catch {
      toast.error("فشل تسجيل الخروج.");
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsMobileMenuOpen(false);
    router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  const navLinks = [
    { name: "الرئيسية", href: "/", icon: Home },
    { name: "المتجر", href: "/shop", icon: ShoppingBag },
    { name: "المحفظة", href: "/wallet", icon: Wallet },
    { name: "السحوبات", href: "/giveaways", icon: Gift },
    { name: "شحن رصيد", href: "/deposit", icon: Wallet },
    { name: "تتبع طلبك", href: "/orders", icon: CheckSquare },
    { name: "الدعم الفني", href: "/support", icon: Headphones },
  ];

  const isAdmin = user && ["SUPER_ADMIN", "ADMIN", "SUPPORT", "ORDER_MANAGER"].includes(user.role);

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-[var(--border)] bg-[#07080c]/95 backdrop-blur-md">
        {/* Main Navbar */}
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-0">

            {/* ── Logo Slot: flush embedded rectangle ── */}
            {/* Sits flush top & bottom with the bar, side borders only, inset shadow = carved-in feel */}
            <div className="flex items-center h-full">
              {/* Mobile hamburger — separate, before logo slot */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden h-full px-3 text-gray-400 hover:text-white hover:bg-white/[0.04] border-r border-[var(--border)] transition"
                aria-label="القائمة الجانبية"
              >
                {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>

              {/* Logo Slot — flush, no radius, part of the bar */}
              <Link
                href="/"
                className="flex items-center h-full px-4 sm:px-5 border-r border-[var(--border)] bg-[var(--surface)] hover:bg-[#0c0d12] transition-colors group relative"
                style={{ boxShadow: "inset -1px 0 0 rgba(192,18,26,0.18), inset 1px 0 0 rgba(192,18,26,0.08)" }}
              >
                {/* Subtle top accent line — red hairline */}
                <span className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--red)] to-transparent opacity-70" />

                <LogoEmblem />
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-0.5 flex-1 px-4">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      isActive
                        ? "text-[var(--red-hi)] bg-[var(--red-soft)] border border-[var(--red)]/25"
                        : "text-gray-300 hover:text-white hover:bg-white/[0.05]"
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </nav>

            {/* Left: Actions */}
            <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4">
              {/* Search Form (Desktop) */}
              <form onSubmit={handleSearch} className="hidden md:flex relative items-center">
                <input
                  type="text"
                  placeholder="ابحث عن سيارة أو خدمة..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-36 lg:w-44 pl-3 pr-7 py-1.5 rounded-lg bg-[var(--card-hi)] border border-[var(--border)] focus:border-[var(--red)] focus:outline-none text-xs text-white placeholder-gray-500 text-right transition cpm-input"
                />
                <button type="submit" className="absolute right-2 text-gray-400 hover:text-[var(--red-hi)] transition" aria-label="بحث">
                  <Search className="w-3 h-3" />
                </button>
              </form>

              {/* Shopping Cart Button */}
              <button
                onClick={() => setCartOpen(true)}
                className="relative h-8 sm:h-9 px-2.5 rounded-lg bg-[var(--card-hi)] border border-[var(--border)] text-gray-300 hover:text-[var(--red-hi)] transition flex items-center justify-center shrink-0"
                aria-label="سلة المشتريات"
              >
                <ShoppingCart className="w-4 h-4" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-3.5 px-0.5 rounded-full bg-[var(--red-hi)] text-white text-[8px] sm:text-[9px] font-black font-mono shadow-sm">
                    {itemCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {user && <NotificationsDropdown />}

              {/* User Account / Login State - Static fixed height to prevent any bar shift */}
              <div className="h-8 sm:h-9 flex items-center shrink-0">
                {user ? (
                  <div className="relative h-full flex items-center">
                    <button
                      onClick={() => setUserDropdown(!userDropdown)}
                      className="h-full flex items-center gap-1.5 px-2 sm:px-3 rounded-lg bg-[var(--card-hi)] border border-[var(--border-hi)] text-right hover:border-[var(--red)] transition"
                    >
                      <div className="flex flex-col text-right leading-none justify-center">
                        <span className="text-[10px] sm:text-[11px] font-bold text-white max-w-[70px] sm:max-w-[85px] truncate">
                          {user.name || "الحساب"}
                        </span>
                        <span className="text-[9px] sm:text-[10px] text-[var(--red-hi)] font-mono font-black mt-0.5">
                          {formatCurrency(user.wallet?.totalAvailable || 0)}
                        </span>
                      </div>
                      <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${userDropdown ? "rotate-180" : ""}`} />
                    </button>

                    {/* Dropdown Menu — Properly anchored below */}
                    {userDropdown && (
                      <>
                        {/* Backdrop to close on outside click */}
                        <div
                          className="fixed inset-0 z-[45]"
                          onClick={() => setUserDropdown(false)}
                        />
                        <div
                          className="absolute top-full right-0 mt-2 w-52 sm:w-56 rounded-xl bg-[#0f1218] border border-gray-800 shadow-2xl p-2 z-[46] text-right space-y-1"
                          onClick={() => setUserDropdown(false)}
                        >
                          <div className="p-2 border-b border-gray-800 mb-1">
                            <p className="text-xs font-bold text-white truncate">{user.name}</p>
                            <p className="text-[10px] text-orange-500 font-mono font-bold">
                              {formatCurrency(user.wallet?.totalAvailable || 0)}
                            </p>
                          </div>

                          <Link
                            href="/wallet"
                            className="flex items-center gap-2 p-2 rounded-lg text-xs text-gray-300 hover:bg-gray-800/40 hover:text-orange-500 transition"
                          >
                            <Wallet className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                            <span>محفظتي وشحن الرصيد</span>
                          </Link>

                          <Link
                            href="/orders"
                            className="flex items-center gap-2 p-2 rounded-lg text-xs text-gray-300 hover:bg-gray-800/40 hover:text-orange-500 transition"
                          >
                            <Car className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                            <span>طلباتي ومشترياتي</span>
                          </Link>

                          {isAdmin && (
                            <Link
                              href="/admin"
                              className="flex items-center gap-2 p-2 rounded-lg text-xs text-orange-400 bg-orange-500/10 border border-orange-500/30 transition"
                            >
                              <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                              <span>لوحة التحكم الإدارية</span>
                            </Link>
                          )}

                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2 p-2 rounded-lg text-xs text-red-400 hover:bg-red-500/10 transition"
                          >
                            <LogOut className="w-3.5 h-3.5 shrink-0" />
                            <span>تسجيل الخروج</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => setIsAuthOpen(true)}
                    className="h-full flex items-center gap-1.5 px-3 rounded-lg cpm-btn-red text-[11px] sm:text-xs tracking-wide shrink-0"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>دخول</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Slide-Out Drawer Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-x-0 top-[calc(100%+1px)] bg-[#0c0f15] border-b border-gray-800 shadow-2xl p-3 z-50 text-right space-y-3">
            {/* Search Input in Mobile Drawer */}
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="ابحث عن سيارة أو خدمة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-3 pr-8 py-2 rounded-lg bg-[#161b24] border border-gray-700 text-xs text-white placeholder-gray-400 text-right"
              />
              <Search className="w-3.5 h-3.5 absolute right-2.5 top-2.5 text-gray-400" />
            </form>

            {/* Quick Links List */}
            <div className="grid grid-cols-1 divide-y divide-gray-800">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center justify-between py-2.5 px-2 text-xs font-bold transition ${
                      isActive ? "text-orange-500 bg-orange-500/10 rounded-lg" : "text-gray-200 hover:text-orange-500"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? "text-orange-500" : "text-gray-400"}`} />
                      <span>{link.name}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </header>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
}
