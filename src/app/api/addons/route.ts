import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/route-auth";
export async function GET() {
  return NextResponse.json(await prisma.addOn.findMany({ where: { inStock: true }, orderBy: { type: "asc" } }));
}
export async function POST(req: Request) {
  if (!(await requireAdminUser())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  return NextResponse.json(await prisma.addOn.create({ data: await req.json() }));
}
