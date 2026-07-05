import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/route-auth";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await requireAdminUser())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json();
  const name = String(body.name || "").trim();
  if (!name) {
    return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });
  }

  return NextResponse.json(await prisma.flower.update({
    where: { id: params.id },
    data: {
      name,
      type: String(body.type || "Flor").trim() || "Flor",
      color: body.color ? String(body.color).trim() : null,
      description: body.description ? String(body.description).trim() : null,
      imageUrl: body.imageUrl ? String(body.imageUrl).trim() : null,
    },
  }));
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await requireAdminUser())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  await prisma.flower.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
