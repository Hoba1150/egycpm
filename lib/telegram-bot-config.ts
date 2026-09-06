export interface TelegramBotConfig {
  welcomeLinked: string;
  welcomeUnlinked: string;
  linkingSuccess: string;
  linkingFailed: string;
  orderCreatedPending: string;
  paymentSuccess: string;
  orderStatusUpdate: string;
  orderDelivered: string;
  balanceMessage: string;
  supportMessage: string;
  buttons: {
    store: { label: string; enabled: boolean };
    cpm2: { label: string; enabled: boolean };
    orders: { label: string; enabled: boolean };
    balance: { label: string; enabled: boolean };
    account: { label: string; enabled: boolean };
    support: { label: string; enabled: boolean };
  };
}

export const DEFAULT_TELEGRAM_BOT_CONFIG: TelegramBotConfig = {
  welcomeLinked: `🏎️ <b>متجر EgyCPM | Car Parking Multiplayer</b> ⚡
<i>البوت الرسمي المعتمد للمتجر الأول في الوطن العربي</i>

👋 مرحباً بك يا كابتن <b>{name}</b>
🟢 <b>حالة الحساب:</b> مرتبط وموثق بنجاح
📧 <b>البريد:</b> <code>{email}</code>
💰 <b>الرصيد المتاح:</b> <b>{balance} ج.م</b>
📦 <b>عدد طلباتك:</b> {ordersCount} طلب

اختر من القائمة التفاعلية أدناه للتحكم السريع:`,

  welcomeUnlinked: `🏎️ <b>أهلاً بك في بوت متجر EgyCPM الرسمي!</b> ⚡
<i>المتجر الأول المتخصص في سيارات وخدمات Car Parking Multiplayer</i>

👋 مرحباً بك <b>{name}</b>
🔴 <b>حالة الحساب:</b> غير مرتبط بحسابك في المتجر

💡 <b>اربط حسابك الآن لتتمكن من:</b>
• متابعة رصيد محفظتك وشحنها بضغطة زر
• تتبع طلباتك واستلام بيانات الحسابات فورياً
• الدفع المباشر بنجوم تيليجرام (Telegram Stars ⭐)`,

  linkingSuccess: `🎉 <b>تم ربط وتوثيق حسابك بنجاح!</b> 🏎️

مرحباً بك <b>{name}</b> 👋
حسابك في <b>متجر EgyCPM</b> مرتبط الآن بحساب تيليجرام وجاهز للشراء والدفع بنجوم تيليجرام ⭐ واستلام الإشعارات.

اضغط الزر أدناه للعودة إلى المتجر ومتابعة طلبك:`,

  linkingFailed: `⚠️ <b>رابط الربط غير صالح أو انتهت مدته (15 دقيقة)</b>

للحصول على رابط جديد، يرجى العودة للمتجر والضغط على زر <b>"ربط Telegram"</b> مرة أخرى.`,

  orderCreatedPending: `🏎️ <b>متجر EgyCPM — فاتورة دفع جديدة</b> ⭐

📦 <b>رقم الطلب:</b> #{orderNumber}
📌 <b>الحالة:</b> ⭐ بانتظار دفع النجوم
💵 <b>المبلغ المطلوب:</b> {amount} Telegram Stars
🚗 <b>المنتجات المطلوبة:</b>
{productsList}

⏳ في انتظار إتمام الدفع داخل تطبيق تيليجرام`,

  paymentSuccess: `✅ <b>تم استلام وتأكيد دفعتك بنجاح!</b> ⭐

📦 <b>رقم الطلب:</b> #{orderNumber}
⭐ <b>المبلغ المدفوع:</b> {amount} Telegram Stars
💳 <b>طريقة الدفع:</b> {paymentMethod}
🚗 <b>تفاصيل المنتجات:</b>
{productsList}
{deliveredCredentials}

شكراً لتسوقك من <b>EgyCPM</b>! 🏎️
اضغط على الزر أدناه لمشاهدة تفاصيل طلبك:`,

  orderStatusUpdate: `🏎️ <b>متجر EgyCPM — تحديث حالة الطلب</b>

📦 <b>رقم الطلب:</b> #{orderNumber}
📌 <b>الحالة الجديدة:</b> {status}
🚗 <b>المنتجات:</b>
{productsList}`,

  orderDelivered: `🎉 <b>تم تسليم طلبك بنجاح!</b> 🚀

📦 <b>رقم الطلب:</b> #{orderNumber}
📌 <b>الحالة:</b> مكتمل وتم التسليم
🚗 <b>المنتجات:</b>
{productsList}
{deliveredCredentials}

شكراً لثقتكم بمتجر <b>EgyCPM</b>! 🏎️`,

  balanceMessage: `💰 <b>محفظتك المالية في متجر EgyCPM</b> 🏎️

💳 <b>الرصيد الأساسي:</b> {balance} ج.م
🎁 <b>رصيد الهدايا والمكافآت:</b> {giftBalance} ج.م
💎 <b>الإجمالي الكلي القابل للاستخدام:</b> <b>{totalBalance} ج.م</b>

⭐ <b>دفع نجوم تيليجرام:</b> مفعل ومتاح لحسابك مباشرة أثناء إتمام الشراء!

💡 <i>يمكنك شحن رصيدك عبر فودافون كاش، إنستاباي، أو المحافظ الإلكترونية واستخدامه في الشراء الفوري داخل المتجر.</i>`,

  supportMessage: `💬 <b>مركز الدعم الفني والمساعدة | EgyCPM</b> 🏎️

فريق دعم EgyCPM متواجد لخدمتك ومساعدتك في:
• تجهيز وتسليم سيارات وحسابات CPM
• مشاكل شحن الرصيد والدفع بالنجوم
• الاستفسارات العامة وطلبات التعديل الخاصة

⚡ <b>سرعة الرد:</b> خلال دقائق معدودة
⏰ <b>التواجد:</b> على مدار الساعة لخدمتكم`,

  buttons: {
    store: { label: "🛒 فتح المتجر", enabled: true },
    cpm2: { label: "🚗 قسم CPM2", enabled: true },
    orders: { label: "📦 طلباتي الأخيرة", enabled: true },
    balance: { label: "💰 رصيدي ومحفظتي", enabled: true },
    account: { label: "🔗 حسابي وربط Telegram", enabled: true },
    support: { label: "💬 الدعم الفني", enabled: true },
  },
};

export const SETTING_KEY = "TELEGRAM_BOT_CONFIG";

export function interpolateTemplate(
  template: string,
  vars: Record<string, string | number | undefined | null>
): string {
  if (!template) return "";
  let result = template;
  for (const [key, val] of Object.entries(vars)) {
    const stringVal = val !== undefined && val !== null ? String(val) : "";
    result = result.split(`{${key}}`).join(stringVal);
  }
  return result;
}
