# 001 — Plan

1. `npm i next@latest eslint-config-next@latest next-auth@^4.24 eslint@^9 --legacy-peer-deps`.
2. Route handlers con `[id]` (14 archivos en `src/app/api/**/[id]`):
   tipar `params: Promise<{ id: string }>` y hacer `const { id } = await params`
   al inicio; reemplazar `params.id` por `id`.
3. Páginas con `params` / `searchParams` (`dashboard/pedidos/[id]`,
   `flores/[id]`, `dashboard/egresos`, `dashboard/reportes`,
   `dashboard/todos-pedidos`): tipar como `Promise` y hacer `await`.
4. `cookies()` → `await cookies()` en `operaciones/page.tsx` y `flores/[id]/page.tsx`.
5. Renombrar `src/middleware.ts` → `src/proxy.ts`.
6. `eslint.config.mjs` copiado de CliqCut; script `"lint": "eslint ."`.
7. `tsconfig.json`: Next 16 lo ajusta solo (`jsx: react-jsx`, include de `.next/dev/types`).
8. Verificar `tsc` + `build`.
