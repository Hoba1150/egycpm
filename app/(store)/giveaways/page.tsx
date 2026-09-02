import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { getActiveGiveaways } from "@/lib/actions/giveaway";
import GiveawaysClient from "./GiveawaysClient";

export const revalidate = 30; // Fast Edge CDN Caching (Zero Latency & 98% Bandwidth Savings)

export default async function GiveawaysPage() {
  const [user, giveaways] = await Promise.all([
    getCurrentUser(),
    getActiveGiveaways(),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 text-right space-y-6">
      {/* Header */}
      <div className="border-b border-gray-800 pb-4 space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">سحوبات وجوائز المتجر الكبرى</h1>
        <p className="text-xs sm:text-sm text-gray-400">
          سجل اسمك وحسابك في اللعبة للدخول في السحب على سيارات حصرية وحسابات معدلة 1695HP!
        </p>
      </div>

      <GiveawaysClient giveaways={giveaways} user={user} />
    </div>
  );
}
