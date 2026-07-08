import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { productFlowerInclude } from "@/lib/product-selects";
import { requireAdminUser } from "@/lib/route-auth";

function normalizeFlowerRelation(item: any) {
  const fallback = Math.max(1, Number(item.quantity) || 1);
  const rawMin = Number(item.quantityMin ?? item.minQuantity ?? fallback);
  const rawMax = Number(item.quantityMax ?? item.maxQuantity ?? fallback);
  const quantityMin = Math.max(1, Number.isFinite(rawMin) ? Math.floor(rawMin) : fallback);
  const quantityMax = Math.max(quantityMin, Number.isFinite(rawMax) ? Math.floor(rawMax) : quantityMin);
  return {
    flowerId: item.flowerId,
    quantity: quantityMax,
    quantityMin,
    quantityMax,
  };
}

export async function GET() {
  return NextResponse.json(await prisma.product.findMany({
    include: { images: true, category: true, flowers: productFlowerInclude },
    orderBy: { createdAt: "desc" },
  }));
}
export async function POST(req: Request) {
  if (!(await requireAdminUser())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const { images, flowerIds, flowerRelations, ...data } = await req.json();
  data.occasion = data.occasion ? String(data.occasion).trim() : null;
  const flowerData = Array.isArray(flowerRelations) && flowerRelations.length > 0
    ? flowerRelations
    : (Array.isArray(flowerIds) ? flowerIds.map((flowerId: string) => ({ flowerId, quantity: 1 })) : []);
  const product = await prisma.product.create({
    data: {
      ...data,
      images: { create: images.map((img: any, i: number) => ({ url: img.url, publicId: img.publicId, isMain: i === 0, order: i })) },
      flowers: { create: flowerData.map(normalizeFlowerRelation) },
    },
    include: { images: true, category: true, flowers: productFlowerInclude },
  });
  return NextResponse.json(product);
}
