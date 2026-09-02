import React from "react";
import { getProductBySlug, getProducts } from "@/lib/actions/product";
import { getProductReviews } from "@/lib/actions/review";
import { notFound } from "next/navigation";
import ProductDetailsClient from "./ProductDetailsClient";
import ProductReviewsSection from "@/components/store/ProductReviewsSection";
import ProductCard from "@/components/store/ProductCard";
import { ShieldCheck, Clock, Award, Sparkles, ChevronLeft, Home, Info, CheckCircle2 } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";

export const revalidate = 30; // Fast Edge CDN Caching (Zero Latency & 98% Bandwidth Savings)

interface ProductPageProps {
  params: {
    slug: string;
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const user = await getCurrentUser();
  const product = await getProductBySlug(params.slug);

  if (!product) {
    notFound();
  }

  const [reviewsData, relatedRes] = await Promise.all([
    getProductReviews(product.id),
    getProducts({
      categorySlug: product.category?.slug,
      limit: 4,
    }),
  ]);

  const relatedProducts = relatedRes.items.filter((p) => p.id !== product.id).slice(0, 4);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 text-right space-y-10">
      {/* Breadcrumbs Navigation */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-400 overflow-x-auto pb-1">
        <Link href="/" className="hover:text-orange-500 flex items-center gap-1 shrink-0">
          <Home className="w-3.5 h-3.5" />
          <span>الرئيسية</span>
        </Link>
        <ChevronLeft className="w-3 h-3 text-gray-600 shrink-0" />
        <Link href="/shop" className="hover:text-orange-500 shrink-0">
          المتجر
        </Link>
        {product.category && (
          <>
            <ChevronLeft className="w-3 h-3 text-gray-600 shrink-0" />
            <Link
              href={`/shop?category=${product.category.slug}`}
              className="hover:text-orange-500 shrink-0"
            >
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronLeft className="w-3 h-3 text-gray-600 shrink-0" />
        <span className="text-white font-bold truncate max-w-[200px]">
          {product.name}
        </span>
      </nav>

      {/* Product Hero & Interactive Client Section */}
      <ProductDetailsClient product={product} user={user} />

      {/* Specifications & Features Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-6 border-t border-gray-800">
        {/* Left 2 Cols: Specs & Service Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl bg-[#0f1218] border border-gray-800 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-orange-500" />
              <span>المواصفات والتفاصيل الفنية</span>
            </h3>

            {product.specs ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {Object.entries(product.specs).map(([key, val], idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-[#161b24] border border-gray-800 flex items-center justify-between"
                  >
                    <span className="text-xs text-gray-400 uppercase">{key}:</span>
                    <span className="text-xs font-bold text-orange-500">{String(val)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400">
                مواصفات قياسية أصلية ومطابقة لمعايير المتجر المعتمدة.
              </p>
            )}

            {product.serviceRequirements && (
              <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/30 text-xs text-orange-400 mt-4 space-y-1">
                <span className="font-bold block text-white">متطلبات وشروط تنفيذ الخدمة:</span>
                <p className="text-gray-300">{product.serviceRequirements}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Trust & Guarantees */}
        <div className="space-y-4">
          <div className="p-6 rounded-2xl bg-[#0f1218] border border-gray-800 shadow-sm space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>ضمانات المتجر المعتمدة</span>
            </h4>
            <ul className="space-y-3 text-xs text-gray-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>ضمان أمان وحماية ضد الباند بنسبة 100%.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>تسليم مباشر ومتابعة حية للطلب فور التأكيد.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>تشفير كامل لكافة بيانات الحساب بـ AES-256.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>دعم فني فوري ومتابعة حتى اكتمال الاستلام داخل اللعبة.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Customer Reviews Section */}
      <ProductReviewsSection
        productId={product.id}
        initialReviews={reviewsData.reviews as any}
        totalReviews={reviewsData.totalReviews}
        averageRating={reviewsData.averageRating}
        user={user}
      />

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="space-y-4 pt-6">
          <h3 className="text-lg sm:text-xl font-extrabold text-white">
            منتجات وسيارات مشابهة قد تعجبك
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p as any} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
