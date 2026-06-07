import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const currentSessionEmail = session?.user?.email?.trim().toLowerCase() || "";

  if (!currentSessionEmail || !["ADMIN", "SUPER_ADMIN"].includes(session?.user?.role || "")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const newEmail = String(body?.newEmail || "").trim().toLowerCase();
    const currentPassword = String(body?.currentPassword || "");
    const newPassword = String(body?.newPassword || "");
    const confirmPassword = String(body?.confirmPassword || "");

    if (!newEmail || !currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json({ error: "Completa todos los campos" }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "La nueva contrasena debe tener al menos 6 caracteres" }, { status: 400 });
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: "Las contrasenas no coinciden" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: currentSessionEmail },
      select: { id: true, email: true, password: true, role: true },
    });

    if (!user || !["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Usuario no valido" }, { status: 404 });
    }

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      return NextResponse.json({ error: "La contrasena actual es incorrecta" }, { status: 401 });
    }

    if (newEmail !== currentSessionEmail) {
      const duplicate = await prisma.user.findUnique({ where: { email: newEmail }, select: { id: true } }).catch(() => null);
      if (duplicate) {
        return NextResponse.json({ error: "Ese correo ya esta en uso" }, { status: 409 });
      }
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        email: newEmail,
        password: await bcrypt.hash(newPassword, 10),
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "No se pudo actualizar el acceso" }, { status: 500 });
  }
}
