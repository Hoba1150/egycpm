/**
 * Telegram Bot API Client (Zero External Dependencies)
 * Handles Telegram Stars (XTR) invoices, webhook verification, and message notifications.
 */

const TELEGRAM_API_BASE = "https://api.telegram.org/bot";

export function getTelegramBotToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.warn("⚠️ TELEGRAM_BOT_TOKEN is not configured in environment variables.");
  }
  return token || "";
}

export function getTelegramBotUsername(): string {
  return (process.env.TELEGRAM_BOT_USERNAME || "EgyCpmBot").replace("@", "").trim();
}

export function getTelegramWebhookSecret(): string {
  return process.env.TELEGRAM_WEBHOOK_SECRET || "egycpm_telegram_secret_2026";
}

/**
 * Execute a Telegram Bot API method
 */
export async function telegramApiRequest(method: string, body: Record<string, any> = {}) {
  const token = getTelegramBotToken();
  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN غير مضبوط في متغيرات البيئة.");
  }

  const url = `${TELEGRAM_API_BASE}${token}/${method}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const data = await response.json();
  if (!data.ok) {
    console.error(`Telegram API Error on ${method}:`, data);
    throw new Error(data.description || `فشل تنفيذ طلب ${method} على تيليجرام.`);
  }

  return data.result;
}

/**
 * Create a Telegram Stars (XTR) Invoice Link
 */
export async function createStarsInvoiceLink(params: {
  title: string;
  description: string;
  payload: string;
  starsAmount: number;
  photoUrl?: string;
}): Promise<string> {
  const { title, description, payload, starsAmount, photoUrl } = params;

  if (starsAmount <= 0) {
    throw new Error("سعر النجوم يجب أن يكون أكبر من الصفر.");
  }

  const body: Record<string, any> = {
    title: title.slice(0, 32), // Telegram title max length is 32 chars
    description: description.slice(0, 255), // Telegram description max length 255 chars
    payload,
    provider_token: "", // REQUIRED: Empty string for Telegram Stars (XTR)
    currency: "XTR", // Official currency for Telegram Stars
    prices: [
      {
        label: title.slice(0, 32),
        amount: Math.round(starsAmount), // 1 Star = 1 unit for XTR
      },
    ],
  };

  if (photoUrl && photoUrl.startsWith("http")) {
    body.photo_url = photoUrl;
  }

  const link = await telegramApiRequest("createInvoiceLink", body);
  return link;
}

/**
 * Answer Telegram Pre-Checkout Query (Must be answered within 10 seconds)
 */
export async function answerPreCheckoutQuery(params: {
  preCheckoutQueryId: string;
  ok: boolean;
  errorMessage?: string;
}) {
  const { preCheckoutQueryId, ok, errorMessage } = params;
  return await telegramApiRequest("answerPreCheckoutQuery", {
    pre_checkout_query_id: preCheckoutQueryId,
    ok,
    error_message: errorMessage || undefined,
  });
}

/**
 * Send Direct Telegram Message to User
 */
export async function sendTelegramMessage(params: {
  chatId: string | number;
  text: string;
  parseMode?: "HTML" | "Markdown" | "MarkdownV2";
  replyMarkup?: any;
}) {
  try {
    const { chatId, text, parseMode = "HTML", replyMarkup } = params;
    const body: Record<string, any> = {
      chat_id: chatId,
      text,
      parse_mode: parseMode,
      disable_web_page_preview: false,
    };
    if (replyMarkup) {
      body.reply_markup = replyMarkup;
    }
    return await telegramApiRequest("sendMessage", body);
  } catch (err) {
    console.error("Failed to send telegram message:", err);
    return null;
  }
}

/**
 * Edit an existing Telegram Message in-place (prevents chat clutter)
 */
export async function editTelegramMessage(params: {
  chatId: string | number;
  messageId: number;
  text: string;
  parseMode?: "HTML" | "Markdown" | "MarkdownV2";
  replyMarkup?: any;
}) {
  try {
    const { chatId, messageId, text, parseMode = "HTML", replyMarkup } = params;
    const body: Record<string, any> = {
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: parseMode,
      disable_web_page_preview: false,
    };
    if (replyMarkup) {
      body.reply_markup = replyMarkup;
    }
    return await telegramApiRequest("editMessageText", body);
  } catch (err) {
    console.error("Failed to edit telegram message:", err);
    return null;
  }
}

/**
 * Answer Telegram Callback Query (stops the button loading spinner)
 */
export async function answerCallbackQuery(params: {
  callbackQueryId: string;
  text?: string;
  showAlert?: boolean;
}) {
  try {
    const { callbackQueryId, text, showAlert = false } = params;
    return await telegramApiRequest("answerCallbackQuery", {
      callback_query_id: callbackQueryId,
      text: text || undefined,
      show_alert: showAlert,
    });
  } catch (err) {
    console.error("Failed to answer callback query:", err);
    return null;
  }
}

/**
 * Refund Telegram Stars Payment
 */
export async function refundTelegramStarPayment(params: {
  userId: number | string;
  telegramPaymentChargeId: string;
}) {
  const { userId, telegramPaymentChargeId } = params;
  return await telegramApiRequest("refundStarPayment", {
    user_id: Number(userId),
    telegram_payment_charge_id: telegramPaymentChargeId,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Order Lifecycle Notifications
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  PENDING:        "⏳ بانتظار المراجعة",
  PAID:           "✅ تم تأكيد الدفع",
  PROCESSING:     "🔄 جاري التجهيز",
  IN_PROGRESS:    "⚙️ جاري التنفيذ داخل اللعبة",
  COMPLETED:      "🎉 تم التسليم والاكتمال",
  CANCELLED:      "❌ تم الإلغاء",
  REJECTED:       "🚫 تم الرفض",
  REFUNDED:       "💸 تمت الاسترداد",
  PENDING_PAYMENT:"⭐ بانتظار دفع النجوم",
};

/**
 * Send a structured order notification to the user or admin via Telegram.
 * Safe: silently returns null if telegramUserId is absent or API fails.
 */
export async function sendOrderNotification(params: {
  telegramUserId: string | null | undefined;
  orderNumber: string;
  status: string;
  extraLines?: string[];
  siteUrl?: string;
  amount?: string | number;
  isAdmin?: boolean;
  productsList?: string;
  paymentMethod?: string;
  starsTotal?: string | number;
  gameUsername?: string;
  deliveredCredentials?: string;
}) {
  const {
    telegramUserId,
    orderNumber,
    status,
    extraLines = [],
    siteUrl,
    amount,
    isAdmin = false,
    productsList,
    paymentMethod,
    starsTotal,
    gameUsername,
    deliveredCredentials,
  } = params;
  if (!telegramUserId) return null;

  const base = (siteUrl || process.env.NEXT_PUBLIC_SITE_URL || "https://egycpm.vercel.app").replace(/\/$/, "");
  // If recipient is admin, direct them to the admin order dashboard; otherwise, direct to customer order tracker
  const destinationUrl = isAdmin
    ? `${base}/admin/orders?search=${orderNumber}`
    : `${base}/orders/${orderNumber}`;
  const buttonLabel = isAdmin
    ? "📋 فتح وإدارة الطلب في لوحة الأدمن ⚙️"
    : "📋 عرض تفاصيل الطلب واستلام الحساب 🚀";

  const label = STATUS_LABELS[status] || status;

  let headerText = `🏎️ <b>متجر EgyCPM — تحديث طلبك</b>\n\n📦 <b>رقم الطلب:</b> #${orderNumber}\n📌 <b>الحالة الجديدة:</b> ${label}`;

  // Attempt dynamic template load
  try {
    const { getTelegramBotConfig } = await import("@/lib/actions/telegram-bot-settings");
    const { interpolateTemplate } = await import("@/lib/telegram-bot-config");
    const config = await getTelegramBotConfig();
    const templateVars = {
      orderNumber,
      status: label,
      amount: amount || starsTotal || "",
      starsTotal: starsTotal || amount || "",
      paymentMethod: paymentMethod || "⭐ Telegram Stars",
      productsList: productsList || "",
      gameUsername: gameUsername || "",
      deliveredCredentials: deliveredCredentials || "",
      siteUrl: base,
    };

    if (status === "PENDING_PAYMENT" && config.orderCreatedPending) {
      headerText = interpolateTemplate(config.orderCreatedPending, templateVars);
    } else if (status === "COMPLETED" && config.orderDelivered) {
      headerText = interpolateTemplate(config.orderDelivered, templateVars);
    } else if (config.orderStatusUpdate) {
      headerText = interpolateTemplate(config.orderStatusUpdate, templateVars);
    }
  } catch {}

  const lines = [
    headerText,
    ...extraLines,
    ``,
    `🔗 <a href="${destinationUrl}">${isAdmin ? "إدارة الطلب من لوحة الأدمن" : "تتبع تفاصيل الطلب هنا"}</a>`,
  ];

  return sendTelegramMessage({
    chatId: telegramUserId,
    text: lines.join("\n"),
    parseMode: "HTML",
    replyMarkup: {
      inline_keyboard: [[{ text: buttonLabel, url: destinationUrl }]],
    },
  });
}


