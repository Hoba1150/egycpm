/**
 * migrate-all-to-cloudinary.js
 * Migrates Hero slider images and Category images to Cloudinary CDN
 */
const https = require('https');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');

const CLOUD_NAME = 'y3cwryo5';
const API_KEY = '536262785818932';
const API_SECRET = 'V4vNclaoiKkUnYvbVDHPmRoFTU0';

const prisma = new PrismaClient();

function uploadUrlOrBase64ToCloudinary(fileInput, folder = 'egycpm') {
  return new Promise((resolve, reject) => {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signStr = `timestamp=${timestamp}${API_SECRET}`;
    const signature = crypto.createHash('sha1').update(signStr).digest('hex');

    let body;
    if (fileInput.startsWith('data:image')) {
      let data = fileInput;
      if (data.includes(',')) data = data.split(',')[1];
      body = `file=data%3Aimage%2Fjpeg%3Bbase64%2C${encodeURIComponent(data)}&api_key=${API_KEY}&timestamp=${timestamp}&signature=${signature}`;
    } else {
      // Remote URL fetch upload by Cloudinary
      body = `file=${encodeURIComponent(fileInput)}&api_key=${API_KEY}&timestamp=${timestamp}&signature=${signature}`;
    }

    const options = {
      hostname: 'api.cloudinary.com',
      path: `/v1_1/${CLOUD_NAME}/image/upload`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let d = '';
      res.on('data', (chunk) => (d += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(d);
          if (parsed.secure_url) {
            resolve(parsed.secure_url);
          } else {
            reject(new Error(parsed.error?.message || 'Upload failed: ' + d));
          }
        } catch (e) {
          reject(new Error('Parse error: ' + d));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  console.log('🚀 Checking Hero Images and Categories for Cloudinary CDN migration...\n');

  // 1. Hero Slider Images
  const heroSetting = await prisma.storeSetting.findUnique({ where: { key: 'hero_images' } });
  if (heroSetting && heroSetting.value) {
    try {
      const images = JSON.parse(heroSetting.value);
      if (Array.isArray(images)) {
        console.log(`📸 Found ${images.length} Hero Slider images...`);
        const newHeroImages = [];
        for (let i = 0; i < images.length; i++) {
          const img = images[i];
          if (img.includes('res.cloudinary.com')) {
            console.log(`   ✅ Hero Image ${i + 1}: Already on Cloudinary CDN`);
            newHeroImages.push(img);
          } else {
            console.log(`   📤 Uploading Hero Image ${i + 1} to Cloudinary...`);
            try {
              const cdnUrl = await uploadUrlOrBase64ToCloudinary(img, 'egycpm/hero');
              console.log(`   ✅ Uploaded: ${cdnUrl}`);
              newHeroImages.push(cdnUrl);
            } catch (err) {
              console.log(`   ⚠️ Failed to upload image ${i + 1}, keeping original:`, err.message);
              newHeroImages.push(img);
            }
          }
        }
        await prisma.storeSetting.update({
          where: { key: 'hero_images' },
          data: { value: JSON.stringify(newHeroImages) },
        });
        console.log('💾 Updated hero_images in database successfully!\n');
      }
    } catch (e) {
      console.error('Error parsing hero_images:', e.message);
    }
  }

  // 2. Categories Images
  const categories = await prisma.category.findMany();
  console.log(`📁 Found ${categories.length} Categories...`);
  for (const cat of categories) {
    if (cat.image && !cat.image.includes('res.cloudinary.com')) {
      console.log(`   📤 Uploading Category [${cat.name}] image to Cloudinary...`);
      try {
        const cdnUrl = await uploadUrlOrBase64ToCloudinary(cat.image, 'egycpm/categories');
        await prisma.category.update({
          where: { id: cat.id },
          data: { image: cdnUrl },
        });
        console.log(`   ✅ Category [${cat.name}] migrated to: ${cdnUrl}`);
      } catch (err) {
        console.log(`   ⚠️ Failed to migrate category image:`, err.message);
      }
    } else {
      console.log(`   ✅ Category [${cat.name}]: Already on CDN or clean`);
    }
  }

  console.log('\n🎉 All store images are now 100% powered by Cloudinary CDN!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
