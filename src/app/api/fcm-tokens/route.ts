import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  const user = email ? await prisma.user.findUnique({ where: { email }, select: { id: true } }) : null;
  const userId = user?.id;

  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const token = body?.token;

  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "Token requerido" }, { status: 400 });
  }

  await prisma.fCMToken.upsert({
    where: { token },
    update: { userId },
    create: { userId, token },
  });

  return NextResponse.json({ ok: true });
}
