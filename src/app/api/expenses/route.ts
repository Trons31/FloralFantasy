import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  const where = start && end ? { date: { gte: new Date(start), lte: new Date(end) } } : {};
  return NextResponse.json(await prisma.expense.findMany({ where, orderBy: { date: "desc" } }));
}
export async function POST(req: Request) {
  return NextResponse.json(await prisma.expense.create({ data: await req.json() }));
}
