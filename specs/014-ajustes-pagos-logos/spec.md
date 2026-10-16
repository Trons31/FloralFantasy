# 014 — Pagos con logos oficiales, Ajustes por secciones y comprobante paso a paso

## Problema

1. En el resumen del checkout hay un recuadro verde “Entrega el …” que repite
   lo que ya dice cada arreglo, y el bloque de confianza dice “Entrega hoy
   disponible” aunque el pedido no llegue hoy (p. ej. un arreglo con 2 días de
   preparación).
2. “Aceptamos múltiples medios de pago” muestra el nombre que el admin escribió
   a mano (“Jason sierra”), no la marca del medio.
3. El proveedor del método de pago es texto libre: no hay forma de saber qué
   logo mostrar.
4. La página de Ajustes es una pila de tarjetas largas; CliqCut la organiza
   como índice por secciones.
5. En el paso de pago, “Elige método” y “Sube el comprobante” están en columnas
   separadas: no queda claro el orden y en móvil el bloque de carga queda
   lejos de la elección.

## Objetivo

Un checkout de pago que se lee de arriba abajo (elige → paga → sube), con las
marcas oficiales de cada medio, y unos Ajustes con la misma estructura que
CliqCut.

## Experiencia de usuario

**Cliente — resumen antes de crear el pedido**
- Sin recuadro verde. El primer punto del bloque de confianza dice el día real
  del pedido: “Entrega hoy · Pide antes de las 4:00 PM”, “Entrega mañana, 17
  de octubre” o “Entrega el 18 de octubre”.
- “Aceptamos estos medios de pago” muestra los logos oficiales (Bancolombia,
  Nequi, PayPal, PSE) de los métodos activos, sin repetir. Si ninguno tiene
  proveedor reconocido, el bloque no aparece.

**Cliente — pago (pedido creado)**
- Una sola tarjeta con tres pasos numerados:
  1. **Elige cómo pagar**: lista de métodos con su logo. Al elegir, la lista se
     contrae a la opción elegida con “Cambiar”. Si solo hay un método, viene
     elegido.
  2. **Paga {total}**: el total en grande, el número/identificador con botón
     “Copiar” (feedback “Copiado”), el QR si existe y las instrucciones.
  3. **Sube tu comprobante**: zona de carga y “Enviar comprobante”.
- Los pasos 2 y 3 se ven atenuados con “Elige primero cómo pagar” hasta que
  haya método: es imposible subir un comprobante sin método.
- Al elegir un método en móvil, la página se desplaza al paso 2.
- La columna derecha queda solo para el resumen; la fecha de entrega es una
  línea neutra (sin recuadro verde).

**Admin — Ajustes**
- Índice como CliqCut: tarjeta de marca arriba y grupos con filas (icono,
  título, estado actual, chevron): *Tienda* (Entrega y domicilio, Tarjetas de
  dedicatoria), *Cobros* (Métodos de pago), *Cuenta* (Acceso al panel).
- Cada fila abre su sección con “← Ajustes”, título y descripción. La sección
  vive en la URL (`?seccion=pagos`): el “atrás” del navegador vuelve al
  índice.
- En el modal del método, el proveedor se elige entre 4 opciones con su logo
  (Bancolombia, Nequi, PayPal, PSE). El campo del número cambia de etiqueta y
  ejemplo según el proveedor (“Número Nequi”, “Correo de PayPal”…).
- Las tarjetas de métodos muestran el logo del proveedor.
- Métodos antiguos con proveedor escrito a mano siguen funcionando; al
  editarlos se pide elegir uno de la lista.

## Alcance

**Dentro**: checkout (`CheckoutPageClient`), Ajustes (`AjustesClient`, página),
logos en `public/payment-logos/`, `src/lib/payment-providers.ts`, componente de
logo compartido.

**Fuera**: esquema y API (el proveedor sigue siendo texto; se guarda el nombre
canónico), pasarela PSE/PayPal real (el flujo sigue siendo comprobante manual),
seguimiento y confirmación.

## Criterios de aceptación

- [x] CA-1 El resumen previo al pedido no tiene recuadro verde de entrega.
- [x] CA-2 Con un arreglo de 2 días de preparación, el bloque de confianza dice
      “Entrega el {fecha}” y no “Entrega hoy disponible”.
- [x] CA-3 “Aceptamos…” muestra un logo por proveedor activo reconocido, sin
      duplicados; sin proveedores reconocidos no aparece.
- [x] CA-4 En el pago, sin método elegido no existe input de archivo en la
      página y los pasos 2–3 muestran “Elige primero cómo pagar”.
- [x] CA-5 Con un único método activo, viene preseleccionado.
- [ ] CA-6 “Copiar” copia el número y muestra “Copiado”.
- [ ] CA-7 Ajustes muestra el índice por grupos; cada fila abre su sección y
      “← Ajustes” / atrás del navegador vuelven al índice.
- [ ] CA-8 El modal del método solo permite guardar con uno de los 4
      proveedores; el logo aparece en la tarjeta del método.
- [ ] CA-9 375px: sin desbordes horizontales en checkout ni Ajustes.

## Riesgos

- Métodos existentes con proveedor libre (“Daviplata”) no tienen logo: se
  muestran con el icono genérico hasta que se editen.
- `history.pushState` + `useSearchParams`: soportado en App Router (igual que
  CliqCut).
