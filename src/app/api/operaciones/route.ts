// app/api/operaciones/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createOperationsSessionToken,
  operationsSessionCookieOptions,
  OPERATION_ROLES,
  OPERATIONS_SESSION_COOKIE,
} from "@/lib/route-auth";

export async function POST(req: NextRequest) {
  const { pin } = await req.json();
  if (!pin) return NextResponse.json({ error: "PIN requerido" }, { status: 400 });

  const user = await prisma.user.findFirst({
    where: { pin, role: { in: ["PREPARADOR", "REPARTIDOR", "CORREDOR"] } }, 
    select: { id: true, name: true, role: true },
  });

  if (!user) return NextResponse.json({ error: "PIN incorrecto" }, { status: 401 });

  const response = NextResponse.json(user);
  if (OPERATION_ROLES.includes(user.role as any)) {
    response.cookies.set(
      OPERATIONS_SESSION_COOKIE,
      createOperationsSessionToken(user),
      operationsSessionCookieOptions()
    );
  }

  return response;
}
