# 006 — Textos de entrega pensados para el cliente

## Problema
La tienda le explica al cliente reglas internas del negocio:
- “Estás pidiendo después de la hora límite configurada. Este pedido se
  entregará el día siguiente…” (detalle de producto).
- “Después de las 4:00 PM: queda para 9 de octubre de 2026” (chip en el detalle).
- “Ya pasaron las 4:00 PM. Los arreglos de entrega inmediata…” (catálogo).
- “Ya pasaron las 4:00 PM; lo de entrega inmediata sale el siguiente día”
  (carrito) y “Pedido después de las 4:00 PM” (checkout).

Al cliente no le importa la “hora límite configurada”: quiere saber **cuándo
llega su pedido**. Además, el carrito gasta espacio en tarjetas decorativas
(“Haz feliz a alguien especial”, “Compra segura y protegida”) que empujan el
botón de pago hacia abajo.

## Objetivo
Cada pantalla dice la fecha de entrega, de forma directa y amable, sin
mencionar la hora límite después de que pasó. El carrito prioriza el botón
“Continuar al pago”.

## Experiencia de usuario
- El detalle del producto muestra un solo chip: “Entrega hoy”, “Entrega
  mañana, 9 de octubre” o “Entrega el 12 de octubre”.
- El catálogo, pasada la hora límite, muestra un aviso suave y corto: “Los
  arreglos de entrega inmediata que pidas ahora llegan mañana, 9 de octubre”.
- El carrito: producto, resumen y botón. Debajo del botón, en una línea
  discreta, la entrega y “Compra segura y protegida”. Sin “Haz feliz a alguien
  especial”.
- El checkout dice la fecha de entrega, sin “Pedido después de las…”.
- **Antes** de la hora límite sí se invita a aprovecharla (“Pide antes de las
  4:00 PM y te lo entregamos hoy”): es un beneficio, no una regla.

## Alcance
**Dentro**: `ProductDetail`, `FloresClient`, `CartDrawer`, `CheckoutPageClient`.
**Fuera**: el cálculo de la fecha (spec 005); la configuración de la hora
límite en Ajustes (es texto para el administrador).

## Criterios de aceptación
- [x] CA-1 En `src/components/client` no queda ningún texto visible con
  “hora límite”, “Ya pasaron”, “Pedido después de” ni “Después de las”.
- [x] CA-2 El detalle de producto muestra un único chip de entrega.
- [x] CA-3 El aviso del catálogo, pasada la hora, menciona solo la fecha.
- [x] CA-4 El carrito no muestra “Haz feliz a alguien especial”; entrega y
  compra segura aparecen debajo de “Continuar al pago”.
- [x] CA-5 El checkout no muestra el aviso “Pedido después de las…”.
- [x] CA-6 Antes de la hora límite, el catálogo y el checkout siguen
  invitando a pedir antes de esa hora.
