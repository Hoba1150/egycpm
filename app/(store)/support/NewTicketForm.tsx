"use client";

import React, { useState } from "react";
import { createSupportTicket } from "@/lib/actions/ticket";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";
import AuthModal from "@/components/shared/AuthModal";

export default function NewTicketForm({
  user,
  defaultRelatedId,
}: {
  user?: any;
  defaultRelatedId?: string;
}) {
  const router = useRouter();
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<"ORDER" | "DEPOSIT" | "WALLET" | "PRODUCT" | "GENERAL">("ORDER");
  const [relatedId, setRelatedId] = useState(defaultRelatedId || "");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setIsAuthOpen(true);
      return;
    }

    if (!subject.trim() || subject.trim().length < 4) {
      toast.error("يرجى إدخال عنوان واضح للتذكرة.");
      return;
    }

    if (!message.trim() || message.trim().length < 10) {
      toast.error("يرجى كتابة تفاصيل المشكلة أو الاستفسار (10 أحرف على الأقل).");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createSupportTicket({
        subject: subject.trim(),
        category,
        relatedId: relatedId.trim() || undefined,
        message: message.trim(),
      });

      if (res.success) {
        toast.success(`تم فتح التذكرة رقم ${res.ticket.ticketNumber} بنجاح!`);
        router.push(`/support/${res.ticket.ticketNumber}`);
      }
    } catch (err: any) {
      toast.error(err.message || "فشل إرسال التذكرة.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1">
            عنوان التذكرة *
          </label>
          <input
            type="text"
            required
            placeholder="مثال: استفسار بخصوص تسليم سيارة M8"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-[#1a202c] border border-gray-700 rounded-xl text-xs text-white placeholder-gray-500 focus:border-orange-500 text-right"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              القسم المتعلق بالمشكلة
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full px-3.5 py-2.5 bg-[#1a202c] border border-gray-700 rounded-xl text-xs text-white focus:border-orange-500 text-right"
            >
              <option value="ORDER">مشكلة أو استفسار بطلب (Order)</option>
              <option value="DEPOSIT">شحن وإيداع المحفظة (Deposit)</option>
              <option value="WALLET">رصيد المحفظة والهدايا (Wallet)</option>
              <option value="PRODUCT">استفسار عن سيارة أو خدمة (Product)</option>
              <option value="GENERAL">استفسار عام (General)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              رقم الطلب أو الإيداع (اختياري)
            </label>
            <input
              type="text"
              placeholder="CPM-ORD-XXXXX أو DEP-XXXX"
              value={relatedId}
              onChange={(e) => setRelatedId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#1a202c] border border-gray-700 rounded-xl text-xs text-white placeholder-gray-500 focus:border-orange-500 text-right font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1">
            تفاصيل المشكلة أو الاستفسار *
          </label>
          <textarea
            required
            rows={4}
            placeholder="اشرح مشكلتك بالتفصيل ليتمكن فريق الدعم من مساعدتك بأسرع وقت..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full p-3 bg-[#1a202c] border border-gray-700 rounded-xl text-xs text-white placeholder-gray-500 focus:border-orange-500 text-right"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 rounded-xl bg-orange-500 text-black font-bold text-xs hover:scale-[1.01] active:scale-[0.98] transition flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>إرسال التذكرة للدعم الفني</span>
            </>
          )}
        </button>
      </form>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
}
