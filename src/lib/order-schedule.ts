export type SchedulableOrder = {
  createdAt: string;
  estimatedTime?: string | null;
  items?: Array<{
    product?: {
      deliveryLeadDays?: number | null;
    } | null;
  }>;
};

export function localDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseLocalDateKey(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function getOrderDeliveryLeadDays(order: SchedulableOrder) {
  const productDays = (order.items || []).reduce((max, item) => {
    const days = Number(item.product?.deliveryLeadDays || 0);
    return Math.max(max, Number.isFinite(days) ? days : 0);
  }, 0);

  if (productDays > 0) return productDays;

  const text = String(order.estimatedTime || "").toLowerCase();
  if (text.includes("mañana") || text.includes("manana")) return 1;
  const match = text.match(/(\d+)/);
  if (!match) return 0;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : 0;
}

export function getEstimatedDeliveryDate(order: SchedulableOrder) {
  const createdAt = new Date(order.createdAt);
  const date = Number.isNaN(createdAt.getTime()) ? new Date() : createdAt;
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + getOrderDeliveryLeadDays(order));
  return date;
}

export function formatScheduleDate(date: Date) {
  return new Intl.DateTimeFormat("es-CO", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
}
