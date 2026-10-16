// Estado del pedido contado al cliente (spec 015): confirmación y seguimiento.

export const TRACKING_STEPS = ["Recibido", "Pagado", "Preparando", "En camino", "Entregado"] as const;

/** Tramo actual de la barra (0–4); -1 si el pedido no sigue la barra. */
export function trackingStepIndex(status: string): number {
  switch (status) {
    case "PENDING":
    case "PENDING_PAYMENT_CONFIRMATION":
      return 0;
    case "PAID":
      return 1;
    // “Listo” es un paso interno: para el cliente sigue “Preparando”.
    case "PROCESSING":
    case "READY":
      return 2;
    case "OUT_FOR_DELIVERY":
      return 3;
    case "DELIVERED":
      return 4;
    default:
      return -1;
  }
}

export type TrackingTone = "progress" | "done" | "problem";

export const TRACKING_STATUS: Record<string, { title: string; text: string; tone: TrackingTone }> = {
  PENDING: { title: "Falta completar el pago", text: "Completa el pago para que empecemos tu pedido.", tone: "progress" },
  PENDING_PAYMENT_CONFIRMATION: { title: "Estamos validando tu pago", text: "Recibimos tu comprobante; en breve lo confirmamos.", tone: "progress" },
  PAYMENT_INVALID: { title: "Hay un problema con tu pago", text: "No pudimos validar el comprobante. Escríbenos para resolverlo.", tone: "problem" },
  PAID: { title: "Pago confirmado", text: "Tu pedido entra pronto en preparación.", tone: "progress" },
  PROCESSING: { title: "Estamos preparando tu arreglo", text: "Nuestros floristas están trabajando en él.", tone: "progress" },
  READY: { title: "Tu arreglo está listo", text: "Pronto sale hacia la dirección de entrega.", tone: "progress" },
  OUT_FOR_DELIVERY: { title: "Tu pedido va en camino", text: "Está en ruta hacia la dirección de entrega.", tone: "progress" },
  DELIVERED: { title: "Pedido entregado", text: "Gracias por elegirnos.", tone: "done" },
  CANCELLED: { title: "Pedido cancelado", text: "Escríbenos si necesitas más información.", tone: "problem" },
};

export function trackingStatus(status: string) {
  return TRACKING_STATUS[status] || { title: "Consultando tu pedido", text: "", tone: "progress" as TrackingTone };
}

export const STORE_WHATSAPP_URL = "https://wa.me/573024128595";

/** Copia al portapapeles con respaldo para http o navegadores sin Clipboard API. */
export async function copyText(value: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(value);
      return true;
    }
    const field = document.createElement("textarea");
    field.value = value;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.appendChild(field);
    field.select();
    const ok = document.execCommand("copy");
    field.remove();
    return ok;
  } catch {
    return false;
  }
}
