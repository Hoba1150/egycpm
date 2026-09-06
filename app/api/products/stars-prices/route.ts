import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/products/stars-prices?ids=id1,id2,id3
export async function GET(req: NextRequest) {
  const idsParam = req.nextUrl.searchParams.get("ids");
  if (!idsParam) return NextResponse.json({});

  const ids = idsParam.split(",").filter(Boolean);
  if (ids.length === 0) return NextResponse.json({});

  const products = await prisma.product.findMany({
    where: { id: { in: ids } },
    select: { id: true, starsPrice: true },
  });

  const result: Record<string, number | null> = {};
  for (const p of products) {
    result[p.id] = p.starsPrice;
  }

  return NextResponse.json(result);
}
