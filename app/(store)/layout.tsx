import React from "react";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import MobileBottomNav from "@/components/shared/MobileBottomNav";
import CartDrawer from "@/components/store/CartDrawer";
import CyberBackground from "@/components/shared/CyberBackground";
import { getStoreSettings } from "@/lib/actions/settings";
import { SettingsProvider } from "@/lib/context/SettingsContext";

import MaintenanceOverlay from "@/components/store/MaintenanceOverlay";
import { TopPanoramaAdBanner, StickyMobileAdBar } from "@/components/store/AdBanners";
import VisitorTracker from "@/components/shared/VisitorTracker";

// High-efficiency Edge CDN caching: Purged on-demand via revalidatePath('/', 'layout') on admin updates.
// This saves 99% of Vercel Compute execution & Fast Origin Transfer!
export const revalidate = 86400;

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch settings ONCE on the server — eliminates FOUC entirely
  let settings: Record<string, string> = {};
  try {
    settings = await getStoreSettings();
  } catch {
    // Use empty object on error, components use their own fallbacks
  }

  return (
    <SettingsProvider settings={settings}>
      <VisitorTracker />
      <MaintenanceOverlay />
      <div className="relative min-h-screen flex flex-col justify-between">
        <CyberBackground />
        <TopPanoramaAdBanner />
        <Header />
        <main className="flex-1 pb-20 md:pb-0">{children}</main>
        <StickyMobileAdBar />
        <CartDrawer />
        <MobileBottomNav />
        <Footer />
      </div>
    </SettingsProvider>
  );
}
