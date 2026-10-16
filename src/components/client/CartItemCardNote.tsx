import { formatPrice } from "@/lib/utils";
import type { CartItem } from "@/store/cartStore";

/** Tarjeta y dedicatoria de una línea, en carrito y checkout (spec 012). */
export default function CartItemCardNote({ item }: { item: Pick<CartItem, "card" | "message"> }) {
  const message = item.card?.message || item.message || "";
  if (!item.card && !message) return null;
  return (
    <div className="mt-1 min-w-0 text-[11px] leading-4 text-slate-500">
      {item.card && (
        <p className="truncate font-medium text-slate-600">
          {item.card.name}{item.card.price > 0 ? ` · + ${formatPrice(item.card.price)}` : ""}
        </p>
      )}
      {message && <p className="truncate italic">“{message}”</p>}
    </div>
  );
}
