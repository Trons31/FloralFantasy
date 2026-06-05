import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { requireAdminUser } from "@/lib/route-auth";

export async function POST(req: NextRequest) {
  if (!(await requireAdminUser())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const { name, email, role, pin } = await req.json();
  if (!name || !role || !pin) return NextResponse.json({ error: "Nombre, rol y PIN son requeridos" }, { status: 400 });
  if (pin.length !== 4 || !/^\d{4}$/.test(pin)) return NextResponse.json({ error: "El PIN debe ser de 4 dígitos" }, { status: 400 });

  const existingPin = await prisma.user.findFirst({ where: { pin } });
  if (existingPin) return NextResponse.json({ error: "Este PIN ya está en uso" }, { status: 400 });

  const password = await bcrypt.hash(pin, 10);
  const user = await prisma.user.create({
    data: { name, email: email || `${pin}@fantasiafloral.internal`, password, role, pin },
    select: { id: true, name: true, email: true, role: true, pin: true, createdAt: true },
  });
  return NextResponse.json(user);
}
