# 007 — Carrito: lista con scroll, resumen fijo y sin sombras

## Problema
- El carrito pinta **solo el primer producto** y debajo dice “Tienes N
  productos más en el carrito”: los demás no se ven ni se pueden cambiar de
  cantidad o eliminar.
- El resumen y el botón de pago se mueven con el contenido; con varios
  productos el botón queda fuera de la vista.
- La tarjeta del producto, el resumen y el botón llevan sombras grandes que
  ensucian un panel blanco.

## Objetivo
Un carrito con tres zonas: cabecera, lista de productos con scroll propio y
resumen fijo abajo con el botón “Continuar al pago” siempre visible. Sin
sombras.

## Experiencia de usuario
- Se ven **todos** los productos, cada uno con su foto, entrega, precio,
  cantidad y botón de eliminar.
- Con muchos productos solo hace scroll la lista; el total y el botón de pago
  no se mueven.
- El resumen fijo es compacto (subtotal, domicilio, total, botón y la línea de
  entrega/compra segura) para dejarle espacio a la lista en pantallas bajas.
- Superficies planas: bordes finos `gray-100`/`slate-200`, sin `shadow-*`.
- El aviso de pedido pendiente (spec 005) queda arriba de la lista.

## Alcance
**Dentro**: `src/components/client/CartDrawer.tsx`.
**Fuera**: lógica del carrito y del pedido pendiente.

## Criterios de aceptación
- [x] CA-1 Cada `item` del carrito se renderiza con cantidad y eliminar.
- [x] CA-2 Solo la lista hace scroll; el pie con el resumen y el botón queda
  fijo abajo (`shrink-0`).
- [x] CA-3 Ni las tarjetas de producto, ni el resumen, ni el botón de pago
  usan `shadow-*`.
- [x] CA-4 Con 6 productos a 1280×860 y a 390×844 el botón de pago sigue
  visible sin hacer scroll.
