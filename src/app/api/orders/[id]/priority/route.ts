import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/route-auth";
import { sendPushToRoles } from "@/lib/webpush";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await requireAdminUser())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json();
  const hasUrgent = typeof body?.isUrgent === "boolean";
  const rawOrder = body?.preparationOrder;
  const preparationOrder =
    rawOrder === null || rawOrder === "" || typeof rawOrder === "undefined"
      ? null
      : Math.max(1, Math.floor(Number(rawOrder) || 1));

  const current = await prisma.order.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      trackingToken: true,
      customerName: true,
      status: true,
      isUrgent: true,
    },
  });

  if (!current) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }

  const order = await prisma.order.update({
    where: { id: params.id },
    data: {
      ...(hasUrgent ? { isUrgent: body.isUrgent } : {}),
      preparationOrder,
    },
  });

  if (hasUrgent && body.isUrgent && !current.isUrgent) {
    await sendPushToRoles(["PREPARADOR", "REPARTIDOR"], {
      type: "ORDER_MARKED_URGENT",
      title: "Pedido urgente",
      body: `La guía #${current.trackingToken} fue marcada como urgente. Priorízala en la operación.`,
      url: "/operaciones",
      orderId: current.id,
      dedupeKey: `order:${current.id}:urgent:${Date.now()}`,
      data: {
        trackingToken: current.trackingToken,
        status: current.status,
        urgent: "true",
      },
    });
  }

  return NextResponse.json(order);
}
