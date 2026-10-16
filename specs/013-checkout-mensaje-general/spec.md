# 013 — Checkout: mensaje general solo cuando hace falta

## Problema

Desde la spec 012 cada arreglo lleva su propia dedicatoria, escrita en la
ficha. El checkout sigue pidiendo además “3. Mensaje para la tarjeta
(opcional)” para todo el pedido. Si el cliente ya escribió su dedicatoria en
la ficha, el campo parece pedirla otra vez y puede terminar escribiéndola dos
veces o dudando de si la primera se guardó.

## Objetivo

Mostrar el mensaje general solo cuando aporta algo, sin quitar la posibilidad
de escribirlo.

## Experiencia de usuario

- **Ningún arreglo trae dedicatoria** → el checkout se ve exactamente como hoy.
- **Al menos un arreglo trae dedicatoria** → en lugar del `textarea`, la
  sección 3 muestra un aviso: “Tus dedicatorias ya van en cada arreglo
  (2 de 2)” y lo que escribió en cada uno (recortado a una línea), con un
  enlace **“Agregar un mensaje general”**. Al tocarlo aparece el campo de
  siempre (mismo límite de 180 caracteres) y un enlace “Quitar mensaje
  general” que lo vacía y lo vuelve a ocultar.
- Si el cliente ya había escrito un mensaje general (p. ej. volvió atrás), el
  campo arranca abierto: nunca se oculta texto escrito.
- Igual en el “Paso 1 · Completa tus datos” de los links de pago armados por
  el equipo, usando las dedicatorias guardadas en las líneas del pedido.
- Móvil y escritorio: mismo bloque, sin cambios de layout.

## Reglas

- Aditivo: `Order.giftMessage`, el campo del formulario, la validación y el
  envío al servidor no cambian. Solo cambia cuándo se ve el `textarea`.

## Criterios de aceptación

- [ ] CA-1 Carrito sin dedicatorias → sección 3 idéntica a la actual.
- [ ] CA-2 Con 1 de 2 arreglos con dedicatoria → aviso “1 de 2” y enlace; sin `textarea` visible.
- [ ] CA-3 “Agregar un mensaje general” muestra el campo; lo escrito se envía como `giftMessage`.
- [ ] CA-4 “Quitar mensaje general” vacía el campo y lo oculta; el pedido se crea con `giftMessage` nulo.
- [ ] CA-5 Link de pago con líneas que traen `cardMessage` → mismo comportamiento en “Paso 1”.
- [ ] CA-6 `npx tsc --noEmit` = 0 y `npm run build` pasa.
