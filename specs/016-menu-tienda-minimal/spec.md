# 016 — Menú de la tienda: Catálogo, Mi pedido, Rastrear

## Problema
El menú superior repetía filtros del catálogo (Amor, Cumpleaños, Bodas) que ya
están como chips en /flores, y “Mi Pedido” llevaba al seguimiento, no al pedido
que el cliente dejó sin pagar.

## Objetivo
Un menú corto con tres destinos claros.

## Experiencia de usuario
- Escritorio y menú móvil muestran: **Catálogo**, **Mi pedido**, **Rastrear**.
- **Mi pedido** solo aparece si hay un pedido creado sin pagar en este
  navegador (`cartStore.pendingOrder`). Lleva a `/checkout?token=<guía>` para
  completar el pago y muestra un punto ámbar que avisa que falta algo.
- Sin pedido pendiente el menú queda en Catálogo y Rastrear (no se muestra un
  enlace que lleve a una página vacía).
- **Rastrear** lleva a `/seguimiento`.
- El enlace activo se marca en rosa: Catálogo en `/flores`, Mi pedido en
  `/checkout`, Rastrear en `/seguimiento`.
- “Mi pedido” se pinta tras montar (el pedido vive en localStorage), igual que
  el contador del carrito, para no romper la hidratación.

## Alcance
Dentro: `Header.tsx`. Fuera: chips de ocasión en /flores (se quedan).

## Criterios de aceptación
- [ ] CA-1 El menú no muestra Amor, Cumpleaños, Bodas ni Ocasiones.
- [ ] CA-2 Con `pendingOrder`, “Mi pedido” abre `/checkout?token=<guía>`.
- [ ] CA-3 Sin `pendingOrder`, “Mi pedido” no aparece.
- [ ] CA-4 “Rastrear” abre `/seguimiento`.
- [ ] CA-5 Igual en escritorio y en el menú móvil (375px).

## Riesgos
Quien usaba “Amor/Cumpleaños/Bodas” del menú ahora filtra con los chips de
/flores.
