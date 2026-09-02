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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#0c0f15]/95 backdrop-blur-md border-t border-gray-800 px-1 py-1">
        <div className="grid grid-cols-5 gap-1">
          {items.map((item, idx) => {
            const Icon = item.icon;
            const isActive = item.href ? pathname === item.href : false;

            if (item.onClick) {
              return (
                <button
                  key={idx}
                  onClick={item.onClick}
                  className="flex flex-col items-center justify-center py-1 relative text-gray-400 hover:text-orange-500 transition"
                >
                  <div className="relative">
                    <Icon className="w-4 h-4" />
                    {Boolean(item.badge && item.badge > 0) && (
                      <span className="absolute -top-1.5 -right-2 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-orange-500 text-[8px] font-bold text-black font-mono">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] mt-0.5 font-medium">{item.name}</span>
                </button>
              );
            }

            return (
              <Link
                key={idx}
                href={item.href!}
                className={`flex flex-col items-center justify-center py-1 relative transition ${
                  isActive
                    ? "text-orange-500 font-bold"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                <div className="relative">
                  <Icon className={`w-4 h-4 ${isActive ? "text-orange-500" : ""}`} />
                </div>
                <span className="text-[9px] mt-0.5 font-medium">{item.name}</span>
                {isActive && (
                  <span className="absolute -bottom-0.5 w-4 h-0.5 bg-orange-500 rounded-full" />
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
