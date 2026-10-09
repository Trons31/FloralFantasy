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

/** Día de entrega en lenguaje natural: "hoy", "mañana, 9 de octubre", "el 12 de octubre". */
export function formatDeliveryDay(days: number, baseDate = new Date()): string {
  if (!days || days <= 0) return "hoy";
  const date = new Date(baseDate);
  date.setDate(date.getDate() + days);
  const label = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "long" }).format(date);
  return days === 1 ? `mañana, ${label}` : `el ${label}`;
}

export function formatCustomerDeliveryDate(days: number, baseDate = new Date()): string {
  if (!days || days <= 0) return "Mismo día";
  return `Entrega el ${getDeliveryDateLabel(days, baseDate)}`;
}

const BUSINESS_TIME_ZONE = "America/Bogota";

function toTime12(hour: number, minute: number) {
  const period = hour >= 12 ? "PM" : "AM";
  return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${period}`;
}

/** "16:00" → "4:00 PM". Para valores guardados como "HH:mm" (24 h). */
export function formatTime12(value: string): string {
  const [hour, minute] = String(value || "").split(":").map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return value;
  return toTime12(hour, minute);
}

/** Hora del día en Colombia, siempre en 12 h: "4:05 PM". */
export function formatTime(value: Date | string | number): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: BUSINESS_TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const hour = Number(parts.find(part => part.type === "hour")?.value || 0) % 24;
  const minute = Number(parts.find(part => part.type === "minute")?.value || 0);
  return toTime12(hour, minute);
}

/** Fecha + hora en Colombia: "8 oct, 4:05 PM". */
export function formatDateTime(
  value: Date | string | number,
  dateOptions: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }
): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  let datePart = new Intl.DateTimeFormat("es-CO", { timeZone: BUSINESS_TIME_ZONE, ...dateOptions })
    .format(date)
    .replace(/\./g, "");
  // Formato compacto: "8 oct 2026" en vez de "8 de oct de 2026".
  if (dateOptions.month === "short") datePart = datePart.replace(/ de /g, " ");
  return `${datePart}, ${formatTime(date)}`;
}

export function hasSameDayCutoffPassed(cutoffTime: string, now = new Date(), timeZone = "America/Bogota") {
  const [cutoffHour, cutoffMinute] = cutoffTime.split(":").map(Number);
  if (!Number.isFinite(cutoffHour) || !Number.isFinite(cutoffMinute)) return false;

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    hour12: false,
  }).formatToParts(now);
  const hour = Number(parts.find(part => part.type === "hour")?.value || 0);
  const minute = Number(parts.find(part => part.type === "minute")?.value || 0);

  return hour * 60 + minute > cutoffHour * 60 + cutoffMinute;
}

export function getEffectiveDeliveryLeadDays(days: number, cutoffTime: string, now = new Date()) {
  const baseDays = Math.max(0, Number(days) || 0);
  return baseDays === 0 && hasSameDayCutoffPassed(cutoffTime, now) ? 1 : baseDays;
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
  PAID: "Por preparar",
  PROCESSING: "En producción",
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
