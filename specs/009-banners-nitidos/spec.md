# 009 — Banners con foto nítida, textos más amplios y filtros tras “Más vendidos”

## Problema
- Los banners con foto de fondo (inicio, catálogo y seguimiento) **se ven de
  baja calidad**. Las fotos son verticales y pequeñas (960×1280 en
  Cloudinary, 1080×1440 las locales) y el banner las estira a todo el ancho
  (1280–1920 px) en una franja horizontal: el navegador las amplía al doble
  y se pixelan. El original no tiene más resolución, así que pedirlo más
  grande no sirve.
- Los textos del banner están apretados: el título se corta a la fuerza con
  `<br />` y el párrafo tiene `max-w-xs` (320 px).
- En el catálogo los filtros van antes de “Más vendidos”; el cliente primero
  quiere inspirarse y luego filtrar.

## Objetivo
Banners que se vean nítidos en cualquier pantalla, con textos amplios, y el
catálogo en orden: banner → más vendidos → filtros → todos los arreglos.

## Experiencia de usuario
- El fondo del banner es la misma foto **muy desenfocada** y oscurecida: se
  conservan los colores y el ambiente, y no se nota la falta de resolución
  (es un efecto buscado, no una foto rota).
- En escritorio, a la derecha, las fotos **nítidas** a su tamaño real, en un
  collage de tarjetas redondeadas (1 foto en seguimiento, hasta 3 productos
  destacados en el catálogo).
- En móvil, el banner queda con el fondo desenfocado y el texto; sin collage.
- Título en una o dos líneas naturales (sin `<br />` forzado); párrafo hasta
  ~512 px de ancho.
- Catálogo: “Más vendidos” aparece justo después del banner y los filtros
  van debajo, pegados a “Todos los arreglos”, que es lo que filtran.
- El fondo se descarga pequeño (se desenfoca igual), así que pesa menos que
  antes.

## Alcance
**Dentro**: `HeroSection` (inicio), `FloresClient` (catálogo),
`SeguimientoPageClient`; componente nuevo `HeroBackdrop`.
**Fuera**: los textos del banner (solo el ancho y los saltos de línea);
el contenido del buscador de seguimiento.

## Criterios de aceptación
- [x] CA-1 Ningún banner muestra una foto nítida a más ancho que su tamaño
  original: el fondo va con `blur` y la foto nítida a ≤ su ancho natural.
- [x] CA-2 En ≥ 1024 px el catálogo muestra un collage de hasta 3 productos
  destacados y seguimiento muestra su foto; en < 1024 px no hay collage.
- [x] CA-3 Los títulos de los banners del catálogo y seguimiento no usan
  `<br />`; los párrafos tienen `max-w-lg` o más.
- [x] CA-4 Orden del catálogo: banner → “Más vendidos” → filtros → “Todos los
  arreglos”. Al elegir una categoría, la vista baja hasta los filtros.
- [x] CA-5 Revisado a 1280 y 390 px sin desbordes.
