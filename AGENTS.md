# Floristería (Fantasía Floral) — guía para agentes

Tienda online de flores + panel administrativo + vista de operaciones para el
equipo (preparador, repartidor, corredor).

Next.js 16 · App Router · React 18 · TypeScript · Tailwind 3 · Prisma 5 ·
PostgreSQL (Supabase) · NextAuth v4 · Cloudinary · FCM / Web Push.

---

## 1. Cómo se trabaja aquí: Spec-Driven Development (SDD)

**Ningún cambio no trivial se escribe sin spec.** El flujo es siempre:

```
specs/<NNN-nombre>/
  spec.md    ← QUÉ y POR QUÉ: problema, alcance, criterios de aceptación
  plan.md    ← CÓMO: archivos afectados, decisiones técnicas, riesgos
  tasks.md   ← lista de tareas verificables, se marcan [x] al terminarlas
```

1. **Spec** — redacta `spec.md`. Los criterios de aceptación deben poder
   comprobarse (“el card del login mide máx. 448px”), nunca “se ve mejor”.
   **La UX es prioridad en cada spec**: `spec.md` lleva siempre una sección
   *Experiencia de usuario* que describe lo que percibe la persona (pasos,
   feedback, carga, estados vacíos y de error, táctil vs. mouse, 375px vs.
   escritorio). Si una decisión técnica empeora la experiencia, se justifica
   ahí.
2. **Plan** — `plan.md`: qué archivos se tocan, qué primitivas se usan,
   qué puede romperse.
3. **Tasks** — `tasks.md`: tareas pequeñas y ordenadas. Cada una deja el repo
   compilando.
4. **Implementar** — una tarea a la vez; marcarla al terminar.
5. **Verificar** — `npx tsc --noEmit` = 0 errores, `npm run build` pasa, y se
   revisan los criterios de aceptación en escritorio **y** en móvil (375px).

Specs vigentes: ver [`specs/README.md`](specs/README.md).

Un bug de una línea o un ajuste de copy no necesita spec. Todo lo que cambie
comportamiento, contrato de API, esquema o el sistema de diseño, sí.

---

## 2. La regla de diseño: CliqCut es la referencia

El panel de Floristería se rediseña **a imagen de CliqCut**
(`D:\MVPs\CliqCut-Web`). Ante cualquier duda visual —proporciones, radios,
espaciados, tablas, paginación, modales, sidebar— **se copia lo que hace
CliqCut** y se cambia solo el color de marca.

| Concepto | CliqCut | Floristería |
| --- | --- | --- |
| Color de marca | violeta `brand-*` | rosa `primary-*` (alias `brand-*`) |
| Fuente panel | Inter | Inter |
| Sidebar | blanco, `w-64`, borde `gray-100` | igual |
| Fondo de página | `bg-gray-50` | igual |
| Cards | `rounded-2xl border border-gray-100 bg-white shadow-sm` | igual |

**Textos para el cliente final** (spec 006): decir lo que le importa
(“Entrega mañana, 9 de octubre”), nunca las reglas internas (“hora límite
configurada”, “Ya pasaron las 4:00 PM”). La hora límite solo se menciona
*antes* de que pase, como beneficio (“Pide antes de las 4:00 PM”). Fechas con
`formatDeliveryDay`.

**La tienda pública (`/`, `/flores`, `/checkout`, `/seguimiento`) conserva su
identidad propia** (tipografía y estética floral). El rediseño CliqCut aplica a
`/auth/*`, `/dashboard/*` y `/operaciones`.

### Primitivas de UI (usar SIEMPRE, no reinventar)

Viven en `src/components/ui/`. Son ports directos de CliqCut:

| Componente | Para qué |
| --- | --- |
| `Modal` | Toda ventana. Hoja inferior en móvil, centrada en `sm+`. Foco atrapado, Escape, scroll-lock compartido. Tamaños `sm·md·lg·xl·2xl`. |
| `ConfirmModal` | Confirmaciones (eliminar, salir, cambiar estado). |
| `LoadingButton` | Botones con estado de carga. Variantes `primary·secondary·danger·ghost`. |
| `PageHeader` | Título + subtítulo + acción de cada página. |
| `StatCard` | KPIs del dashboard. |
| `EmptyState` | Listas vacías. |
| `Pagination` | Paginación de tablas: “Mostrando X a Y de Z · Anterior · Página N de M · Siguiente · N por página”. |
| `ScrollableTabs` | Pestañas que desbordan en móvil. |
| `TimeInput12` | Selector de hora en 12 h (hora · minutos · AM/PM). Emite `"HH:mm"`. Nunca usar `<input type="time">`. |
| `OpsHeader` (`components/operations`) | Cabecera común de las vistas de operaciones. |
| `ProductCard` (`components/client`) | **Única** tarjeta de producto de la tienda (home, catálogo, recomendaciones). Agregar al carrito con `useQuickAdd`. |
| `HeroBackdrop` (`components/client`) | Banner con foto: fondo desenfocado + foto nítida a su tamaño real. **Nunca estirar una foto de producto a todo el ancho**: son ≈960×1280 y se pixelan (spec 009). |
| `CatalogDropdown` (`components/client`) | Desplegable de la tienda (listbox accesible). **No usar `<select>` nativo en la tienda** (spec 008). |
| `CartDrawer` (`components/client`) | Lo monta **solo** `Header`; no montarlo en páginas. Abrir con `openCart()`, no `toggleCart()`. El pedido creado sin pagar vive en `cartStore.pendingOrder` (spec 005). |
| `BrandLogo` | Isotipo oficial en baldosa. Exporta `LOGO_FULL_SRC` (flor + “FANTASIA FLORAL”). |

**Logo oficial** (`public/logo/`): `logo.png` es el original del cliente; el
resto se genera a partir de él. `logo-full.png` (completo, transparente),
`logo-mark.png` (solo la flor), `logo-mark-small.png` (flor con trazo
engrosado para ≤ 64px), `icon-192/512.png` y `apple-touch-icon.png` (PWA, fondo
blanco) y `src/app/icon.png` (favicon). `public/flowers/logo.png` es el logo
anterior y ya no se usa.

Reglas:

- **Bloqueo de scroll**: solo con `useBodyScrollLock` de `src/lib/scroll-lock.ts`.
  Nunca escribir `document.body.style.overflow` a mano: con dos capas abiertas
  la página queda bloqueada.
- **Aperturas ligeras, como CliqCut** (specs 010–011): carrito, menú y capas
  aparecen con `animate-fade-in` (CSS, 150 ms) y se desmontan al cerrar; sin
  deslizamientos con framer-motion ni `backdrop-blur` en capas que se animan.
  Los elementos `fixed` usan `right: var(--scroll-lock-gap, 0px)` para no
  saltar al bloquear el scroll. Carruseles horizontales: `ScrollArrows`
  (degradado + chevron sutil, como `ScrollableTabs` de CliqCut).
- **No definir componentes dentro de otros componentes** (`const Content = () => …`
  dentro del render). Se re-montan en cada render y producen parpadeos — era la
  causa del parpadeo del sidebar en móvil.
- **Tablas**: en `md+` tabla con cabecera `text-[10px] font-bold uppercase
  tracking-wide text-gray-400` sobre `bg-gray-50/80`, celdas `px-3 py-2.5`;
  en móvil, lista de tarjetas (`md:hidden`). La paginación va dentro del card.
- **Inputs**: `h-11 rounded-xl border-gray-200 bg-gray-50`, foco
  `focus:border-brand-300 focus:ring-4 focus:ring-brand-100`. Etiqueta
  `text-sm font-bold text-gray-700`.
- Iconos: `react-icons` — preferir `fi` (Feather) en el panel como CliqCut.

---

## 3. Mapa del repo

```
src/app/page.tsx, flores/, checkout/, seguimiento/  — tienda pública
src/app/auth/login      login del panel
src/app/dashboard/*     panel admin (ADMIN, SUPER_ADMIN)
src/app/operaciones     vista del equipo (PREPARADOR, REPARTIDOR, CORREDOR)
src/app/api/*           route handlers
src/components/admin    clientes del panel
src/components/ui       primitivas compartidas (ver §2)
src/lib/*               lógica: auth, prisma, notificaciones, contabilidad…
prisma/                 esquema + migraciones
specs/                  especificaciones SDD
```

### Roles y sesiones

- `ADMIN`, `SUPER_ADMIN` → NextAuth (credenciales) → `/dashboard`.
  Protegido en `src/proxy.ts` **y** en `src/app/dashboard/layout.tsx`.
- `PREPARADOR`, `REPARTIDOR`, `CORREDOR` → cookie firmada `ff_ops_session`
  (`src/lib/route-auth.ts`) → `/operaciones`.

### Estados de pedido (`OrderStatus`)

`PENDING → PENDING_PAYMENT_CONFIRMATION → (PAYMENT_INVALID) → PAID → PROCESSING
→ READY → OUT_FOR_DELIVERY → DELIVERED` · `CANCELLED`.
Las etiquetas en español (“Por preparar”, “En producción”…) deben ser las
mismas en dashboard, tablero, lista y operaciones.

---

## 4. Trampas conocidas (Next 16)

1. **`params` y `searchParams` son `Promise`.** En páginas y route handlers:
   ```ts
   export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
     const { id } = await params
   ```
2. **`cookies()` y `headers()` son async**: `(await cookies()).get(...)`.
3. **`middleware.ts` se llama `proxy.ts`** (Next 16). Exporta `proxy` / default.
4. **Turbopack es el bundler por defecto** en `dev` y `build`.
5. **`next lint` ya no existe**: `npm run lint` usa ESLint 9 (flat config,
   `eslint.config.mjs`).
6. Fechas: el negocio opera en hora de Colombia (UTC-5). Cuidado con
   `new Date()` en servidor al calcular “hoy”.
   **Toda hora visible va en 12 horas** (`4:00 PM`), en tienda, panel,
   operaciones, PDF y CSV: usar `formatTime`, `formatTime12` (para el
   `"HH:mm"` guardado) o `formatDateTime` de `src/lib/utils.ts`. Nunca `HH:mm`,
   `toLocaleTimeString` ni interpolar la hora cruda (spec 003).
7. Prisma: usar `select` explícito en consultas nuevas.

---

## 5. Checklist antes de dar algo por terminado

- [ ] Existe spec y sus tareas están marcadas.
- [ ] `npx tsc --noEmit` → 0 errores.
- [ ] `npm run build` pasa.
- [ ] Revisado en 375px (móvil) y ≥1280px (escritorio).
- [ ] Modales: abren, cierran con Escape y con el fondo, no dejan el scroll bloqueado.
- [ ] Sin `document.body.style.overflow` manual ni componentes definidos dentro del render.

## 6. Cosas que NO se hacen sin preguntar

- Migraciones o `db push` contra la base de producción.
- Cambiar el contrato de `/api/*` que consume la vista de operaciones o la tienda.
- Tocar la lógica de contabilidad / pagos / notificaciones al hacer cambios visuales.
- Rediseñar la tienda pública (fuera del alcance de la spec 001).
