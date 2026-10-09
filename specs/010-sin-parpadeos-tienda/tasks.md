# 010 — Tareas

Plan: `scroll-lock` fija `--scroll-lock-gap` en `<html>` mientras bloquea; la
cabecera usa `right: var(--scroll-lock-gap, 0px)`. `CartDrawer`: capa sin blur,
panel `x: 100% → 0` con tween. `Header`: menú que baja con `transform` (opaco), capa
oscura, `useBodyScrollLock`, Escape y cierre por ruta; el padding de la
cabecera no depende de `mobileOpen`. `ScrollArrows`: envuelve un contenedor con
scroll horizontal y pinta flechas según `scrollLeft`.

- [x] T1 `scroll-lock`: `--scroll-lock-gap`.
- [x] T2 `CartDrawer`: capa sin blur, panel deslizante.
- [x] T3 `Header`: menú móvil opaco + capa + bloqueo + cierres; alto estable.
- [x] T4 `ScrollArrows` en “Más vendidos” y categorías.
- [x] T5 Re-grabar cuadros (1280 y 390), `tsc`, lint, build.

## Resultado de la verificación (brillo medio por cuadro, screencast de Chrome)
- Antes: el carrito alternaba fondo nítido/desenfocado; en móvil el panel se
  veía semitransparente; el menú se veía transparente sobre la página.
- Primer intento del menú con `clip-path`: dejaba **un cuadro suelto** sin capa
  oscura al terminar (185 en medio de 114). Se cambió a `transform` (`y: -100% → 0`)
  dentro de un `<nav overflow-hidden>`, y `will-change` en las capas oscuras.
- Final: carrito y menú, abrir y cerrar, con brillo **monotónico** (sin saltos).
  Ancho de la cabecera estable (1275 px) con el carrito abierto.
- Flechas (CDP): solo derecha al inicio, ambas al avanzar, solo izquierda al
  final; ninguna en escritorio.
