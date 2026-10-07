# 002 — Tareas

## Fundaciones
- [x] T1 Alias `brand` en Tailwind + utilidades en `globals.css`.
- [x] T2 `src/lib/scroll-lock.ts`.
- [x] T3 Primitivas: `Modal` (con `description` y `footer` fijo), `ConfirmModal`, `LoadingButton`, `StatCard`, `PageHeader`, `EmptyState`, `ScrollableTabs`, `BrandLogo`.
- [x] T4 `ResponsiveModal` y `ConfirmDialog` como adaptadores de las primitivas.
- [x] T5 `Pagination` con el diseño de CliqCut.

## Pantallas
- [x] T6 Login (CA-1…CA-5).
- [x] T7 Sidebar blanco + topbar móvil sin parpadeo (CA-6…CA-10).
- [x] T8 Layout del dashboard + Inter (CA-11).
- [x] T9 Dashboard (CA-12…CA-14).
- [x] T10 Títulos y contenedores de las páginas alineados al layout.
- [x] T11 Tablas CliqCut: Contabilidad, Egresos, Pedidos.
- [x] T12 Footers fijos en modales: CreateOrder, EditOrder, Flores, Productos, Ocasiones, Adicionales, Equipo, Ajustes, Egresos.
- [x] T13 Overlays manuales de operaciones → `Modal`; `PhotoViewer` con scroll-lock compartido.

## Pendiente (siguiente sesión)
- [ ] T14 Grillas de Flores / Productos / Adicionales / Ocasiones al patrón tabla+tarjetas.
- [ ] T15 Modales “Validar pago” y “Orden/Urgencia” de Pedidos con `footer`.
- [ ] T16 Login de `/operaciones` y vistas de operaciones al estilo CliqCut.
- [ ] T17 Tablero Kanban, detalle de pedido, Reportes y Ajustes: revisión fina.
- [ ] T18 Limpiar imports sin usar (`npm run lint` → 0 avisos).
- [ ] T19 Revisión visual 375px / 1280px de todo el panel.

## Verificación
- [x] `npx tsc --noEmit` = 0 errores.
- [x] `npm run build` OK.
- [ ] `npm run lint`: queda 1 error preexistente en `CheckoutPageClient.tsx` (tienda, fuera de alcance).
