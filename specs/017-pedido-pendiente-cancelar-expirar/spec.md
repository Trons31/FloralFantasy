# 017 — Pedido pendiente: vista en el carrito, cancelar y vencer en 1 h

## Problema
- Con un pedido sin pagar, el carrito mostraba a la vez el aviso amarillo y
  “Tu carrito está vacío”: dos mensajes que compiten.
- El pedido sin pagar quedaba guardado para siempre; el cliente no podía
  descartarlo y el equipo recibía recordatorios de pedidos abandonados.

## Objetivo
El pedido pendiente es el protagonista del carrito, el cliente puede
cancelarlo y, si no paga en 1 hora, se cancela solo.

## Experiencia de usuario
- **Carrito con pedido pendiente y sin productos**: en el centro, una tarjeta
  sobria: icono de reloj, “Tienes un pedido en proceso”, guía y total, y
  “Se cancela a las 6:51 p. m. si no subes el comprobante”. Botón principal
  “Completar pago” y enlace discreto “Cancelar pedido”. No se muestra “Tu
  carrito está vacío”.
- **Carrito con pedido pendiente y con productos**: arriba queda el aviso
  compacto (como hoy) con su hora de vencimiento; debajo, los productos.
- **Cancelar**: pide confirmación en la misma tarjeta (“¿Cancelar el pedido
  FLR-…? Sí, cancelar / No”). Mientras cancela, el botón dice “Cancelando…”.
  Al terminar, el aviso desaparece y queda el carrito normal. Si falla, un
  toast lo dice y el pedido sigue.
- **Vencimiento**: a la hora de creado, si no hay comprobante, el pedido pasa a
  Cancelado con la nota “Cancelado automáticamente: no se recibió el pago en
  1 hora”. En el navegador el aviso desaparece solo al pasar la hora (sin
  esperar al servidor). Si el cliente abre el enlace después, el checkout lo
  trata como pedido no disponible y el seguimiento lo muestra cancelado.
- **Checkout del pedido** (`/checkout?token=…`): en el Resumen, bajo el estado
  (“Esperando tu comprobante”), la hora de vencimiento y “Cancelar pedido” con
  la misma confirmación. Al cancelar: toast “Pedido cancelado” y vuelve al
  catálogo.
- “Mi pedido” del menú (spec 016) desaparece en los mismos casos.
- Horas en formato 12 h (spec 003).

## Alcance
Dentro: pedidos creados por el cliente (`PENDING_PAYMENT_CONFIRMATION` sin
comprobante). Fuera: borradores del equipo (`PENDING`), pedidos con
comprobante o rechazados (`PAYMENT_INVALID`). Nada se borra de la base: se
cancela (estado `CANCELLED` + historial).

## Criterios de aceptación
- [ ] CA-1 Con pedido pendiente y carrito vacío no aparece “Tu carrito está vacío”.
- [ ] CA-2 “Cancelar pedido” con confirmación deja el pedido en `CANCELLED` con nota en el historial.
- [ ] CA-3 `POST /api/orders/:id/cancel` exige la guía y solo cancela pedidos sin comprobante en `PENDING_PAYMENT_CONFIRMATION`.
- [ ] CA-4 Pedido sin comprobante con más de 60 min se cancela (cron de recordatorios y al consultarlo por guía).
- [ ] CA-5 Subir comprobante a un pedido cancelado o vencido responde 409.
- [ ] CA-6 El carrito y el menú olvidan el pedido al pasar la hora.
- [ ] CA-7 375px y escritorio.

## Riesgos
- El cron corre cada 30 min: el servidor puede cancelar hasta ~30 min tarde,
  pero la consulta por guía y la subida del comprobante aplican la regla al
  momento, así que el cliente nunca paga un pedido vencido.
