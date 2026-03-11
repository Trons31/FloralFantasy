import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { images, flowerIds, ...data } = await req.json();
  await prisma.productImage.deleteMany({ where: { productId: params.id } });
  await prisma.productFlower.deleteMany({ where: { productId: params.id } });
  const product = await prisma.product.update({
    where: { id: params.id },
    data: {
      ...data,
      images: { create: images.map((img: any, i: number) => ({ url: img.url, publicId: img.publicId || "", isMain: i === 0, order: i })) },
      flowers: { create: (flowerIds || []).map((fid: string) => ({ flowerId: fid })) },
    },
    include: { images: true, category: true, flowers: { include: { flower: true } } },
  });
  return NextResponse.json(product);
}
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.product.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
