import React from "react";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import MobileBottomNav from "@/components/shared/MobileBottomNav";
import CartDrawer from "@/components/store/CartDrawer";
import CyberBackground from "@/components/shared/CyberBackground";

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex flex-col justify-between">
      <CyberBackground />
      <Header />
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
      <CartDrawer />
      <MobileBottomNav />
      <Footer />
    </div>
  );
}
