import React from "react";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import MobileBottomNav from "@/components/shared/MobileBottomNav";
import CartDrawer from "@/components/store/CartDrawer";
import CyberBackground from "@/components/shared/CyberBackground";
import { getStoreSettings } from "@/lib/actions/settings";
import { SettingsProvider } from "@/lib/context/SettingsContext";

import MaintenanceOverlay from "@/components/store/MaintenanceOverlay";

// Revalidate every 10 seconds so changes from admin panel appear almost instantly
export const revalidate = 10;

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
      <MaintenanceOverlay />
      <div className="relative min-h-screen flex flex-col justify-between">
        <CyberBackground />
        <Header />
        <main className="flex-1 pb-20 md:pb-0">{children}</main>
        <CartDrawer />
        <MobileBottomNav />
        <Footer />
      </div>
    </SettingsProvider>
  );
}
