const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const cats = await prisma.category.findMany({
    orderBy: { order: 'asc' },
    include: { _count: { select: { products: true } } }
  });
  console.log('--- ALL CATEGORIES ---');
  cats.forEach(c => {
    console.log(`ID: ${c.id} | Name: "${c.name}" | Slug: "${c.slug}" | Order: ${c.order} | Products: ${c._count.products} | Image: ${c.image}`);
  });
}

run().catch(console.error).finally(() => prisma.$disconnect());
