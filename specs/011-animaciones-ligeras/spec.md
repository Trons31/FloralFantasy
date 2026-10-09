# 011 — Animaciones ligeras (fade-in) y flechas sutiles, como CliqCut

## Problema
- Las flechas de los carruseles (spec 010) son círculos blancos con sombra que
  tapan las píldoras y las fotos (“Cump[>]os”). Se ven pesadas.
- El carrito y el menú móvil se deslizan con framer-motion (`transform`). Se ven
  costosos y se sienten lentos en teléfonos modestos.

## Referencia (CliqCut, `D:\MVPs\CliqCut-Web`)
- `components/ui/ScrollableTabs.tsx`: en el borde con contenido oculto, un
  degradado del color del fondo (`w-10`) con un chevron pequeño (`h-4`) de
  color de marca; el derecho con `animate-pulse`. No tapa nada.
- `components/shared/Sidebar.tsx`: el menú móvil se monta directo con una capa
  `bg-black/45`, sin deslizar.

## Objetivo
Flechas y aperturas con la misma ligereza que CliqCut.

## Experiencia de usuario
- Las flechas son un degradado sutil en el borde con un chevron pequeño rosa.
  Solo aparecen hacia el lado con contenido oculto; tocar el borde avanza.
- El carrito y el menú aparecen con un **fade-in corto (150 ms)** y se cierran
  al instante. Sin deslizamientos.
- Sin framer-motion en carrito ni menú: solo una animación CSS de opacidad.

## Alcance
**Dentro**: `ScrollArrows`, `CartDrawer`, `Header` (menú móvil),
`tailwind.config.ts` (animación `fade-in`).
**Fuera**: el resto de animaciones de la tienda.

## Criterios de aceptación
- [x] CA-1 `ScrollArrows` usa degradado `w-10` + chevron `h-4` color de marca,
  sin círculo ni sombra; mantiene la lógica de spec 010 (solo hacia el lado
  con contenido oculto).
- [x] CA-2 `CartDrawer` y el menú móvil no importan framer-motion; aparecen con
  `animate-fade-in` (150 ms) y se desmontan al cerrar.
- [x] CA-3 Sin regresiones de spec 005/010: Escape, clic fuera, cierre al
  navegar, bloqueo de scroll y cabecera sin salto.
- [x] CA-4 Revisado a 390 y 1280 px.
