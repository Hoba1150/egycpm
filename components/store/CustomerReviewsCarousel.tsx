import React from "react";
import { Star, ShieldCheck, Quote } from "lucide-react";

export default function CustomerReviewsCarousel() {
  const reviews = [
    {
      name: "عمر الراجحي",
      badge: "مشتري معتمد",
      car: "BMW M8 1695HP Police Mod",
      rating: 5,
      comment: "أفضل متجر لخدمات كار باركينج! طلبت بي إم دبليو واستلمتها في أقل من 7 دقائق والسيارة ممتازة. شكراً لكم على السرعة والأمانة.",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120",
    },
    {
      name: "كريم الزهراني",
      badge: "مشتري معتمد",
      car: "شحن 50 مليون كاش + كينج رانك",
      rating: 5,
      comment: "شحنت 50 مليون وتفعيل الكينج رانك الملكي، التسليم كان فوري بدون أي تأخير وأمان تام.",
      avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120",
    },
    {
      name: "يوسف المهدي",
      badge: "مشتري معتمد",
      car: "Nissan Skyline GT-R R34",
      rating: 5,
      comment: "تفاصيل الرسمة تحفة ممتازة! متجر ثقة وسريع جداً في الرد والدعم الفني محترم للغاية.",
      avatar: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=120",
    },
  ];

  return (
    <section className="py-8 sm:py-12 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto text-right">
      <div className="text-center max-w-2xl mx-auto mb-8 space-y-1.5">
        <span className="text-xs font-bold text-orange-500 uppercase tracking-wide">
          آراء وتقييمات العملاء
        </span>
        <h2 className="text-xl sm:text-3xl font-black text-white">
          تجارب حقيقية لعملائنا
        </h2>
        <p className="text-xs sm:text-sm text-gray-400">
          يثق بنا آلاف اللاعبين لتعديل وشحن سياراتهم
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        {reviews.map((r, idx) => (
          <div
            key={idx}
            className="p-4 sm:p-5 rounded-xl bg-[#0f1218] border border-gray-800 flex flex-col justify-between space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-0.5 text-amber-400">
                {[...Array(r.rating)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                ))}
              </div>
              <Quote className="w-4 h-4 text-gray-600" />
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              &quot;{r.comment}&quot;
            </p>

            <div className="pt-3 border-t border-gray-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img
                  src={r.avatar}
                  alt={r.name}
                  className="w-8 h-8 rounded-full object-cover border border-gray-700"
                />
                <div>
                  <h4 className="text-xs font-bold text-white">{r.name}</h4>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>{r.badge}</span>
                  </span>
                </div>
              </div>

              <span className="text-[10px] text-gray-500 max-w-[100px] truncate">
                {r.car}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
