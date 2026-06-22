import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { requireAdminUser } from "@/lib/route-auth";

export async function POST(req: NextRequest) {
  if (!(await requireAdminUser())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const { name, email, role, password } = await req.json();
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!name || !normalizedEmail || !role || !password) {
    return NextResponse.json({ error: "Nombre, correo, rol y contraseña son requeridos" }, { status: 400 });
  }
  if (String(password).length < 6) {
    return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 });
  }

  const existingEmail = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existingEmail) return NextResponse.json({ error: "Este correo ya está en uso" }, { status: 400 });

  const user = await prisma.user.create({
    data: { name: String(name).trim(), email: normalizedEmail, password: await bcrypt.hash(String(password), 10), role, pin: null },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
  return NextResponse.json(user);
}
