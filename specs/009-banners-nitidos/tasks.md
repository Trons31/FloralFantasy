# 009 — Tareas

Plan: `src/components/client/HeroBackdrop.tsx`. Fondo: `next/image` con
`sizes="480px"` (se baja pequeño), `blur-2xl`, `scale-110` y degradados
oscuros. Collage: hasta 3 `next/image` con `sizes` ≤ ancho mostrado, solo `lg+`.
`canOptimize` pasa de `ProductCard` a `src/lib/image.ts` para reutilizarlo.

- [x] T1 `src/lib/image.ts` + `HeroBackdrop`.
- [x] T2 Catálogo: banner con `HeroBackdrop` (collage de destacados), título sin
      `<br/>`, párrafo más ancho.
- [x] T3 Catálogo: mover los filtros debajo de “Más vendidos”.
- [x] T4 Seguimiento: banner con `HeroBackdrop`.
- [x] T5 Inicio: fondo desenfocado + foto nítida a la derecha en `lg+`.
- [x] T6 `tsc`, lint, build, capturas 1280 / 390.

Notas:
- “Más vendidos” queda siempre visible: si se ocultara al filtrar, la barra de
  filtros (ahora debajo) saltaría hacia arriba bajo el dedo.
- Inicio: el centrado de la foto va en un contenedor aparte porque framer-motion
  escribe `transform` y anulaba `-translate-y-1/2`.
- Capturas 1280 y 390 de inicio, catálogo y seguimiento: sin scroll horizontal.
