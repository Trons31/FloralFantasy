/**
 * Pedido creado por el cliente que aún no tiene comprobante (spec 017).
 * Compartido por cliente y servidor: sin imports de servidor.
 */
export const PENDING_ORDER_TTL_MINUTES = 60;

export function pendingOrderExpiresAt(createdAt: Date | string | number) {
  return new Date(new Date(createdAt).getTime() + PENDING_ORDER_TTL_MINUTES * 60_000);
}

export function isPendingOrderExpired(createdAt: Date | string | number, now = new Date()) {
  const expiresAt = pendingOrderExpiresAt(createdAt).getTime();
  return Number.isFinite(expiresAt) && expiresAt <= now.getTime();
}

/** Solo el pedido del cliente sin comprobante puede cancelarse o vencer. */
export function isCancellablePendingOrder(order: { status: string; paymentProofUrl: string | null }) {
  return order.status === "PENDING_PAYMENT_CONFIRMATION" && !order.paymentProofUrl;
}
