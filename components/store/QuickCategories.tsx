import React from 'react';
import Link from 'next/link';
import { Car, Coins, Crown, Zap, Shield, Sparkles, Wrench } from 'lucide-react';

const CATEGORIES = [
  { id: 'cpm2', name: 'خدمات CPM 2', href: '/cpm2', icon: Zap, badge: 'NEW', color: 'from-purple-600/20 to-purple-950/40 border-purple-500/40 text-purple-400' },
  { id: 'cars', name: 'سيارات معدلة', href: '/cars', icon: Car, color: 'from-red-600/20 to-red-950/40 border-red-500/40 text-red-500' },
  { id: 'coins', name: 'شحن كاش 50M', href: '/shop?search=50M', icon: Coins, color: 'from-emerald-600/20 to-emerald-950/40 border-emerald-500/40 text-emerald-400' },
  { id: 'ranks', name: 'كينج رانك وفينيل', href: '/shop?search=%D9%83%D9%8A%D9%86%D8%AC', icon: Crown, color: 'from-amber-600/20 to-amber-950/40 border-amber-500/40 text-amber-400' },
  { id: 'accounts', name: 'حسابات جاهزة', href: '/accounts', icon: Shield, color: 'from-blue-600/20 to-blue-950/40 border-blue-500/40 text-blue-400' },
  { id: 'services', name: 'تعديل وتزويد', href: '/services', icon: Wrench, color: 'from-orange-600/20 to-orange-950/40 border-orange-500/40 text-orange-400' },
];

export default function QuickCategories() {
  return (
    <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-3 text-right">
        <Link href="/shop" className="text-xs font-bold text-gray-400 hover:text-red-500 transition">
          عرض كافة الأقسام ←
        </Link>
        <h2 className="text-sm sm:text-base font-black text-white flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-red-500" />
          <span>أقسام وخدمات سريعة</span>
        </h2>
      </div>

      <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          return (
            <Link
              key={cat.id}
              href={cat.href}
              className={`relative p-3 rounded-2xl bg-gradient-to-b ${cat.color} border transition-all duration-200 hover:-translate-y-1 hover:shadow-lg flex flex-col items-center justify-center text-center gap-2 group`}
            >
              {cat.badge && (
                <span className="absolute top-1.5 right-1.5 px-1.5 py-0.2 rounded-md bg-purple-500 text-white text-[8px] font-mono font-black shadow-sm">
                  {cat.badge}
                </span>
              )}
              <div className="w-9 h-9 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-black text-white group-hover:text-red-400 transition-colors">
                {cat.name}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
