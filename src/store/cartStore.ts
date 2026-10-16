import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { formatCustomerDeliveryDate, getDeliveryDateLabel, getEffectiveDeliveryLeadDays, maxPreparationTime } from "@/lib/utils";

export interface CartAddon {
  id: string; name: string; price: number; type: string;
}

export interface CartFlower {
  id: string;
  name: string;
  type: string;
  quantity: number;
  quantityMin?: number;
  quantityMax?: number;
}

/** Tarjeta de dedicatoria elegida en la ficha (spec 012). */
export interface CartCard {
  id: string;
  name: string;
  price: number;
  maxChars: number;
  message: string;
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  preparationTimeValue: number;
  preparationTimeUnit: string;
  deliveryLeadDays: number;
  addons: CartAddon[];
  flowers?: CartFlower[];
  /** Opcional: los carritos guardados antes de la spec 012 no la tienen. */
  card?: CartCard | null;
  /** Dedicatoria sin tarjeta (cuando la tienda no tiene tarjetas activas). */
  message?: string;
  subtotal: number;
}

/**
 * Pedido ya creado en el servidor que aún no tiene comprobante. Se guarda para
 * que el cliente pueda retomarlo si recarga o vuelve más tarde (spec 005).
 */
export interface PendingOrder {
  id: string;
  trackingToken: string;
  total: number;
  createdAt: string;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  pendingOrder: PendingOrder | null;
  addItem: (item: Omit<CartItem, "subtotal">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, qty: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  setPendingOrder: (order: PendingOrder) => void;
  clearPendingOrder: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  getEstimatedTime: () => { value: number; unit: string; label: string };
  getDeliveryLeadDays: (sameDayCutoffTime?: string) => { days: number; label: string; dateLabel: string };
}

/** Precio de una unidad: arreglo + complementos + tarjeta. */
export const calcUnitPrice = (item: Pick<CartItem, "price" | "addons" | "card">) =>
  item.price + item.addons.reduce((s, a) => s + a.price, 0) + (item.card?.price || 0);

// Complementos y tarjeta se cobran por unidad, igual que en la ficha, el
// checkout y el servidor (spec 012).
const calcSubtotal = (item: Omit<CartItem, "subtotal">) => calcUnitPrice(item) * item.quantity;

/** Dos líneas se fusionan solo si son el mismo arreglo con los mismos extras. */
const sameLine = (a: Omit<CartItem, "subtotal">, b: Omit<CartItem, "subtotal">) =>
  a.productId === b.productId &&
  JSON.stringify(a.addons) === JSON.stringify(b.addons) &&
  (a.card?.id || "") === (b.card?.id || "") &&
  (a.card?.message ?? a.message ?? "") === (b.card?.message ?? b.message ?? "");

/** Cuerpo de cada línea para `POST /api/orders`. */
export const toOrderItemPayload = (item: CartItem) => ({
  ...item,
  card: item.card ? { id: item.card.id, message: item.card.message } : item.message ? { message: item.message } : undefined,
});

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      pendingOrder: null,
      addItem: (item) => {
        const existing = get().items.find(i => sameLine(i, item));
        if (existing) {
          set(s => ({
            items: s.items.map(i =>
              i.id === existing.id
                ? { ...i, quantity: i.quantity + item.quantity, subtotal: calcSubtotal({ ...i, quantity: i.quantity + item.quantity }) }
                : i
            ),
          }));
        } else {
          set(s => ({ items: [...s.items, { ...item, subtotal: calcSubtotal(item) }] }));
        }
      },
      removeItem: (id) => set(s => ({ items: s.items.filter(i => i.id !== id) })),
      updateQuantity: (id, qty) => {
        if (qty <= 0) { get().removeItem(id); return; }
        set(s => ({
          items: s.items.map(i =>
            i.id === id ? { ...i, quantity: qty, subtotal: calcSubtotal({ ...i, quantity: qty }) } : i
          ),
        }));
      },
      clearCart: () => set({ items: [] }),
      toggleCart: () => set(s => ({ isOpen: !s.isOpen })),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      setPendingOrder: (order) => set({ pendingOrder: order }),
      clearPendingOrder: () => set({ pendingOrder: null }),
      getTotalItems: () => get().items.reduce((s, i) => s + i.quantity, 0),
      getTotalPrice: () => get().items.reduce((s, i) => s + i.subtotal, 0),
      getEstimatedTime: () =>
        maxPreparationTime(
          get().items.map(i => ({
            preparationTimeValue: i.preparationTimeValue,
            preparationTimeUnit: i.preparationTimeUnit,
          }))
        ),
      getDeliveryLeadDays: (sameDayCutoffTime = "16:00") => {
        const days = get().items.reduce((max, item) => Math.max(max, getEffectiveDeliveryLeadDays(item.deliveryLeadDays || 0, sameDayCutoffTime)), 0);
        const label = formatCustomerDeliveryDate(days);
        const dateLabel = getDeliveryDateLabel(days);
        return { days, label, dateLabel };
      },
    }),
    {
      name: "fantasia-floral-cart",
      // `isOpen` no se persiste: si se guardara, un carrito abierto reaparecería
      // solo al recargar o al llegar a otra página.
      partialize: (state) => ({ items: state.items, pendingOrder: state.pendingOrder }),
      // v1 (spec 012): los subtotales guardados contaban los complementos una
      // sola vez; se recalculan por unidad.
      version: 1,
      migrate: (persisted: any) => ({
        ...persisted,
        items: Array.isArray(persisted?.items)
          ? persisted.items.map((item: CartItem) => ({ ...item, addons: item.addons || [], subtotal: calcSubtotal({ ...item, addons: item.addons || [] }) }))
          : [],
      }),
    }
  )
);

/**
 * “Comprar ahora” (spec 012): un único arreglo que va directo al checkout sin
 * tocar el carrito. Vive en sessionStorage para sobrevivir a una recarga,
 * pero no a cerrar la pestaña.
 */
interface BuyNowStore {
  item: CartItem | null;
  setItem: (item: Omit<CartItem, "subtotal">) => void;
  setQuantity: (qty: number) => void;
  clear: () => void;
}

export const useBuyNowStore = create<BuyNowStore>()(
  persist(
    (set, get) => ({
      item: null,
      setItem: (item) => set({ item: { ...item, subtotal: calcSubtotal(item) } }),
      setQuantity: (qty) => {
        const current = get().item;
        if (!current) return;
        const quantity = Math.max(1, qty);
        set({ item: { ...current, quantity, subtotal: calcSubtotal({ ...current, quantity }) } });
      },
      clear: () => set({ item: null }),
    }),
    {
      name: "fantasia-floral-buy-now",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
