# 014 — Plan

## Archivos

| Archivo | Cambio |
| --- | --- |
| `public/payment-logos/*` | Logos oficiales: `bancolombia.svg` (Wikimedia, logo 2023), `nequi.svg` (Wikimedia), `paypal.svg` (Wikimedia), `pse.jpg` (pse.com.co). |
| `src/lib/payment-providers.ts` | Lista `PAYMENT_PROVIDERS` (id, nombre, logo, etiqueta y ejemplo del número) y `getPaymentProvider(texto)` que reconoce valores antiguos (“nequi”, “BANCOLOMBIA ahorros”). |
| `src/components/ui/PaymentProviderLogo.tsx` | Baldosa blanca con el logo (`object-contain`); sin proveedor reconocido, icono de tarjeta. Sirve en tienda y panel. |
| `src/components/admin/AjustesClient.tsx` | Índice tipo `SettingsHub` de CliqCut + secciones `entrega`, `pagos`, `acceso` vía `?seccion=`. Proveedor como selector de 4 opciones con logo. |
| `src/app/dashboard/ajustes/page.tsx` | Pasa el número de tarjetas activas para el estado de la fila. |
| `src/components/client/CheckoutPageClient.tsx` | Resumen sin recuadro verde, punto de confianza con el día real, logos en “Aceptamos…”, paso de pago en 3 pasos dentro de una sola tarjeta. |

## Decisiones

- **Sin migración**: `PaymentMethod.provider` ya es `String?`; se guarda el
  nombre canónico (“Nequi”). La API no cambia.
- **Selector con logos en vez de `<select>` nativo**: elegir viendo la marca es
  más claro y deja ver el logo que verá el cliente.
- **Pasos 2–3 no se montan sin método** (CA-4): no hay `<input type="file">`
  que se pueda usar por accidente.
- **Sección en la URL** igual que CliqCut (`pushState` + `useSearchParams`).
- La fecha del pedido creado sigue saliendo de `estimatedTime` (fijada al
  crear), solo cambia su presentación.

## Qué puede romperse

- Flujo del enlace del equipo (`checkoutStage === "details"`): no se toca.
- `selectPaymentMethod`/`clearPaymentMethod` limpian el comprobante al cambiar:
  se conservan.
