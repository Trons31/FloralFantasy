"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  RiAddLine,
  RiArrowLeftLine,
  RiArrowRightLine,
  RiArrowRightSLine,
  RiBearSmileLine,
  RiCakeLine,
  RiCheckLine,
  RiFlashlightLine,
  RiFlowerLine,
  RiGiftLine,
  RiGlassesLine,
  RiGobletLine,
  RiHeartFill,
  RiHeartLine,
  RiLeafLine,
  RiPencilLine,
  RiShieldCheckLine,
  RiShoppingBagLine,
  RiShoppingBasketLine,
  RiSubtractLine,
  RiTruckLine,
  RiZoomInLine,
} from "react-icons/ri";
import { nanoid } from "nanoid";
import { toast } from "sonner";
import { useBuyNowStore, useCartStore, type CartItem } from "@/store/cartStore";
import { formatDeliveryDay, formatPrice, getEffectiveDeliveryLeadDays } from "@/lib/utils";
import { DEFAULT_SAME_DAY_CUTOFF_TIME } from "@/lib/site-settings";
import { DEFAULT_CARD_MAX_CHARS } from "@/lib/card-options";
import { formatFlowerQuantityRange, getFlowerQuantityRange } from "@/lib/flower-quantities";
import ProductCard from "@/components/client/ProductCard";
import Modal from "@/components/ui/Modal";

// Ficha de producto con estilo boutique (spec 012): blanco, bordes finos,
// títulos serif, etiquetas en versalitas y la opción elegida apenas teñida.

const ADDON_ICONS: Record<string, typeof RiGiftLine> = {
  BEBIDA: RiGobletLine,
  VINO: RiGlassesLine,
  PELUCHE: RiBearSmileLine,
  DULCE: RiCakeLine,
  CANASTA: RiShoppingBasketLine,
  OTRO: RiGiftLine,
};

const SUGGESTED_MESSAGES: Array<{ label: string; messages: string[] }> = [
  {
    label: "💝 Amor",
    messages: [
      "Cada día a tu lado es un regalo. Te amo.",
      "Para la persona que hace florecer mis días. Con todo mi amor.",
    ],
  },
  {
    label: "🎂 Cumpleaños",
    messages: [
      "¡Feliz cumpleaños! Que este nuevo año florezca lleno de alegrías.",
      "Hoy celebramos tu vida. ¡Feliz cumpleaños, con mucho cariño!",
    ],
  },
  {
    label: "🙏 Gratitud",
    messages: [
      "Gracias por estar siempre. Estas flores son para ti.",
      "Con gratitud por todo lo que haces. ¡Mil gracias!",
    ],
  },
];

const SECTION_LABEL = "text-[11px] font-bold uppercase tracking-[.14em] text-slate-500";

export type CardOptionView = {
  id: string;
  name: string;
  description: string;
  price: number;
  maxChars: number;
  imageUrl?: string | null;
};

function readCookieArray(name: string) {
  try {
    const raw = document.cookie.split("; ").find(item => item.startsWith(`${name}=`))?.split("=").slice(1).join("=");
    const parsed = raw ? JSON.parse(decodeURIComponent(raw)) : [];
    return Array.isArray(parsed) ? parsed.filter(item => typeof item === "string") : [];
  } catch {
    return [] as string[];
  }
}

function writeCookieArray(name: string, values: string[]) {
  document.cookie = `${name}=${encodeURIComponent(JSON.stringify(values))}; path=/; max-age=15552000; samesite=lax`;
}

function buildCartItem(item: any, qty: number, chosenAddons: any[], card: CardOptionView | null, message: string): Omit<CartItem, "subtotal"> {
  const image = item.images?.find((entry: any) => entry.isMain)?.url || item.images?.[0]?.url || "";
  const cleanMessage = message.trim();
  return {
    id: nanoid(),
    productId: item.id,
    name: item.name,
    price: item.price,
    image,
    quantity: qty,
    preparationTimeValue: 0,
    preparationTimeUnit: "MINUTES",
    deliveryLeadDays: item.deliveryLeadDays || 0,
    flowers: (item.flowers || []).map((entry: any) => ({
      id: entry.flower.id,
      name: entry.flower.name,
      type: entry.flower.type,
      quantity: getFlowerQuantityRange(entry).max,
      quantityMin: getFlowerQuantityRange(entry).min,
      quantityMax: getFlowerQuantityRange(entry).max,
    })),
    addons: chosenAddons.map(addon => ({
      id: addon.id,
      name: addon.name,
      price: addon.price,
      type: addon.type,
    })),
    card: card
      ? { id: card.id, name: card.name, price: card.price, maxChars: card.maxChars, message: cleanMessage }
      : null,
    ...(card ? {} : { message: cleanMessage }),
  };
}

export default function ProductDetail({
  product,
  addons,
  cardOptions = [],
  recommendations,
}: {
  product: any;
  addons: any[];
  cardOptions?: CardOptionView[];
  recommendations: any[];
}) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [selectedAddons, setSelectedAddons] = useState<any[]>([]);
  const [imageIndex, setImageIndex] = useState(0);
  const [previewAddon, setPreviewAddon] = useState<any | null>(null);
  const [previewCard, setPreviewCard] = useState<CardOptionView | null>(null);
  const [favorite, setFavorite] = useState(false);
  const [sameDayCutoffTime, setSameDayCutoffTime] = useState(DEFAULT_SAME_DAY_CUTOFF_TIME);
  const [message, setMessage] = useState("");
  const [selectedCardId, setSelectedCardId] = useState<string | null>(() =>
    cardOptions.length ? [...cardOptions].sort((a, b) => a.price - b.price)[0].id : null
  );
  const { addItem, openCart } = useCartStore();
  const setBuyNowItem = useBuyNowStore(state => state.setItem);
  const images = product.images || [];
  const mainImage = images[imageIndex]?.url || images[0]?.url || "";

  useEffect(() => {
    const viewed = readCookieArray("ff_viewed_products");
    writeCookieArray("ff_viewed_products", [product.id, ...viewed.filter(id => id !== product.id)].slice(0, 16));
    setFavorite(readCookieArray("ff_favorite_products").includes(product.id));
  }, [product.id]);

  useEffect(() => {
    fetch("/api/settings")
      .then(response => response.json())
      .then(data => {
        if (typeof data?.sameDayCutoffTime === "string") setSameDayCutoffTime(data.sameDayCutoffTime);
      })
      .catch(() => {});
  }, []);

  const selectedCard = cardOptions.find(option => option.id === selectedCardId) || null;
  const maxChars = selectedCard?.maxChars ?? DEFAULT_CARD_MAX_CHARS;
  const messageTooLong = message.trim().length > maxChars;

  const addonTotal = useMemo(
    () => selectedAddons.reduce((sum, addon) => sum + Number(addon.price || 0), 0),
    [selectedAddons]
  );
  const total = (product.price + addonTotal + (selectedCard?.price || 0)) * quantity;
  const flowerTotals = product.flowers.reduce((totals: { min: number; max: number }, item: any) => {
    const range = getFlowerQuantityRange(item);
    return { min: totals.min + range.min, max: totals.max + range.max };
  }, { min: 0, max: 0 });
  const flowerTotal = flowerTotals.min === flowerTotals.max ? String(flowerTotals.max) : `${flowerTotals.min}-${flowerTotals.max}`;
  const effectiveDeliveryLeadDays = getEffectiveDeliveryLeadDays(product.deliveryLeadDays || 0, sameDayCutoffTime);

  const toggleFavorite = () => {
    const current = readCookieArray("ff_favorite_products");
    const next = favorite ? current.filter(id => id !== product.id) : [product.id, ...current.filter(id => id !== product.id)].slice(0, 32);
    writeCookieArray("ff_favorite_products", next);
    setFavorite(!favorite);
    toast.success(favorite ? "Eliminado de favoritos" : "Agregado a favoritos");
  };

  const toggleAddon = (addon: any) => {
    setSelectedAddons(current =>
      current.some(item => item.id === addon.id)
        ? current.filter(item => item.id !== addon.id)
        : [...current, addon]
    );
  };

  const handleAdd = () => {
    if (messageTooLong) return;
    addItem(buildCartItem(product, quantity, selectedAddons, selectedCard, message));
    openCart();
  };

  const handleBuyNow = () => {
    if (messageTooLong) return;
    setBuyNowItem(buildCartItem(product, quantity, selectedAddons, selectedCard, message));
    router.push("/checkout?mode=buy-now");
  };

  // Recomendaciones: agregado rápido sin tarjeta, como hasta ahora.
  const quickAdd = (item: any) => {
    addItem(buildCartItem(item, 1, [], null, ""));
    openCart();
  };

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 pb-36 pt-24 sm:px-6 lg:pb-12 lg:pt-28">
        <Link href="/flores" className="mb-7 inline-flex items-center gap-2 text-sm font-medium text-primary-600 transition hover:text-primary-800">
          <RiArrowLeftLine size={17} />
          Volver al catálogo
        </Link>

        <section className="grid gap-8 lg:grid-cols-[1.05fr_.95fr] lg:gap-14">
          <div className="min-w-0 lg:sticky lg:top-28 lg:self-start">
            <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
              <div key={mainImage} className="aspect-square animate-fade-in">
                {mainImage ? (
                  <img src={mainImage} alt={product.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full place-items-center"><RiFlowerLine className="text-slate-200" size={72} /></div>
                )}
              </div>
              {product.featured && <span className="absolute left-4 top-4 rounded-md bg-white px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[.14em] text-primary-700">Premium</span>}
              <button type="button" onClick={toggleFavorite} className={`absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white transition ${favorite ? "text-primary-600" : "text-slate-500 hover:text-primary-600"}`} aria-label={favorite ? "Quitar de favoritos" : "Agregar a favoritos"}>
                {favorite ? <RiHeartFill size={19} /> : <RiHeartLine size={19} />}
              </button>
            </div>

            {images.length > 1 && (
              <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {images.map((image: any, index: number) => (
                  <button key={image.id || image.url} type="button" onClick={() => setImageIndex(index)} aria-label={`Ver foto ${index + 1}`} className={`h-20 w-20 shrink-0 overflow-hidden rounded-lg border transition sm:h-24 sm:w-24 ${imageIndex === index ? "border-primary-500" : "border-slate-200 opacity-75 hover:opacity-100"}`}>
                    <img src={image.url} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
                <button type="button" onClick={() => setImageIndex(current => (current + 1) % images.length)} aria-label="Siguiente foto" className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-slate-500">
                  <RiArrowRightLine />
                </button>
              </div>
            )}
          </div>

          <div className="flex min-w-0 flex-col">
            <p className={SECTION_LABEL}>{product.featured ? "Premium" : product.category?.name}</p>
            <h1 className="mt-2 font-display text-4xl font-semibold leading-tight text-slate-950 sm:text-5xl">{product.name}</h1>
            <p className="mt-3 text-2xl font-semibold text-slate-900">{formatPrice(product.price)}</p>
            {product.description && <p className="mt-4 text-sm leading-6 text-slate-600 sm:text-[15px]">{product.description}</p>}

            <p className="mt-4 inline-flex items-center gap-2 text-sm text-slate-600">
              <RiTruckLine className="text-primary-600" /> Entrega {formatDeliveryDay(effectiveDeliveryLeadDays)}
            </p>

            {product.flowers.length > 0 && (
              <div className="mt-6 border-t border-slate-200 pt-5">
                <h2 className={SECTION_LABEL}>Incluye</h2>
                <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-slate-700">
                  {product.flowers.slice(0, 6).map((entry: any) => (
                    <li key={entry.id} className="flex items-center gap-2"><RiFlowerLine className="shrink-0 text-primary-500" /> {formatFlowerQuantityRange(entry)} {entry.flower.name} aprox.</li>
                  ))}
                  {product.flowers.length < 3 && (
                    <>
                      <li className="flex items-center gap-2"><RiLeafLine className="shrink-0 text-primary-500" /> Follaje seleccionado</li>
                      <li className="flex items-center gap-2"><RiGiftLine className="shrink-0 text-primary-500" /> Presentación premium</li>
                    </>
                  )}
                </ul>
              </div>
            )}

            <div className="mt-6 border-t border-slate-200 pt-5">
              <GiftMessageField value={message} onChange={setMessage} maxChars={maxChars} />
            </div>

            {cardOptions.length > 0 && (
              <div className="mt-6">
                <CardOptionList
                  options={cardOptions}
                  selectedId={selectedCardId}
                  onSelect={setSelectedCardId}
                  onPreview={setPreviewCard}
                />
              </div>
            )}

            {messageTooLong && (
              <p role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs leading-5 text-red-700">
                Tu mensaje tiene {message.trim().length} caracteres; {selectedCard ? "esta tarjeta" : "la dedicatoria"} admite {maxChars}. {cardOptions.length > 1 ? "Elige una tarjeta más grande o acórtalo." : "Acórtalo para continuar."}
              </p>
            )}

            <div className="mt-6 hidden lg:block">
              <p className={`${SECTION_LABEL} mb-2`}>Cantidad</p>
              <QuantityStepper value={quantity} onChange={setQuantity} />
              <PurchaseActions total={total} disabled={messageTooLong} onBuyNow={handleBuyNow} onAdd={handleAdd} />
              <p className="mt-3 flex items-center gap-2 text-xs text-slate-500"><RiShieldCheckLine className="text-emerald-600" /> Compra segura y protegida</p>
            </div>
          </div>
        </section>

        <section className="mt-10 grid rounded-xl border border-slate-200 bg-white md:grid-cols-3">
          {[
            { Icon: RiFlowerLine, title: "Flores frescas", text: flowerTotals.max > 0 ? `${flowerTotal} flores aprox. seleccionadas cuidadosamente.` : "Flores seleccionadas cuidadosamente." },
            { Icon: RiTruckLine, title: `Entrega ${formatDeliveryDay(effectiveDeliveryLeadDays)}`, text: "Preparamos tu pedido con el tiempo necesario para entregarlo perfecto." },
            { Icon: RiGiftLine, title: "Presentación premium", text: "Cada arreglo se prepara con cuidado y materiales seleccionados." },
          ].map((benefit, index) => (
            <article key={benefit.title} className={`flex items-center gap-4 p-5 ${index ? "border-t border-slate-200 md:border-l md:border-t-0" : ""}`}>
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary-50 text-primary-600"><benefit.Icon size={19} /></span>
              <div><h2 className="text-sm font-semibold text-slate-900">{benefit.title}</h2><p className="mt-1 text-xs leading-5 text-slate-500">{benefit.text}</p></div>
            </article>
          ))}
        </section>

        {addons.length > 0 && (
          <section className="mt-10">
            <div className="mb-4">
              <h2 className="font-display text-3xl font-semibold text-slate-950">Hazlo aún más especial</h2>
              <p className="mt-1 text-sm text-slate-500">Añade un detalle adicional a tu arreglo.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {addons.map(addon => {
                const selected = selectedAddons.some(item => item.id === addon.id);
                const Icon = ADDON_ICONS[addon.type] || RiGiftLine;
                return (
                  <article key={addon.id} className={`overflow-hidden rounded-xl border bg-white transition ${selected ? "border-primary-400 bg-primary-50/60" : "border-slate-200"}`}>
                    <button type="button" onClick={() => setPreviewAddon(addon)} className="group relative block aspect-square w-full overflow-hidden bg-slate-50" aria-label={`Ver ${addon.name}`}>
                      {addon.imageUrl ? <img src={addon.imageUrl} alt={addon.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <span className="grid h-full place-items-center"><Icon className="text-slate-300" size={36} /></span>}
                      <span className="absolute inset-0 grid place-items-center bg-black/0 text-white opacity-0 transition group-hover:bg-black/20 group-hover:opacity-100"><RiZoomInLine size={22} /></span>
                      {selected && <span className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-primary-600 text-white"><RiCheckLine size={13} /></span>}
                    </button>
                    <div className="p-3">
                      <h3 className="truncate text-xs font-semibold text-slate-800">{addon.name}</h3>
                      <p className="mt-1 text-xs font-bold text-primary-700">+ {formatPrice(addon.price)}</p>
                      <button type="button" onClick={() => toggleAddon(addon)} className={`mt-3 h-9 w-full rounded-lg border text-xs font-semibold transition ${selected ? "border-primary-300 bg-white text-primary-700" : "border-slate-200 text-slate-600 hover:border-primary-300 hover:text-primary-700"}`}>{selected ? "Quitar" : "Agregar"}</button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {recommendations.length > 0 && (
          <section className="mt-12">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div><h2 className="font-display text-3xl font-semibold text-slate-950">También te puede gustar</h2><p className="mt-1 text-sm text-slate-500">Seleccionado según tus intereses recientes.</p></div>
              <Link href="/flores" className="hidden items-center gap-2 text-sm font-semibold text-primary-600 hover:text-primary-800 sm:flex">Ver todos <RiArrowRightLine /></Link>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4 lg:gap-x-5">
              {recommendations.map(item => (
                <ProductCard key={item.id} product={item} onAdd={quickAdd} />
              ))}
            </div>
          </section>
        )}
      </div>

      <div className="fixed bottom-0 left-0 z-40 border-t border-slate-200 bg-white px-3 py-3 lg:hidden" style={{ right: "var(--scroll-lock-gap, 0px)" }}>
        <div className="mx-auto flex max-w-2xl items-center gap-2">
          <QuantityStepper value={quantity} onChange={setQuantity} compact />
          <button type="button" onClick={handleBuyNow} disabled={messageTooLong} className="flex h-12 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary-600 px-3 text-sm font-bold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-40">
            <span>Comprar</span>
            <span className="truncate font-semibold text-white/85">· {formatPrice(total)}</span>
          </button>
          <button type="button" onClick={handleAdd} disabled={messageTooLong} aria-label="Agregar al carrito" className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-primary-600 text-primary-700 transition hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-40">
            <RiShoppingBagLine size={20} />
          </button>
        </div>
      </div>

      <Modal open={Boolean(previewAddon)} onClose={() => setPreviewAddon(null)} size="md" title={previewAddon?.name}>
        {previewAddon && (
          <div>
            <div className="aspect-square overflow-hidden rounded-xl bg-slate-100">
              {previewAddon.imageUrl ? <img src={previewAddon.imageUrl} alt={previewAddon.name} className="h-full w-full object-cover" /> : <span className="grid h-full place-items-center"><RiGiftLine className="text-slate-300" size={64} /></span>}
            </div>
            <p className="mt-4 text-xl font-bold text-primary-700">+ {formatPrice(previewAddon.price)}</p>
            <button type="button" onClick={() => { toggleAddon(previewAddon); setPreviewAddon(null); }} className={`mt-4 h-12 w-full rounded-xl text-sm font-bold ${selectedAddons.some(item => item.id === previewAddon.id) ? "border border-slate-200 text-slate-700" : "bg-primary-600 text-white"}`}>
              {selectedAddons.some(item => item.id === previewAddon.id) ? "Quitar del pedido" : "Agregar al pedido"}
            </button>
          </div>
        )}
      </Modal>

      <Modal open={Boolean(previewCard)} onClose={() => setPreviewCard(null)} size="md" title={previewCard?.name} description={previewCard ? `${previewCard.description ? `${previewCard.description} · ` : ""}${previewCard.maxChars} caracteres` : undefined}>
        {previewCard && (
          <div>
            {previewCard.imageUrl && (
              <div className="overflow-hidden rounded-xl bg-slate-50">
                <img src={previewCard.imageUrl} alt={previewCard.name} className="h-auto w-full object-contain" />
              </div>
            )}
            <button type="button" onClick={() => { setSelectedCardId(previewCard.id); setPreviewCard(null); }} className="mt-4 h-12 w-full rounded-xl bg-primary-600 text-sm font-bold text-white">
              Elegir esta tarjeta · {previewCard.price > 0 ? `+ ${formatPrice(previewCard.price)}` : "Gratis"}
            </button>
          </div>
        )}
      </Modal>
    </>
  );
}

function GiftMessageField({ value, onChange, maxChars }: { value: string; onChange: (value: string) => void; maxChars: number }) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState(0);
  const length = value.trim().length;
  const over = length > maxChars;

  return (
    <div className={`rounded-xl border bg-white transition ${open ? "border-primary-300" : "border-slate-200 hover:border-primary-300"}`}>
      <button type="button" onClick={() => setOpen(current => !current)} aria-expanded={open} className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left">
        <span className="min-w-0 truncate font-display text-lg font-semibold text-slate-900">
          {value.trim() && !open ? `“${value.trim()}”` : "Escribir mensaje"} <RiArrowRightSLine className={`inline transition ${open ? "rotate-90" : ""}`} />
        </span>
        <span className="hidden shrink-0 items-center gap-1.5 text-[11px] font-bold uppercase tracking-[.14em] text-slate-500 sm:inline-flex">
          <RiPencilLine /> Dedicatoria (opcional)
        </span>
      </button>

      {open && (
        <div className="animate-fade-in border-t border-slate-200 px-4 pb-4 pt-3">
          <p className="mb-2 text-xs text-slate-500">Selecciona un mensaje inspirador o escribe el tuyo.</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_MESSAGES.map((group, index) => (
              <button key={group.label} type="button" onClick={() => setCategory(index)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${category === index ? "border-primary-400 bg-primary-50 text-primary-700" : "border-slate-200 text-slate-600 hover:border-primary-300"}`}>
                {group.label}
              </button>
            ))}
          </div>
          <div className="mt-2 grid gap-2">
            {SUGGESTED_MESSAGES[category].messages.map(text => (
              <button key={text} type="button" onClick={() => onChange(text)} className="rounded-lg border border-dashed border-slate-200 px-3 py-2 text-left text-xs leading-5 text-slate-600 transition hover:border-primary-300 hover:text-slate-900">
                {text}
              </button>
            ))}
          </div>
          <label className="mt-3 block">
            <span className="sr-only">Mensaje de la tarjeta</span>
            <textarea
              value={value}
              onChange={event => onChange(event.target.value)}
              rows={4}
              placeholder="Escribe aquí tu dedicatoria…"
              className={`w-full resize-none rounded-lg border bg-white px-3 py-2.5 text-sm leading-6 text-slate-800 outline-none transition focus:ring-4 ${over ? "border-red-300 focus:ring-red-100" : "border-slate-200 focus:border-primary-300 focus:ring-primary-100"}`}
            />
          </label>
          <div className="mt-1 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Se escribe a mano en la tarjeta que elijas.</span>
            <span className={`font-semibold tabular-nums ${over ? "text-red-600" : "text-slate-400"}`}>{length}/{maxChars}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function CardOptionList({
  options,
  selectedId,
  onSelect,
  onPreview,
}: {
  options: CardOptionView[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onPreview: (option: CardOptionView) => void;
}) {
  return (
    <fieldset>
      <legend className="font-display text-xl font-semibold text-slate-900">Elige tu tarjeta</legend>
      <div className="mt-3 space-y-2.5" role="radiogroup">
        {options.map(option => {
          const selected = option.id === selectedId;
          return (
            <div key={option.id} className={`flex items-center gap-3 rounded-xl border px-4 py-3.5 transition ${selected ? "border-primary-400 bg-primary-50/60" : "border-slate-200 bg-white hover:border-primary-200"}`}>
              <button type="button" role="radio" aria-checked={selected} onClick={() => onSelect(option.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                <span className={`grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full border-2 ${selected ? "border-primary-600" : "border-slate-300"}`}>
                  {selected && <span className="h-2 w-2 rounded-full bg-primary-600" />}
                </span>
                <span className="min-w-0">
                  <strong className="block text-sm font-semibold text-slate-900">{option.name}</strong>
                  <span className="block text-xs leading-5 text-slate-500">
                    {[option.description, `hasta ${option.maxChars} caracteres`].filter(Boolean).join(" · ")}
                  </span>
                </span>
              </button>
              <span className="shrink-0 text-sm font-bold text-primary-700">{option.price > 0 ? `+ ${formatPrice(option.price)}` : "Gratis"}</span>
              {option.imageUrl && (
                <button type="button" onClick={() => onPreview(option)} className="shrink-0 text-xs font-medium text-slate-500 underline underline-offset-4 hover:text-primary-700">
                  Ver
                </button>
              )}
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}

function QuantityStepper({ value, onChange, compact = false }: { value: number; onChange: (value: number) => void; compact?: boolean }) {
  const size = compact ? "h-8 w-8" : "h-10 w-10";
  return (
    <div className="inline-flex shrink-0 items-center rounded-xl border border-slate-200 bg-white">
      <button type="button" onClick={() => onChange(Math.max(1, value - 1))} aria-label="Quitar uno" className={`grid ${size} place-items-center text-slate-500 hover:text-slate-900`}><RiSubtractLine /></button>
      <span className={`${compact ? "w-7" : "w-10"} text-center text-sm font-bold tabular-nums`}>{value}</span>
      <button type="button" onClick={() => onChange(value + 1)} aria-label="Agregar uno" className={`grid ${size} place-items-center text-slate-500 hover:text-slate-900`}><RiAddLine /></button>
    </div>
  );
}

function PurchaseActions({ total, disabled, onBuyNow, onAdd }: { total: number; disabled: boolean; onBuyNow: () => void; onAdd: () => void }) {
  return (
    <div className="mt-5 grid gap-2.5">
      <button type="button" onClick={onBuyNow} disabled={disabled} className="flex h-12 w-full items-center justify-center gap-2.5 rounded-xl bg-primary-600 text-[15px] font-bold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-40">
        <RiFlashlightLine size={18} /> Comprar ahora <span className="text-white/70">·</span> {formatPrice(total)}
      </button>
      <button type="button" onClick={onAdd} disabled={disabled} className="flex h-12 w-full items-center justify-center gap-2.5 rounded-xl border border-primary-600 bg-white text-[15px] font-bold text-primary-700 transition hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-40">
        <RiShoppingBagLine size={18} /> Agregar al carrito
      </button>
    </div>
  );
}
