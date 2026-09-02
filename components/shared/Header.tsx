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

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { getItemCount, setIsOpen: setCartOpen } = useCartStore();
  const itemCount = getItemCount();

  const [user, setUser] = useState<any>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userDropdown, setUserDropdown] = useState(false);
  const [settings, setSettings] = useState<Record<string, string>>({});

  const fetchSession = async () => {
    try {
      const [resAuth, resSettings] = await Promise.all([
        fetch("/api/auth/me", { cache: "no-store" }),
        fetch("/api/settings", { cache: "no-store" }),
      ]);
      if (resAuth.ok) {
        const data = await resAuth.json();
        setUser(data.user);
      }
      if (resSettings.ok) {
        const data = await resSettings.json();
        if (data.settings) setSettings(data.settings);
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
      <header className="sticky top-0 z-40 w-full border-b border-gray-800 bg-[#08090d]/95 backdrop-blur-md">
        {/* Main Navbar */}
        <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-1.5 sm:gap-4">
            {/* Right: Mobile Hamburger + Logo */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-1.5 rounded-lg bg-[#12161f] border border-gray-800 text-white hover:text-orange-500 focus:outline-none"
                aria-label="القائمة الجانبية"
              >
                {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>

              <Logo size="sm" />
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      isActive
                        ? "text-orange-500 bg-orange-500/10 border border-orange-500/30"
                        : "text-gray-300 hover:text-orange-500 hover:bg-gray-800/40"
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </nav>

            {/* Left: Actions */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Search Form (Desktop) */}
              <form onSubmit={handleSearch} className="hidden md:flex relative items-center">
                <input
                  type="text"
                  placeholder="ابحث عن سيارة أو خدمة..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-36 lg:w-48 pl-3 pr-7 py-1.5 rounded-lg bg-[#12161f] border border-gray-800 focus:border-orange-500 text-xs text-white placeholder-gray-500 text-right"
                />
                <button type="submit" className="absolute right-2 text-gray-400 hover:text-orange-500" aria-label="بحث">
                  <Search className="w-3 h-3" />
                </button>
              </form>

              {/* Shopping Cart Button */}
              <button
                onClick={() => setCartOpen(true)}
                className="relative p-1.5 sm:p-2 rounded-lg bg-[#12161f] border border-gray-800 text-gray-300 hover:text-orange-500 transition"
                aria-label="سلة المشتريات"
              >
                <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-3.5 px-0.5 rounded-full bg-orange-500 text-black text-[8px] sm:text-[9px] font-black font-mono">
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
                    className="flex items-center gap-1 p-1 sm:px-2.5 sm:py-1.5 rounded-lg bg-[#12161f] border border-orange-500/30 text-right"
                  >
                    <div className="flex flex-col text-right leading-tight">
                      <span className="text-[11px] sm:text-xs font-bold text-white max-w-[70px] sm:max-w-[80px] truncate">
                        {user.name || "الحساب"}
                      </span>
                      <span className="text-[9px] sm:text-[10px] text-orange-500 font-mono font-bold">
                        {formatCurrency(user.wallet?.totalAvailable || 0)}
                      </span>
                    </div>
                    <ChevronDown className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-gray-400" />
                  </button>

                  {/* Dropdown Menu */}
                  {userDropdown && (
                    <div
                      className="absolute left-0 mt-1.5 w-48 sm:w-52 rounded-xl bg-[#0f1218] border border-gray-800 shadow-xl p-2 z-50 text-right space-y-1"
                      onClick={() => setUserDropdown(false)}
                    >
                      <div className="p-1.5 border-b border-gray-800 mb-1">
                        <p className="text-xs font-bold text-white truncate">{user.name}</p>
                        <p className="text-[10px] text-orange-500 font-mono font-bold">
                          {formatCurrency(user.wallet?.totalAvailable || 0)}
                        </p>
                      </div>

                      <Link
                        href="/wallet"
                        className="flex items-center gap-2 p-1.5 rounded-lg text-xs text-gray-300 hover:bg-gray-800/40 hover:text-orange-500 transition"
                      >
                        <Wallet className="w-3.5 h-3.5 text-orange-500" />
                        <span>محفظتي وشحن الرصيد</span>
                      </Link>

                      <Link
                        href="/orders"
                        className="flex items-center gap-2 p-1.5 rounded-lg text-xs text-gray-300 hover:bg-gray-800/40 hover:text-orange-500 transition"
                      >
                        <Car className="w-3.5 h-3.5 text-orange-500" />
                        <span>طلباتي ومشترياتي</span>
                      </Link>

                      {isAdmin && (
                        <Link
                          href="/admin/login"
                          className="flex items-center gap-2 p-1.5 rounded-lg text-xs text-orange-400 bg-orange-500/10 border border-orange-500/30 transition"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>لوحة التحكم الإدارية</span>
                        </Link>
                      )}

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 p-1.5 rounded-lg text-xs text-red-400 hover:bg-red-500/10 transition"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>تسجيل الخروج</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setIsAuthOpen(true)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-black font-extrabold text-[11px] sm:text-xs transition shadow-sm"
                >
                  <User className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span>دخول</span>
                </button>
              )}
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
