# EGY CPM | متجر كار باركينج الاحترافي 🏎️

متجر إلكتروني متكامل لبيع وتعديل سيارات لعبة **Car Parking Multiplayer** على الهواتف، وشحن العملات (كاش 50M وكوينز ذهبي) وتفعيل رتبة الكينج رانك الملكية وحسابات VIP جاهزة.

---

## ✨ المميزات الرئيسية
- 🚀 **Next.js 14 App Router + TypeScript + Tailwind CSS**
- 🎨 **ثيم Gaming & Cyber Racing فخم وسريع**
- 🛒 **نظام سلة مشتريات تفاعلي وكوبونات خصم فورية**
- 💳 **نظام محفظة وخزينة إلكترونية وشحن رصيد (فودافون كاش / اتصالات / أورنج / وي باي)**
- 🔒 **حماية وأمان وتشفير بيانات الدخول وكلمات المرور**
- 👑 **لوحة تحكم إدارية كاملة (Dashboard CRM & CMS Settings)**
- 🎲 **سلايدر منتجات عشوائي ذكي في الواجهة الرئيسية**

---

## 🛠️ تشغيل المشروع محلياً

```bash
# تثبيت الحزم
npm install

# تهيئة قاعدة البيانات
npx prisma generate
npx prisma db push
node prisma/seed.js

# تشغيل السيرفر المحلي
npm run dev
```

افتح المتصفح على [http://localhost:3000](http://localhost:3000)

---

## 🌐 النشر والاستضافة (Deployment)
- **Build Command:** `npm run build`
- **Start Command:** `npm run start`
- **Environment Variables:** `ENCRYPTION_SECRET_KEY`
