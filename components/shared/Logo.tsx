"use client";

import React from "react";
import Link from "next/link";
import { Car } from "lucide-react";
import { useSettings } from "@/lib/context/SettingsContext";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
}

export default function Logo({ size = "md", showText = true }: LogoProps) {
  const settings = useSettings();

  const storeName = settings.store_name || "EGY CPM";
  const storeSlogan = settings.store_slogan || "Car Parking Marketplace";
  const customLogoUrl = settings.store_logo_url;

  // Prominent, enlarged sizes for maximum elegance & iOS-style clarity
  const iconSizes = {
    sm: "h-9 sm:h-10 w-auto max-w-[120px]",
    md: "h-11 sm:h-12 w-auto max-w-[150px]",
    lg: "h-14 sm:h-16 w-auto max-w-[190px]",
    xl: "h-20 sm:h-24 w-auto max-w-[260px]",
  };

  const emblemSizes = {
    sm: "w-9 h-9",
    md: "w-11 h-11",
    lg: "w-14 h-14",
    xl: "w-20 h-20",
  };

  const titleSizes = {
    sm: "text-sm sm:text-base",
    md: "text-base sm:text-lg",
    lg: "text-xl sm:text-2xl",
    xl: "text-2xl sm:text-3xl",
  };

  return (
    <Link href="/" className="flex items-center gap-3 group shrink-0 transition-transform active:scale-95 duration-200">
      {/* Dynamic Emblem / Logo with iOS-style glass aura */}
      {customLogoUrl ? (
        <div className="relative shrink-0 flex items-center justify-center p-1 rounded-2xl bg-white/[0.03] border border-white/10 shadow-[0_8px_20px_-4px_rgba(0,0,0,0.6)] group-hover:border-red-500/40 group-hover:shadow-[0_0_24px_rgba(220,38,38,0.35)] transition-all duration-300">
          <img
            src={customLogoUrl}
            alt={storeName}
            className={`${iconSizes[size]} object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] group-hover:scale-105 transition duration-300`}
          />
        </div>
      ) : (
        <div
          className={`flex items-center justify-center ${emblemSizes[size]} rounded-2xl bg-gradient-to-br from-red-600 via-red-700 to-black border border-white/20 text-white shadow-[0_8px_20px_-4px_rgba(220,38,38,0.5),inset_0_1px_0_rgba(255,255,255,0.3)] group-hover:scale-105 group-hover:shadow-[0_0_28px_rgba(220,38,38,0.6)] transition-all duration-300`}
        >
          <Car className="w-5 h-5 text-white drop-shadow-md" />
        </div>
      )}

      {/* Brand Text */}
      {showText && (
        <div className="text-right leading-tight">
          <span className={`${titleSizes[size]} font-black text-white block tracking-tight group-hover:text-red-400 transition-colors`}>
            {storeName}
          </span>
          <span className="text-[10px] sm:text-[11px] font-mono tracking-widest text-red-500/90 font-bold block uppercase mt-0.5">
            {storeSlogan}
          </span>
        </div>
      )}
    </Link>
  );
}
