import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/route-auth";
export async function GET(req: Request) {
  if (!(await requireAdminUser())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  const where = start && end ? { date: { gte: new Date(start), lte: new Date(end) } } : {};
  return NextResponse.json(await prisma.expense.findMany({ where, orderBy: { date: "desc" } }));
}
export async function POST(req: Request) {
  if (!(await requireAdminUser())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  return NextResponse.json(await prisma.expense.create({ data: await req.json() }));
}
