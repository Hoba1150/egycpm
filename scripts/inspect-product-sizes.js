const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany();
  console.log(`Found ${products.length} products`);
  for (const p of products) {
    const imagesLen = (p.images || '').length;
    const descLen = (p.description || '').length;
    const specsLen = (p.detailedSpecs || '').length;
    const totalSizeKb = (imagesLen + descLen + specsLen) / 1024;

    if (totalSizeKb > 50) {
      console.log(`⚠️ Large product [${p.id}] "${p.name}": Size = ${totalSizeKb.toFixed(1)} KB (Images: ${(imagesLen/1024).toFixed(1)} KB)`);
    }
  }
}

main().finally(() => prisma.$disconnect());
