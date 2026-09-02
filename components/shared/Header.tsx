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
import Logo from "@/components/shared/Logo";
import { toast } from "sonner";
import { useSettings } from "@/lib/context/SettingsContext";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { getItemCount, setIsOpen: setCartOpen } = useCartStore();
  const itemCount = getItemCount();

  const settings = useSettings();

  const [user, setUser] = useState<any>(null);
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
    { name: "CPM 2 🔥", href: "/cpm2", icon: Zap },
    { name: "المحفظة", href: "/wallet", icon: Wallet },
    { name: "السحوبات", href: "/giveaways", icon: Gift },
    { name: "شحن رصيد", href: "/deposit", icon: Wallet },
    { name: "تتبع طلبك", href: "/orders", icon: CheckSquare },
    { name: "الدعم الفني", href: "/support", icon: Headphones },
  ];

  const isAdmin = user && ["SUPER_ADMIN", "ADMIN", "SUPPORT", "ORDER_MANAGER"].includes(user.role);

  return (
    <>
      {/* Fixed Sticky Ultra-Glass Header (iOS 17 Style) */}
      <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-[#030406]/75 backdrop-blur-2xl backdrop-saturate-200 shadow-[0_4px_30px_rgba(0,0,0,0.5)] transition-all duration-300">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-2 sm:gap-4">
            {/* Right: Logo (Enlarged and highlighted) & Mobile Menu Toggle */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl bg-white/[0.04] border border-white/10 text-gray-300 hover:text-white hover:bg-white/[0.08] active:scale-95 transition backdrop-blur-md"
                aria-label="القائمة الجانبية"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              <Logo size="md" />
            </div>

            {/* Desktop Navigation Links (iOS Segmented Glass Bar) */}
            <nav className="hidden lg:flex items-center p-1.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-xl shadow-inner gap-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                      isActive
                        ? "bg-red-600 text-white shadow-[0_2px_12px_rgba(220,38,38,0.4),inset_0_1px_0_rgba(255,255,255,0.25)]"
                        : "text-gray-300 hover:text-white hover:bg-white/[0.06]"
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </nav>

            {/* Left: Actions (Search, Cart, User) */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Search Form (Desktop) */}
              <form onSubmit={handleSearch} className="hidden md:flex relative items-center">
                <input
                  type="text"
                  placeholder="بحث سريع..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-36 lg:w-48 pl-3 pr-8 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] focus:border-red-500/60 focus:bg-white/[0.07] text-xs text-white placeholder-gray-500 text-right backdrop-blur-md transition-all outline-none"
                />
                <button type="submit" className="absolute right-2.5 text-gray-400 hover:text-red-400 transition" aria-label="بحث">
                  <Search className="w-3.5 h-3.5" />
                </button>
              </form>

              {/* Shopping Cart Glass Button */}
              <button
                onClick={() => setCartOpen(true)}
                className="relative p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-gray-200 hover:text-white hover:border-red-500/40 hover:bg-white/[0.08] active:scale-95 transition backdrop-blur-md"
                aria-label="سلة المشتريات"
              >
                <ShoppingCart className="w-4 h-4" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[9px] font-black font-mono shadow-[0_2px_8px_rgba(220,38,38,0.7)] border border-white/20 animate-in zoom-in-50 duration-200">
                    {itemCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {user && <NotificationsDropdown />}

              {/* User Account / Login State */}
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setUserDropdown(!userDropdown)}
                    className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-gray-200 hover:text-white hover:border-white/20 active:scale-95 transition backdrop-blur-md"
                  >
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-red-600 to-red-800 text-white flex items-center justify-center text-xs font-black shadow-sm">
                      {user.name ? user.name[0].toUpperCase() : "U"}
                    </div>
                    <span className="hidden sm:inline text-xs font-bold truncate max-w-[100px]">
                      {user.name}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                  </button>

                  {/* Dropdown Menu Glass Panel */}
                  {userDropdown && (
                    <div className="absolute left-0 mt-2 w-52 rounded-2xl bg-[#0b0e14]/90 border border-white/10 shadow-[0_16px_40px_rgba(0,0,0,0.8)] backdrop-blur-2xl p-1.5 z-50 text-right animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="px-3 py-2 border-b border-white/[0.08] mb-1">
                        <span className="text-[11px] text-gray-400 block font-medium">الرصيد المتاح</span>
                        <span className="text-sm font-black text-red-400 font-mono">
                          {formatCurrency(user.wallet?.totalAvailable ?? 0)}
                        </span>
                      </div>

                      {isAdmin && (
                        <Link
                          href="/admin"
                          onClick={() => setUserDropdown(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-red-400 hover:bg-red-600/10 transition"
                        >
                          <ShieldAlert className="w-4 h-4" />
                          <span>لوحة التحكم (Admin)</span>
                        </Link>
                      )}

                      <Link
                        href="/profile"
                        onClick={() => setUserDropdown(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-gray-200 hover:bg-white/[0.06] transition"
                      >
                        <User className="w-4 h-4 text-gray-400" />
                        <span>الملف الشخصي</span>
                      </Link>

                      <Link
                        href="/wallet"
                        onClick={() => setUserDropdown(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-gray-200 hover:bg-white/[0.06] transition"
                      >
                        <Wallet className="w-4 h-4 text-gray-400" />
                        <span>محفظتي ورصيدي</span>
                      </Link>

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-red-400 hover:bg-red-600/10 transition text-right"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>تسجيل الخروج</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setIsAuthOpen(true)}
                  className="px-4 py-2 rounded-xl glass-button-primary text-xs font-black tracking-wide shrink-0"
                >
                  تسجيل الدخول
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-white/[0.08] bg-[#05070a]/95 backdrop-blur-3xl px-4 py-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="ابحث عن سيارة أو خدمة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-3 pr-9 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-white placeholder-gray-500 text-right outline-none focus:border-red-500"
              />
              <Search className="w-4 h-4 absolute right-3 top-3 text-gray-400" />
            </form>

            <div className="grid grid-cols-2 gap-1.5 pt-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                      isActive
                        ? "bg-red-600 text-white shadow-sm"
                        : "bg-white/[0.03] text-gray-300 hover:text-white"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.name}</span>
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
