# 015 — Confirmación compacta y seguimiento minimalista

## Problema

1. El botón final del pago dice “Enviar comprobante”: suena a un trámite a
   medias, no a terminar la compra.
2. La confirmación (`/checkout/confirmacion`) tiene un cuadro grande vacío
   con el icono de una tarjeta (el “QR” de un método que no tiene QR), repite
   todos los datos de pago y una línea de tiempo larga. No deja claro que la
   guía hay que guardarla.
3. El seguimiento (`/seguimiento`) está muy cargado: foto de fondo, “¿Cómo
   funciona?”, un bloque promocional, preguntas frecuentes, y en el resultado
   seis tarjetas que repiten la misma información.

## Objetivo

Que el cliente termine la compra con un botón claro, salga de la confirmación
sabiendo que debe guardar la guía, y consulte el estado en una página limpia
donde lo primero es *en qué va su pedido y cuándo llega*.

Referencias revisadas: buenas prácticas de páginas de rastreo (Malomo, Loop,
Baymard/Amazon) y el ejemplo de envia.co. Lo común: el estado y la fecha
primero, un solo indicador de avance, lo esencial (guía, productos, dirección,
entrega) y nada de relleno.

## Experiencia de usuario

**Pago**: el botón dice “Finalizar pedido” (“Finalizando…” mientras sube).

**Confirmación**
- Una tarjeta compacta (máx. 448px): check, “¡Pedido recibido!” y una línea:
  “Estamos validando tu pago”.
- Bloque destacado **“Guarda tu guía”**: el código grande, “Copiar guía”
  (feedback “Copiada”) y “Compartir” cuando el navegador lo permite (para
  mandársela por WhatsApp a uno mismo). Debajo: “La necesitas para consultar
  tu pedido. Cópiala o toma una captura.”
- Resumen en filas cortas: Estado, Entrega, Pago (logo del proveedor) y Total.
  Sin cuadro vacío ni línea de tiempo.
- “Ver seguimiento” (principal) y “Volver a la tienda”.

**Seguimiento — buscar**
- Sin foto ni bloques informativos: título “Rastrea tu pedido”, una línea de
  ayuda y un campo con el botón dentro (“Rastrear”). Ayuda debajo: “Tu guía
  tiene el formato FLR-XXXXXX y está en tu confirmación.” y “¿No la tienes?
  Escríbenos por WhatsApp”.
- Error en línea bajo el campo.

**Seguimiento — resultado** (una columna, máx. 672px)
- Arriba: “← Buscar otra guía” y la guía con “Copiar”.
- Tarjeta de estado: titular en lenguaje natural (“Estamos preparando tu
  arreglo”), una frase y la fecha de entrega. Debajo, una barra de 5 tramos:
  Recibido · Pagado · Preparando · En camino · Entregado.
- Pago rechazado / cancelado: aviso en rojo en lugar de la barra. Pedido sin
  pagar: botón “Completar pago”.
- Una tarjeta de detalle con filas: productos (foto, nombre, cantidad),
  entrega (dirección y fecha), pago (logo, método, estado) y total.
- “Historial” plegado (“Ver historial · N”).
- Al final, una línea: “¿Necesitas ayuda? Escríbenos”.
- Aparición con `animate-fade-in` (spec 011), sin framer-motion.

## Alcance

**Dentro**: `CheckoutPageClient` (texto del botón),
`src/app/checkout/confirmacion/page.tsx`, `SeguimientoPageClient`.

**Fuera**: API de seguimiento (no cambia), notificaciones, identidad de la
tienda (tipografía `font-display` y paleta se mantienen).

## Criterios de aceptación

- [x] CA-1 El botón del paso 3 dice “Finalizar pedido”.
- [x] CA-2 La confirmación no muestra ningún cuadro de imagen vacío; si el
      método tiene QR, no se muestra (ya pagó).
- [x] CA-3 La confirmación muestra “Guarda tu guía”, el código y “Copiar guía”.
- [x] CA-4 La búsqueda del seguimiento no tiene foto, “¿Cómo funciona?”,
      bloque promocional ni preguntas frecuentes.
- [x] CA-5 El resultado muestra titular de estado, fecha de entrega y barra de
      5 tramos con el tramo actual marcado.
- [x] CA-6 Con `PAYMENT_INVALID` o `CANCELLED` se ve un aviso rojo y no la barra.
- [x] CA-7 375px: sin desborde horizontal en confirmación ni seguimiento.

## Riesgos

- El enlace de ayuda usaba un número de relleno (`573000000000`); se usa el
  de `WhatsAppButton` (`573024128595`), que es el de la tienda.
- `navigator.share` no existe en todos los navegadores: el botón solo aparece
  si está disponible.
