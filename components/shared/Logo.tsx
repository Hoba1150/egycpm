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
    sm: "h-8 sm:h-9 w-auto max-w-[100px]",
    md: "h-10 sm:h-11 w-auto max-w-[130px]",
    lg: "h-14 sm:h-16 w-auto max-w-[170px]",
  };

  const emblemSizes = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-14 h-14",
  };

  const titleSizes = {
    sm: "text-xs sm:text-sm",
    md: "text-sm sm:text-base",
    lg: "text-xl sm:text-2xl",
  };

  return (
    <Link href="/" className="flex items-center gap-2.5 group shrink-0">
      {/* Dynamic Emblem / Logo Icon */}
      {customLogoUrl ? (
        <div className="relative shrink-0">
          <img
            src={customLogoUrl}
            alt={storeName}
            className={`${iconSizes[size]} object-contain rounded-xl drop-shadow-[0_0_12px_rgba(220,38,38,0.4)] group-hover:scale-105 transition duration-300`}
          />
        </div>
      ) : (
        <div
          className={`flex items-center justify-center ${emblemSizes[size]} rounded-xl bg-gradient-to-br from-red-600 via-red-700 to-black border border-red-500/50 text-white shadow-[0_0_15px_rgba(220,38,38,0.4)] group-hover:scale-105 transition duration-300`}
        >
          <Car className="w-5 h-5 text-white" />
        </div>
      )}

      {/* Brand Text */}
      {showText && (
        <div className="text-right">
          <span className={`${titleSizes[size]} font-black text-white block leading-none tracking-tight group-hover:text-red-500 transition`}>
            {storeName}
          </span>
          <span className="text-[9px] text-red-500 font-mono block mt-1 uppercase tracking-wider font-bold">
            {storeSlogan}
          </span>
        </div>
      )}
    </Link>
  );
}

