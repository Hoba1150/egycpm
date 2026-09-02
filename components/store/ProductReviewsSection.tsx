"use client";

import React, { useState } from "react";
import { Star, MessageSquare, ShieldCheck, CheckCircle2, Send, LogIn } from "lucide-react";
import { submitProductReview } from "@/lib/actions/review";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import AuthModal from "@/components/shared/AuthModal";

interface ReviewItem {
  id: string;
  rating: number;
  comment: string | null;
  isVerifiedPurchase: boolean;
  createdAt: Date | string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

interface ProductReviewsSectionProps {
  productId: string;
  initialReviews: ReviewItem[];
  totalReviews: number;
  averageRating: number;
  user?: any;
}

export default function ProductReviewsSection({
  productId,
  initialReviews,
  totalReviews,
  averageRating,
  user,
}: ProductReviewsSectionProps) {
  const [reviews, setReviews] = useState<ReviewItem[]>(initialReviews);
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setIsAuthOpen(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitProductReview({
        productId,
        rating,
        comment: comment.trim() || undefined,
      });

      if (res.success && res.review) {
        toast.success(
          res.isVerifiedPurchase
            ? "شكراً لتقييمك! تم تأكيد الشراء بنجاح (مشتري مؤكد)."
            : "تم إضافة تقييمك بنجاح!"
        );
        setReviews([
          {
            id: res.review.id,
            rating: res.review.rating,
            comment: res.review.comment,
            isVerifiedPurchase: Boolean(res.isVerifiedPurchase),
            createdAt: new Date(),
            user: {
              id: user.id,
              name: user.name || "عميل",
              image: user.image || null,
            },
          },
          ...reviews.filter((r) => r.user.id !== user.id),
        ]);
        setComment("");
      }
    } catch (err: any) {
      toast.error(err.message || "فشل إرسال التقييم.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-[#0f1218] border border-gray-800 shadow-sm space-y-6 text-right">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-4">
        <div className="space-y-1">
          <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
            <span>تقييمات وآراء العملاء</span>
          </h3>
          <p className="text-xs text-gray-400">
            تقييمات حقيقية من لاعبين قاموا بتجربة وشراء هذا المنتج
          </p>
        </div>

        <div className="flex items-center gap-3 bg-[#161b24] px-4 py-2 rounded-xl border border-gray-800 self-start sm:self-auto">
          <span className="text-2xl font-black text-yellow-400 font-mono">
            {averageRating > 0 ? averageRating.toFixed(1) : "5.0"}
          </span>
          <div className="space-y-0.5">
            <div className="flex items-center gap-0.5 text-yellow-400">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-3.5 h-3.5 ${
                    star <= Math.round(averageRating || 5)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-600"
                  }`}
                />
              ))}
            </div>
            <span className="text-[10px] text-gray-400 block font-mono">
              {reviews.length} {reviews.length === 1 ? "تقييم" : "تقييمات"}
            </span>
          </div>
        </div>
      </div>

      {/* Review Submission Form */}
      <form onSubmit={handleSubmit} className="p-4 rounded-xl bg-[#161b24] border border-gray-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-white">أضف تقييمك وتجربتك:</span>
          <div className="flex items-center gap-1 dir-ltr">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                type="button"
                key={star}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
                className="p-1 text-yellow-400 hover:scale-125 transition"
                aria-label={`تقييم ${star} نجوم`}
              >
                <Star
                  className={`w-5 h-5 ${
                    star <= (hoverRating || rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-600"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <textarea
          rows={2}
          placeholder={user ? "اكتب رأيك الصريح وسرعة التسليم والخدمة..." : "سجل الدخول لتتمكن من كتابة تقييم..."}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          disabled={!user}
          className="w-full px-3 py-2 bg-[#0f1218] border border-gray-700 rounded-xl text-xs text-white placeholder-gray-500 focus:border-orange-500 text-right"
        />

        <div className="flex items-center justify-between pt-1">
          {user ? (
            <div className="flex items-center gap-2 text-[11px] text-gray-400">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>مشارك باسم: <strong className="text-white">{user.name}</strong></span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsAuthOpen(true)}
              className="text-xs font-bold text-orange-500 hover:underline flex items-center gap-1"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>تسجيل الدخول لإضافة تقييم</span>
            </button>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-black font-extrabold text-xs transition flex items-center gap-1.5 disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSubmitting ? "جاري النشر..." : "نشر التقييم"}</span>
          </button>
        </div>
      </form>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="p-8 text-center text-xs text-gray-500 space-y-1">
          <MessageSquare className="w-8 h-8 mx-auto text-gray-600 mb-2" />
          <p>كن أول من يقيّم هذا المنتج بعد تجربته!</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-800/80 space-y-4 pt-2">
          {reviews.map((rev) => (
            <div key={rev.id} className="pt-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-500 font-bold text-xs">
                    {rev.user?.name ? rev.user.name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-white">{rev.user?.name || "لاعب CPM"}</span>
                      {rev.isVerifiedPurchase && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                          <ShieldCheck className="w-3 h-3" />
                          <span>مشتري مؤكد ✓</span>
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-500 font-mono">{formatDate(rev.createdAt)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-0.5 text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3 h-3 ${
                        i < rev.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-700"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {rev.comment && (
                <p className="text-xs text-gray-300 leading-relaxed bg-[#12161f] p-3 rounded-xl border border-gray-800/60">
                  {rev.comment}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </div>
  );
}
