// app/api/operaciones/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import {
  createOperationsSessionToken,
  operationsSessionCookieOptions,
  OPERATION_ROLES,
  OPERATIONS_SESSION_COOKIE,
  getPrivilegedUser,
} from "@/lib/route-auth";

async function getOperationsUserFromSession(req: NextRequest) {
  const current = await getPrivilegedUser(req);
  if (current?.kind === "operations") return current.user;
  return null;
}

export async function GET(req: NextRequest) {
  const user = await getOperationsUserFromSession(req);
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({ user });
}

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const plainPassword = String(password || "");
  if (!normalizedEmail || !plainPassword) {
    return NextResponse.json({ error: "Correo y contraseña requeridos" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, name: true, role: true, password: true, email: true },
  });

  if (!user || !OPERATION_ROLES.includes(user.role as any)) {
    return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
  }

  const valid = await bcrypt.compare(plainPassword, user.password);
  if (!valid) {
    return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 });
  }

  await prisma.appSetting.upsert({
    where: { key: "operationsLastAccess" },
    create: {
      key: "operationsLastAccess",
      value: JSON.stringify({ at: new Date().toISOString(), id: user.id, name: user.name, role: user.role }),
    },
    update: {
      value: JSON.stringify({ at: new Date().toISOString(), id: user.id, name: user.name, role: user.role }),
    },
  }).catch(() => null);

  const response = NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  response.cookies.set(
    OPERATIONS_SESSION_COOKIE,
    createOperationsSessionToken({ id: user.id, name: user.name, email: user.email, role: user.role }),
    operationsSessionCookieOptions()
  );

  return response;
}
