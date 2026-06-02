import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { images, flowerIds, flowerRelations, ...data } = await req.json();
  const flowerData = Array.isArray(flowerRelations) && flowerRelations.length > 0
    ? flowerRelations
    : (Array.isArray(flowerIds) ? flowerIds.map((flowerId: string) => ({ flowerId, quantity: 1 })) : []);
  await prisma.productImage.deleteMany({ where: { productId: params.id } });
  await prisma.productFlower.deleteMany({ where: { productId: params.id } });
  const product = await prisma.product.update({
    where: { id: params.id },
    data: {
      ...data,
      images: { create: images.map((img: any, i: number) => ({ url: img.url, publicId: img.publicId || "", isMain: i === 0, order: i })) },
      flowers: { create: flowerData.map((item: any) => ({ flowerId: item.flowerId, quantity: Math.max(1, Number(item.quantity) || 1) })) },
    },
    include: { images: true, category: true, flowers: { include: { flower: true } } },
  });
  return NextResponse.json(product);
}
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.product.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
