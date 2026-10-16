import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/route-auth";
import { cardOptionSelect, parseCardOptionInput } from "@/lib/card-options";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!(await requireAdminUser())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const parsed = parseCardOptionInput(await req.json().catch(() => null), false);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  try {
    const updated = await prisma.cardOption.update({ where: { id }, data: parsed.data, select: cardOptionSelect });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "No fue posible actualizar la tarjeta" }, { status: 500 });
  }
}

// Las tarjetas nunca se borran (pedidos antiguos las referencian): DELETE
// solo la desactiva para que deje de aparecer en la tienda.
export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!(await requireAdminUser())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    await prisma.cardOption.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "No fue posible desactivar la tarjeta" }, { status: 500 });
  }
}
