/**
 * Setup / Register Telegram Bot Webhook
 * Usage: node scripts/setup-telegram-webhook.js
 */

const fs = require('fs');
const path = require('path');

// Load environment variables from .env
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://egycpm.com';
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET || 'egycpm_telegram_secret_2026';

if (!BOT_TOKEN) {
  console.error('❌ Error: TELEGRAM_BOT_TOKEN is not set in .env or environment.');
  process.exit(1);
}

const webhookUrl = `${SITE_URL.replace(/\/$/, '')}/api/telegram/webhook`;

async function setup() {
  console.log('🤖 Configuring Telegram Bot Webhook...');
  console.log('📍 Webhook Destination URL:', webhookUrl);

  const payload = {
    url: webhookUrl,
    secret_token: WEBHOOK_SECRET,
    allowed_updates: ['message', 'pre_checkout_query'],
    drop_pending_updates: false,
  };

  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (data.ok) {
      console.log('🎉 Webhook registered successfully with Telegram!');
      console.log('Result description:', data.description);

      // Fetch webhook info
      const infoRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`);
      const infoData = await infoRes.json();
      console.log('📊 Current Webhook Info:', JSON.stringify(infoData.result, null, 2));
    } else {
      console.error('❌ Failed to set webhook:', data);
    }
  } catch (err) {
    console.error('❌ Error calling Telegram API:', err.message);
  }
}

setup();
