# 005 — Plan

## Decisiones
- **Montaje único**: `Header` renderiza `<CartDrawer />`. Se elimina de
  `page.tsx`, `flores/page.tsx` y `flores/[id]/page.tsx`.
- **Store** (`src/store/cartStore.ts`):
  - `openCart`, `closeCart` (además de `toggleCart`).
  - `pendingOrder` + `setPendingOrder` / `clearPendingOrder`.
  - `persist({ partialize })`: solo `items` y `pendingOrder`.
- **Drawer**: `useBodyScrollLock(isOpen)`, Escape, cierre en cambio de
  `pathname`. Aviso de pedido pendiente.
- **Hora**: hook `useMinuteTick()` (`src/lib/use-minute-tick.ts`) que
  re-renderiza cada 60 s; helper `formatDeliveryDay(days)` en `utils.ts`:
  0 → “hoy”, 1 → “mañana, 9 de octubre”, n → “el 12 de octubre”.
- **Checkout**:
  - `onSubmit` → `setPendingOrder` + `clearCart` + `router.replace(?token)`.
  - Carga por token → etapa `payment` si el token es el pendiente propio y
    los datos están completos; limpia el pendiente si ya no espera pago.
  - Sin token: carrito vacío + pendiente → `router.replace(?token)`; carrito
    con productos + pendiente → aviso con las dos opciones.
  - `uploadProof` → `clearPendingOrder`.
  - La caja “Entrega hoy disponible” se vuelve dinámica.

## Archivos
| Archivo | Cambio |
| --- | --- |
| `src/store/cartStore.ts` | open/close, pendingOrder, partialize |
| `src/lib/use-minute-tick.ts` | nuevo |
| `src/lib/utils.ts` | `formatDeliveryDay` |
| `src/components/client/Header.tsx` | monta `CartDrawer`, usa `openCart` |
| `src/components/client/CartDrawer.tsx` | scroll-lock, Escape, ruta, textos, aviso |
| `src/components/client/CheckoutPageClient.tsx` | pendiente, etapas, textos |
| `src/app/page.tsx`, `flores/page.tsx`, `flores/[id]/page.tsx` | quitar `CartDrawer` |
