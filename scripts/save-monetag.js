const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const updates = [
    { key: 'monetag_enabled', value: 'true' },
    { key: 'monetag_zone_id', value: '11823951' },
    { key: 'monetag_tag_code', value: '<script>(function(s){s.dataset.zone=\x2711823951\x27,s.src=\x27https://nap5k.com/tag.min.js\x27})([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement(\x27script\x27)))</script>' },
  ];

  for (const u of updates) {
    await prisma.storeSetting.upsert({
      where: { key: u.key },
      create: { key: u.key, value: u.value },
      update: { value: u.value },
    });
  }

  console.log('SUCCESS_MONETAG_SAVED');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
