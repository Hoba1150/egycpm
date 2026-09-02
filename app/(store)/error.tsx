"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Store error:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4 text-right">
      <div className="max-w-md w-full p-6 sm:p-8 rounded-2xl bg-[#0f1218] border border-gray-800 shadow-sm text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center mx-auto border border-orange-500/20">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <div className="space-y-1">
          <h2 className="text-lg font-extrabold text-white">حدث خطأ غير متوقع</h2>
          <p className="text-xs text-gray-400">
            حدث انقطاع مؤقت، اضغط إعادة المحاولة ليتم تحديث الصفحة والبيانات فوراً.
          </p>
        </div>

        <div className="flex gap-2 justify-center pt-2">
          <button
            onClick={() => reset()}
            className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-black font-extrabold text-xs shadow-sm transition flex items-center gap-1.5"
          >
            <RefreshCw className="w-4 h-4" />
            <span>إعادة المحاولة</span>
          </button>
          <Link
            href="/"
            className="px-4 py-2.5 rounded-xl bg-[#161b24] text-gray-300 text-xs font-bold hover:text-white border border-gray-700 transition flex items-center gap-1.5"
          >
            <Home className="w-4 h-4" />
            <span>الرئيسية</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
