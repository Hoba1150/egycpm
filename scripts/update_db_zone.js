const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.storeSetting.upsert({
    where: { key: 'monetag_zone_id' },
    create: { key: 'monetag_zone_id', value: '11824157' },
    update: { value: '11824157' },
  });
  await prisma.storeSetting.upsert({
    where: { key: 'monetag_tag_code' },
    create: { key: 'monetag_tag_code', value: '<script src=https://5gvci.com/act/files/tag.min.js?z=11824157 data-cfasync=false async></script>' },
    update: { value: '<script src=https://5gvci.com/act/files/tag.min.js?z=11824157 data-cfasync=false async></script>' },
  });
  console.log('SUCCESS_DB_UPDATE');
  process.exit(0);
}

main().catch(console.error);
