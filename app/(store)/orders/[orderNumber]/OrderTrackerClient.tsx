"use client";

import React, { useState } from "react";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

export default function OrderTrackerClient({ copyText }: { copyText: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!copyText) return;
    navigator.clipboard.writeText(copyText);
    setCopied(true);
    toast.success("تم نسخ بيانات الحساب بنجاح!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="p-2 rounded-xl bg-purple-500/20 text-neon-purple hover:bg-purple-500/30 transition flex items-center gap-1 text-xs font-bold"
    >
      {copied ? <Check className="w-4 h-4 text-neon-green" /> : <Copy className="w-4 h-4" />}
      <span>{copied ? "تم النسخ" : "نسخ البيانات"}</span>
    </button>
  );
}
