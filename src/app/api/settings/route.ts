import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  DEFAULT_DELIVERY_FEE,
  DEFAULT_SAME_DAY_CUTOFF_TIME,
  normalizeDeliveryFee,
  normalizeSameDayCutoffTime,
} from "@/lib/site-settings";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user?.role && ["ADMIN", "SUPER_ADMIN"].includes(session.user.role);
}

export async function GET() {
  const [deliveryFeeSetting, cutoffSetting] = await Promise.all([
    prisma.appSetting.findUnique({ where: { key: "deliveryFee" } }).catch(() => null),
    prisma.appSetting.findUnique({ where: { key: "sameDayCutoffTime" } }).catch(() => null),
  ]);
  return NextResponse.json({
    deliveryFee: normalizeDeliveryFee(deliveryFeeSetting?.value ?? process.env.DELIVERY_FEE ?? DEFAULT_DELIVERY_FEE),
    sameDayCutoffTime: normalizeSameDayCutoffTime(cutoffSetting?.value ?? process.env.SAME_DAY_CUTOFF_TIME ?? DEFAULT_SAME_DAY_CUTOFF_TIME),
  });
}

export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const deliveryFee = normalizeDeliveryFee(body?.deliveryFee);
    const sameDayCutoffTime = normalizeSameDayCutoffTime(body?.sameDayCutoffTime);

    await Promise.all([
      prisma.appSetting.upsert({
        where: { key: "deliveryFee" },
        create: { key: "deliveryFee", value: String(deliveryFee) },
        update: { value: String(deliveryFee) },
      }),
      prisma.appSetting.upsert({
        where: { key: "sameDayCutoffTime" },
        create: { key: "sameDayCutoffTime", value: sameDayCutoffTime },
        update: { value: sameDayCutoffTime },
      }),
    ]);

    return NextResponse.json({ deliveryFee, sameDayCutoffTime });
  } catch {
    return NextResponse.json({ error: "No se pudo guardar la configuración" }, { status: 500 });
  }
}
