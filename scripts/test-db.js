const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Testing Supabase DB connection...');
    const userCount = await prisma.user.count();
    const productCount = await prisma.product.count();
    const orderCount = await prisma.order.count();
    const categoryCount = await prisma.category.count();

    console.log('✅ Connection Successful!');
    console.log(`📊 Statistics:
- Users: ${userCount}
- Products: ${productCount}
- Orders: ${orderCount}
- Categories: ${categoryCount}`);
  } catch (err) {
    console.error('❌ Connection Failed:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
