"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Car } from "lucide-react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export default function Logo({ size = "md", showText = true }: LogoProps) {
  const [settings, setSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/settings", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) setSettings(data.settings);
      })
      .catch(() => {});
  }, []);

  const storeName = settings.store_name || "EGY CPM";
  const storeSlogan = settings.store_slogan || "Car Parking Marketplace";
  const customLogoUrl = settings.store_logo_url;

  const iconSizes = {
    sm: "w-7 h-7",
    md: "w-9 h-9",
    lg: "w-12 h-12",
  };

  const titleSizes = {
    sm: "text-xs sm:text-sm",
    md: "text-sm sm:text-base",
    lg: "text-xl sm:text-2xl",
  };

  return (
    <Link href="/" className="flex items-center gap-2 group shrink-0">
      {/* Dynamic Emblem / Logo Icon */}
      {customLogoUrl ? (
        <img
          src={customLogoUrl}
          alt={storeName}
          className={`${iconSizes[size]} rounded-lg object-contain border border-orange-500/40`}
        />
      ) : (
        <div
          className={`flex items-center justify-center ${iconSizes[size]} rounded-lg bg-orange-500/10 border border-orange-500/40 text-orange-500`}
        >
          <Car className="w-4 h-4" />
        </div>
      )}

      {/* Brand Text */}
      {showText && (
        <div className="text-right">
          <span className={`${titleSizes[size]} font-black text-white block leading-none`}>
            {storeName}
          </span>
          <span className="text-[9px] text-gray-400 font-mono block mt-0.5 uppercase">
            {storeSlogan}
          </span>
        </div>
      )}
    </Link>
  );
}
