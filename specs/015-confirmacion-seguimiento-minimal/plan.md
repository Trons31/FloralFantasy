# 015 — Plan

## Archivos

| Archivo | Cambio |
| --- | --- |
| `src/components/client/CheckoutPageClient.tsx` | Texto del botón: “Finalizar pedido”. |
| `src/lib/order-tracking.ts` (nuevo) | Titulares por estado, los 5 tramos y `trackingStepIndex(status)`; compartido por confirmación y seguimiento. |
| `src/app/checkout/confirmacion/page.tsx` | Tarjeta compacta: guía destacada (copiar / compartir), filas de resumen con `PaymentProviderLogo`. Sin framer-motion. |
| `src/components/client/SeguimientoPageClient.tsx` | Búsqueda minimalista y resultado en una columna; historial plegable. Sin `HeroBackdrop` ni framer-motion. |

## Decisiones

- **5 tramos en vez de 6**: “Listo” (`READY`) se muestra como parte de
  “Preparando”; al cliente le importa si ya salió, no el paso interno.
- **Copiar solo el código** de la guía (antes copiaba un bloque con datos de
  pago): es lo que se pega en el buscador.
- La copia usa `navigator.clipboard` y, si no hay, `execCommand` (igual que el
  checkout, spec 014).
- Componentes auxiliares a nivel de módulo (regla de AGENTS.md).

## Qué puede romperse

- `/checkout/confirmacion` lo abre el checkout tras subir el comprobante y la
  redirección de pedidos ya pagados: solo cambia la vista, no la carga.
- Enlaces `/seguimiento?token=` desde el panel y la confirmación: se conserva la
  búsqueda automática por `token`.
