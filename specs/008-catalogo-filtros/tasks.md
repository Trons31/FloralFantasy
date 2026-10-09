# 008 — Tareas

Plan: `src/components/client/CatalogDropdown.tsx` (botón + menú `listbox`,
prop `align: "left" | "right"` para no salirse en móvil). En `FloresClient`:
fila 1 = buscador + 2 desplegables; fila 2 = píldoras de categorías + “Limpiar
filtros”. Se elimina `CatalogSelect`.

- [x] T1 `CatalogDropdown` accesible (teclado, clic fuera, Escape).
- [x] T2 Buscador con botón de borrar.
- [x] T3 Píldoras de categoría + degradado de scroll en móvil.
- [x] T4 “Limpiar filtros”.
- [x] T5 `tsc`, lint, build, prueba por CDP (abrir, teclado, Escape, clic
      fuera) y capturas 1280 / 390.

Verificado por CDP (11/11): sin <select>, abre con clic, ↓+Enter elige, Escape y clic
fuera cierran, “Limpiar filtros” solo con filtros y reinicia, nombres completos,
menú dentro de la pantalla y sin scroll horizontal en 390px.
Ajuste tras la captura móvil: la opción “Todos los precios” pasó a “Todos”.
