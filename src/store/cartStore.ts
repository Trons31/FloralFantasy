import { create } from "zustand";
import { persist } from "zustand/middleware";
import { maxPreparationTime } from "@/lib/utils";

export interface CartAddon {
  id: string; name: string; price: number; type: string;
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
  addons: CartAddon[];
  subtotal: number;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  addItem: (item: Omit<CartItem, "subtotal">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, qty: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  getEstimatedTime: () => { value: number; unit: string; label: string };
}

const calcSubtotal = (item: Omit<CartItem, "subtotal">) =>
  item.price * item.quantity + item.addons.reduce((s, a) => s + a.price, 0);

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      addItem: (item) => {
        const existing = get().items.find(
          i => i.productId === item.productId &&
               JSON.stringify(i.addons) === JSON.stringify(item.addons)
        );
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
      getTotalItems: () => get().items.reduce((s, i) => s + i.quantity, 0),
      getTotalPrice: () => get().items.reduce((s, i) => s + i.subtotal, 0),
      getEstimatedTime: () =>
        maxPreparationTime(
          get().items.map(i => ({
            preparationTimeValue: i.preparationTimeValue,
            preparationTimeUnit: i.preparationTimeUnit,
          }))
        ),
    }),
    { name: "fantasia-floral-cart" }
  )
);
