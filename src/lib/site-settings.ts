export const DEFAULT_DELIVERY_FEE = 8000;
export const DEFAULT_SAME_DAY_CUTOFF_TIME = "16:00";

export function normalizeDeliveryFee(value: unknown) {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : DEFAULT_DELIVERY_FEE;
}

export function normalizeSameDayCutoffTime(value: unknown) {
  if (typeof value !== "string") return DEFAULT_SAME_DAY_CUTOFF_TIME;
  const match = value.trim().match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  return match ? `${match[1]}:${match[2]}` : DEFAULT_SAME_DAY_CUTOFF_TIME;
}
