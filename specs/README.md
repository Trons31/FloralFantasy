# Specs (Spec-Driven Development)

Cada carpeta es un cambio con su `spec.md` (qué/por qué), `plan.md` (cómo) y
`tasks.md` (tareas verificables). Ver la metodología en [AGENTS.md](../AGENTS.md#1-cómo-se-trabaja-aquí-spec-driven-development-sdd).

| # | Spec | Estado |
| --- | --- | --- |
| 001 | [Upgrade a Next.js 16](001-upgrade-next16/spec.md) | Implementada |
| 002 | [Rediseño del panel a imagen de CliqCut](002-rediseno-panel-cliqcut/spec.md) | En curso |
| 003 | [Formato de 12 horas en todo el sistema](003-formato-12-horas/spec.md) | Implementada |
| 004 | [Catálogo: tarjeta única y carga progresiva](004-catalogo-card-unificada/spec.md) | Implementada |
| 005 | [Carrito y checkout: apertura, scroll, hora límite y pedido pendiente](005-carrito-checkout-flujo/spec.md) | Implementada |
| 006 | [Textos de entrega pensados para el cliente](006-copy-entrega-cliente/spec.md) | Implementada |
| 007 | [Carrito: lista con scroll, resumen fijo y sin sombras](007-carrito-resumen-fijo/spec.md) | Implementada |
| 008 | [Catálogo: filtros y orden con mejor diseño](008-catalogo-filtros/spec.md) | Implementada |
| 009 | [Banners con foto nítida, textos amplios y filtros tras “Más vendidos”](009-banners-nitidos/spec.md) | Implementada |
| 010 | [Tienda sin parpadeos al abrir el carrito y el menú; flechas en carruseles](010-sin-parpadeos-tienda/spec.md) | Implementada |
| 011 | [Animaciones ligeras (fade-in) y flechas sutiles, como CliqCut](011-animaciones-ligeras/spec.md) | Implementada |

## Plantilla

```md
# NNN — Título

## Problema
## Objetivo
## Experiencia de usuario
<!-- Obligatoria: qué percibe la persona (pasos, feedback, móvil vs escritorio, estados vacíos/carga/error). -->
## Alcance (dentro / fuera)
## Criterios de aceptación
- [ ] CA-1 …
## Riesgos
```
