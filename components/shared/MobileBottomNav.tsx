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
      {/* Floating iOS Glass Island Bottom Navigation */}
      <nav className="md:hidden fixed bottom-3 inset-x-3 max-w-md mx-auto z-40 glass-nav rounded-full px-2 py-1.5 shadow-[0_12px_35px_rgba(0,0,0,0.85),_0_0_22px_rgba(255,42,53,0.18)] border border-white/10">
        <div className="grid grid-cols-6 gap-0.5 items-center">
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
                    <Icon className="w-4 h-4" />
                    {Boolean(item.badge && item.badge > 0) && (
                      <span className="absolute -top-1.5 -right-2 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[var(--red-core)] text-[8px] font-black text-white font-mono shadow-[0_0_8px_var(--red-core)]">
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
                className={`flex flex-col items-center justify-center py-1 relative transition active:scale-90 ${
                  isActive
                    ? item.isSpecial
                      ? "text-purple-300 font-black"
                      : "text-white font-black"
                    : item.isSpecial
                    ? "text-purple-400/80 hover:text-purple-300"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                <div className="relative">
                  <Icon className={`w-4 h-4 ${isActive ? (item.isSpecial ? "text-purple-400" : "text-[var(--red-core)]") : ""}`} />
                </div>
                <span className="text-[9px] mt-0.5 font-bold truncate max-w-full">{item.name}</span>
                {isActive && (
                  <span className={`absolute -bottom-1 w-3.5 h-1 rounded-full ${item.isSpecial ? "bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]" : "bg-[var(--red-core)] shadow-[0_0_8px_var(--red-core)]"}`} />
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
