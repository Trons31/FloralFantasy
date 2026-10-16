# 017 — Plan

| Archivo | Cambio |
| --- | --- |
| `src/lib/pending-order.ts` (nuevo) | `PENDING_ORDER_TTL_MINUTES = 60`, `pendingOrderExpiresAt`, `isPendingOrderExpired` (cliente y servidor). |
| `src/lib/pending-order-server.ts` (nuevo) | `cancelPendingOrder(id, note)` condicional (`updateMany` con estado + sin comprobante) e `expireStalePendingOrders()`. |
| `src/app/api/orders/[id]/cancel/route.ts` (nuevo) | POST público con `trackingToken`. |
| `src/app/api/cron/notifications/reminders/route.ts` | Vence pedidos antes de encolar recordatorios. |
| `src/app/api/seguimiento/route.ts` | Si el pedido consultado venció, lo cancela antes de responder. |
| `src/app/api/orders/[id]/payment-proof/route.ts` | 409 si está cancelado o vencido. |
| `src/components/client/CartDrawer.tsx` | Vista centrada del pedido en proceso, cancelar con confirmación, hora de vencimiento. |
| `src/components/client/CheckoutPageClient.tsx` | Pedido `CANCELLED` → `/seguimiento?token=…`. `pendingOrder.createdAt` toma la hora del servidor. |

El carrito (montado en toda página con cabecera) limpia `pendingOrder` al
vencer, así que `Header` y `cartStore` no cambian.

Sin cambios de esquema (`CANCELLED` ya existe).
