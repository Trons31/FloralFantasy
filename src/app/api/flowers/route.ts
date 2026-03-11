import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export async function GET() {
  return NextResponse.json(await prisma.flower.findMany({ orderBy: { name: "asc" } }));
}
export async function POST(req: Request) {
  const body = await req.json();
  return NextResponse.json(await prisma.flower.create({ data: body }));
}
