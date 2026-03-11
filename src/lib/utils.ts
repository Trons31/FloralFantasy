export function formatPrice(price: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency", currency: "COP", minimumFractionDigits: 0,
  }).format(price);
}

export function formatPreparationTime(value: number, unit: string): string {
  if (value === 0) return "Inmediato";
  const labels: Record<string, string[]> = {
    MINUTES: ["minuto", "minutos"],
    HOURS:   ["hora",   "horas"],
    DAYS:    ["día",    "días"],
  };
  const [sing, plur] = labels[unit] ?? ["", ""];
  return `${value} ${value === 1 ? sing : plur}`;
}

export function comparePreparationTime(
  aVal: number, aUnit: string,
  bVal: number, bUnit: string
): number {
  const toMinutes = (v: number, u: string) =>
    u === "MINUTES" ? v : u === "HOURS" ? v * 60 : v * 1440;
  return toMinutes(aVal, aUnit) - toMinutes(bVal, bUnit);
}

export function maxPreparationTime(
  items: { preparationTimeValue: number; preparationTimeUnit: string }[]
) {
  if (!items.length) return { value: 0, unit: "MINUTES", label: "Inmediato" };
  let maxMin = 0, maxVal = 0, maxUnit = "MINUTES";
  for (const i of items) {
    const min =
      i.preparationTimeUnit === "MINUTES" ? i.preparationTimeValue
      : i.preparationTimeUnit === "HOURS"  ? i.preparationTimeValue * 60
      : i.preparationTimeValue * 1440;
    if (min > maxMin) { maxMin = min; maxVal = i.preparationTimeValue; maxUnit = i.preparationTimeUnit; }
  }
  return { value: maxVal, unit: maxUnit, label: formatPreparationTime(maxVal, maxUnit) };
}

export const STATUS_LABELS: Record<string, string> = {
  PENDING:          "Pedido recibido",
  PAID:             "Pago confirmado",
  PROCESSING:       "Preparando flores",
  READY:            "Pedido listo",
  OUT_FOR_DELIVERY: "En camino",
  DELIVERED:        "Entregado",
  CANCELLED:        "Cancelado",
};

export const ADDON_EMOJI: Record<string, string> = {
  BEBIDA:"🥤", VINO:"🍷", PELUCHE:"🧸", DULCE:"🍫", CANASTA:"🧺", OTRO:"🎁",
};
