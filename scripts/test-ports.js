const { PrismaClient } = require('@prisma/client');

async function testUrl(name, url) {
  const p = new PrismaClient({ datasources: { db: { url } } });
  const start = Date.now();
  try {
    const c = await p.product.count();
    const duration = Date.now() - start;
    console.log(`✅ [${name}] Success in ${duration}ms (Products: ${c})`);
  } catch (err) {
    console.log(`❌ [${name}] Failed: ${err.message}`);
  } finally {
    await p.$disconnect();
  }
}

async function main() {
  const p1 = "postgresql://postgres.tentklltwfwvugebsyeb:AIVt7WNyDLP1hzUd@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true";
  const p2 = "postgresql://postgres.tentklltwfwvugebsyeb:AIVt7WNyDLP1hzUd@aws-1-eu-west-1.pooler.supabase.com:5432/postgres";

  await testUrl("Port 6543 (Transaction Pooler)", p1);
  await testUrl("Port 5432 (Session Pooler)", p2);
}

main();
