import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_DELIVERY_FEE, normalizeDeliveryFee } from "@/lib/site-settings";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user?.role && ["ADMIN", "SUPER_ADMIN"].includes(session.user.role);
}

export async function GET() {
  const setting = await prisma.appSetting.findUnique({ where: { key: "deliveryFee" } }).catch(() => null);
  return NextResponse.json({
    deliveryFee: normalizeDeliveryFee(setting?.value ?? process.env.DELIVERY_FEE ?? DEFAULT_DELIVERY_FEE),
  });
}

export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const deliveryFee = normalizeDeliveryFee(body?.deliveryFee);

    await prisma.appSetting.upsert({
      where: { key: "deliveryFee" },
      create: { key: "deliveryFee", value: String(deliveryFee) },
      update: { value: String(deliveryFee) },
    });

    return NextResponse.json({ deliveryFee });
  } catch {
    return NextResponse.json({ error: "No se pudo guardar la configuración" }, { status: 500 });
  }
}
