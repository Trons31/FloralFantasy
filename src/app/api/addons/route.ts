import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export async function GET() {
  return NextResponse.json(await prisma.addOn.findMany({ where: { inStock: true }, orderBy: { type: "asc" } }));
}
export async function POST(req: Request) {
  return NextResponse.json(await prisma.addOn.create({ data: await req.json() }));
}
