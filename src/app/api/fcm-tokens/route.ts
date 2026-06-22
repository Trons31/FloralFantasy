import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPrivilegedUser } from "@/lib/route-auth";

export async function POST(req: Request) {
  const access = await getPrivilegedUser(req as any);
  if (!access) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const token = body?.token;

  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "Token requerido" }, { status: 400 });
  }

  await prisma.fCMToken.upsert({
    where: { token },
    update: { userId: access.user.id },
    create: { userId: access.user.id, token },
  });

  return NextResponse.json({ ok: true });
}
