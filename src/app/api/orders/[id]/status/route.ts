import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendStatusUpdate } from "@/lib/email";
import { STATUS_LABELS } from "@/lib/utils";
import { requireOrderManagementUser } from "@/lib/route-auth";
import { sendPushToRoles } from "@/lib/webpush";

const VALID_STATUSES = new Set([
  "PENDING",
  "PENDING_PAYMENT_CONFIRMATION",
  "PAYMENT_INVALID",
  "PAID",
  "PROCESSING",
  "READY",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
]);

const OPS_STATUS_RULES: Record<string, string[]> = {
  PREPARADOR: ["PROCESSING", "READY"],
  REPARTIDOR: ["OUT_FOR_DELIVERY", "DELIVERED"],
  CORREDOR: [],
};

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const access = await requireOrderManagementUser(req);
  if (!access) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { status, note } = await req.json();
  if (!VALID_STATUSES.has(status)) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  }

  if (access.kind === "operations") {
    const allowed = OPS_STATUS_RULES[access.user.role] || [];
    if (!allowed.includes(status)) {
      return NextResponse.json({ error: "No autorizado para cambiar a ese estado" }, { status: 403 });
    }
  }

  const existing = await prisma.order.findUnique({
    where: { id: params.id },
    select: { id: true, customerEmail: true, customerName: true, trackingToken: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }

  const order = await prisma.order.update({
    where: { id: params.id },
    data: {
      status,
      statusHistory: {
        create: {
          status,
          note:
            note ||
            (status === "PAYMENT_INVALID"
              ? "Comprobante de pago inválido. Se requiere corrección o reenvío."
              : STATUS_LABELS[status] || status),
        },
      },
    },
  });

  if (existing.customerEmail) {
    sendStatusUpdate({
      email: existing.customerEmail,
      customerName: existing.customerName,
      trackingToken: existing.trackingToken,
      statusLabel: STATUS_LABELS[status] || status,
    }).catch(console.error);
  }

  if (status === "PAID") {
    sendPushToRoles(["PREPARADOR"], {
      type: "ORDER_READY_TO_PREPARE",
      title: "Nuevo pedido para preparar",
      body: `La guía #${existing.trackingToken} ya fue validada. Hay un nuevo pedido para preparar.`,
      url: "/operaciones",
      orderId: existing.id,
      data: {
        trackingToken: existing.trackingToken,
        status,
      },
    }).catch(console.error);
  }

  if (status === "READY") {
    sendPushToRoles(["REPARTIDOR"], {
      type: "ORDER_READY_FOR_DELIVERY",
      title: "Pedido listo para entregar",
      body: `La guía #${existing.trackingToken} está lista para entrega. Revisa la información del pedido.`,
      url: "/operaciones",
      orderId: existing.id,
      data: {
        trackingToken: existing.trackingToken,
        guide: existing.trackingToken,
        status,
      },
    }).catch(console.error);
  }

  return NextResponse.json(order);
}
