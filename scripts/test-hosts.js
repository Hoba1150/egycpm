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
  const p1 = "postgresql://postgres:AIVt7WNyDLP1hzUd@db.tentklltwfwvugebsyeb.supabase.co:5432/postgres";
  const p2 = "postgresql://postgres.tentklltwfwvugebsyeb:AIVt7WNyDLP1hzUd@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true";
  const p3 = "postgresql://postgres.tentklltwfwvugebsyeb:AIVt7WNyDLP1hzUd@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true";

  await testUrl("Direct Host (db.tentklltwfwvugebsyeb.supabase.co:5432)", p1);
  await testUrl("Pooler aws-0 (aws-0-eu-west-1.pooler.supabase.com:6543)", p2);
  await testUrl("Pooler aws-1 (aws-1-eu-west-1.pooler.supabase.com:6543)", p3);
}

main();
