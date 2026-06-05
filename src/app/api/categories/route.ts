import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/route-auth";
export async function GET() {
  return NextResponse.json(await prisma.category.findMany({ orderBy: { name: "asc" } }));
}
export async function POST(req: Request) {
  if (!(await requireAdminUser())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const body = await req.json();
  const ex = await prisma.category.findUnique({ where: { slug: body.slug } });
  if (ex) return NextResponse.json({ error: "Ya existe" }, { status: 400 });
  return NextResponse.json(await prisma.category.create({ data: body }));
}
