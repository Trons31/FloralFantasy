import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export async function GET() {
  return NextResponse.json(await prisma.category.findMany({ orderBy: { name: "asc" } }));
}
export async function POST(req: Request) {
  const body = await req.json();
  const ex = await prisma.category.findUnique({ where: { slug: body.slug } });
  if (ex) return NextResponse.json({ error: "Ya existe" }, { status: 400 });
  return NextResponse.json(await prisma.category.create({ data: body }));
}
