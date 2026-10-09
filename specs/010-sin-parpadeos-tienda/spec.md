# 010 — Tienda sin parpadeos al abrir el carrito y el menú; flechas en carruseles

## Problema
Grabado cuadro a cuadro (screencast de Chrome) en `/flores`:
1. **Carrito, escritorio**: el fondo alterna entre desenfocado y nítido
   durante la animación: el `backdrop-blur-md` de la capa oscura parpadea al
   animar su opacidad. Además la cabecera fija salta 5 px (de 1275 a 1280 de
   ancho) al ocultarse la barra de scroll: el bloqueo compensa el `body` pero
   no los elementos `fixed`.
2. **Carrito, móvil**: el panel ocupa toda la pantalla y entra con fundido de
   opacidad: varios cuadros muestran la página “lavada” y semitransparente.
3. **Menú, móvil**: también entra con fundido; sus enlaces se ven transparentes
   encima del catálogo. En el inicio, además, la cabecera cambia de alto
   (`py-5` → `py-3`) al abrirlo. No bloquea el scroll ni se cierra al navegar.
4. **Carruseles en móvil** (“Más vendidos”, categorías): nada indica que se
   pueden deslizar.

## Objetivo
Abrir y cerrar carrito y menú sin parpadeos, y carruseles que se entienden
como deslizables.

## Experiencia de usuario
- El carrito **se desliza** desde la derecha, opaco de principio a fin; el
  fondo se oscurece suavemente, sin desenfoque. Nada de la página salta.
- El menú móvil **se despliega** hacia abajo, opaco, con una capa oscura sobre
  el resto; se cierra al tocar fuera, con Escape o al navegar, y bloquea el
  scroll del fondo. La cabecera no cambia de alto.
- Los carruseles muestran flechas ‹ › en los bordes cuando hay más contenido
  hacia ese lado; tocar una flecha avanza una “página”. La flecha de un lado
  desaparece al llegar a ese extremo.

## Alcance
**Dentro**: `CartDrawer`, `Header` (menú móvil), `scroll-lock.ts`,
`FloresClient` (carruseles); componente nuevo `ScrollArrows`.
**Fuera**: el panel administrativo (usa el mismo `scroll-lock`, que mejora
igual).

## Criterios de aceptación
- [x] CA-1 La capa del carrito no usa `backdrop-blur`; el panel anima solo
  `transform` (sin `opacity`).
- [x] CA-2 Con el carrito abierto, el ancho de la cabecera no cambia
  (`scroll-lock` publica `--scroll-lock-gap` y la cabecera lo respeta).
- [x] CA-3 El menú móvil es opaco durante toda su animación, tiene capa
  oscura, bloquea el scroll y se cierra con clic fuera, Escape y al navegar;
  la cabecera mantiene su alto al abrirlo.
- [x] CA-4 “Más vendidos” y las categorías muestran flechas en móvil cuando hay
  contenido oculto; la flecha izquierda no aparece al inicio y la derecha
  desaparece al final.
- [x] CA-5 Re-grabado cuadro a cuadro: ningún cuadro muestra la página
  semitransparente ni el fondo alternando nitidez.
