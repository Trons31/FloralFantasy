import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  return NextResponse.json(await prisma.flower.update({ where: { id: params.id }, data: await req.json() }));
}
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.flower.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
