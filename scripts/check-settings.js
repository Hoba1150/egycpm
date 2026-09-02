const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const settings = await prisma.storeSetting.findMany();
  console.log('Total store settings:', settings.length);
  for (const s of settings) {
    if (s.key.includes('image') || s.key.includes('logo') || s.key.includes('hero')) {
      console.log(`Key: ${s.key} => ${s.value}`);
    }
  }
}

check().catch(console.error).finally(() => prisma.$disconnect());
