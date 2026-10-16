// Tarjetas de dedicatoria (spec 012).

export const CARD_MAX_CHARS_LIMIT = 2000;
/** Límite de la dedicatoria cuando no hay ninguna tarjeta activa. */
export const DEFAULT_CARD_MAX_CHARS = 200;

export const cardOptionSelect = {
  id: true,
  name: true,
  description: true,
  price: true,
  maxChars: true,
  imageUrl: true,
  imagePublicId: true,
  isActive: true,
  sortOrder: true,
} as const;

/** Columnas `card*` que se guardan en cada `OrderItem`. */
export interface OrderItemCardData {
  cardOptionId: string | null;
  cardName: string | null;
  cardPrice: number;
  cardMessage: string | null;
}

export const EMPTY_ORDER_ITEM_CARD: OrderItemCardData = {
  cardOptionId: null,
  cardName: null,
  cardPrice: 0,
  cardMessage: null,
};

/**
 * Copia de la tarjeta de un `OrderItem` ya guardado (o de su `cardSnapshot`
 * enviado por los editores del panel). Sirve para que editar un pedido no
 * borre la tarjeta que eligió el cliente.
 */
export function pickOrderItemCard(source: any): OrderItemCardData {
  if (!source || typeof source !== "object") return { ...EMPTY_ORDER_ITEM_CARD };
  const price = Number(source.cardPrice);
  return {
    cardOptionId: typeof source.cardOptionId === "string" && source.cardOptionId ? source.cardOptionId : null,
    cardName: typeof source.cardName === "string" && source.cardName ? source.cardName : null,
    cardPrice: Number.isFinite(price) && price > 0 ? price : 0,
    cardMessage: typeof source.cardMessage === "string" && source.cardMessage.trim() ? source.cardMessage.trim() : null,
  };
}

type CardLookup ={ id: string; name: string; price: number; maxChars: number; isActive: boolean };

/**
 * Resuelve la tarjeta de cada línea (`item.card = { id, message }`) contra la
 * base de datos: nombre y precio salen de la opción guardada, nunca del
 * cliente. Líneas sin `card` quedan sin tarjeta (compatibilidad).
 */
export async function resolveOrderItemCards(
  items: any[],
  findOptions: (ids: string[]) => Promise<CardLookup[]>
): Promise<{ error: string } | { cards: OrderItemCardData[] }> {
  const ids = Array.from(new Set(items.map(item => item?.card?.id).filter((id): id is string => typeof id === "string" && !!id)));
  const options = ids.length ? await findOptions(ids) : [];
  const byId = new Map(options.map(option => [option.id, option]));

  const cards: OrderItemCardData[] = [];
  for (const item of items) {
    const card = item?.card;
    const message = typeof card?.message === "string" ? card.message.trim() : "";
    if (!card?.id) {
      if (message.length > DEFAULT_CARD_MAX_CHARS) {
        return { error: `La dedicatoria no puede superar ${DEFAULT_CARD_MAX_CHARS} caracteres` };
      }
      cards.push({ ...EMPTY_ORDER_ITEM_CARD, cardMessage: message || null });
      continue;
    }
    const option = byId.get(card.id);
    if (!option || !option.isActive) {
      return { error: "Una de las tarjetas elegidas ya no está disponible. Elige otra." };
    }
    if (message.length > option.maxChars) {
      return { error: `La dedicatoria de “${option.name}” admite hasta ${option.maxChars} caracteres` };
    }
    cards.push({
      cardOptionId: option.id,
      cardName: option.name,
      cardPrice: Number(option.price || 0),
      cardMessage: message || null,
    });
  }
  return { cards };
}

export interface CardOptionInput {
  name?: string;
  description?: string;
  price?: number;
  maxChars?: number;
  imageUrl?: string | null;
  imagePublicId?: string | null;
  isActive?: boolean;
  sortOrder?: number;
}

/**
 * Normaliza el cuerpo de creación/edición. Devuelve un error legible o los
 * datos limpios (solo los campos presentes, para que PUT sea parcial).
 */
export function parseCardOptionInput(body: any, requireName: boolean): { error: string } | { data: CardOptionInput } {
  const data: CardOptionInput = {};

  if (typeof body?.name === "string") data.name = body.name.trim();
  if (requireName && !data.name) return { error: "El nombre es obligatorio" };
  if (data.name !== undefined && !data.name) return { error: "El nombre es obligatorio" };

  if (typeof body?.description === "string") data.description = body.description.trim();

  if (body?.price !== undefined) {
    const price = Number(body.price);
    if (!Number.isFinite(price) || price < 0) return { error: "El precio debe ser 0 o mayor" };
    data.price = Math.round(price);
  }

  if (body?.maxChars !== undefined) {
    const maxChars = Number(body.maxChars);
    if (!Number.isInteger(maxChars) || maxChars < 1 || maxChars > CARD_MAX_CHARS_LIMIT) {
      return { error: `Los caracteres deben estar entre 1 y ${CARD_MAX_CHARS_LIMIT}` };
    }
    data.maxChars = maxChars;
  }

  if (body?.imageUrl !== undefined) data.imageUrl = typeof body.imageUrl === "string" && body.imageUrl ? body.imageUrl : null;
  if (body?.imagePublicId !== undefined) data.imagePublicId = typeof body.imagePublicId === "string" && body.imagePublicId ? body.imagePublicId : null;
  if (typeof body?.isActive === "boolean") data.isActive = body.isActive;
  if (body?.sortOrder !== undefined && Number.isInteger(Number(body.sortOrder))) data.sortOrder = Number(body.sortOrder);

  return { data };
}
