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
    <div className="flex items-center select-none py-0.5">
      {/* Enlarged Logo Image occupying full slot */}
      {customLogoUrl ? (
        <img
          src={customLogoUrl}
          alt={storeName}
          className="h-10 sm:h-12 w-auto max-w-[150px] sm:max-w-[180px] object-contain drop-shadow-[0_0_12px_rgba(255,42,53,0.35)] transition-transform group-hover:scale-105"
        />
      ) : (
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-[var(--red-core)] to-[#0c0e15] flex items-center justify-center border border-white/10 shadow-[0_0_15px_rgba(255,42,53,0.5)] shrink-0 group-hover:shadow-[0_0_20px_rgba(255,42,53,0.8)] transition-all">
          <Car className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>
      )}
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
    window.addEventListener("focus", handleAuthEvent);
    return () => {
      window.removeEventListener("cpm_auth_changed", handleAuthEvent);
      window.removeEventListener("focus", handleAuthEvent);
    };
  }, [pathname]);

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
    { name: "CPM 2", href: "/cpm2", icon: Zap, isSpecial: true },
    { name: "المحفظة", href: "/wallet", icon: Wallet },
    { name: "السحوبات", href: "/giveaways", icon: Gift },
    { name: "شحن رصيد", href: "/deposit", icon: Wallet },
    { name: "تتبع طلبك", href: "/orders", icon: CheckSquare },
    { name: "الدعم الفني", href: "/support", icon: Headphones },
  ];

  const isAdmin = user && ["SUPER_ADMIN", "ADMIN", "SUPPORT", "ORDER_MANAGER"].includes(user.role);

  return (
    <>
      <header className="sticky top-2 sm:top-3 z-40 w-full px-2.5 sm:px-4 transition-all">
        {/* Floating Glass Island Navbar */}
        <div className="max-w-7xl mx-auto glass-nav rounded-2xl sm:rounded-full px-2.5 sm:px-4 py-1.5 sm:py-2 flex items-center justify-between gap-2 sm:gap-4 relative overflow-visible">
          
          {/* Subtle Ambient Red Underglow beneath the island */}
          <div className="absolute -bottom-2 inset-x-8 h-3 bg-[var(--red-ambient)] blur-xl pointer-events-none rounded-full opacity-70" />

          {/* Right: Logo Slot & Mobile Menu Trigger */}
          <div className="flex items-center gap-2">
            {/* Mobile hamburger button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden w-8 h-8 rounded-full glass-pill flex items-center justify-center text-gray-300 hover:text-white transition active:scale-95"
              aria-label="القائمة الجانبية"
            >
              {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>

            {/* Logo Link */}
            <Link
              href="/"
              className="flex items-center gap-2 px-2 sm:px-3 py-1 rounded-full hover:bg-white/[0.04] transition group"
            >
              <LogoEmblem />
            </Link>
          </div>

          {/* Center: Desktop iOS Glass Navigation Pills */}
          <nav className="hidden lg:flex items-center gap-1.5">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              if (link.isSpecial) {
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative px-3.5 py-1.5 rounded-full text-xs font-black transition flex items-center gap-1.5 ${
                      isActive
                        ? "text-purple-300 bg-purple-950/70 border border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.45)]"
                        : "text-purple-400 hover:text-white bg-purple-950/30 hover:bg-purple-900/40 border border-purple-500/30"
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                    <span>{link.name}</span>
                    <span className="px-1 py-0.2 rounded-full text-[8px] bg-purple-500 text-white font-mono font-black">NEW</span>
                  </Link>
                );
              }
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                    isActive
                      ? "glass-pill-active text-white font-black"
                      : "text-gray-300 hover:text-white hover:bg-white/[0.06]"
                  }`}
                >
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--red-core)] shadow-[0_0_8px_var(--red-core)]" />
                  )}
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Left: Actions (Search, Cart, User/Auth) */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Search Form (Desktop Glass Pill) */}
            <form onSubmit={handleSearch} className="hidden md:flex relative items-center">
              <input
                type="text"
                placeholder="ابحث عن سيارة أو خدمة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-36 lg:w-44 pl-3 pr-7 py-1.5 rounded-full bg-black/40 border border-white/10 focus:border-[var(--red-core)] focus:outline-none text-xs text-white placeholder-gray-500 text-right transition"
              />
              <button type="submit" className="absolute right-2.5 text-gray-400 hover:text-[var(--red-core)] transition" aria-label="بحث">
                <Search className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Shopping Cart Glass Button */}
            <button
              onClick={() => setCartOpen(true)}
              className="relative h-8 sm:h-9 px-3 rounded-full glass-pill text-gray-300 hover:text-white hover:border-[var(--red-core)] transition flex items-center justify-center shrink-0 active:scale-95"
              aria-label="سلة المشتريات"
            >
              <ShoppingCart className="w-4 h-4" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[17px] h-4 px-1 rounded-full bg-[var(--red-core)] text-white text-[9px] font-black font-mono shadow-[0_0_10px_var(--red-core)]">
                  {itemCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {user && <NotificationsDropdown />}

            {/* User Account / Login State */}
            <div className="h-8 sm:h-9 flex items-center shrink-0">
              {user ? (
                <div className="relative h-full flex items-center">
                  <button
                    onClick={() => setUserDropdown(!userDropdown)}
                    className="h-full flex items-center gap-1.5 px-3 rounded-full glass-pill border-white/10 hover:border-[var(--red-core)] transition active:scale-95"
                  >
                    <div className="flex flex-col text-right leading-none justify-center">
                      <span className="text-[10px] sm:text-[11px] font-bold text-white max-w-[70px] sm:max-w-[85px] truncate">
                        {user.name || "الحساب"}
                      </span>
                      <span className="text-[9px] sm:text-[10px] text-[var(--red-core)] font-mono font-black mt-0.5">
                        {formatCurrency(user.wallet?.totalAvailable || 0)}
                      </span>
                    </div>
                    <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${userDropdown ? "rotate-180" : ""}`} />
                  </button>

                  {/* Dropdown Menu — Glass Modal */}
                  {userDropdown && (
                    <>
                      {/* Backdrop to close on outside click */}
                      <div
                        className="fixed inset-0 z-[45]"
                        onClick={() => setUserDropdown(false)}
                      />
                      <div
                        className="absolute top-full left-0 mt-2 w-52 sm:w-56 rounded-2xl glass-panel p-2 z-[46] text-right space-y-1 shadow-2xl border border-white/10"
                        onClick={() => setUserDropdown(false)}
                      >
                        <div className="p-2 border-b border-white/10 mb-1">
                          <p className="text-xs font-bold text-white truncate">{user.name}</p>
                          <p className="text-[10px] text-[var(--red-core)] font-mono font-bold">
                            {formatCurrency(user.wallet?.totalAvailable || 0)}
                          </p>
                        </div>

                        <Link
                          href="/wallet"
                          className="flex items-center gap-2 p-2 rounded-xl text-xs text-gray-300 hover:bg-white/[0.06] hover:text-white transition"
                        >
                          <Wallet className="w-3.5 h-3.5 text-[var(--red-core)] shrink-0" />
                          <span>محفظتي وشحن الرصيد</span>
                        </Link>

                        <Link
                          href="/orders"
                          className="flex items-center gap-2 p-2 rounded-xl text-xs text-gray-300 hover:bg-white/[0.06] hover:text-white transition"
                        >
                          <Car className="w-3.5 h-3.5 text-[var(--red-core)] shrink-0" />
                          <span>طلباتي ومشترياتي</span>
                        </Link>

                        {isAdmin && (
                          <Link
                            href="/admin"
                            className="flex items-center gap-2 p-2 rounded-xl text-xs text-red-300 bg-red-950/40 border border-red-500/30 transition"
                          >
                            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                            <span>لوحة التحكم الإدارية</span>
                          </Link>
                        )}

                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 p-2 rounded-xl text-xs text-red-400 hover:bg-red-500/10 transition"
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
                  className="h-full flex items-center gap-1.5 px-3.5 rounded-full cpm-btn-red text-[11px] sm:text-xs tracking-wide shrink-0"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>دخول</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Slide-Out Glass Island Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden mt-2 max-w-7xl mx-auto rounded-2xl glass-panel p-3 shadow-2xl text-right space-y-3 border border-white/10 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Search Input in Mobile Drawer */}
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="ابحث عن سيارة أو خدمة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-3 pr-8 py-2 rounded-xl bg-black/50 border border-white/10 focus:border-[var(--red-core)] focus:outline-none text-xs text-white placeholder-gray-400 text-right"
              />
              <Search className="w-3.5 h-3.5 absolute right-2.5 top-2.5 text-gray-400" />
            </form>

            {/* Quick Links List */}
            <div className="grid grid-cols-1 gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center justify-between py-2 px-3 text-xs font-bold rounded-xl transition ${
                      isActive
                        ? "glass-pill-active text-white"
                        : "text-gray-300 hover:bg-white/[0.05] hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? "text-[var(--red-core)]" : "text-gray-400"}`} />
                      <span>{link.name}</span>
                    </div>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--red-core)] shadow-[0_0_6px_var(--red-core)]" />
                    )}
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
