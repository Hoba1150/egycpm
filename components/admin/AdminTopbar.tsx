"use client";

import React from "react";
import { LogOut, Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function AdminTopbar({ user }: { user: any }) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout?type=admin", { method: "POST" });
      toast.success("تم تسجيل الخروج من لوحة الإدارة.");
      router.push("/admin/login");
      router.refresh();
    } catch {
      toast.error("فشل تسجيل الخروج.");
    }
  };

  return (
    <header className="h-14 border-b border-gray-800 bg-[#0d1117]/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between z-30">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-500 text-xs font-mono font-bold">
          <Shield className="w-3.5 h-3.5" />
          <span>EGY CPM COMMAND</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold transition"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>تسجيل خروج</span>
        </button>
      </div>
    </header>
  );
}
