# 006 — Plan

## Decisiones
- La fecha siempre sale de `formatDeliveryDay(días efectivos)` (spec 005):
  “hoy”, “mañana, 9 de octubre” o “el 12 de octubre”. Así se dice “hoy” o
  “mañana” y no hace falta explicar la hora límite.
- La hora límite (`formatTime12(sameDayCutoffTime)`) solo aparece **antes**
  de que pase, en las invitaciones (“Pide antes de las 4:00 PM…”).

## Archivos
| Archivo | Cambio |
| --- | --- |
| `ProductDetail.tsx` | un chip de entrega; quitar chip y caja ámbar |
| `FloresClient.tsx` | aviso del catálogo solo con la fecha, en tono suave |
| `CartDrawer.tsx` | quitar “Haz feliz…”; entrega + compra segura bajo el botón |
| `CheckoutPageClient.tsx` | quitar “Pedido después de las…” |
