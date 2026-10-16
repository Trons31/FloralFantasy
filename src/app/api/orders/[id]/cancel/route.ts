import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isCancellablePendingOrder } from "@/lib/pending-order";
import { cancelPendingOrder } from "@/lib/pending-order-server";

/** El cliente cancela su pedido antes de pagar (spec 017). Exige la guía. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const trackingToken = String(body?.trackingToken || "");

  const order = await prisma.order.findUnique({
    where: { id },
    select: { trackingToken: true, status: true, paymentProofUrl: true },
  });
  if (!order || !trackingToken || order.trackingToken !== trackingToken) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }
  if (order.status === "CANCELLED") return NextResponse.json({ ok: true });
  if (!isCancellablePendingOrder(order)) {
    return NextResponse.json({ error: "Este pedido ya tiene pago registrado y no se puede cancelar aquí" }, { status: 409 });
  }

  const cancelled = await cancelPendingOrder(id, "Cancelado por el cliente antes de pagar");
  if (!cancelled) {
    return NextResponse.json({ error: "Este pedido ya tiene pago registrado y no se puede cancelar aquí" }, { status: 409 });
  }
  return NextResponse.json({ ok: true });
}
