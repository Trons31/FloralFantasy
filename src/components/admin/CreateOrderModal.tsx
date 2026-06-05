"use client";

import { useEffect, useMemo, useState } from "react";
import { RiCloseLine, RiSearchLine, RiAddLine, RiSubtractLine, RiShoppingBagLine, RiWhatsappLine, RiLoaderLine, RiCheckLine, RiLinkM, RiFileCopyLine } from "react-icons/ri";
import ResponsiveModal from "@/components/ui/ResponsiveModal";
import { DEFAULT_DELIVERY_FEE } from "@/lib/site-settings";
import { toast } from "sonner";
import { formatPrice, formatDeliveryLeadDays } from "@/lib/utils";

interface ProductImage { url: string; isMain: boolean }
interface Addon { id: string; name: string; price: number; type: string; inStock: boolean }
interface Flower { id: string; name: string; type: string; description?: string | null; imageUrl?: string | null }
interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  images: ProductImage[];
  flowers?: { flower: Flower; quantity: number }[];
  occasion?: string;
  deliveryLeadDays?: number;
}

interface CartItem {
  product: Product;
  quantity: number;
  price: number;
  addons: Addon[];
  customization: {
    bouquetSize: "STANDARD" | "ENLARGED" | "REDUCED";
    sizeModes: {
      reduced: boolean;
      enlarged: boolean;
    };
    baseFlowers: { id: string; name: string; baseQuantity: number; quantity: number }[];
    extraFlowers: { id: string; name: string; quantity: number }[];
  };
}

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated?: (order: any) => void;
}

function buildBaseFlowers(product: Product) {
  return (product.flowers || []).map(({ flower, quantity }) => ({
    id: flower.id,
    name: flower.name,
    baseQuantity: quantity || 1,
    quantity: quantity || 1,
  }));
}

function formatNames(items: { name: string }[]) {
  if (items.length === 0) return "";
  const names = items.map((item) => item.name);
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} y ${names[1]}`;
  return `${names[0]}, ${names[1]} y ${names.length - 2} más`;
}

function getBouquetSummary(customization: CartItem["customization"]) {
  const reducedMode = customization.sizeModes?.reduced || false;
  const enlargedMode = customization.sizeModes?.enlarged || false;
  const increased = customization.baseFlowers.filter((flower) => flower.quantity > flower.baseQuantity);
  const decreased = customization.baseFlowers.filter((flower) => flower.quantity < flower.baseQuantity);
  const added = customization.extraFlowers;
  const hasIncrease = increased.length > 0;
  const hasDecrease = decreased.length > 0;
  const hasExtraFlowers = added.length > 0;
  const isMixed = (reducedMode && enlargedMode) || ((hasIncrease || hasExtraFlowers) && hasDecrease) || (hasIncrease && hasExtraFlowers && hasDecrease);
  const detailParts: string[] = [];

  if (hasIncrease) {
    detailParts.push(`agrandaste ${formatNames(increased)}`);
  }
  if (hasDecrease) {
    detailParts.push(`redujiste ${formatNames(decreased)}`);
  }
  if (hasExtraFlowers) {
    detailParts.push(`agregaste ${formatNames(added)}`);
  }

  if (isMixed) {
    return {
      label: "Mixto",
      detail: detailParts.join(" · "),
      chips: {
        increased,
        decreased,
        added,
      },
      storedSize: "STANDARD" as const,
    };
  }

  if (hasIncrease || hasExtraFlowers) {
    return {
      label: "Agrandado",
      detail: detailParts.join(" · "),
      chips: {
        increased,
        decreased,
        added,
      },
      storedSize: "ENLARGED" as const,
    };
  }

  if (hasDecrease) {
    return {
      label: "Reducido",
      detail: detailParts.join(" · "),
      chips: {
        increased,
        decreased,
        added,
      },
      storedSize: "REDUCED" as const,
    };
  }

  return {
    label: "Normal",
    detail: "Sin cambios",
    chips: {
      increased,
      decreased,
      added,
    },
    storedSize: "STANDARD" as const,
  };
}

export default function CreateOrderModal({ open, onClose, onCreated }: Props) {
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [flowers, setFlowers] = useState<Flower[]>([]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [deliveryFee, setDeliveryFee] = useState(DEFAULT_DELIVERY_FEE);
  const [adminNote, setAdminNote] = useState("");
  const [manualAdjustment, setManualAdjustment] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");
  const [generatedToken, setGeneratedToken] = useState("");
  const [clipboardState, setClipboardState] = useState(false);

  useEffect(() => {
    if (!open) {
      const timer = setTimeout(() => {
        setSuccess(false);
        setError("");
        setSearch("");
        setCart([]);
        setAdminNote("");
        setManualAdjustment("");
        setGeneratedLink("");
        setGeneratedToken("");
        setClipboardState(false);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (typeof data?.deliveryFee === "number") setDeliveryFee(data.deliveryFee);
      })
      .catch(() => {});
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setLoadingProducts(true);
    Promise.all([
      fetch("/api/products").then((r) => r.json()),
      fetch("/api/addons").then((r) => r.json()),
      fetch("/api/flowers").then((r) => r.json()),
    ])
      .then(([prods, ads, fls]) => {
        setProducts(Array.isArray(prods) ? prods : prods.products ?? []);
        setAddons(Array.isArray(ads) ? ads : ads.addons ?? []);
        setFlowers(Array.isArray(fls) ? fls : []);
      })
      .catch(() => {})
      .finally(() => setLoadingProducts(false));
  }, [open]);

  const filtered = useMemo(
    () =>
      products.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          (p.occasion ?? "").toLowerCase().includes(search.toLowerCase())
      ),
    [products, search]
  );

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.product.id === product.id);
      if (existing) {
        return prev.map((c) => (c.product.id === product.id ? { ...c, quantity: c.quantity + 1 } : c));
      }
      return [...prev, {
        product,
        quantity: 1,
        price: product.price,
        addons: [],
        customization: {
          bouquetSize: "STANDARD",
          sizeModes: {
            reduced: false,
            enlarged: false,
          },
          baseFlowers: buildBaseFlowers(product),
          extraFlowers: [],
        },
      }];
    });
  };

  const updateQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => (c.product.id === productId ? { ...c, quantity: c.quantity + delta } : c))
        .filter((c) => c.quantity > 0)
    );
  };

  const toggleAddon = (productId: string, addon: Addon) => {
    setCart((prev) =>
      prev.map((c) => {
        if (c.product.id !== productId) return c;
        const has = c.addons.find((a) => a.id === addon.id);
        return { ...c, addons: has ? c.addons.filter((a) => a.id !== addon.id) : [...c.addons, addon] };
      })
    );
  };

  const setBouquetSize = (productId: string, bouquetSize: "STANDARD" | "ENLARGED" | "REDUCED") => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id !== productId) return item;

        const nextSizeModes = { ...item.customization.sizeModes };
        if (bouquetSize === "STANDARD") {
          nextSizeModes.reduced = false;
          nextSizeModes.enlarged = false;
        } else if (bouquetSize === "REDUCED") {
          nextSizeModes.reduced = !nextSizeModes.reduced;
        } else if (bouquetSize === "ENLARGED") {
          nextSizeModes.enlarged = !nextSizeModes.enlarged;
        }

        const nextBouquetSize =
          nextSizeModes.reduced && nextSizeModes.enlarged
            ? "STANDARD"
            : nextSizeModes.enlarged
              ? "ENLARGED"
              : nextSizeModes.reduced
                ? "REDUCED"
                : "STANDARD";

        return {
          ...item,
          customization: {
            ...item.customization,
            bouquetSize: nextBouquetSize,
            sizeModes: nextSizeModes,
          },
        };
      })
    );
  };

  const toggleExtraFlower = (productId: string, flower: Flower) => {
    setCart((prev) =>
      prev.map((c) => {
        if (c.product.id !== productId) return c;
        const exists = c.customization.extraFlowers.find((f) => f.id === flower.id);
        const nextExtraFlowers = exists
          ? c.customization.extraFlowers.filter((f) => f.id !== flower.id)
          : [...c.customization.extraFlowers, { id: flower.id, name: flower.name, quantity: 1 }];
        return { ...c, customization: { ...c.customization, extraFlowers: nextExtraFlowers } };
      })
    );
  };

  const updateExtraFlowerQty = (productId: string, flowerId: string, delta: number) => {
    setCart((prev) =>
      prev.map((c) => {
        if (c.product.id !== productId) return c;
        const nextExtraFlowers = c.customization.extraFlowers
          .map((flower) =>
            flower.id === flowerId ? { ...flower, quantity: flower.quantity + delta } : flower
          )
          .filter((flower) => flower.quantity > 0);
        return { ...c, customization: { ...c.customization, extraFlowers: nextExtraFlowers } };
      })
    );
  };

  const updateBaseFlowerQty = (productId: string, flowerId: string, delta: number) => {
    setCart((prev) =>
      prev.map((c) => {
        if (c.product.id !== productId) return c;
        const nextBaseFlowers = c.customization.baseFlowers.map((flower) => {
          if (flower.id !== flowerId) return flower;
          const proposed = flower.quantity + delta;
          const nextQuantity = Math.max(0, proposed);
          return { ...flower, quantity: nextQuantity };
        });
        return { ...c, customization: { ...c.customization, baseFlowers: nextBaseFlowers } };
      })
    );
  };

  const subtotal = cart.reduce(
    (acc, c) => acc + c.price * c.quantity + c.addons.reduce((a, ad) => a + ad.price, 0) * c.quantity,
    0
  );
  const maxDeliveryDays = cart.reduce((max, item) => Math.max(max, item.product.deliveryLeadDays || 0), 0);
  const manualAdjustmentValue = Number(manualAdjustment || 0);
  const total = subtotal + deliveryFee + manualAdjustmentValue;

  const handleSubmit = async () => {
    if (cart.length === 0) {
      toast.error("Agrega al menos un producto");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "",
          phone: "",
          email: "",
          address: "",
          addressRef: "",
          total,
          deliveryFee,
          adminNote,
          manualAdjustment: manualAdjustmentValue,
          estimatedTime: formatDeliveryLeadDays(maxDeliveryDays),
          source: "ADMIN",
          items: cart.map((c) => ({
            productId: c.product.id,
            quantity: c.quantity,
            price: c.price,
            addons: c.addons,
            customization: {
              ...c.customization,
              bouquetSize: getBouquetSummary(c.customization).storedSize,
            },
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No fue posible generar el link");
      setGeneratedLink(`${window.location.origin}${data.checkoutUrl || `/checkout?token=${data.trackingToken}`}`);
      setGeneratedToken(data.trackingToken || "");
      setSuccess(true);
      onCreated?.(data);
    } catch (e: any) {
      setError(e.message || "No fue posible generar el link");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = async () => {
    if (!generatedLink) return;
    await navigator.clipboard.writeText(generatedLink);
    setClipboardState(true);
    setTimeout(() => setClipboardState(false), 1800);
  };

  const handleWhatsApp = () => {
    if (!generatedLink) return;
    const text = encodeURIComponent(`Hola, aquí tienes tu link de pago: ${generatedLink}`);
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
  };

  return (
    <ResponsiveModal
      open={open}
      onClose={onClose}
      title={success ? "Link de pago generado" : "Nuevo pedido"}
      description={success ? "Comparte este enlace con tu cliente por WhatsApp." : "Arma el pedido y genera el enlace de pago."}
      panelClassName="md:max-w-4xl"
      contentClassName="p-0 overflow-hidden"
    >
      {success ? (
        <div className="space-y-4">
          <div className="rounded-3xl bg-green-50 border border-green-100 p-5">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-2xl bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0">
                <RiCheckLine size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-green-800">Pedido armado correctamente</p>
                <p className="text-sm text-green-700 mt-1">
                  Ya puedes enviar el link al cliente. El checkout abrirá el pedido armado y luego podrá completar sus datos y subir el comprobante.
                </p>
                {generatedToken && <p className="text-xs font-mono text-green-600 mt-2">{generatedToken}</p>}
              </div>
            </div>
          </div>

            <div className="rounded-3xl border border-gray-200 bg-white p-4">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Link de pago</label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input value={generatedLink} readOnly className="flex-1 border border-gray-200 rounded-2xl px-4 py-3 text-sm bg-gray-50" />
                <button onClick={handleCopy} className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-primary-600 text-white font-semibold">
                  {clipboardState ? <RiCheckLine size={16} /> : <RiFileCopyLine size={16} />}
                  {clipboardState ? "Copiado" : "Copiar"}
                </button>
                <button onClick={handleWhatsApp} className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-[#25D366] text-white font-semibold">
                  <RiWhatsappLine size={16} />
                  WhatsApp
                </button>
              </div>
            </div>

          <div className="flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-3 rounded-2xl border border-gray-200 text-gray-700 font-semibold">
              Cerrar
            </button>
          </div>
        </div>
      ) : (
        <div className="relative h-full min-h-0 flex flex-col overflow-hidden">
          <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6 pb-32">
            <div className="grid lg:grid-cols-[1.1fr_.9fr] gap-6">
          <div className="space-y-4">
            <div className="rounded-3xl bg-gray-50 border border-gray-100 p-4">
              <div className="relative">
                <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar productos..."
                  className="w-full pl-9 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>
            </div>

            <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
              {loadingProducts ? (
                <div className="flex items-center justify-center py-12">
                  <RiLoaderLine className="animate-spin text-rose-500" size={26} />
                </div>
              ) : filtered.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-10">Sin resultados</p>
              ) : (
                filtered.map((product) => {
                  const cartItem = cart.find((c) => c.product.id === product.id);
                  const img = product.images?.find((i) => i.isMain)?.url ?? product.images?.[0]?.url;
                  return (
                    <div key={product.id} className="rounded-2xl border border-gray-100 bg-white p-3 space-y-3">
                      <div className="flex items-center gap-3">
                        {img ? (
                          <img src={img} alt={product.name} className="w-14 h-14 object-cover rounded-xl flex-shrink-0" />
                        ) : (
                          <div className="w-14 h-14 bg-rose-50 rounded-xl flex-shrink-0 flex items-center justify-center">
                            <RiShoppingBagLine className="text-rose-300" size={22} />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm leading-tight truncate">{product.name}</p>
                          {product.occasion && <p className="text-[10px] text-rose-400 uppercase font-bold tracking-wide">{product.occasion}</p>}
                          <p className="text-rose-600 font-bold text-sm mt-0.5">{formatPrice(product.price)}</p>
                        </div>
                        {cartItem ? (
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button onClick={() => updateQty(product.id, -1)} className="w-7 h-7 rounded-full bg-rose-100 flex items-center justify-center hover:bg-rose-200 transition-colors">
                              <RiSubtractLine size={14} className="text-rose-600" />
                            </button>
                            <span className="w-5 text-center text-sm font-bold text-gray-900">{cartItem.quantity}</span>
                            <button onClick={() => updateQty(product.id, 1)} className="w-7 h-7 rounded-full bg-rose-500 flex items-center justify-center hover:bg-rose-600 transition-colors">
                              <RiAddLine size={14} className="text-white" />
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => addToCart(product)} className="flex-shrink-0 w-9 h-9 rounded-full bg-rose-500 flex items-center justify-center hover:bg-rose-600 transition-colors shadow-sm shadow-rose-200">
                            <RiAddLine size={18} className="text-white" />
                          </button>
                        )}
                      </div>

                      {cartItem && (
                        <div className="rounded-2xl bg-rose-50/40 border border-rose-100 p-3 space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-bold text-rose-700 uppercase tracking-wide">Personalizar ramo</p>
                            <span className="text-[11px] text-rose-500 font-semibold">
                              {getBouquetSummary(cartItem.customization).label}
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            {(["REDUCED", "STANDARD", "ENLARGED"] as const).map((size) => (
                              <button
                                key={size}
                                type="button"
                                onClick={() => setBouquetSize(product.id, size)}
                                className={`rounded-xl px-3 py-2 text-[11px] font-semibold border transition-all ${
                                  (size === "REDUCED" && cartItem.customization.sizeModes.reduced) ||
                                  (size === "ENLARGED" && cartItem.customization.sizeModes.enlarged) ||
                                  (size === "STANDARD" && !cartItem.customization.sizeModes.reduced && !cartItem.customization.sizeModes.enlarged)
                                    ? "bg-rose-500 text-white border-rose-500"
                                    : "bg-white text-gray-600 border-gray-200 hover:border-rose-300"
                                }`}
                              >
                                {size === "REDUCED" ? "Reducido" : size === "STANDARD" ? "Normal" : "Agrandado"}
                              </button>
                            ))}
                          </div>

                          <div className="rounded-2xl border border-rose-100 bg-rose-50/60 px-3 py-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-rose-500">Detalle</p>
                            {getBouquetSummary(cartItem.customization).chips.decreased.length > 0 ? (
                              <div className="mt-2 rounded-xl border border-rose-100 bg-white/80 px-3 py-1.5">
                                <p className="text-[10px] font-black uppercase tracking-widest text-rose-500">Reducido</p>
                                <p className="mt-1 text-[13px] font-semibold leading-snug text-gray-900">
                                  {`Quitaste ${formatNames(getBouquetSummary(cartItem.customization).chips.decreased)}`}
                                </p>
                                <div className="mt-1.5 flex flex-wrap gap-1.5">
                                  {getBouquetSummary(cartItem.customization).chips.decreased.map((flower) => (
                                    <span key={flower.id} className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-600">
                                      - {flower.name} x{flower.baseQuantity - flower.quantity}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ) : null}
                            {getBouquetSummary(cartItem.customization).chips.increased.length > 0 ? (
                              <div className="mt-2 rounded-xl border border-green-100 bg-white/80 px-3 py-1.5">
                                <p className="text-[10px] font-black uppercase tracking-widest text-green-600">Agrandado</p>
                                <p className="mt-1 text-[13px] font-semibold leading-snug text-gray-900">
                                  {`Aumentaste ${formatNames(getBouquetSummary(cartItem.customization).chips.increased)}`}
                                </p>
                                <div className="mt-1.5 flex flex-wrap gap-1.5">
                                  {getBouquetSummary(cartItem.customization).chips.increased.map((flower) => (
                                    <span key={flower.id} className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                                      + {flower.name} x{flower.quantity - flower.baseQuantity}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ) : null}
                            {getBouquetSummary(cartItem.customization).chips.added.length > 0 ? (
                              <div className="mt-2 rounded-xl border border-primary-100 bg-white/80 px-3 py-1.5">
                                <p className="text-[10px] font-black uppercase tracking-widest text-primary-600">Flores nuevas</p>
                                <p className="mt-1 text-[13px] font-semibold leading-snug text-gray-900">
                                  {`Agregaste ${formatNames(getBouquetSummary(cartItem.customization).chips.added)}`}
                                </p>
                                <div className="mt-1.5 flex flex-wrap gap-1.5">
                                  {getBouquetSummary(cartItem.customization).chips.added.map((flower) => (
                                    <span key={flower.id} className="rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-semibold text-primary-700">
                                      + {flower.name} x{flower.quantity}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ) : null}
                            {getBouquetSummary(cartItem.customization).chips.increased.length === 0 &&
                              getBouquetSummary(cartItem.customization).chips.decreased.length === 0 &&
                              getBouquetSummary(cartItem.customization).chips.added.length === 0 && (
                                <p className="mt-2 text-[12px] font-medium leading-snug text-gray-500">Sin cambios todavía. Usa los chips para editar el ramo.</p>
                              )}
                          </div>

                          <div className="space-y-2">
                            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                              Flores del ramo
                            </p>
                            {cartItem.customization.baseFlowers.length > 0 ? (
                              cartItem.customization.baseFlowers.map((flower) => {
                                return (
                                  <div key={flower.id} className="flex items-center justify-between gap-2 bg-white rounded-xl border border-gray-200 px-3 py-2">
                                    <div className="min-w-0">
                                      <p className="text-sm font-semibold text-gray-900 truncate">{flower.name}</p>
                                      <p className="text-[11px] text-gray-400">
                                        Base: {flower.baseQuantity}
                                        {flower.quantity > flower.baseQuantity
                                          ? " · aumentada"
                                          : flower.quantity < flower.baseQuantity
                                            ? " · reducida"
                                            : " · ajustable"}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => updateBaseFlowerQty(product.id, flower.id, -1)}
                                        disabled={flower.quantity <= 0}
                                        className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors disabled:opacity-40"
                                      >
                                        <RiSubtractLine size={12} className="text-gray-600" />
                                      </button>
                                      <span className="w-5 text-center text-sm font-bold text-gray-900">{flower.quantity}</span>
                                      <button
                                        type="button"
                                        onClick={() => updateBaseFlowerQty(product.id, flower.id, 1)}
                                        className="w-7 h-7 rounded-full bg-rose-500 flex items-center justify-center hover:bg-rose-600 transition-colors disabled:opacity-40"
                                      >
                                        <RiAddLine size={12} className="text-white" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <p className="text-[11px] text-gray-400">Este ramo no tiene flores asociadas registradas.</p>
                            )}
                          </div>

                          {cartItem.customization.sizeModes.enlarged && flowers.length > 0 && (
                            <div>
                              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-2">
                                Agregar flores registradas
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {flowers.map((flower) => {
                                  const selected = cartItem.customization.extraFlowers.find((f) => f.id === flower.id);
                                  return (
                                    <button
                                      key={flower.id}
                                      type="button"
                                      onClick={() => toggleExtraFlower(product.id, flower)}
                                      className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all ${
                                        selected
                                          ? "bg-rose-500 border-rose-500 text-white"
                                          : "bg-white border-gray-200 text-gray-600 hover:border-rose-300"
                                      }`}
                                    >
                                      {flower.name}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {cartItem.customization.extraFlowers.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Flores agregadas</p>
                              {cartItem.customization.extraFlowers.map((flower) => (
                                <div key={flower.id} className="flex items-center justify-between gap-2 bg-white rounded-xl border border-gray-200 px-3 py-2">
                                  <div className="min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 truncate">{flower.name}</p>
                                    <p className="text-[11px] text-gray-400">Registro del sistema</p>
                                  </div>
                                  <div className="flex items-center gap-1.5 flex-shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => updateExtraFlowerQty(product.id, flower.id, -1)}
                                      className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                                    >
                                      <RiSubtractLine size={12} className="text-gray-600" />
                                    </button>
                                    <span className="w-5 text-center text-sm font-bold text-gray-900">{flower.quantity}</span>
                                    <button
                                      type="button"
                                      onClick={() => updateExtraFlowerQty(product.id, flower.id, 1)}
                                      className="w-7 h-7 rounded-full bg-rose-500 flex items-center justify-center hover:bg-rose-600 transition-colors"
                                    >
                                      <RiAddLine size={12} className="text-white" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          <p className="text-[11px] leading-relaxed text-gray-500">
                            Ahora puedes hacer ajustes mixtos: aumentar unas flores, reducir otras y agregar flores nuevas en el mismo ramo.
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {cart.length > 0 && addons.length > 0 && (
              <div className="rounded-3xl border border-gray-100 bg-white p-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Complementos</p>
                <div className="space-y-3">
                  {cart.map((c) => (
                    <div key={c.product.id}>
                      <p className="text-xs font-semibold text-gray-700 mb-1.5">{c.product.name}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {addons.filter((a) => a.inStock).map((addon) => {
                          const selected = c.addons.find((a) => a.id === addon.id);
                          return (
                            <button
                              key={addon.id}
                              onClick={() => toggleAddon(c.product.id, addon)}
                              className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all ${
                                selected
                                  ? "bg-rose-500 border-rose-500 text-white"
                                  : "bg-white border-gray-200 text-gray-600 hover:border-rose-300"
                              }`}
                            >
                              {addon.name} +{formatPrice(addon.price)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
              <h3 className="font-semibold text-lg mb-4">Observaciones del pedido</h3>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Color de rosas, cambios, sustituciones o instrucciones especiales..."
                className="w-full min-h-[120px] resize-y border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
              />
              <p className="text-xs text-gray-400 mt-2">
                Úsalo para dejar indicaciones como color de rosas, reemplazos o cualquier ajuste del pedido.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
              <h3 className="font-semibold text-lg mb-4">Ajuste manual</h3>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">
                Ajuste al total
              </label>
              <input
                type="number"
                value={manualAdjustment}
                onChange={(e) => setManualAdjustment(e.target.value)}
                placeholder="0"
                className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
              />
              <p className="text-xs text-gray-400 mt-2">
                Usa un valor positivo para aumentar el total o negativo para reducirlo.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <RiShoppingBagLine className="text-primary-500" /> Resumen
              </h3>
              <div className="space-y-3 mb-5">
                {cart.map((item) => (
                  <div key={item.product.id} className="flex gap-3">
                    <img src={item.product.images?.[0]?.url || ""} alt={item.product.name} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.product.name}</p>
                      <p className="text-xs text-gray-400">x{item.quantity}</p>
                      <p className="text-[11px] text-rose-500 font-semibold mt-0.5">
                        {getBouquetSummary(item.customization).label}
                        {getBouquetSummary(item.customization).detail !== "Sin cambios"
                          ? ` · ${getBouquetSummary(item.customization).detail}`
                          : ""}
                      </p>
                      <p className="text-[11px] text-emerald-600 mt-0.5">
                        Entrega: {formatDeliveryLeadDays(item.product.deliveryLeadDays || 0)}
                      </p>
                    </div>
                    <p className="font-medium text-sm">
                      {formatPrice(item.price * item.quantity + item.addons.reduce((s, a) => s + a.price, 0) * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>
              <div className="border-t pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span className="flex items-center gap-1.5"><RiShoppingBagLine size={14} /> Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span className="flex items-center gap-1.5"><RiLinkM size={14} /> Domicilio</span>
                  <span>{formatPrice(deliveryFee)}</span>
                </div>
                {manualAdjustmentValue !== 0 && (
                  <div className="flex justify-between text-gray-500">
                    <span className="flex items-center gap-1.5">Ajuste manual</span>
                    <span className={manualAdjustmentValue > 0 ? "text-green-600" : "text-red-600"}>
                      {manualAdjustmentValue > 0 ? "+" : ""}
                      {formatPrice(manualAdjustmentValue)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total</span><span className="text-primary-600">{formatPrice(total)}</span>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
                <RiCheckLine size={14} /> El cliente completará sus datos y subirá el comprobante en checkout
              </div>
              {error && <div className="mt-3 rounded-2xl bg-red-50 border border-red-200 p-3 text-sm text-red-600">{error}</div>}
            </div>
          </div>
        </div>
      </div>

        <div className="absolute inset-x-0 bottom-0 z-20 bg-white border-t border-gray-100 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] shadow-[0_-8px_24px_rgba(15,23,42,0.04)] sm:px-6 sm:pt-4">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || cart.length === 0}
            className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white py-4 rounded-full font-semibold hover:bg-primary-700 disabled:opacity-50 transition-all shadow-lg shadow-primary-600/20"
          >
            {submitting ? "Generando link..." : "Generar link de pago"}
            {!submitting && <RiLinkM size={18} />}
          </button>
        </div>
      </div>
      )}
    </ResponsiveModal>
  );
}
