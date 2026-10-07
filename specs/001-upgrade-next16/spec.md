# 001 — Upgrade a Next.js 16

## Problema

Floristería corre en Next 14.2.0 mientras CliqCut (la referencia del
ecosistema) ya está en Next 16. Mantener dos majors distintos duplica las
trampas a recordar, impide copiar código entre repos tal cual y deja a
Floristería sin Turbopack estable ni los parches de seguridad de 14.x
posteriores (14.2.0 tiene CVEs conocidos de middleware).

## Objetivo

Subir a la última versión estable de Next 16 conservando React 18 (igual que
CliqCut) y sin cambiar comportamiento.

## Alcance

**Dentro**
- `next`, `eslint-config-next` → 16.x; `eslint` → 9 con flat config.
- `next-auth` → última 4.24.x (soporta Next 16).
- `params` / `searchParams` asíncronos en páginas y route handlers.
- `cookies()` asíncrono.
- `src/middleware.ts` → `src/proxy.ts`.
- Script `lint`.

**Fuera**
- React 19, NextAuth v5, Prisma 6 (cambios independientes).

## Criterios de aceptación

- [x] CA-1 `package.json` declara `next@16.x` y la app arranca con `npm run dev`.
- [x] CA-2 `npx tsc --noEmit` → 0 errores.
- [x] CA-3 `npm run build` termina sin errores.
- [x] CA-4 `/dashboard/*` sin sesión redirige a `/auth/login` (proxy + layout).
- [x] CA-5 Ningún route handler lee `params.x` sin `await`.

## Riesgos

- Dependencias con peer de React 18 (`@hello-pangea/dnd`, `framer-motion`):
  se mantienen en React 18, así que no aplican.
- `next-auth/middleware` (`withAuth`) sigue funcionando desde `proxy.ts`.
