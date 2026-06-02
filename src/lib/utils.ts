export function formatPrice(price: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(price);
}

export function formatPreparationTime(value: number, unit: string): string {
  if (value === 0) return "Inmediato";
  const labels: Record<string, string[]> = {
    MINUTES: ["minuto", "minutos"],
    HOURS: ["hora", "horas"],
    DAYS: ["día", "días"],
  };
  const [sing, plur] = labels[unit] ?? ["", ""];
  return `${value} ${value === 1 ? sing : plur}`;
}

export function formatDeliveryLeadDays(days: number): string {
  if (!days || days <= 0) return "Mismo día";
  return days === 1 ? "Entrega en 1 día" : `Entrega en ${days} días`;
}

export function getDeliveryDateLabel(days: number, baseDate = new Date()): string {
  if (!days || days <= 0) return "Hoy";
  const date = new Date(baseDate);
  date.setDate(date.getDate() + days);
  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function comparePreparationTime(
  aVal: number,
  aUnit: string,
  bVal: number,
  bUnit: string
): number {
  const toMinutes = (v: number, u: string) => (u === "MINUTES" ? v : u === "HOURS" ? v * 60 : v * 1440);
  return toMinutes(aVal, aUnit) - toMinutes(bVal, bUnit);
}

export function maxPreparationTime(items: { preparationTimeValue: number; preparationTimeUnit: string }[]) {
  if (!items.length) return { value: 0, unit: "MINUTES", label: "Inmediato" };
  let maxMin = 0;
  let maxVal = 0;
  let maxUnit = "MINUTES";
  for (const i of items) {
    const min =
      i.preparationTimeUnit === "MINUTES"
        ? i.preparationTimeValue
        : i.preparationTimeUnit === "HOURS"
          ? i.preparationTimeValue * 60
          : i.preparationTimeValue * 1440;
    if (min > maxMin) {
      maxMin = min;
      maxVal = i.preparationTimeValue;
      maxUnit = i.preparationTimeUnit;
    }
  }
  return { value: maxVal, unit: maxUnit, label: formatPreparationTime(maxVal, maxUnit) };
}

export function maxDeliveryLeadDays(items: { deliveryLeadDays?: number }[]) {
  const days = items.reduce((max, item) => Math.max(max, item.deliveryLeadDays || 0), 0);
  return {
    days,
    label: formatDeliveryLeadDays(days),
    dateLabel: getDeliveryDateLabel(days),
  };
}

export const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pedido recibido",
  PENDING_PAYMENT_CONFIRMATION: "Pendiente de confirmación de pago",
  PAYMENT_INVALID: "Pago inválido",
  PAID: "Pago confirmado",
  PROCESSING: "Preparando flores",
  READY: "Pedido listo",
  OUT_FOR_DELIVERY: "En camino",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
};

export const PAYMENT_FLOW_STATUSES = [
  "PENDING_PAYMENT_CONFIRMATION",
  "PAYMENT_INVALID",
  "PAID",
  "PROCESSING",
  "READY",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
] as const;

export const REVENUE_STATUSES = [
  "PAID",
  "PROCESSING",
  "READY",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
] as const;
