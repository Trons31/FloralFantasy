# 012 — Plan

## Datos (Prisma)

```prisma
model CardOption {
  id          String      @id @default(cuid())
  name        String
  description String      @default("")
  price       Float       @default(0)
  maxChars    Int         @default(200)
  imageUrl    String?
  imagePublicId String?
  isActive    Boolean     @default(true)
  sortOrder   Int         @default(0)
  createdAt   DateTime    @default(now())
  orderItems  OrderItem[]
}

model OrderItem {
  // …campos actuales…
  cardOptionId String?
  cardOption   CardOption? @relation(fields: [cardOptionId], references: [id])
  cardName     String?   // copia al momento de comprar
  cardPrice    Float     @default(0)
  cardMessage  String?
}
```

- Migración `20261015000000_card_options` (aditiva). Semilla con las tres
  opciones de la referencia: Básica (0, 200), Mediana (15.000, 450) y Grande
  (20.000, 900).
- `Order.giftMessage` se conserva para pedidos antiguos y no se escribe en
  pedidos nuevos de la tienda.

## API

| Ruta | Cambio |
| --- | --- |
| `GET /api/card-options` | Nueva. Opciones activas (pública). |
| `GET/POST /api/card-options?all=1`, `PATCH/DELETE /api/card-options/[id]` | Nueva. Admin (`requireAdminUser`). DELETE solo desactiva (`isActive=false`); nunca borra filas. |
| `POST /api/orders` | Acepta `items[].card = { id, message }`. Para `source=CLIENT` recalcula precios y total con la base de datos y valida el límite de caracteres. Guarda `cardOptionId/cardName/cardPrice/cardMessage`. |
| `GET /api/orders/[id]`, `/api/seguimiento`, vista de operaciones | Incluir los campos `card*` del item (los `select` explícitos). |
| `payment-proof` | Sin cambios. |

## Cliente

- `src/store/cartStore.ts`
  - `CartItem.card?: { id: string; name: string; price: number; message: string }`.
  - `calcSubtotal` suma `card.price` por unidad (igual que se debe hacer con
    los complementos: **ojo**, hoy `calcSubtotal` suma los complementos una sola
    vez mientras que la ficha los multiplica por la cantidad. Se unifica a
    "por unidad" en ambos sitios).
  - La clave de fusión de `addItem` incluye `card.id` y `card.message`.
  - `buyNowItem: CartItem | null` (no persistido en zustand) + `setBuyNow` /
    `clearBuyNow`, respaldado en `sessionStorage` para sobrevivir recargas.
- `src/components/client/ProductDetail.tsx` — reestructurar con
  subcomponentes **a nivel de módulo** (regla de AGENTS §2): `GiftMessageField`,
  `CardOptionList`, `PurchaseActions`. Quitar `framer-motion` del modal de
  complementos y usar `Modal` de `components/ui`.
- `src/components/client/CheckoutPageClient.tsx` — si `?mode=buy-now` y hay
  `buyNowItem`, usar `[buyNowItem]` como lista de items; al crear el pedido
  llamar `clearBuyNow()` en vez de `clearCart()`. El campo dedicatoria del pedido se conserva.
- `CartDrawer.tsx` y el resumen del checkout: línea secundaria con tarjeta y
  mensaje.
- `src/app/operaciones/PreparadorView.tsx`, `src/app/dashboard/pedidos/[id]` y
  `CreateOrderModal` (solo lectura/compatibilidad): mostrar `card*`.
- Panel: `src/app/dashboard/tarjetas/page.tsx` siguiendo el patrón de
  `dashboard/addons` (PageHeader, tabla md+ / tarjetas en móvil, `Modal`,
  `ConfirmModal`) + enlace en el sidebar.

## Estilo de la ficha (tokens)

- Contenedor de sección: `rounded-xl border border-slate-200 bg-white`, sin sombras.
- Etiqueta de sección: `text-[11px] font-bold uppercase tracking-[.14em] text-slate-500`.
- Títulos: `font-display` (Cormorant, ya cargada).
- Opción elegida: `border-primary-400 bg-primary-50/60`; radio propio de 18px.
- Precio extra: `text-sm font-bold text-primary-700`.
- Botón principal: `h-12 rounded-xl bg-primary-600`, sin resplandor;
  secundario: `border border-primary-600 text-primary-700`.

## Qué puede romperse

- Totales del checkout si el subtotal del cliente y el del servidor difieren:
  tras crear el pedido, mostrar el `total` devuelto por el servidor.
- `CreateOrderModal` del panel envía `price` y `total` propios: queda fuera del
  recálculo (`source=ADMIN`).
- Carritos persistidos antiguos sin `card`.
