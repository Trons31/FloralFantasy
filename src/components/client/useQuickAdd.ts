"use client";

import { useCallback } from "react";
import { nanoid } from "nanoid";
import { useCartStore } from "@/store/cartStore";
import { getFlowerQuantityRange } from "@/lib/flower-quantities";

export type QuickAddProduct = {
  id: string;
  name: string;
  price: number;
  deliveryLeadDays?: number | null;
  images?: Array<{ url: string; isMain?: boolean }>;
  flowers?: Array<{
    flower: { id: string; name: string; type: string };
    quantity?: number | null;
    quantityMin?: number | null;
    quantityMax?: number | null;
  }>;
};

export const getMainImage = (product: { images?: Array<{ url: string; isMain?: boolean }> }) =>
  product.images?.find(image => image.isMain)?.url || product.images?.[0]?.url || "";

/** Agrega un producto (1 unidad, sin adicionales) y abre el carrito. */
export function useQuickAdd() {
  const addItem = useCartStore(state => state.addItem);
  const openCart = useCartStore(state => state.openCart);

  return useCallback((product: QuickAddProduct) => {
    addItem({
      id: nanoid(),
      productId: product.id,
      name: product.name,
      price: product.price,
      image: getMainImage(product),
      quantity: 1,
      preparationTimeValue: 0,
      preparationTimeUnit: "MINUTES",
      deliveryLeadDays: product.deliveryLeadDays || 0,
      flowers: (product.flowers || []).map(entry => {
        const range = getFlowerQuantityRange(entry);
        return {
          id: entry.flower.id,
          name: entry.flower.name,
          type: entry.flower.type,
          quantity: range.max,
          quantityMin: range.min,
          quantityMax: range.max,
        };
      }),
      addons: [],
    });
    // Sin toast: el carrito que se abre ya confirma la acción, y el toast
    // (arriba a la derecha) tapaba el botón de cerrar del carrito.
    openCart();
  }, [addItem, openCart]);
}
