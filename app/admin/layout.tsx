import React from "react";
import { getCurrentAdminUser } from "@/lib/auth";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopbar from "@/components/admin/AdminTopbar";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN", "SUPPORT", "ORDER_MANAGER"];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentAdminUser();
  const isAdmin = Boolean(user && ADMIN_ROLES.includes(user.role));

  // If not logged in as admin — return clean layout for login page without sidebar
  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-[#050608] flex items-center justify-center">
        {children}
      </div>
    );
  }

  // Authenticated Admin Layout
  return (
    <div
      className="min-h-screen text-gray-100 flex flex-col md:flex-row"
      style={{ background: "#07090e" }}
    >
      {/* Sidebar */}
      <AdminSidebar user={user} />

      {/* Main Admin Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden overflow-y-auto">
        <AdminTopbar user={user} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
