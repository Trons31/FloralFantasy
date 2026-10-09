# 003 — Plan

## Decisiones
- Formato canónico: `h:mm AM/PM` (sin cero inicial, “AM”/“PM” en mayúsculas).
  Se construye a mano a partir de `formatToParts` en `America/Bogota` para no
  depender del locale del navegador (`es-CO` produce “p. m.”, `[]` puede dar 24 h).
- Helpers en `src/lib/utils.ts` (ya se importa en cliente y servidor):
  - `formatTime12("16:00") → "4:00 PM"` — para valores `"HH:mm"`.
  - `formatTime(date) → "4:05 PM"`.
  - `formatDateTime(date, dateOptions?) → "8 oct, 4:05 PM"`.
- `src/components/ui/TimeInput12.tsx`: selector hora/minuto/AM-PM con estilos
  de input del panel; `value`/`onChange` en `"HH:mm"`.

## Archivos
| Archivo | Cambio |
| --- | --- |
| `src/lib/utils.ts` | helpers |
| `src/components/ui/TimeInput12.tsx` | nuevo |
| `src/components/client/{FloresClient,ProductDetail,CartDrawer,CheckoutPageClient,SeguimientoPageClient}.tsx` | hora límite y fechas |
| `src/components/admin/{AjustesClient,OrderDetailEditor,KanbanBoard,EquipoManager,FloresManager}.tsx` | helpers + `TimeInput12` |
| `src/app/dashboard/{reportes/ReportesClient,todos-pedidos/PedidosListClient,contabilidad/ContabilidadDashboard,egresos/EgresosClient}.tsx` | helpers |
| `src/app/api/reportes/pdf/route.ts` | helper (servidor, zona Bogotá) |
