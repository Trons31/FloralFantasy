"use client";

import { useEffect, useMemo, useState } from "react";
import {
  RiCloseLine,
  RiSearchLine,
  RiAddLine,
  RiSubtractLine,
  RiShoppingBagLine,
  RiLoaderLine,
  RiCheckLine,
  RiLinkM,
  RiSaveLine,
} from "react-icons/ri";
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

type CartItem = {
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
};

type OrderItem = {
  quantity: number;
  price: number;
  addons: { id: string; addon: Addon }[];
  customization?: {
    bouquetSize?: "STANDARD" | "ENLARGED" | "REDUCED";
    sizeModes?: {
      reduced?: boolean;
      enlarged?: boolean;
    };
    baseFlowers?: { id: string; name: string; baseQuantity: number; quantity: number }[];
    extraFlowers?: { id: string; name: string; quantity: number }[];
  } | null;
  product: Product;
};

type OrderDetail = {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  address: string;
  addressRef?: string | null;
  total: number;
  deliveryFee: number;
  manualAdjustment: number;
  adminNote?: string | null;
  paymentMethodId?: string | null;
  items: OrderItem[];
};

function buildBaseFlowers(product: Product) {
  return (product.flowers || []).map(({ flower, quantity }) => ({
    id: flower.id,
    name: flower.name,
    baseQuantity: quantity || 1,
    quantity: quantity || 1,
  }));
}

function deriveSizeModes(customization: OrderItem["customization"], baseFlowers: { baseQuantity: number; quantity: number }[]) {
  const reduced = Boolean(customization?.sizeModes?.reduced) || baseFlowers.some((flower) => flower.quantity < flower.baseQuantity);
  const enlarged =
    Boolean(customization?.sizeModes?.enlarged) ||
    baseFlowers.some((flower) => flower.quantity > flower.baseQuantity) ||
    Boolean(customization?.extraFlowers?.length);

  return { reduced, enlarged };
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

  if (hasIncrease) detailParts.push(`agrandaste ${formatNames(increased)}`);
  if (hasDecrease) detailParts.push(`redujiste ${formatNames(decreased)}`);
  if (hasExtraFlowers) detailParts.push(`agregaste ${formatNames(added)}`);

  if (isMixed) {
    return {
      label: "Mixto",
      detail: detailParts.join(" · "),
      chips: { increased, decreased, added },
      storedSize: "STANDARD" as const,
    };
  }

  if (hasIncrease || hasExtraFlowers) {
    return {
      label: "Agrandado",
      detail: detailParts.join(" · "),
      chips: { increased, decreased, added },
      storedSize: "ENLARGED" as const,
    };
  }

  if (hasDecrease) {
    return {
      label: "Reducido",
      detail: detailParts.join(" · "),
      chips: { increased, decreased, added },
      storedSize: "REDUCED" as const,
    };
  }

  return {
    label: "Normal",
    detail: "Sin cambios",
    chips: { increased, decreased, added },
    storedSize: "STANDARD" as const,
  };
}

function buildCartFromOrder(order: OrderDetail): CartItem[] {
  return order.items.map((item) => {
    const product = item.product;
    const customization = item.customization;
    const baseFlowers =
      customization?.baseFlowers?.length
        ? customization.baseFlowers
        : buildBaseFlowers(product);

    return {
      product,
      quantity: Math.max(1, item.quantity || 1),
      price: item.price || product.price,
      addons: (item.addons || []).map((a) => a.addon),
      // Preserve the current editing state even when the order does not have explicit mode flags.
      customization: {
        bouquetSize: customization?.bouquetSize || "STANDARD",
        sizeModes: deriveSizeModes(customization, baseFlowers),
        baseFlowers,
        extraFlowers: customization?.extraFlowers || [],
      },
    };
  });
}

export default function EditOrderModal({
  open,
  orderId,
  onClose,
  onSaved,
}: {
  open: boolean;
  orderId: string | null;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [flowers, setFlowers] = useState<Flower[]>([]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [deliveryFee, setDeliveryFee] = useState(DEFAULT_DELIVERY_FEE);
  const [adminNote, setAdminNote] = useState("");
  const [manualAdjustment, setManualAdjustment] = useState("");
  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    addressRef: "",
  });

  useEffect(() => {
    if (!open || !orderId) {
      setOrder(null);
      setCart([]);
      setError("");
      setSearch("");
      setAdminNote("");
      setManualAdjustment("");
      setCustomer({ name: "", phone: "", email: "", address: "", addressRef: "" });
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError("");

    Promise.all([
      fetch(`/api/orders/${orderId}`).then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "No fue posible cargar el pedido");
        return data as OrderDetail;
      }),
      fetch("/api/products").then((r) => r.json()),
      fetch("/api/addons").then((r) => r.json()),
      fetch("/api/flowers").then((r) => r.json()),
      fetch("/api/settings").then((r) => r.json()).catch(() => ({})),
    ])
      .then(([orderData, prods, ads, fls, settings]) => {
        if (cancelled) return;
        const normalizedProducts = Array.isArray(prods) ? prods : prods.products ?? [];
        const normalizedAddons = Array.isArray(ads) ? ads : ads.addons ?? [];
        const normalizedFlowers = Array.isArray(fls) ? fls : [];

        setOrder(orderData);
        setProducts(normalizedProducts);
        setAddons(normalizedAddons);
        setFlowers(normalizedFlowers);
        setCart(buildCartFromOrder(orderData));
        setDeliveryFee(typeof settings?.deliveryFee === "number" ? settings.deliveryFee : orderData.deliveryFee || DEFAULT_DELIVERY_FEE);
        setAdminNote(orderData.adminNote || "");
        setManualAdjustment(String(orderData.manualAdjustment || 0));
        setCustomer({
          name: orderData.customerName || "",
          phone: orderData.customerPhone || "",
          email: orderData.customerEmail || "",
          address: orderData.address || "",
          addressRef: orderData.addressRef || "",
        });
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message || "No fue posible cargar el pedido");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, orderId]);

  const filteredProducts = useMemo(
    () =>
      products.filter(
        (product) =>
          product.name.toLowerCase().includes(search.toLowerCase()) ||
          (product.occasion ?? "").toLowerCase().includes(search.toLowerCase())
      ),
    [products, search]
  );

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }

      return [
        ...prev,
        {
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
      },
      ];
    });
  };

  const updateQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => (item.product.id === productId ? { ...item, quantity: item.quantity + delta } : item))
        .filter((item) => item.quantity > 0)
    );
  };

  const toggleAddon = (productId: string, addon: Addon) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id !== productId) return item;
        const has = item.addons.find((a) => a.id === addon.id);
        return { ...item, addons: has ? item.addons.filter((a) => a.id !== addon.id) : [...item.addons, addon] };
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
      prev.map((item) => {
        if (item.product.id !== productId) return item;
        const exists = item.customization.extraFlowers.find((f) => f.id === flower.id);
        const nextExtraFlowers = exists
          ? item.customization.extraFlowers.filter((f) => f.id !== flower.id)
          : [...item.customization.extraFlowers, { id: flower.id, name: flower.name, quantity: 1 }];
        return { ...item, customization: { ...item.customization, extraFlowers: nextExtraFlowers } };
      })
    );
  };

  const updateExtraFlowerQty = (productId: string, flowerId: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id !== productId) return item;
        const nextExtraFlowers = item.customization.extraFlowers
          .map((flower) => (flower.id === flowerId ? { ...flower, quantity: flower.quantity + delta } : flower))
          .filter((flower) => flower.quantity > 0);
        return { ...item, customization: { ...item.customization, extraFlowers: nextExtraFlowers } };
      })
    );
  };

  const updateBaseFlowerQty = (productId: string, flowerId: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id !== productId) return item;
        const nextBaseFlowers = item.customization.baseFlowers.map((flower) => {
          if (flower.id !== flowerId) return flower;
          const proposed = flower.quantity + delta;
          return { ...flower, quantity: Math.max(0, proposed) };
        });
        return { ...item, customization: { ...item.customization, baseFlowers: nextBaseFlowers } };
      })
    );
  };

  const subtotal = cart.reduce(
    (acc, item) => acc + item.price * item.quantity + item.addons.reduce((sum, addon) => sum + addon.price, 0) * item.quantity,
    0
  );
  const maxDeliveryDays = cart.reduce((max, item) => Math.max(max, item.product.deliveryLeadDays || 0), 0);
  const manualAdjustmentValue = Number(manualAdjustment || 0);
  const total = subtotal + deliveryFee + manualAdjustmentValue;

  const handleSave = async () => {
    if (!order) return;
    if (!customer.name.trim() || !customer.phone.trim() || !customer.address.trim()) {
      toast.error("Cliente, teléfono y dirección son requeridos");
      return;
    }
    if (cart.length === 0) {
      toast.error("Agrega al menos un producto");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customer.name,
          customerPhone: customer.phone,
          customerEmail: customer.email,
          address: customer.address,
          addressRef: customer.addressRef,
          items: cart.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
            price: item.price,
            addons: item.addons,
            customization: {
              ...item.customization,
              bouquetSize: getBouquetSummary(item.customization).storedSize,
            },
          })),
          deliveryFee,
          manualAdjustment: manualAdjustmentValue,
          adminNote,
          paymentMethodId: order.paymentMethodId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No fue posible actualizar el pedido");

      toast.success("Pedido actualizado");
      onSaved?.();
      onClose();
    } catch (e: any) {
      setError(e.message || "No fue posible actualizar el pedido");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ResponsiveModal
      open={open}
      onClose={onClose}
      title="Editar pedido"
      description="Ajusta los datos del cliente, la dirección y los productos del pedido."
      panelClassName="md:max-w-5xl"
    >
      {loading ? (
        <div className="flex justify-center py-20">
          <RiLoaderLine className="animate-spin text-primary-500" size={30} />
        </div>
      ) : error && !order ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">{error}</div>
      ) : order ? (
        <div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
          <div className="space-y-4">
            <div className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Información del cliente</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Nombre completo *</label>
                  <input
                    value={customer.name}
                    onChange={(e) => setCustomer((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Teléfono *</label>
                  <input
                    value={customer.phone}
                    onChange={(e) => setCustomer((prev) => ({ ...prev, phone: e.target.value }))}
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Email</label>
                  <input
                    value={customer.email}
                    onChange={(e) => setCustomer((prev) => ({ ...prev, email: e.target.value }))}
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Dirección *</label>
                  <input
                    value={customer.address}
                    onChange={(e) => setCustomer((prev) => ({ ...prev, address: e.target.value }))}
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Referencia</label>
                  <input
                    value={customer.addressRef}
                    onChange={(e) => setCustomer((prev) => ({ ...prev, addressRef: e.target.value }))}
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-gray-900">Productos</h3>
                <span className="text-xs text-gray-400">{cart.length} producto{cart.length !== 1 ? "s" : ""}</span>
              </div>

              <div className="rounded-3xl bg-gray-50 border border-gray-100 p-4 mb-4">
                <div className="relative">
                  <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar productos..."
                    className="w-full rounded-2xl border border-gray-200 bg-white py-3 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                  />
                </div>
              </div>

              <div className="max-h-[48vh] space-y-2 overflow-y-auto pr-1">
                {filteredProducts.map((product) => {
                  const cartItem = cart.find((item) => item.product.id === product.id);
                  const img = product.images?.find((image) => image.isMain)?.url ?? product.images?.[0]?.url;
                  return (
                    <div key={product.id} className="space-y-3 rounded-2xl border border-gray-100 bg-gray-50 p-3">
                      <div className="flex items-center gap-3">
                        {img ? (
                          <img src={img} alt={product.name} className="h-14 w-14 rounded-xl object-cover" />
                        ) : (
                          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white">
                            <RiShoppingBagLine className="text-gray-300" size={20} />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-gray-900">{product.name}</p>
                          <p className="text-xs text-gray-400">{formatPrice(product.price)}</p>
                        </div>
                        {cartItem ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => updateQty(product.id, -1)}
                              className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-gray-500 shadow-sm"
                            >
                              <RiSubtractLine size={13} />
                            </button>
                            <span className="w-5 text-center text-sm font-bold text-gray-900">{cartItem.quantity}</span>
                            <button
                              type="button"
                              onClick={() => updateQty(product.id, 1)}
                              className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-500 text-white shadow-sm"
                            >
                              <RiAddLine size={13} />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => addToCart(product)}
                            className="rounded-full bg-primary-500 px-3 py-1.5 text-xs font-semibold text-white"
                          >
                            Agregar
                          </button>
                        )}
                      </div>

                      {cartItem && (
                        <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-3">
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
                                    ? "border-primary-500 bg-primary-500 text-white"
                                    : "border-gray-200 bg-white text-gray-600"
                                }`}
                              >
                                {size === "REDUCED" ? "Reducido" : size === "STANDARD" ? "Normal" : "Agrandado"}
                              </button>
                            ))}
                          </div>

                          <div className="rounded-2xl border border-primary-100 bg-primary-50/60 px-3 py-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-primary-500">Detalle</p>
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
                            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Flores base</p>
                            {cartItem.customization.baseFlowers.map((flower) => (
                              <div key={flower.id} className="flex items-center justify-between gap-2 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold text-gray-900">{flower.name}</p>
                                  <p className="text-[11px] text-gray-400">Base: {flower.baseQuantity}</p>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => updateBaseFlowerQty(product.id, flower.id, -1)}
                                    className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-gray-500 shadow-sm"
                                  >
                                    <RiSubtractLine size={12} />
                                  </button>
                                  <span className="w-5 text-center text-sm font-bold text-gray-900">{flower.quantity}</span>
                                  <button
                                    type="button"
                                    onClick={() => updateBaseFlowerQty(product.id, flower.id, 1)}
                                    className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-500 text-white shadow-sm"
                                  >
                                    <RiAddLine size={12} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>

                          {cartItem.customization.sizeModes.enlarged && flowers.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Flores adicionales</p>
                              <div className="flex flex-wrap gap-1.5">
                                {flowers.map((flower) => {
                                  const selected = cartItem.customization.extraFlowers.find((f) => f.id === flower.id);
                                  return (
                                    <button
                                      key={flower.id}
                                      type="button"
                                      onClick={() => toggleExtraFlower(product.id, flower)}
                                      className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${
                                        selected
                                          ? "border-primary-500 bg-primary-500 text-white"
                                          : "border-gray-200 bg-white text-gray-600"
                                      }`}
                                    >
                                      {flower.name}
                                    </button>
                                  );
                                })}
                              </div>

                              {cartItem.customization.extraFlowers.length > 0 && (
                                <div className="space-y-2">
                                  {cartItem.customization.extraFlowers.map((flower) => (
                                    <div key={flower.id} className="flex items-center justify-between gap-2 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
                                      <span className="text-sm font-medium text-gray-900">{flower.name}</span>
                                      <div className="flex items-center gap-1.5">
                                        <button
                                          type="button"
                                          onClick={() => updateExtraFlowerQty(product.id, flower.id, -1)}
                                          className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-gray-500 shadow-sm"
                                        >
                                          <RiSubtractLine size={12} />
                                        </button>
                                        <span className="w-5 text-center text-sm font-bold text-gray-900">{flower.quantity}</span>
                                        <button
                                          type="button"
                                          onClick={() => updateExtraFlowerQty(product.id, flower.id, 1)}
                                          className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-500 text-white shadow-sm"
                                        >
                                          <RiAddLine size={12} />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          <p className="text-[11px] leading-relaxed text-gray-500">
                            Ahora puedes hacer ajustes mixtos: aumentar unas flores, reducir otras y agregar flores nuevas en el mismo ramo.
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">Resumen</h3>
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.product.id} className="flex gap-3">
                    <img
                      src={item.product.images?.[0]?.url || ""}
                      alt={item.product.name}
                      className="h-14 w-14 flex-shrink-0 rounded-xl object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">{item.product.name}</p>
                      <p className="text-xs text-gray-400">x{item.quantity}</p>
                      <p className="text-[11px] text-primary-600 font-semibold mt-0.5">
                        {getBouquetSummary(item.customization).label}
                        {getBouquetSummary(item.customization).detail !== "Sin cambios"
                          ? ` · ${getBouquetSummary(item.customization).detail}`
                          : ""}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 border-t border-gray-100 pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span className="flex items-center gap-1.5"><RiShoppingBagLine size={14} /> Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span className="flex items-center gap-1.5"><RiLinkM size={14} /> Domicilio</span>
                  <span>{formatPrice(deliveryFee)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Ajuste manual</span>
                  <span className={manualAdjustmentValue > 0 ? "text-green-600" : manualAdjustmentValue < 0 ? "text-red-600" : ""}>
                    {manualAdjustmentValue > 0 ? "+" : ""}
                    {formatPrice(manualAdjustmentValue)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-gray-100 pt-2 text-lg font-bold text-gray-900">
                  <span>Total</span>
                  <span className="text-primary-600">{formatPrice(total)}</span>
                </div>
                <p className="text-xs text-gray-400">
                  Entrega estimada: {formatDeliveryLeadDays(maxDeliveryDays)}
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
              <label className="mb-2 block text-sm font-semibold text-gray-900">Observaciones</label>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                className="min-h-[120px] w-full resize-y rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                placeholder="Cambios, sustituciones o instrucciones especiales..."
              />
            </div>

            {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>}

            <div className="sticky bottom-0 rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary-600 px-4 py-3.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
              >
                {saving ? <RiLoaderLine className="animate-spin" size={16} /> : <RiSaveLine size={16} />}
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
              <p className="mt-2 text-center text-xs text-gray-400">
                El pedido se actualizará conservando su estado actual.
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </ResponsiveModal>
  );
}
