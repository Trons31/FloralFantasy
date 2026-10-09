# 005 — Carrito y checkout: apertura, scroll, hora límite y pedido pendiente

## Problema
1. **El carrito no abre en algunas páginas.** `/checkout` y `/seguimiento`
   muestran la cabecera, pero no montan el `CartDrawer`. Además `isOpen` se
   guarda en localStorage: el clic “perdido” deja el carrito abierto y aparece
   solo al llegar a la siguiente página.
2. **Con el carrito abierto, la página de atrás sigue haciendo scroll.**
3. **El checkout no reacciona a la hora.** Después de la hora límite sigue
   diciendo “Entrega hoy disponible · Realiza tu pedido antes de las 4:00 PM”.
   El carrito repite la fecha (“Entrega el 9 de octubre de 2026 · 9 de octubre
   de 2026”) y dice “Entrega programada disponible” sin decir cuándo. Si la
   página queda abierta y pasa la hora límite, los textos no cambian.
4. **Se pierde el pedido creado sin pagar.** Al crear el pedido se vacía el
   carrito, pero el pedido solo vive en el estado de React. Si el cliente
   recarga antes de subir el comprobante, ve “Tu carrito está vacío”: el pedido
   existe en la base de datos, pero el cliente ya no tiene cómo pagarlo.

## Objetivo
El carrito abre igual en toda la tienda y bloquea el fondo. Los mensajes de
entrega dicen la verdad según la hora actual. Un pedido creado y sin
comprobante se puede retomar siempre hasta que se pague.

## Experiencia de usuario
- El ícono del carrito funciona en todas las páginas de la tienda. Cerrar con
  la X, con el fondo o con Escape. Al navegar, el carrito se cierra solo.
- Con el carrito abierto, el fondo no se mueve (tampoco en iOS).
- Los textos de entrega usan “hoy”, “mañana” o la fecha, nunca la fecha dos
  veces. Pasada la hora límite, el checkout dice “Entrega mañana disponible —
  pide ahora y lo entregamos el 9 de octubre” y el carrito “Entrega mañana”.
  Esto se recalcula cada minuto sin recargar.
- Tras crear el pedido, la URL pasa a `/checkout?token=…`: recargar o cerrar y
  volver deja al cliente **en el paso de pago** del mismo pedido.
- Si vuelve a la tienda con un pedido sin pagar, el carrito muestra “Tienes un
  pedido pendiente de pago” con un botón “Completar pago”. En `/checkout` sin
  token y con el carrito vacío, entra directo a ese pedido. Si el carrito tiene
  productos nuevos, ve el aviso y decide: completar el pago pendiente o
  continuar con la compra nueva.
- Cuando sube el comprobante, o si el pedido ya no espera pago (pagado,
  cancelado, no existe), el pendiente se olvida solo.

## Alcance
**Dentro**: `cartStore`, `CartDrawer`, `Header`, `CheckoutPageClient`,
páginas que montaban `CartDrawer`.
**Fuera**: contrato de `/api/orders`, `/api/seguimiento` y
`/api/orders/[id]/payment-proof`; estados de pedido.

## Criterios de aceptación
- [x] CA-1 `CartDrawer` se monta una sola vez, dentro de `Header`; ninguna
  página lo monta por su cuenta.
- [x] CA-2 `isOpen` no se persiste; el carrito se cierra al cambiar de ruta y
  con Escape.
- [x] CA-3 Abierto el carrito, `useBodyScrollLock` bloquea el scroll del fondo.
- [x] CA-4 Ningún texto de entrega del carrito ni del checkout dice “hoy”
  cuando ya pasó la hora límite; se recalcula cada 60 s.
- [x] CA-5 `cartStore` persiste `pendingOrder` (`id`, `trackingToken`,
  `total`, `createdAt`). Crear el pedido lo guarda y reemplaza la URL por
  `/checkout?token=…`.
- [x] CA-6 Abrir `/checkout?token=X` con `X === pendingOrder.trackingToken`
  y datos completos lleva directo al paso de pago.
- [x] CA-7 El pendiente se borra al subir el comprobante, o al cargar el
  pedido si ya tiene comprobante o su estado no es `PENDING`,
  `PENDING_PAYMENT_CONFIRMATION` ni `PAYMENT_INVALID`, o si no existe.
- [x] CA-8 El `CartDrawer` muestra el aviso de pedido pendiente con enlace a
  `/checkout?token=…`.

## Riesgos
- Un pedido abandonado queda en la base en `PENDING_PAYMENT_CONFIRMATION` sin
  comprobante (ya pasaba antes). Ahora al menos se puede retomar. Limpiar o
  expirar esos pedidos es otra spec.
