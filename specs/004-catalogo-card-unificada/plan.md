# 004 — Plan

## Decisiones
- **`ProductCard`** (`src/components/client/ProductCard.tsx`): markup del card
  del home. Props: `product`, `onAdd`, `favorite?`, `onFavorite?`,
  `priority?`, `sizes?`. Imagen con `next/image` (`fill`, `sizes`) cuando la
  URL es de `res.cloudinary.com` o local; `<img loading="lazy">` en otro caso
  (un host fuera de `remotePatterns` haría fallar a `next/image`).
- **`useQuickAdd`** (`src/components/client/useQuickAdd.ts`): arma el ítem del
  carrito (incluye flores, como `ProductDetail`), muestra el toast y abre el
  carrito. Lo usan home, catálogo y recomendaciones.
- **Carga progresiva** en `FloresClient`: `visibleCount` (12, +12),
  `IntersectionObserver` con `rootMargin: 600px` sobre un centinela tras el
  grid; se reinicia al cambiar `search`/filtro/precio/orden. Botón “Ver más”
  dentro del centinela.
- **Aviso de hora límite** único sobre el grid.
- **Bug de filtros**: `flores/page.tsx` hace `await searchParams` y pasa
  `key` a `FloresClient` para que remonte al cambiar de filtro desde la
  cabecera.

## Archivos
| Archivo | Cambio |
| --- | --- |
| `src/components/client/ProductCard.tsx` | nuevo |
| `src/components/client/useQuickAdd.ts` | nuevo |
| `src/components/client/FeaturedProducts.tsx` | usa `ProductCard` |
| `src/components/client/FloresClient.tsx` | `ProductCard`, carga progresiva, aviso único; borra `ProductCard`/`CompactProductCard` locales |
| `src/components/client/ProductDetail.tsx` | recomendaciones con `ProductCard` |
| `src/app/flores/page.tsx` | `await searchParams`, `key` |
