# 008 — Catálogo: filtros y orden con mejor diseño

## Problema
- “Ordenar” y “Precio” son `<select>` nativos: el menú lo pinta el sistema
  operativo (gris, sin marca, distinto en cada navegador) y no se puede
  estilizar.
- Las categorías son tarjetas de 96 px de alto con el texto cortado
  (“Buchon y Bo…”). Ocupan mucho y parecen botones de una app, no filtros.
- No hay forma rápida de limpiar la búsqueda ni los filtros.

## Objetivo
Una barra de filtros limpia y con la estética de la tienda: buscador,
desplegables propios para orden y precio, y categorías como píldoras.

## Experiencia de usuario
- **Buscador** primero (es lo más usado), con botón ✕ para borrar.
- **Ordenar / Precio**: botones con etiqueta pequeña (“Ordenar”) y el valor
  actual en negrita (“Recientes”). Al abrir, un menú flotante con las opciones,
  la elegida marcada con ✓, hover rosa suave y animación corta. Se cierra al
  elegir, con Escape, al hacer clic fuera o con Tab. Se maneja con teclado
  (↑ ↓ Enter) y es accesible (`listbox`/`option`).
- **Categorías**: píldoras con ícono y nombre completo (sin cortar), 40 px de
  alto; la activa en rosa de marca. En móvil hacen scroll horizontal con un
  degradado en el borde que indica que hay más.
- **Limpiar filtros**: aparece solo si hay algo aplicado (búsqueda, categoría o
  precio) y deja todo en el estado inicial.

## Alcance
**Dentro**: `FloresClient.tsx` (sección de filtros) y un componente nuevo
`CatalogDropdown`.
**Fuera**: la lógica de filtrado y orden (no cambia); las tarjetas (spec 004).

## Criterios de aceptación
- [x] CA-1 No queda ningún `<select>` en `FloresClient`.
- [x] CA-2 `CatalogDropdown` abre/cierra con clic, cierra con Escape y clic
  fuera, navega con ↑ ↓ y elige con Enter; expone `aria-expanded`,
  `role="listbox"` y `aria-selected`.
- [x] CA-3 Las categorías muestran el nombre completo (sin `truncate`) en
  píldoras de `h-10`.
- [x] CA-4 “Limpiar filtros” aparece solo con filtros activos y los reinicia.
- [x] CA-5 El buscador tiene botón para borrar cuando hay texto.
- [x] CA-6 Revisado a 1280 y 390 px: sin desbordes; el menú del desplegable de
  la derecha no se sale de la pantalla.
