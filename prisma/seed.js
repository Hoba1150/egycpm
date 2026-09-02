const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Starting database seeding for CPM Garage Marketplace...");

  // Clean old data if any
  try {
    await prisma.auditLog.deleteMany({});
    await prisma.ticketMessage.deleteMany({});
    await prisma.ticket.deleteMany({});
    await prisma.review.deleteMany({});
    await prisma.notification.deleteMany({});
    await prisma.couponUsage.deleteMany({});
    await prisma.coupon.deleteMany({});
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.depositRequest.deleteMany({});
    await prisma.walletTransaction.deleteMany({});
    await prisma.wallet.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.category.deleteMany({});
    await prisma.storeSetting.deleteMany({});
    await prisma.giveawayEntry.deleteMany({});
    await prisma.giveaway.deleteMany({});
    await prisma.user.deleteMany({});
  } catch (e) {
    console.log("Cleanup warning:", e.message);
  }

  const crypto = require("crypto");
  function encryptData(text) {
    const secret = process.env.ENCRYPTION_SECRET_KEY || "cpm_garage_ultra_secure_secret_key_2026_super_production_encryption";
    const key = crypto.createHash("sha256").update(String(secret)).digest();
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    const authTag = cipher.getAuthTag().toString("hex");
    return `${iv.toString("hex")}:${authTag}:${encrypted}`;
  }

  const superAdminPassword = await bcrypt.hash("admin123456", 10);
  const managerPassword = await bcrypt.hash("manager123456", 10);
  const gamerPassword = await bcrypt.hash("gamer123456", 10);

  // 1. Create Users
  const superAdmin = await prisma.user.create({
    data: {
      email: "admin@cpmgarage.com",
      name: "Super Admin (Owner)",
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      passwordHash: superAdminPassword,
      plainPasswordEncrypted: encryptData("admin123456"),
      image: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
    },
  });

  await prisma.user.create({
    data: {
      email: "manager@cpmgarage.com",
      name: "Fulfillment Officer",
      role: "ORDER_MANAGER",
      status: "ACTIVE",
      passwordHash: managerPassword,
      plainPasswordEncrypted: encryptData("manager123456"),
      image: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150",
    },
  });

  const testCustomer = await prisma.user.create({
    data: {
      email: "gamer@gmail.com",
      name: "CPM Racer Gamer",
      role: "CUSTOMER",
      status: "ACTIVE",
      passwordHash: gamerPassword,
      plainPasswordEncrypted: encryptData("gamer123456"),
      phone: "01234567890",
      image: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150",
    },
  });

  // Create Wallet for test customer with initial balance
  const customerWallet = await prisma.wallet.create({
    data: {
      userId: testCustomer.id,
      balance: 1250.0,
      giftBalance: 200.0,
      totalDeposited: 1500.0,
      totalSpent: 450.0,
    },
  });

  // Initial Wallet Transactions (using correct model name: walletTransaction)
  await prisma.walletTransaction.create({
    data: {
      walletId: customerWallet.id,
      type: "DEPOSIT",
      amount: 1500.0,
      beforeBalance: 0.0,
      afterBalance: 1500.0,
      beforeGiftBalance: 0.0,
      afterGiftBalance: 0.0,
      description: "إيداع ناجح عبر فودافون كاش - طلب رقم DEP-2026-101",
      referenceId: "DEP-2026-101",
    },
  });

  await prisma.walletTransaction.create({
    data: {
      walletId: customerWallet.id,
      type: "GIFT",
      amount: 200.0,
      beforeBalance: 1500.0,
      afterBalance: 1500.0,
      beforeGiftBalance: 0.0,
      afterGiftBalance: 200.0,
      description: "هدية افتتاحية ترحيبية من إدارة المتجر",
      referenceId: "ADMIN-GIFT-INIT",
    },
  });

  // 2. Create Categories
  const categoriesData = [
    {
      name: "سيارات معدلة وسرعة (Modified 1695HP)",
      slug: "modified-cars",
      description: "سيارات مجهزة بأقوى تزويد محركات W16 وقوة 1695 حصان وتظبيط دريفت ودراج احترافي.",
      icon: "Gauge",
      order: 1,
      isActive: true,
      image: "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800",
    },
    {
      name: "سيارات رسم وتصميمات خاصة (Drawn Cars)",
      slug: "drawn-cars",
      description: "سيارات برسم أنمي، ستيكرات ثلاثية الأبعاد وDesign فينيل فائق الدقة لا يوجد في المتجر العادي.",
      icon: "Palette",
      order: 2,
      isActive: true,
      image: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800",
    },
    {
      name: "سيارات لوجوهات وماركات واقعية (Realistic Logos)",
      slug: "realistic-logos",
      description: "لوجوهات سيارات حقيقية معتمدة مثل Red Bull, Monster Energy, Supreme, Gucci, Police.",
      icon: "Sparkles",
      order: 3,
      isActive: true,
      image: "https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?w=800",
    },
    {
      name: "سيارات نادرة ومحدودة (Limited Edition)",
      slug: "limited-cars",
      description: "سيارات مخصصة بأعداد حصرية مع لمسات كروم وذهب وأرقام شاسيه مميزة.",
      icon: "Flame",
      order: 4,
      isActive: true,
      image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800",
    },
    {
      name: "سيارات ستوك وكلاسيك (Stock Cars)",
      slug: "stock-cars",
      description: "جميع سيارات اللعبة الأصلية بحالة الوكالة ومفتوحة بالكامل وجاهزة للاستلام الفوري.",
      icon: "Car",
      order: 5,
      isActive: true,
      image: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800",
    },
    {
      name: "خدمات شحن وتطوير الحساب (Account Services)",
      slug: "services",
      description: "شحن أموال خضراء 50M، كوينز ذهبي، تفعيل الكينج رانك، تغيير الآي دي وفتح جميع التعديلات.",
      icon: "Zap",
      order: 6,
      isActive: true,
      image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800",
    },
    {
      name: "حسابات لعبة جاهزة VIP (Game Accounts)",
      slug: "accounts",
      description: "حسابات متكاملة تحتوي على جميع السيارات مفتوحة ومعدلة + كينج رانك + فلوس ماكس + تسليم فوري.",
      icon: "ShieldCheck",
      order: 7,
      isActive: true,
      image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800",
    },
  ];

  const categories = {};
  for (const cat of categoriesData) {
    const created = await prisma.category.create({ data: cat });
    categories[cat.slug] = created.id;
  }

  // 3. Create Products
  const productsData = [
    {
      name: "BMW M8 Competition - 1695HP W16 Police Monster",
      slug: "bmw-m8-competition-1695hp",
      categoryId: categories["modified-cars"],
      productType: "MODIFIED_CAR",
      price: 180.0,
      originalPrice: 240.0,
      discountPercent: 25,
      isFeatured: true,
      isBestSeller: true,
      deliveryTimeMinutes: 10,
      stockType: "UNLIMITED",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800",
        "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800",
      ]),
      description: "وحش السرعة والدريفت في كار باركينج! بي إم دبليو M8 مزودة بمحرك W16 بقوة 1695 حصان، فليشر بوليس أصلي، دخان إطارات بنفسجي وتظبيط جيربوكس احترافي لسباقات الدراج والهاي واي.",
      detailedSpecs: JSON.stringify({ horsePower: "1695 HP (W16 Engine)", extras: "Police Flashers, Triple Color Smoke, BBS Wheels" }),
    },
    {
      name: "Nissan Skyline GT-R R34 - Paul Walker 2 Fast 2 Furious",
      slug: "nissan-skyline-r34-paul-walker",
      categoryId: categories["drawn-cars"],
      productType: "DRAWN_CAR",
      price: 220.0,
      originalPrice: 280.0,
      discountPercent: 21,
      isFeatured: true,
      isBestSeller: true,
      deliveryTimeMinutes: 15,
      stockType: "UNLIMITED",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1619405399517-d7fce0f13302?w=800",
        "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800",
      ]),
      description: "الأسطورة اليابانية نيسان سكايلاين R34 بنفس رسمة وتصميم فيلم فاست آند فيوريوس الأيقونية.",
      detailedSpecs: JSON.stringify({ vinylLayers: "320 Vinyl Layers Ultra HD", horsePower: "1695 HP Engine" }),
    },
    {
      name: "Mercedes-AMG G63 Mansory 6x6 - Gold Edition",
      slug: "mercedes-g63-mansory-6x6-gold",
      categoryId: categories["limited-cars"],
      productType: "LIMITED_CAR",
      price: 350.0,
      originalPrice: 450.0,
      discountPercent: 22,
      isFeatured: true,
      isLimited: true,
      deliveryTimeMinutes: 15,
      stockType: "QUANTITY",
      stockQuantity: 5,
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1520031441872-265e4ff70366?w=800",
        "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800",
      ]),
      description: "إصدار محدود للغاية! مرسيدس جي كلاس مانصوري 6 عجلات مطلي بذهب عيار 24 مع جنوط فورجد.",
      detailedSpecs: JSON.stringify({ edition: "Mansory 1 of 10 Exclusive", horsePower: "1695 HP Biturbo" }),
    },
    {
      name: "Dodge Charger SRT Hellcat - Red Eye Monster Police",
      slug: "dodge-charger-hellcat-redeye-police",
      categoryId: categories["realistic-logos"],
      productType: "REALISTIC_LOGO_CAR",
      price: 190.0,
      originalPrice: 250.0,
      discountPercent: 24,
      isFeatured: false,
      isBestSeller: true,
      deliveryTimeMinutes: 10,
      stockType: "UNLIMITED",
      images: JSON.stringify(["https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?w=800"]),
      description: "دوج تشارجر ريد آي مع لوجو SRT وHellcat الأصلي، مزودة بفليشر بوليس أمريكي.",
      detailedSpecs: JSON.stringify({ horsePower: "1695 HP Supercharged", logos: "Official SRT Hellcat High-Res Badges" }),
    },
    {
      name: "Toyota Supra MK4 1998 - 2JZ Flame Beast",
      slug: "toyota-supra-mk4-2jz-beast",
      categoryId: categories["modified-cars"],
      productType: "MODIFIED_CAR",
      price: 170.0,
      originalPrice: 220.0,
      discountPercent: 22,
      isFeatured: true,
      deliveryTimeMinutes: 10,
      stockType: "UNLIMITED",
      images: JSON.stringify(["https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=800"]),
      description: "تويوتا سوبرا MK4 الأسطورية محرك 2JZ معدل 1695HP مع باك فاير وشعلات نار مستمرة.",
      detailedSpecs: JSON.stringify({ engine: "2JZ-GTE Twin Turbo Mod", horsePower: "1695 HP" }),
    },
    {
      name: "Porsche 911 GT3 RS - Track Weapon Shark Blue",
      slug: "porsche-911-gt3-rs-shark-blue",
      categoryId: categories["stock-cars"],
      productType: "STOCK_CAR",
      price: 140.0,
      originalPrice: 180.0,
      discountPercent: 22,
      isFeatured: false,
      deliveryTimeMinutes: 10,
      stockType: "UNLIMITED",
      images: JSON.stringify(["https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800"]),
      description: "بورشه 911 جي تي 3 آر إس أصلية بلون شارك بلو النادر مع جناح ديناميكي.",
      detailedSpecs: JSON.stringify({ horsePower: "1695 HP Track Spec", color: "Shark Blue Pearl" }),
    },
    {
      name: "شحن 50 مليون دولار كاش (50,000,000 Green Money)",
      slug: "service-50m-green-money",
      categoryId: categories["services"],
      productType: "SERVICE",
      price: 65.0,
      originalPrice: 100.0,
      discountPercent: 35,
      isFeatured: true,
      isBestSeller: true,
      deliveryTimeMinutes: 5,
      stockType: "UNLIMITED",
      images: JSON.stringify(["https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800"]),
      description: "إضافة 50,000,000 كاش أخضر في حسابك في أقل من 5 دقائق وبطريقة رسمية 100% آمنة.",
      detailedSpecs: JSON.stringify({ amount: "50,000,000$", deliverySpeed: "5 to 10 minutes", safety: "100% Anti-Ban Protection" }),
      serviceRequirements: "يتطلب إرسال البريد وكلمة السر للعبة كار باركينج في شاشة الدفع.",
    },
    {
      name: "شحن 40,000 عملة كوينز ذهبية (40,000 Gold Coins)",
      slug: "service-40k-gold-coins",
      categoryId: categories["services"],
      productType: "SERVICE",
      price: 110.0,
      originalPrice: 160.0,
      discountPercent: 31,
      isFeatured: true,
      isBestSeller: true,
      deliveryTimeMinutes: 10,
      stockType: "UNLIMITED",
      images: JSON.stringify(["https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=800"]),
      description: "شحن 40 ألف كوينز لشراء أي سيارة دفع، وتفعيل البودي كيتات وشراء تصاميم الماركت بليس الرسمية.",
      detailedSpecs: JSON.stringify({ amount: "40,000 Coins", safety: "Safe & Permanent" }),
      serviceRequirements: "يتطلب إرسال حساب اللعبة في صفحة الدفع.",
    },
    {
      name: "تفعيل رتبة الكينج رانك الملكية (King Rank)",
      slug: "service-king-rank",
      categoryId: categories["services"],
      productType: "SERVICE",
      price: 90.0,
      originalPrice: 130.0,
      discountPercent: 30,
      isFeatured: true,
      isBestSeller: true,
      deliveryTimeMinutes: 10,
      stockType: "UNLIMITED",
      images: JSON.stringify(["https://images.unsplash.com/photo-1563089145-599997674d42?w=800"]),
      description: "فتح التاج الذهبي الملكي (King Rank) بجانب اسمك ورقمك في السيرفرات.",
      detailedSpecs: JSON.stringify({ rank: "Official King Rank Crown", features: "Gold Crown in Chat, Server VIP Status" }),
      serviceRequirements: "حساب اللعبة (إيميل وباسورد).",
    },
    {
      name: "تعديل جميع محركات السيارات W16 1695HP (Full Garage Engine)",
      slug: "service-w16-all-cars",
      categoryId: categories["services"],
      productType: "SERVICE",
      price: 120.0,
      originalPrice: 180.0,
      discountPercent: 33,
      isFeatured: false,
      deliveryTimeMinutes: 15,
      stockType: "UNLIMITED",
      images: JSON.stringify(["https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=800"]),
      description: "تزويد كل سيارات حسابك بمحرك W16 1695HP بدون الحاجة لدفع كوينز لكل سيارة على حدة.",
      detailedSpecs: JSON.stringify({ coverage: "All existing cars in your garage", power: "Maxed Out 1695 HP" }),
      serviceRequirements: "حساب اللعبة.",
    },
    {
      name: "تغيير وتخصيص ID الحساب (Premium VIP Custom ID)",
      slug: "service-custom-id",
      categoryId: categories["services"],
      productType: "SERVICE",
      price: 80.0,
      originalPrice: 110.0,
      discountPercent: 27,
      isFeatured: false,
      deliveryTimeMinutes: 10,
      stockType: "UNLIMITED",
      images: JSON.stringify(["https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800"]),
      description: "اختر ID مخصص لحسابك (أرقام مميزة مثل 777777 أو اسمك الشخصي).",
      detailedSpecs: JSON.stringify({ customization: "Custom 6-8 digit or alphabetic ID", permanence: "Permanent VIP ID" }),
      serviceRequirements: "الحساب + الـ ID الجديد المطلوب.",
    },
    {
      name: "حساب VIP King Account - 150 سيارة معدلة + 50M كاش + 40k كوينز",
      slug: "account-vip-king-150-cars",
      categoryId: categories["accounts"],
      productType: "ACCOUNT",
      price: 550.0,
      originalPrice: 750.0,
      discountPercent: 26,
      isFeatured: true,
      isBestSeller: true,
      deliveryTimeMinutes: 5,
      stockType: "UNIQUE_DIGITAL",
      stockQuantity: 1,
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800",
        "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800",
      ]),
      description: "الحساب الحلم! حساب جاهز بالكامل يحتوي على 150 سيارة خارقة معدلة 1695HP، كينج رانك دائم، 50 مليون كاش أخضر.",
      detailedSpecs: JSON.stringify({ carsCount: "150 Cars Maxed Out", cash: "50,000,000 $", coins: "40,000 Coins", rank: "King Rank Crown" }),
      accountDetailsEncrypted: encryptData("cpm_king_vip_acc_2026@gmail.com:PassKing#9982"),
    },
    {
      name: "حساب أسطوري توب رانك - سيارات بوليس كاملة + مرسومة بالكامل",
      slug: "account-legendary-police-drawn",
      categoryId: categories["accounts"],
      productType: "ACCOUNT",
      price: 690.0,
      originalPrice: 900.0,
      discountPercent: 23,
      isFeatured: true,
      isLimited: true,
      deliveryTimeMinutes: 5,
      stockType: "UNIQUE_DIGITAL",
      stockQuantity: 1,
      images: JSON.stringify(["https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800"]),
      description: "حساب النخبة يحتوي على 160 سيارة جميعها بفليشر بوليس ورسومات أنمي ولوجوهات عالمية + ماكس موني.",
      detailedSpecs: JSON.stringify({ carsCount: "160 Police & Drawn Cars", cash: "50,000,000 $", coins: "35,000 Coins", rank: "King Rank" }),
      accountDetailsEncrypted: encryptData("cpm_police_legend_acc@gmail.com:PoliceLegend#771"),
    },
  ];

  for (const prod of productsData) {
    await prisma.product.create({ data: prod });
  }

  // 4. Create Coupons
  await prisma.coupon.create({
    data: {
      code: "CPM2026",
      discountType: "PERCENTAGE",
      discountValue: 15.0,
      minOrderAmount: 100.0,
      minOrderValue: 100.0,
      maxDiscount: 150.0,
      usageLimit: 500,
      maxUses: 500,
      isActive: true,
    },
  });

  // 5. Create Store Settings
  const settingsData = [
    { key: "store_name", value: "CPM GARAGE | متجر كار باركينج الاحترافي" },
    { key: "vodafone_cash", value: "01288212101" },
    { key: "currency", value: "ج.م" },
    { key: "announcement_center", value: "تسليم فوري لجميع الخدمات والسيارات | كود الخصم: CPM2026 خصم 15% | رقم الإيداع: 01288212101" },
    { key: "page_cars_title", value: "أسطول سيارات Car Parking" },
    { key: "page_cars_desc", value: "تصفح واشترِ أقوى سيارات كار باركينج المعدلة" },
    { key: "page_services_title", value: "خدمات الشحن وزيادة الرتبة" },
    { key: "page_services_desc", value: "خدمات شحن الكاش وزيادة الرتبة في Car Parking بأسرع تسليم" },
    { key: "page_accounts_title", value: "حسابات Car Parking المميزة" },
    { key: "page_accounts_desc", value: "حسابات جاهزة بالسيارات والكاش وأعلى الرتب بتسليم فوري" },
  ];

  for (const set of settingsData) {
    await prisma.storeSetting.create({ data: set });
  }

  // 6. Create Initial Sample Reviews
  const firstCar = await prisma.product.findFirst({ where: { slug: "bmw-m8-competition-1695hp" } });
  if (firstCar) {
    await prisma.review.create({
      data: {
        userId: testCustomer.id,
        productId: firstCar.id,
        rating: 5,
        comment: "السيارة خرافية وسرعتها صاروخ بالدراج! التسليم كان فوري ومضمون 100%. أفضل متجر لكار باركينج بلا منازع",
        isApproved: true,
        isHidden: false,
      },
    });
  }

  // 7. Create Audit Log Entry
  await prisma.auditLog.create({
    data: {
      adminId: superAdmin.id,
      adminEmail: superAdmin.email,
      action: "INITIALIZE_DATABASE",
      targetType: "SYSTEM",
      targetId: "SYSTEM_INIT",
      afterValue: JSON.stringify({ status: "SUCCESS", version: "2.0.0" }),
    },
  });

  console.log("✅ Database seeded successfully with 13 products and categories!");
  console.log("👑 Super Admin: admin@cpmgarage.com / admin123456");
  console.log("🎮 Test Customer: gamer@gmail.com (Wallet: 1250 EGP + 200 EGP Gift)");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
