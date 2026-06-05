import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/route-auth";
export async function GET() {
  return NextResponse.json(await prisma.flower.findMany({ orderBy: { name: "asc" } }));
}
export async function POST(req: Request) {
  if (!(await requireAdminUser())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const body = await req.json();
  return NextResponse.json(await prisma.flower.create({ data: body }));
}
