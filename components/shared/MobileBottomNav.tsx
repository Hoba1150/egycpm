"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ShoppingBag, ShoppingCart, Wallet, User as UserIcon } from "lucide-react";
import { useCartStore } from "@/lib/store";
import AuthModal from "@/components/shared/AuthModal";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { getItemCount, setIsOpen: setCartOpen } = useCartStore();
  const itemCount = getItemCount();
  const [user, setUser] = useState<any>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const fetchUser = () => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => setUser(data.user))
      .catch(() => {});
  };

  useEffect(() => {
    fetchUser();
    window.addEventListener("cpm_auth_changed", fetchUser);
    return () => {
      window.removeEventListener("cpm_auth_changed", fetchUser);
    };
  }, []);

  const items = [
    { name: "الرئيسية", href: "/", icon: Home },
    { name: "المتجر", href: "/shop", icon: ShoppingBag },
    {
      name: "السلة",
      onClick: () => setCartOpen(true),
      icon: ShoppingCart,
      badge: itemCount,
    },
    { name: "المحفظة", href: "/wallet", icon: Wallet },
    {
      name: user ? "حسابي" : "دخول",
      href: user ? "/profile" : undefined,
      onClick: user ? undefined : () => setIsAuthOpen(true),
      icon: UserIcon,
    },
  ];

  return (
    <>
      {/* iOS Floating Frosted Glass Dock */}
      <nav className="md:hidden fixed bottom-3 left-3 right-3 z-30 rounded-3xl bg-[#080a0f]/80 backdrop-blur-2xl border border-white/10 shadow-[0_12px_36px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.1)] px-2 py-2">
        <div className="grid grid-cols-5 gap-1">
          {items.map((item, idx) => {
            const Icon = item.icon;
            const isActive = item.href ? pathname === item.href : false;

            if (item.onClick) {
              return (
                <button
                  key={idx}
                  onClick={item.onClick}
                  className="flex flex-col items-center justify-center py-1 relative text-gray-400 hover:text-white transition active:scale-90"
                >
                  <div className="relative">
                    <Icon className="w-5 h-5" />
                    {Boolean(item.badge && item.badge > 0) && (
                      <span className="absolute -top-1.5 -right-2 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-red-600 text-[9px] font-black text-white font-mono shadow-sm border border-white/20">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] mt-1 font-medium">{item.name}</span>
                </button>
              );
            }

            return (
              <Link
                key={idx}
                href={item.href!}
                className={`flex flex-col items-center justify-center py-1 relative transition active:scale-90 ${
                  isActive ? "text-white font-black" : "text-gray-400 hover:text-gray-200"
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${isActive ? "text-red-500 drop-shadow-[0_0_8px_rgba(220,38,38,0.6)]" : ""}`} />
                </div>
                <span className="text-[10px] mt-1 font-medium">{item.name}</span>
                {isActive && (
                  <span className="absolute -bottom-0.5 w-4 h-1 bg-red-500 rounded-full shadow-[0_0_6px_rgba(220,38,38,0.8)]" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
}
