# 004 — Catálogo: tarjeta de producto única y carga progresiva

## Problema
- El producto se muestra con **tres tarjetas distintas**: la del home
  (`FeaturedProducts`, limpia: foto cuadrada, nombre y precio centrados), la del
  catálogo (`FloresClient`, con 2–3 chips por tarjeta, botón “Ver producto” y
  “+”) y la de “También te puede gustar” en el detalle. Las del catálogo quedan
  con alturas distintas según cuántos chips caben, y la fila se ve desordenada.
- Cuando ya pasó la hora límite, **cada tarjeta** repite “Después de 4:00 PM” y
  “Entrega el 9 de octubre de 2026”: el mismo aviso 44 veces.
- El catálogo pinta **todos** los productos y descarga todas las fotos a
  tamaño completo de una vez.
- Bug: los enlaces de la cabecera (`/flores?ocasion=amor`…) no filtran, porque
  en Next 16 `searchParams` es una `Promise` y la página no lo espera.

## Objetivo
Una sola tarjeta, la del home, usada en todas partes, y un catálogo que carga
los productos a medida que se hace scroll.

## Experiencia de usuario
- Mismo aspecto de producto en home, catálogo, “Más vendidos” y
  recomendaciones, sin importar desde dónde se llegue.
- Tarjetas de altura uniforme: la fila del grid queda alineada.
- Agregar al carrito en **un toque también en móvil** (en escritorio el botón
  aparece al pasar el mouse; en pantallas táctiles no hay hover).
- El aviso de hora límite se da **una vez**, arriba del grid.
- Al hacer scroll, los siguientes productos aparecen antes de llegar al final
  (sin esperar un clic). Las fotos aparecen con un fundido suave, sin saltos de
  layout. Hay un botón “Ver más” como alternativa accesible.
- “Mostrando 12 de 44” informa cuánto falta; al terminar, “Ya viste todos los
  arreglos”.
- Cambiar búsqueda, filtro u orden reinicia la lista desde arriba.

## Alcance
**Dentro**: `FeaturedProducts`, `FloresClient`, recomendaciones de
`ProductDetail`, `src/app/flores/page.tsx`.
**Fuera**: contrato de `/api/products` (lo usa el panel); paginación en
servidor (ver Riesgos); el diseño del detalle de producto.

## Criterios de aceptación
- [x] CA-1 Existe `src/components/client/ProductCard.tsx` y es la única tarjeta
  de producto de la tienda (home, catálogo, más vendidos, recomendaciones).
- [x] CA-2 La tarjeta muestra: foto 1:1 `rounded-2xl`, insignias (Top /
  Encargo / Entrega en N días), favorito opcional, nombre (1 línea) y precio
  centrados. Sin chips de categoría ni de fecha.
- [x] CA-3 En escritorio “Añadir al carrito” aparece al hover; en móvil hay un
  botón circular de carrito siempre visible sobre la foto (≥ 40px).
- [x] CA-4 El catálogo renderiza 12 productos y agrega 12 más cuando el final
  del grid está a ≤ 600px del viewport (`IntersectionObserver`).
- [x] CA-5 Las fotos usan `loading="lazy"` y, si son de Cloudinary o locales,
  `next/image` con `sizes` (WebP/AVIF al tamaño de la tarjeta).
- [x] CA-6 Si pasó la hora límite, un único aviso sobre el grid lo explica con
  la fecha de entrega; ninguna tarjeta lo repite.
- [x] CA-7 `/flores?ocasion=…`, `?categoria=…`, `?q=…`, `?flor=…` filtran al
  entrar y al navegar entre ellos desde la cabecera.
- [x] CA-8 Agregar desde cualquier tarjeta guarda en el carrito las flores del
  producto (como hace el detalle), no solo nombre y precio.

## Riesgos
- La carga progresiva es **en cliente**: los datos (JSON liviano) llegan
  completos y se pintan por tandas. Así la búsqueda y los filtros siguen siendo
  instantáneos. Lo pesado —DOM y fotos— sí se difiere. Si el catálogo supera
  ~300 productos conviene paginar en servidor (spec aparte).
