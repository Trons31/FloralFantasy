# 013 — Plan

Un solo archivo: `src/components/client/CheckoutPageClient.tsx`.

- Componente a nivel de módulo `PerItemMessagesNotice({ messages, total, onAddGeneral })`:
  aviso con la lista de dedicatorias y el enlace.
- Estado `showGeneralMessage` (abre el campo manualmente).
- Checkout nuevo (react-hook-form): `messages` = dedicatorias de `items`
  (`card.message` o `message`). El campo se ve si `messages.length === 0`,
  si `showGeneralMessage` o si `watch("giftMessage")` ya tiene texto.
  “Quitar” hace `setValue("giftMessage", "")` y cierra.
- Link de pago (“Paso 1”): `orderItems` gana `cardMessage` al mapear la
  respuesta de `/api/seguimiento`; misma regla con `customerGiftMessage`.

Riesgo: ninguno de contrato. `giftMessage` vacío ya se guarda como `null`.
