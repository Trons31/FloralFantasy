export type FlowerQuantityRange = {
  quantity?: number | null;
  quantityMin?: number | null;
  quantityMax?: number | null;
  baseQuantity?: number | null;
  baseQuantityMin?: number | null;
  baseQuantityMax?: number | null;
};

export function getFlowerQuantityRange(item: FlowerQuantityRange) {
  const fallback = Math.max(1, Number(item.quantity ?? item.baseQuantity) || 1);
  const rawMin = item.quantityMin ?? item.baseQuantityMin ?? fallback;
  const rawMax = item.quantityMax ?? item.baseQuantityMax ?? fallback;
  const min = Math.max(1, Number(rawMin) || fallback);
  const max = Math.max(min, Number(rawMax) || fallback);
  return { min, max };
}

export function formatFlowerQuantityRange(item: FlowerQuantityRange, separator = "-") {
  const { min, max } = getFlowerQuantityRange(item);
  return min === max ? `${min}` : `${min}${separator}${max}`;
}
