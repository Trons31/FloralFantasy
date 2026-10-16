# 012 — Ficha de producto: estilo boutique, tarjeta de dedicatoria y “Comprar ahora”

## Problema

El cliente quiere que la tienda se parezca en estilo a la referencia que le
gusta (ficha de producto de Fiorimarket) y que tenga funciones que hoy no
existen:

1. **Tarjeta de dedicatoria con precio.** Hoy la dedicatoria es un único texto
   de hasta 180 caracteres por pedido, escrito en el checkout. No hay forma de
   cobrar una tarjeta más grande.
2. **Comprar sin pasar por el carrito.** Hoy la única acción de la ficha es
   “Agregar al carrito”, que abre el carrito lateral. Quien quiere un solo
   arreglo debe dar un paso de más.
3. **Estética.** La ficha actual usa sombras, píldoras de color y botones con
   resplandor rosa. La referencia es más sobria: blanco, bordes finos, títulos
   serif, etiquetas pequeñas en mayúsculas espaciadas y la opción elegida con
   un fondo apenas teñido.

Además, `POST /api/orders` guarda el `total` que envía el navegador sin
recalcularlo. Con extras de pago (tarjetas) esto deja de ser aceptable.

## Objetivo

- La ficha de producto adopta el estilo de la referencia, conservando la marca
  propia (logo, nombre, paleta rosa).
- Cada arreglo puede llevar **su** tarjeta y **su** dedicatoria. Las opciones de
  tarjeta (nombre, descripción, precio y límite de caracteres) se administran
  desde el panel.
- La ficha ofrece **“Comprar ahora”** (checkout solo con ese arreglo, sin tocar
  el carrito) y **“Agregar al carrito”**.
- El servidor calcula el total del pedido con precios de la base de datos.

## Experiencia de usuario

**Ficha, de arriba abajo** (en escritorio a dos columnas: galería | compra):

1. Categoría en versalitas pequeñas, nombre en serif grande, precio.
2. Descripción corta.
3. **Dedicatoria (opcional).** Una fila con borde fino: “Escribir mensaje ›” a
   la izquierda y la etiqueta “✎ DEDICATORIA (OPCIONAL)” a la derecha. Al
   tocarla se despliega en el sitio (sin modal) un `textarea` con contador
   `n/límite` y chips de mensajes sugeridos (Amor · Cumpleaños · Gratitud). Al
   elegir un chip se rellena el texto y se puede editar. Con texto ya escrito,
   la fila cerrada muestra el inicio del mensaje en lugar de “Escribir mensaje”.
4. **Elige tu tarjeta.** Lista de opciones tipo radio, una por fila:
   nombre en negrita, descripción gris debajo (“Postal 10×15 en papel lino ·
   450 caracteres”), precio a la derecha (“Gratis” o “+ $15.000”) y enlace
   “Ver” si la opción tiene foto (abre la foto en `Modal`). La opción elegida
   lleva borde rosa y fondo `primary-50`. Por defecto queda elegida la más
   barata (la gratuita).
   - Si el mensaje supera el límite de la tarjeta elegida, el contador se pone
     en rojo con el texto “Tu mensaje tiene 320 caracteres; esta tarjeta
     admite 200. Elige una tarjeta más grande o acórtalo.” y las dos acciones
     de compra quedan deshabilitadas. El texto no se recorta solo.
   - Sin opciones activas en el panel, la sección no aparece y la dedicatoria
     usa un límite de 200 caracteres.
5. Complementos (“Hazlo aún más especial”), con el estilo nuevo.
6. Cantidad y acciones:
   - **Comprar ahora**: botón principal (relleno rosa). Lleva al checkout solo
     con este arreglo, su tarjeta, mensaje y complementos. El carrito no
     cambia: lo que hubiera sigue ahí al volver.
   - **Agregar al carrito**: botón secundario (borde). Hace lo de hoy: agrega
     y abre el carrito lateral.
   - Ambos muestran el total de la línea (precio × cantidad + complementos +
     tarjeta).
7. En móvil (375px), barra fija inferior con cantidad compacta y los dos
   botones (“Comprar” y un botón de icono de carrito con `aria-label`), sin
   salirse del ancho.

**Carrito lateral y checkout**: cada línea muestra, debajo del nombre, la
tarjeta (“Tarjeta mediana · + $15.000”) y el inicio del mensaje en gris.
Dos líneas del mismo producto con distinta tarjeta o mensaje no se fusionan.

**Checkout en modo “Comprar ahora”**: el encabezado indica “Comprando: Pradera
Floral” y un enlace “Volver” regresa a la ficha. Si el cliente recarga, el
modo se conserva (sessionStorage). Al crear el pedido **no** se vacía el
carrito. Si el pedido falla, el mensaje de error es el mismo de hoy.

**Checkout en modo carrito**: igual que hoy. El campo de dedicatoria del paso
de pago (`giftMessage` del pedido) **se conserva** sin cambios: es opcional y
sirve como mensaje general; la dedicatoria por arreglo viaja en cada línea.

**Preparador y panel**: la vista del preparador y el detalle del pedido
muestran, por cada arreglo, la tarjeta elegida y su mensaje. Los pedidos
antiguos siguen mostrando el `giftMessage` del pedido como hoy.

## Reglas de esta spec

- **Todo es aditivo.** No se borra ni renombra ninguna columna, ruta, campo de
  API, formulario ni comportamiento existente. Lo nuevo es opcional: un pedido,
  carrito o petición sin tarjeta funciona exactamente como hoy.
- **El dashboard conserva su estilo visual actual.** La pantalla
  `/dashboard/tarjetas` copia la estructura de `/dashboard/addons`; el detalle
  del pedido y el preparador solo ganan una línea de información con los
  estilos que ya usan. El estilo “boutique” aplica solo a la ficha de la tienda.
- **Orden y estructura**: carpetas, nombres y patrones existentes del repo.

## Alcance

**Dentro**
- Modelo `CardOption` y su CRUD en `/dashboard/tarjetas`.
- Tarjeta y dedicatoria por línea de pedido (`OrderItem`).
- Rediseño visual de la **ficha de producto** (`/flores/[id]`) únicamente.
- Botón “Comprar ahora” y modo de checkout de un solo producto.
- Recalcular el total en el servidor en `POST /api/orders` para pedidos de
  cliente.
- Mostrar tarjeta y mensaje en el carrito, el checkout, el preparador y el
  detalle del pedido en el panel.

**Fuera** (specs posteriores)
- Rediseño del home, el catálogo, el carrito y el checkout.
- Calendario de fecha de entrega en la ficha.
- Ventana de venta adicional tras agregar al carrito.
- Mensajes sugeridos administrables (en esta spec van fijos en código).

## Criterios de aceptación

- [ ] CA-1 En `/dashboard/tarjetas` el admin crea, edita, ordena, activa y
      desactiva opciones con nombre, descripción, precio (≥ 0), límite de
      caracteres (1–2000) y foto opcional.
- [ ] CA-2 La ficha lista solo las opciones activas, ordenadas por `sortOrder`,
      y preselecciona la de menor precio.
- [ ] CA-3 Elegir “Tarjeta mediana” (+$15.000) con cantidad 2 en un producto de
      $198.000 muestra en los botones `$426.000` (2 × 198.000 + 2 × 15.000).
      La tarjeta se cobra por unidad, como los complementos.
- [ ] CA-4 Con 201 caracteres y la tarjeta de 200, los dos botones están
      deshabilitados y se ve el aviso descrito en *Experiencia de usuario* §4.
- [ ] CA-5 “Comprar ahora” con 2 productos ya en el carrito lleva a `/checkout`
      mostrando solo el producto de la ficha; tras crear el pedido, el carrito
      sigue teniendo los 2 productos.
- [ ] CA-6 “Agregar al carrito” dos veces con el mismo producto y la misma
      tarjeta y mensaje deja 1 línea con cantidad 2; con mensaje distinto
      deja 2 líneas.
- [ ] CA-7 `POST /api/orders` (origen CLIENT) ignora `total` y `price` del
      cuerpo: guarda `total = Σ(precio_db + complementos_db + tarjeta_db) ×
      cantidad + domicilio`. Si el cliente manipula el precio en la petición,
      el pedido se guarda con el precio real.
- [ ] CA-8 `POST /api/orders` rechaza con 400 un mensaje más largo que el
      límite de su tarjeta, o una tarjeta inactiva o inexistente.
- [ ] CA-9 La vista del preparador y `/dashboard/pedidos/[id]` muestran por
      arreglo “Tarjeta mediana” + mensaje. Un pedido antiguo con `giftMessage`
      lo sigue mostrando.
- [ ] CA-10 En 375px la ficha no tiene scroll horizontal y la barra inferior
      muestra cantidad + “Comprar” + carrito sin cortar texto.
- [ ] CA-11 Estilo de la ficha: sin `shadow-*` en sus tarjetas internas, bordes
      `border-slate-200`, radio `rounded-xl`, título `font-display`, etiquetas
      de sección `text-[11px] font-bold uppercase tracking-[.14em]`.
- [ ] CA-12 `npx tsc --noEmit` = 0 errores y `npm run build` pasa.

## Riesgos

- **Pagos.** Recalcular el total en el servidor toca la lógica de pagos. Los
  pedidos de origen ADMIN (link de pago con `manualAdjustment`) mantienen su
  comportamiento actual.
- **Migración.** Se añade una tabla y columnas opcionales en `OrderItem`. Es
  aditiva y no cambia datos existentes. Se aplica primero en desarrollo; en
  producción solo con aprobación explícita.
- **Carritos guardados.** Los carritos de `localStorage` sin `card` deben
  seguir funcionando (tarjeta ausente = sin tarjeta, mensaje vacío).
- **Contrato de `/api/orders`.** Lo consumen la tienda y el panel
  (`CreateOrderModal`). Los campos nuevos son opcionales.
