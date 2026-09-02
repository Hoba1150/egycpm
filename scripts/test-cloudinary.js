/**
 * test-cloudinary.js - اختبار الاتصال بـ Cloudinary
 */
const https = require('https');
const crypto = require('crypto');

const CLOUD_NAME = 'root';
const API_KEY = '536262785818932';
const API_SECRET = 'V4vNclaoiKkUnYvbVDHPmRoFTU0';

// صورة تجريبية صغيرة جداً (1x1 pixel PNG)
const TINY_PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

const timestamp = Math.floor(Date.now() / 1000).toString();
const signStr = `timestamp=${timestamp}${API_SECRET}`;
const signature = crypto.createHash('sha1').update(signStr).digest('hex');

console.log(`🔑 Cloud: ${CLOUD_NAME}`);
console.log(`🔑 API Key: ${API_KEY}`);
console.log(`⏱️  Timestamp: ${timestamp}`);
console.log(`🔐 Signature: ${signature}`);
console.log(`📤 Testing upload...\n`);

const params = [
  `file=data%3Aimage%2Fpng%3Bbase64%2C${encodeURIComponent(TINY_PNG_BASE64)}`,
  `api_key=${API_KEY}`,
  `timestamp=${timestamp}`,
  `signature=${signature}`,
].join('&');

const options = {
  hostname: 'api.cloudinary.com',
  path: `/v1_1/${CLOUD_NAME}/image/upload`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(params),
  },
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => (data += chunk));
  res.on('end', () => {
    const parsed = JSON.parse(data);
    if (parsed.secure_url) {
      console.log(`✅ SUCCESS! Cloudinary is connected!`);
      console.log(`🌐 URL: ${parsed.secure_url}`);
      console.log(`📁 Public ID: ${parsed.public_id}`);
    } else {
      console.log(`❌ FAILED:`, JSON.stringify(parsed, null, 2));
    }
  });
});

req.on('error', (e) => console.error('Request error:', e.message));
req.write(params);
req.end();
