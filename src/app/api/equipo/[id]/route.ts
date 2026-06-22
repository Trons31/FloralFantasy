import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { requireAdminUser } from "@/lib/route-auth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await requireAdminUser())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const { name, email, password, role } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
  if (role && !["PREPARADOR", "REPARTIDOR", "CORREDOR"].includes(role)) {
    return NextResponse.json({ error: "Rol no válido" }, { status: 400 });
  }

  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail) return NextResponse.json({ error: "Correo requerido" }, { status: 400 });

  if (password && String(password).length < 6) {
    return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 });
  }

  const duplicateEmail = await prisma.user.findFirst({ where: { email: normalizedEmail, id: { not: params.id } } });
  if (duplicateEmail) return NextResponse.json({ error: "Este correo ya está en uso" }, { status: 400 });

  const data: any = { name: name.trim(), email: normalizedEmail };
  if (password) data.password = await bcrypt.hash(String(password), 10);
  if (role) data.role = role;
  data.pin = null;

  const user = await prisma.user.update({
    where: { id: params.id },
    data,
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
  return NextResponse.json(user);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  if (!(await requireAdminUser())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  await prisma.user.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
