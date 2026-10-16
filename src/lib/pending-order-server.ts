import { prisma } from "@/lib/prisma";
import { PENDING_ORDER_TTL_MINUTES, isCancellablePendingOrder, isPendingOrderExpired } from "@/lib/pending-order";

export const EXPIRED_ORDER_NOTE = "Cancelado automáticamente: no se recibió el pago en 1 hora";

/** Vence el pedido al momento si ya pasó la hora; el cron puede ir 30 min atrás. */
export async function expireIfStale(order: { id: string; status: string; paymentProofUrl: string | null; createdAt: Date }) {
  if (!isCancellablePendingOrder(order) || !isPendingOrderExpired(order.createdAt)) return false;
  return cancelPendingOrder(order.id, EXPIRED_ORDER_NOTE);
}

/**
 * Cancela el pedido solo si sigue sin comprobante (spec 017). La condición va
 * en el `where` para no pisar un comprobante que llegue al mismo tiempo.
 * Devuelve `true` si lo canceló.
 */
export async function cancelPendingOrder(id: string, note: string) {
  return prisma.$transaction(async tx => {
    const { count } = await tx.order.updateMany({
      where: { id, status: "PENDING_PAYMENT_CONFIRMATION", paymentProofUrl: null },
      data: { status: "CANCELLED" },
    });
    if (!count) return false;
    await tx.orderStatusHistory.create({ data: { orderId: id, status: "CANCELLED", note } });
    return true;
  });
}

/** Cancela los pedidos del cliente que pasaron la hora sin comprobante. */
export async function expireStalePendingOrders(now = new Date()) {
  const cutoff = new Date(now.getTime() - PENDING_ORDER_TTL_MINUTES * 60_000);
  const stale = await prisma.order.findMany({
    where: { status: "PENDING_PAYMENT_CONFIRMATION", paymentProofUrl: null, createdAt: { lte: cutoff } },
    select: { id: true },
  });
  let expired = 0;
  for (const order of stale) {
    if (await cancelPendingOrder(order.id, EXPIRED_ORDER_NOTE)) expired += 1;
  }
  return { expired };
}
