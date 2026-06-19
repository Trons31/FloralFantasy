"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  RiAddLine,
  RiArrowLeftLine,
  RiArrowRightLine,
  RiBearSmileLine,
  RiCakeLine,
  RiCheckLine,
  RiCloseLine,
  RiFlowerLine,
  RiGiftLine,
  RiGlassesLine,
  RiGobletLine,
  RiHeartFill,
  RiHeartLine,
  RiLeafLine,
  RiShieldCheckLine,
  RiShoppingBagLine,
  RiShoppingBasketLine,
  RiSubtractLine,
  RiTimeLine,
  RiTruckLine,
  RiZoomInLine,
} from "react-icons/ri";
import { nanoid } from "nanoid";
import { toast } from "sonner";
import { useCartStore } from "@/store/cartStore";
import { formatDeliveryLeadDays, formatPrice } from "@/lib/utils";

const ADDON_ICONS: Record<string, typeof RiGiftLine> = {
  BEBIDA: RiGobletLine,
  VINO: RiGlassesLine,
  PELUCHE: RiBearSmileLine,
  DULCE: RiCakeLine,
  CANASTA: RiShoppingBasketLine,
  OTRO: RiGiftLine,
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

export default function ProductDetail({
  product,
  addons,
  recommendations,
}: {
  product: any;
  addons: any[];
  recommendations: any[];
}) {
  const [quantity, setQuantity] = useState(1);
  const [selectedAddons, setSelectedAddons] = useState<any[]>([]);
  const [imageIndex, setImageIndex] = useState(0);
  const [previewAddon, setPreviewAddon] = useState<any | null>(null);
  const [favorite, setFavorite] = useState(false);
  const { addItem, toggleCart } = useCartStore();
  const images = product.images || [];
  const mainImage = images[imageIndex]?.url || images[0]?.url || "";

  useEffect(() => {
    const viewed = readCookieArray("ff_viewed_products");
    writeCookieArray("ff_viewed_products", [product.id, ...viewed.filter(id => id !== product.id)].slice(0, 16));
    setFavorite(readCookieArray("ff_favorite_products").includes(product.id));
  }, [product.id]);

  const addonTotal = useMemo(
    () => selectedAddons.reduce((sum, addon) => sum + Number(addon.price || 0), 0),
    [selectedAddons]
  );
  const total = product.price * quantity + addonTotal * quantity;
  const flowerTotal = product.flowers.reduce((sum: number, item: any) => sum + Number(item.quantity || 1), 0);

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

  const addProductToCart = (item: any, qty = 1, chosenAddons: any[] = []) => {
    const image = item.images?.find((entry: any) => entry.isMain)?.url || item.images?.[0]?.url || "";
    addItem({
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
        quantity: entry.quantity || 1,
      })),
      addons: chosenAddons.map(addon => ({
        id: addon.id,
        name: addon.name,
        price: addon.price,
        type: addon.type,
      })),
    });
    toast.success(`${item.name} agregado al carrito`);
  };

  const handleAdd = () => {
    addProductToCart(product, quantity, selectedAddons);
    toggleCart();
  };

  const quickAdd = (item: any) => {
    addProductToCart(item);
    toggleCart();
  };

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 pb-32 pt-24 sm:px-6 lg:pb-12 lg:pt-28">
        <Link href="/flores" className="mb-7 inline-flex items-center gap-2 text-sm font-medium text-primary-500 transition hover:text-primary-700">
          <RiArrowLeftLine size={17} />
          Volver al catálogo
        </Link>

        <section className="grid gap-8 lg:grid-cols-[1.08fr_.92fr] lg:gap-12">
          <div className="min-w-0">
            <div className="relative overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 shadow-sm">
              <motion.div key={mainImage} initial={{ opacity: 0.65 }} animate={{ opacity: 1 }} className="aspect-square">
                {mainImage ? (
                  <img src={mainImage} alt={product.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full place-items-center"><RiFlowerLine className="text-slate-200" size={72} /></div>
                )}
              </motion.div>
              {product.featured && <span className="absolute left-4 top-4 rounded-lg bg-primary-500 px-3 py-2 text-[10px] font-bold text-white">PREMIUM</span>}
              <button type="button" onClick={toggleFavorite} className={`absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-white shadow-md transition ${favorite ? "text-primary-500" : "text-slate-500 hover:text-primary-500"}`} aria-label={favorite ? "Quitar de favoritos" : "Agregar a favoritos"}>
                {favorite ? <RiHeartFill size={20} /> : <RiHeartLine size={20} />}
              </button>
            </div>

            {images.length > 1 && (
              <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {images.map((image: any, index: number) => (
                  <button key={image.id || image.url} type="button" onClick={() => setImageIndex(index)} className={`h-20 w-24 shrink-0 overflow-hidden rounded-xl border-2 transition sm:h-24 sm:w-28 ${imageIndex === index ? "border-primary-500" : "border-transparent opacity-75 hover:opacity-100"}`}>
                    <img src={image.url} alt={`${product.name} ${index + 1}`} className="h-full w-full object-cover" />
                  </button>
                ))}
                <button type="button" onClick={() => setImageIndex(current => (current + 1) % images.length)} className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm">
                  <RiArrowRightLine />
                </button>
              </div>
            )}
          </div>

          <div className="flex min-w-0 flex-col">
            <p className="text-xs font-bold uppercase tracking-[.12em] text-primary-500">{product.featured ? "Premium" : product.category?.name}</p>
            <h1 className="mt-2 font-display text-4xl font-semibold leading-none text-slate-950 sm:text-5xl">{product.name}</h1>
            {product.description && <p className="mt-3 text-sm leading-6 text-slate-500 sm:text-base">{product.description}</p>}
            <p className="mt-5 text-3xl font-bold text-primary-600 sm:text-4xl">{formatPrice(product.price)}</p>

            <div className="mt-4 flex flex-wrap gap-2">
              {product.flowers.slice(0, 3).map((entry: any) => (
                <span key={entry.id} className="inline-flex items-center gap-1.5 rounded-full border border-primary-100 bg-primary-50 px-3 py-2 text-xs font-medium text-primary-600">
                  <RiFlowerLine /> {entry.flower.name}
                </span>
              ))}
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-600">
                <RiTimeLine /> {formatDeliveryLeadDays(product.deliveryLeadDays || 0)}
              </span>
            </div>

            {product.flowers.length > 0 && (
              <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="text-sm font-bold text-slate-900">Incluye</h2>
                <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {product.flowers.slice(0, 4).map((entry: any) => (
                    <div key={entry.id} className="text-center">
                      <span className="mx-auto grid h-9 w-9 place-items-center rounded-full bg-primary-50 text-primary-500"><RiFlowerLine /></span>
                      <p className="mt-2 text-xs font-medium leading-5 text-slate-600">{entry.quantity || 1} {entry.flower.name}</p>
                    </div>
                  ))}
                  {product.flowers.length < 3 && (
                    <>
                      <div className="text-center"><span className="mx-auto grid h-9 w-9 place-items-center rounded-full bg-primary-50 text-primary-500"><RiLeafLine /></span><p className="mt-2 text-xs font-medium leading-5 text-slate-600">Follaje seleccionado</p></div>
                      <div className="text-center"><span className="mx-auto grid h-9 w-9 place-items-center rounded-full bg-primary-50 text-primary-500"><RiGiftLine /></span><p className="mt-2 text-xs font-medium leading-5 text-slate-600">Presentación premium</p></div>
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="mt-5 hidden lg:block">
              <p className="mb-2 text-sm font-medium text-slate-600">Cantidad</p>
              <div className="inline-flex items-center rounded-full border border-slate-200 bg-white p-1 shadow-sm">
                <button type="button" onClick={() => setQuantity(current => Math.max(1, current - 1))} className="grid h-9 w-9 place-items-center rounded-full text-slate-500 hover:bg-slate-50"><RiSubtractLine /></button>
                <span className="w-12 text-center text-sm font-bold">{quantity}</span>
                <button type="button" onClick={() => setQuantity(current => current + 1)} className="grid h-9 w-9 place-items-center rounded-full text-slate-500 hover:bg-slate-50"><RiAddLine /></button>
              </div>
            </div>

            <button type="button" onClick={handleAdd} className="mt-5 hidden h-14 w-full items-center justify-center gap-3 rounded-xl bg-primary-500 text-base font-bold text-white shadow-[0_10px_24px_rgba(236,18,91,.22)] transition hover:bg-primary-600 lg:flex">
              <RiShoppingBagLine size={20} />
              Agregar al carrito
              <span className="text-white/75">•</span>
              {formatPrice(total)}
            </button>
            <p className="mt-3 hidden items-center gap-2 text-xs text-slate-500 lg:flex"><RiShieldCheckLine className="text-emerald-600" /> Compra segura y protegida</p>
          </div>
        </section>

        <section className="mt-6 grid rounded-2xl border border-slate-200 bg-white shadow-sm md:grid-cols-3">
          {[
            { Icon: RiFlowerLine, title: "Flores frescas", text: `${flowerTotal || "Flores"} seleccionadas cuidadosamente.` },
            { Icon: RiTruckLine, title: formatDeliveryLeadDays(product.deliveryLeadDays || 0), text: "Preparamos tu pedido con el tiempo necesario para entregarlo perfecto." },
            { Icon: RiGiftLine, title: "Presentación premium", text: "Cada arreglo se prepara con cuidado y materiales seleccionados." },
          ].map((benefit, index) => (
            <article key={benefit.title} className={`flex items-center gap-4 p-5 ${index ? "border-t border-slate-100 md:border-l md:border-t-0" : ""}`}>
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary-50 text-primary-500"><benefit.Icon size={20} /></span>
              <div><h2 className="text-sm font-bold text-slate-900">{benefit.title}</h2><p className="mt-1 text-xs leading-5 text-slate-500">{benefit.text}</p></div>
            </article>
          ))}
        </section>

        {addons.length > 0 && (
          <section className="mt-8">
            <div className="mb-4">
              <h2 className="font-display text-2xl font-semibold text-slate-950">Hazlo aún más especial</h2>
              <p className="mt-1 text-sm text-slate-500">Añade un detalle adicional a tu arreglo.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {addons.map(addon => {
                const selected = selectedAddons.some(item => item.id === addon.id);
                const Icon = ADDON_ICONS[addon.type] || RiGiftLine;
                return (
                  <article key={addon.id} className={`overflow-hidden rounded-2xl border bg-white transition ${selected ? "border-primary-400 shadow-md" : "border-slate-200"}`}>
                    <button type="button" onClick={() => setPreviewAddon(addon)} className="group relative block aspect-square w-full overflow-hidden bg-slate-50">
                      {addon.imageUrl ? <img src={addon.imageUrl} alt={addon.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <span className="grid h-full place-items-center"><Icon className="text-slate-300" size={36} /></span>}
                      <span className="absolute inset-0 grid place-items-center bg-black/0 text-white opacity-0 transition group-hover:bg-black/20 group-hover:opacity-100"><RiZoomInLine size={22} /></span>
                      {selected && <span className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-primary-500 text-white"><RiCheckLine size={13} /></span>}
                    </button>
                    <div className="p-3">
                      <h3 className="truncate text-xs font-semibold text-slate-800">{addon.name}</h3>
                      <p className="mt-1 text-xs font-bold text-primary-500">+{formatPrice(addon.price)}</p>
                      <button type="button" onClick={() => toggleAddon(addon)} className={`mt-3 h-9 w-full rounded-xl text-xs font-semibold transition ${selected ? "bg-primary-100 text-primary-700" : "bg-slate-100 text-slate-600 hover:bg-primary-50 hover:text-primary-600"}`}>{selected ? "Quitar" : "Agregar"}</button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {recommendations.length > 0 && (
          <section className="mt-10">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div><h2 className="font-display text-2xl font-semibold text-slate-950">También te puede gustar</h2><p className="mt-1 text-sm text-slate-500">Seleccionado según tus intereses recientes.</p></div>
              <Link href="/flores" className="hidden items-center gap-2 text-sm font-semibold text-primary-500 hover:text-primary-700 sm:flex">Ver todos <RiArrowRightLine /></Link>
            </div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {recommendations.map(item => {
                const image = item.images?.find((entry: any) => entry.isMain)?.url || item.images?.[0]?.url || "";
                return (
                  <article key={item.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <Link href={`/flores/${item.id}`} className="block aspect-[4/3] overflow-hidden bg-slate-50">
                      {image ? <img src={image} alt={item.name} className="h-full w-full object-cover transition duration-500 hover:scale-105" /> : <span className="grid h-full place-items-center"><RiFlowerLine className="text-slate-200" size={40} /></span>}
                    </Link>
                    <div className="flex items-end justify-between gap-2 p-3">
                      <div className="min-w-0"><Link href={`/flores/${item.id}`} className="block truncate text-xs font-semibold text-slate-900 sm:text-sm">{item.name}</Link><p className="mt-1 text-xs font-bold text-slate-900 sm:text-sm">{formatPrice(item.price)}</p></div>
                      <button type="button" onClick={() => quickAdd(item)} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary-100 text-primary-500 transition hover:bg-primary-500 hover:text-white" aria-label={`Agregar ${item.name}`}><RiAddLine /></button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-100 bg-white px-3 py-3 shadow-[0_-6px_24px_rgba(15,23,42,.08)] lg:hidden">
        <div className="mx-auto flex max-w-2xl items-center gap-2">
          <div className="flex items-center rounded-full border border-slate-200 bg-slate-50 p-1">
            <button type="button" onClick={() => setQuantity(current => Math.max(1, current - 1))} className="grid h-8 w-8 place-items-center rounded-full bg-white"><RiSubtractLine /></button>
            <span className="w-8 text-center text-sm font-bold">{quantity}</span>
            <button type="button" onClick={() => setQuantity(current => current + 1)} className="grid h-8 w-8 place-items-center rounded-full bg-white"><RiAddLine /></button>
          </div>
          <button type="button" onClick={handleAdd} className="flex h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl bg-primary-500 px-3 text-sm font-bold text-white">
            <RiShoppingBagLine size={18} />
            Agregar
            <span className="truncate">• {formatPrice(total)}</span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {previewAddon && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPreviewAddon(null)} className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4">
            <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }} onClick={event => event.stopPropagation()} className="w-full overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-w-md sm:rounded-3xl">
              <div className="relative aspect-square bg-slate-100">
                {previewAddon.imageUrl ? <img src={previewAddon.imageUrl} alt={previewAddon.name} className="h-full w-full object-cover" /> : <span className="grid h-full place-items-center"><RiGiftLine className="text-slate-300" size={64} /></span>}
                <button type="button" onClick={() => setPreviewAddon(null)} className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-white/95 text-slate-500 shadow"><RiCloseLine /></button>
              </div>
              <div className="p-5">
                <h2 className="text-lg font-bold text-slate-900">{previewAddon.name}</h2>
                <p className="mt-1 text-xl font-bold text-primary-500">+{formatPrice(previewAddon.price)}</p>
                <button type="button" onClick={() => { toggleAddon(previewAddon); setPreviewAddon(null); }} className={`mt-5 h-12 w-full rounded-xl text-sm font-bold ${selectedAddons.some(item => item.id === previewAddon.id) ? "bg-slate-100 text-slate-700" : "bg-primary-500 text-white"}`}>
                  {selectedAddons.some(item => item.id === previewAddon.id) ? "Quitar del pedido" : "Agregar al pedido"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
