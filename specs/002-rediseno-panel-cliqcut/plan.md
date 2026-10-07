# 002 — Plan

## Decisiones

- **Color**: se añade `brand` en Tailwind como alias de la paleta rosa
  `primary`. El código portado de CliqCut usa `brand-*` y funciona sin
  traducir clases.
- **Fuente**: Inter vía `next/font` aplicada en `dashboard/layout.tsx` y en el
  login. La tienda conserva Poppins.
- **Modales**: `src/components/ui/Modal.tsx` es el port de CliqCut.
  `ResponsiveModal` se mantiene como **adaptador** (misma API: `title`,
  `description`, `panelClassName`) que delega en `Modal`; así los ~15
  consumidores existentes adoptan el nuevo diseño sin reescribir su lógica.
  `ConfirmDialog` igual, delega en `ConfirmModal`.
- **Paginación**: `src/components/ui/Pagination.tsx` conserva su API
  (`page`, `totalPages`, `totalItems`, `perPage`, `onPageChange`,
  `onPerPageChange`) pero adopta el markup de `ServerPagination` de CliqCut.
- **Sidebar**: contenido extraído a un componente de módulo (`SidebarBody`)
  para no re-montarlo; drawer móvil siempre montado con
  `translate-x` + `visibility`, scroll-lock compartido. Sin framer-motion.

## Archivos

| Archivo | Cambio |
| --- | --- |
| `tailwind.config.ts` | alias `brand` |
| `src/app/globals.css` | `custom-scrollbar`, utilidades del panel |
| `src/lib/scroll-lock.ts` | nuevo (port) |
| `src/components/ui/*` | nuevas primitivas + adaptadores |
| `src/app/auth/login/page.tsx` | rediseño |
| `src/components/admin/AdminSidebar.tsx` | rediseño |
| `src/app/dashboard/layout.tsx` | contenedor CliqCut + Inter |
| `src/app/dashboard/page.tsx` | rediseño con `StatCard` |
| páginas del panel | `PageHeader`, quitar `p-6 lg:p-8` propios (el layout ya da el padding) |
