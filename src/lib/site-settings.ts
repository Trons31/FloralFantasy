export const DEFAULT_DELIVERY_FEE = 8000;

export function normalizeDeliveryFee(value: unknown) {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : DEFAULT_DELIVERY_FEE;
}
