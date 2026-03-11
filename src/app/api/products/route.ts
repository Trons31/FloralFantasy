import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export async function GET() {
  return NextResponse.json(await prisma.product.findMany({
    include: { images: true, category: true, flowers: { include: { flower: true } } },
    orderBy: { createdAt: "desc" },
  }));
}
export async function POST(req: Request) {
  const { images, flowerIds, ...data } = await req.json();
  const product = await prisma.product.create({
    data: {
      ...data,
      images: { create: images.map((img: any, i: number) => ({ url: img.url, publicId: img.publicId, isMain: i === 0, order: i })) },
      flowers: { create: (flowerIds || []).map((fid: string) => ({ flowerId: fid })) },
    },
    include: { images: true, category: true, flowers: { include: { flower: true } } },
  });
  return NextResponse.json(product);
}
