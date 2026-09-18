"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ShoppingBag, ShoppingCart, Wallet, User as UserIcon, Zap } from "lucide-react";
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
    { name: "CPM 2", href: "/cpm2", icon: Zap, isSpecial: true },
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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#07080c]/95 backdrop-blur-xl border-t border-white/[0.08] px-1 py-1.5 shadow-[0_-10px_25px_rgba(0,0,0,0.7)]">
        <div className="grid grid-cols-6 gap-0.5 max-w-md mx-auto">
          {items.map((item, idx) => {
            const Icon = item.icon;
            const isActive = item.href ? pathname === item.href : false;

            if (item.onClick) {
              return (
                <button
                  key={idx}
                  onClick={item.onClick}
                  className="flex flex-col items-center justify-center py-1 relative text-gray-400 hover:text-white transition active:scale-95"
                >
                  <div className="relative">
                    <Icon className="w-4 h-4" />
                    {Boolean(item.badge && item.badge > 0) && (
                      <span className="absolute -top-1.5 -right-2 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[var(--red-hi)] text-[8px] font-black text-white font-mono shadow-sm">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] mt-0.5 font-bold truncate max-w-full">{item.name}</span>
                </button>
              );
            }

            return (
              <Link
                key={idx}
                href={item.href!}
                className={`flex flex-col items-center justify-center py-1 relative transition active:scale-95 ${
                  isActive
                    ? item.isSpecial
                      ? "text-purple-400 font-black"
                      : "text-[var(--red-hi)] font-black"
                    : item.isSpecial
                    ? "text-purple-400/80 hover:text-purple-300"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                <div className="relative">
                  <Icon className={`w-4 h-4 ${isActive ? (item.isSpecial ? "text-purple-400" : "text-[var(--red-hi)]") : ""}`} />
                </div>
                <span className="text-[9px] mt-0.5 font-bold truncate max-w-full">{item.name}</span>
                {isActive && (
                  <span className={`absolute -bottom-1 w-4 h-0.5 rounded-full shadow-[0_0_8px_var(--red-hi)] ${item.isSpecial ? "bg-purple-500" : "bg-[var(--red-hi)]"}`} />
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
