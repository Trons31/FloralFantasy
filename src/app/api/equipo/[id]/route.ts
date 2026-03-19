import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { name, pin } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });

  if (pin) {
    if (!/^\d{4}$/.test(pin)) return NextResponse.json({ error: "PIN debe ser 4 dígitos" }, { status: 400 });
    const existing = await prisma.user.findFirst({ where: { pin, id: { not: params.id } } });
    if (existing) return NextResponse.json({ error: "Este PIN ya está en uso" }, { status: 400 });
  }

  const data: any = { name: name.trim() };
  if (pin) data.pin = pin;

  const user = await prisma.user.update({
    where: { id: params.id },
    data,
    select: { id: true, name: true, email: true, role: true, pin: true, createdAt: true },
  });
  return NextResponse.json(user);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await prisma.user.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}