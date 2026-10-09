# 005 — Tareas

- [x] T1 Store: `openCart`/`closeCart`, `pendingOrder`, `partialize`.
- [x] T2 `CartDrawer` dentro de `Header`; quitarlo de las páginas.
- [x] T3 Drawer: scroll-lock, Escape, cierre al navegar.
- [x] T4 `useMinuteTick` + `formatDeliveryDay`; textos de entrega del drawer.
- [x] T5 Checkout: textos de entrega dinámicos. En un pedido ya creado se
      muestra `estimatedTime` (fijado al crearlo) en vez de recalcularlo.
- [x] T6 Checkout: guardar/retomar/limpiar el pedido pendiente. Si el pedido ya
      tiene comprobante, `/checkout?token=` lleva a la confirmación.
- [x] T7 Drawer y checkout: aviso de pedido pendiente.
- [x] T8 `tsc`, lint, `build`. Prueba E2E por CDP con un pedido real sin
      comprobante: abrir carrito en `/seguimiento`, bloqueo de scroll, Escape,
      `isOpen` no persistido, retomar desde `/checkout`, recargar, aviso en el
      carrito, textos según la hora. **No probado**: crear un pedido nuevo (se
      evitó escribir en la base de producción).

Extra: “Agregar al carrito” usa `openCart` (con `toggleCart` cerraba el
carrito si ya estaba abierto).
