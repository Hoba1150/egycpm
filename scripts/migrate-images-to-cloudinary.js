/**
 * migrate-images-to-cloudinary.js (v2 - Fixed Signature)
 */
const https = require('https');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');

const CLOUD_NAME = 'y3cwryo5';
const API_KEY = '536262785818932';
const API_SECRET = 'V4vNclaoiKkUnYvbVDHPmRoFTU0';

const prisma = new PrismaClient();

// ─── Cloudinary upload ────────────────────────────────────────────────────────
function uploadToCloudinary(base64Data, idx) {
  return new Promise((resolve, reject) => {
    const timestamp = Math.floor(Date.now() / 1000).toString();

    // Strip data URI prefix
    let imageData = base64Data;
    if (imageData.includes(',')) {
      imageData = imageData.split(',')[1];
    }

    // Signature: only timestamp → simplest valid signature
    const signStr = `timestamp=${timestamp}${API_SECRET}`;
    const signature = crypto.createHash('sha1').update(signStr).digest('hex');

    // Build multipart-like form body
    const params = [
      `file=data%3Aimage%2Fjpeg%3Bbase64%2C${encodeURIComponent(imageData)}`,
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
        try {
          const parsed = JSON.parse(data);
          if (parsed.secure_url) {
            resolve(parsed.secure_url);
          } else {
            reject(new Error(parsed.error?.message || 'Upload failed: ' + data.substring(0, 200)));
          }
        } catch (e) {
          reject(new Error('Parse error: ' + data.substring(0, 200)));
        }
      });
    });

    req.on('error', reject);
    req.write(params);
    req.end();
  });
}

// ─── Is Base64 image? ─────────────────────────────────────────────────────────
function isBase64Image(str) {
  if (!str || typeof str !== 'string') return false;
  if (str.startsWith('data:image')) return true;
  if (!str.startsWith('http') && str.length > 300) return true;
  return false;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🚀 Starting image migration to Cloudinary...\n');

  const products = await prisma.product.findMany({
    select: { id: true, name: true, images: true },
  });

  console.log(`📦 Found ${products.length} products\n`);

  let migrated = 0, skipped = 0, failed = 0;

  for (const product of products) {
    let images = [];
    try {
      const parsed = JSON.parse(product.images || '[]');
      images = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      if (product.images) images = [product.images];
    }

    const hasBase64 = images.some(isBase64Image);
    if (!hasBase64) {
      console.log(`✅ Skip: ${product.name.substring(0, 50)}`);
      skipped++;
      continue;
    }

    console.log(`📤 Uploading: ${product.name.substring(0, 50)} (${images.length} images)`);
    const newImages = [];

    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      if (!isBase64Image(img)) {
        newImages.push(img);
        continue;
      }

      try {
        const url = await uploadToCloudinary(img, i);
        newImages.push(url);
        console.log(`   ✅ Image ${i + 1}: ${url.substring(0, 60)}...`);
      } catch (err) {
        console.log(`   ❌ Image ${i + 1} error: ${err.message.substring(0, 100)}`);
        newImages.push(img);
        failed++;
      }
    }

    await prisma.product.update({
      where: { id: product.id },
      data: { images: JSON.stringify(newImages) },
    });
    console.log(`   💾 Saved!\n`);
    migrated++;
  }

  console.log('══════════════════════════════════');
  console.log(`🎉 Done! Migrated: ${migrated} | Skipped: ${skipped} | Failed: ${failed}`);
  console.log('══════════════════════════════════');

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('Fatal:', e.message);
  await prisma.$disconnect();
});
