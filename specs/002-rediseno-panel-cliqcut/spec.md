# 002 — Rediseño del panel a imagen de CliqCut

## Problema

El panel de Floristería tiene una estética inconsistente respecto a CliqCut,
que es el producto de referencia del equipo:

1. **Login**: el card mide hasta `max-w-lg` (512px) y lleva dos logos (flor y
   escudo) que CliqCut no tiene; el titular usa otra jerarquía.
2. **Sidebar**: oscuro (`#0d1a2d`) con cabecera “SUPER ADMIN”; CliqCut usa
   sidebar blanco con card de negocio + usuario.
3. **Móvil**: al abrir el menú lateral la pantalla **parpadea**. Causas:
   `SidebarContent` se define dentro del render (se re-monta en cada render),
   la animación de opacidad de framer-motion y el `overflow` del body
   escrito a mano.
4. **Tablas y paginación**: cada pantalla pagina distinto (botones numerados,
   “Mostrar N”), CliqCut usa un único patrón.
5. **Modales**: `ResponsiveModal` con radios de 2rem, títulos grandes, sin
   foco atrapado ni Escape, y bloqueo de scroll que se rompe con dos capas.

## Objetivo

Que el panel (`/auth/login`, `/dashboard/*`) se vea y se comporte como
CliqCut, conservando el rosa de la marca Floristería.

## Alcance

**Dentro**
- Primitivas UI portadas de CliqCut (`Modal`, `ConfirmModal`, `LoadingButton`,
  `StatCard`, `PageHeader`, `EmptyState`, `Pagination`, `ScrollableTabs`,
  `scroll-lock`).
- Login, sidebar + topbar móvil, layout del dashboard, página Dashboard.
- Paginación de todas las tablas del panel.
- Todos los modales del panel migrados a `Modal` (vía `ResponsiveModal`, que
  pasa a ser un adaptador de `Modal`).
- Fuente Inter en el panel.

**Fuera**
- Tienda pública (`/`, `/flores`, `/checkout`, `/seguimiento`).
- Lógica de negocio, API, esquema.

## Criterios de aceptación

### Login
- [ ] CA-1 Fondo `gray-950` + degradado `rose-950/40` + rejilla de 60px, como CliqCut.
- [ ] CA-2 El card mide como máximo `max-w-md` (448px), `rounded-[28px]`, sin logos dentro.
- [ ] CA-3 Columna izquierda: marca (logo + “Fantasía Floral”), titular `text-5xl font-black`, 3 tarjetas de características.
- [ ] CA-4 En móvil se ve logo + nombre centrados encima del card.
- [ ] CA-5 Inputs `h-12 lg:h-11 rounded-2xl lg:rounded-xl`, botón primario sólido de marca.

### Sidebar y layout
- [ ] CA-6 Sidebar blanco `w-64`, borde `gray-100`, card superior con logo + nombre del negocio y, bajo un divisor, usuario + rol.
- [ ] CA-7 Secciones con título `text-[10px] uppercase text-gray-400`; ítem activo `bg-brand-500 text-white` con indicador lateral.
- [ ] CA-8 Footer con card “Cerrar sesión” y confirmación con `ConfirmModal`.
- [ ] CA-9 Topbar móvil blanco con logo + nombre + botón menú.
- [ ] CA-10 Abrir/cerrar el menú en móvil **no parpadea**: el drawer está siempre montado y se desliza con `transform`, sin re-montar su contenido.
- [ ] CA-11 Contenido en `max-w-[96rem] px-4 py-4 sm:px-6 sm:py-6` sobre `bg-gray-50`.

### Dashboard
- [ ] CA-12 Encabezado “Dashboard - Fantasía Floral” + fecha en `capitalize`.
- [ ] CA-13 KPIs con `StatCard` en `grid-cols-2 lg:grid-cols-4` (hoy, ingresos de hoy, por preparar, en producción…).
- [ ] CA-14 Card “Pedidos recientes” con cabecera `p-5 border-b` y enlace “Ver todos” `text-brand-600`.

### Tablas, paginación y modales
- [ ] CA-15 Toda paginación del panel usa `Pagination` (texto “Mostrando X a Y de Z”, Anterior / Página N de M / Siguiente, selector “N por página”).
- [ ] CA-16 Todo modal del panel: hoja inferior con tirador en móvil, centrado en `sm+`, `rounded-2xl`, cabecera `p-5 border-b`, cierra con Escape y fondo, foco atrapado.
- [ ] CA-17 Abrir un modal sobre otro y cerrarlos en cualquier orden deja el scroll de la página funcionando.

## Riesgos

- Los managers grandes (`ProductosManager`, `CreateOrderModal`…) tienen
  estilos en línea propios: se migran por la primitiva común para no tocar
  su lógica.
- El color `primary` lo usa también la tienda pública: el alias `brand`
  apunta a la misma paleta para no alterar la tienda.
