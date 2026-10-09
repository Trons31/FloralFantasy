# 007 — Tareas

Plan: un solo archivo (`CartDrawer.tsx`). El `aside` es `flex-col`. Cabecera
`shrink-0`, lista `flex-1 overflow-y-auto` que mapea `items` con una fila
plana por producto, y pie `shrink-0 border-t` con el resumen. Se elimina
`heroItem`.

- [x] T1 Lista de todos los productos (fila plana, sin sombra).
- [x] T2 Pie fijo con resumen, botón y línea de entrega (sin sombras).
- [x] T3 `tsc`, lint, capturas 1280 y 390 con 6 productos.

Verificado por CDP: 6 filas, botón visible y 0 sombras en 1280×860 y 390×844.
También se quitó la caja “Entrega estimada” (tiempo de preparación): repetía la
entrega que ya dice el pie.
