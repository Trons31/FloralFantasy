import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/route-auth";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await requireAdminUser())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const updated = await prisma.addOn.update({
      where: { id: params.id },
      data: {
        ...(typeof body.name === "string" ? { name: body.name.trim() } : {}),
        ...(body.price !== undefined ? { price: Number(body.price) } : {}),
        ...(body.type ? { type: body.type } : {}),
        ...(typeof body.imageUrl === "string" ? { imageUrl: body.imageUrl || null } : {}),
        ...(typeof body.inStock === "boolean" ? { inStock: body.inStock } : {}),
      },
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "No fue posible actualizar el adicional" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  if (!(await requireAdminUser())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const usage = await prisma.orderItemAddOn.count({ where: { addonId: params.id } });
  if (usage > 0) {
    return NextResponse.json(
      { error: "Este adicional está asociado a pedidos existentes. Desactívalo en lugar de eliminarlo." },
      { status: 409 }
    );
  }

  try {
    await prisma.addOn.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "No fue posible eliminar el adicional" }, { status: 500 });
  }
}
