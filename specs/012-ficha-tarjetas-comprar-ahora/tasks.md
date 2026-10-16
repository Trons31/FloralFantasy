# 012 — Tareas

## Datos y API
- [x] T1 Esquema `CardOption` + columnas `card*` en `OrderItem`; migración aditiva y semilla (`prisma/migrations/20261015000000_card_options`). Aplicada en producción el 2026-10-15 con `migrate deploy` (aprobada); datos existentes verificados intactos.
- [x] T2 `GET /api/card-options` público y CRUD admin (DELETE solo desactiva).
- [x] T3 `POST /api/orders`: aceptar `items[].card`, validar límite, recalcular total (CLIENT).
- [x] T4 `card*` en `GET /api/orders/[id]`, seguimiento y operaciones (llegan solos por `include`). `PATCH /api/orders/[id]` conserva la tarjeta al editar (`cardSnapshot`).

## Panel
- [x] T5 `/dashboard/tarjetas` (estructura de `/dashboard/addons`: lista, crear/editar, activar, ordenar, foto) + enlace “Tarjetas” en el sidebar (Catálogo).
- [x] T6 Tarjeta y mensaje por arreglo en `OrderDetailEditor`, `EditOrderModal`, `PedidosListClient` y `PreparadorView` (con respaldo a `giftMessage`).

## Tienda
- [x] T7 `cartStore`: `card` en `CartItem`, subtotal por unidad (migración de persistencia v1), clave de fusión, `useBuyNowStore` en sessionStorage.
- [x] T8 `ProductDetail`: `GiftMessageField` (sugerencias + contador), `CardOptionList`, validación de límite.
- [x] T9 `ProductDetail`: “Comprar ahora” + “Agregar al carrito” (escritorio y barra móvil).
- [x] T10 `ProductDetail`: estilo nuevo (CA-11); modales con `Modal` (sin framer-motion).
- [x] T11 Checkout modo `buy-now`; no vacía el carrito en ese modo; muestra el total que devuelve el servidor.
- [x] T12 `CartDrawer` y resumen del checkout muestran tarjeta y mensaje (`CartItemCardNote`).

## Verificación
- [x] T13a `npx tsc --noEmit` = 0 errores; ESLint 0 errores en archivos tocados.
- [x] T13b `npm run build` pasa.
- [x] T14a Ficha en 375px (sin scroll horizontal) y 1366px; CA-3, CA-4, CA-5 (modo buy-now, carrito intacto), CA-7/CA-8 (validaciones 400 y escritura con rollback), CA-10, CA-11.
- [ ] T14b CA-1, CA-6, CA-9 visuales en el panel (requieren sesión de admin): revisar `/dashboard/tarjetas`, detalle de pedido y preparador.

> Nota: `prisma migrate diff` contra producción muestra dos índices que existen en la BD y no en `schema.prisma` (`OccasionImage_occasionId_idx`, `Order_isUrgent_preparationOrder_createdAt_idx`). Es deriva previa a esta spec: **no usar `db push`**, borraría esos índices.
