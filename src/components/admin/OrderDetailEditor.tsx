"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  RiAddLine,
  RiArrowLeftLine,
  RiBankCardLine,
  RiCheckLine,
  RiCheckboxCircleLine,
  RiDeleteBinLine,
  RiFileList3Line,
  RiFlowerLine,
  RiHistoryLine,
  RiLoader4Line,
  RiMapPin2Line,
  RiImage2Line,
  RiSaveLine,
  RiSearchLine,
  RiShoppingBag3Line,
  RiSubtractLine,
  RiTruckLine,
  RiUser3Line,
  RiWhatsappLine,
} from "react-icons/ri";
import { formatDeliveryLeadDays, formatPrice, STATUS_LABELS } from "@/lib/utils";

type Addon = { id: string; name: string; price: number; inStock: boolean; type?: string };
type Flower = { id: string; name: string; type: string };
type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  deliveryLeadDays?: number;
  images: Array<{ url: string; isMain: boolean }>;
  flowers?: Array<{ flower: Flower; quantity: number }>;
};
type Size = "STANDARD" | "REDUCED" | "ENLARGED";
type EditorItem = {
  key: string;
  product: Product;
  quantity: number;
  price: number;
  addons: Addon[];
  customization: {
    bouquetSize: Size;
    sizeModes: { reduced: boolean; enlarged: boolean };
    baseFlowers: Array<{ id: string; name: string; baseQuantity: number; quantity: number }>;
    extraFlowers: Array<{ id: string; name: string; quantity: number }>;
  };
};

const FLOW_STATUSES = [
  "PENDING_PAYMENT_CONFIRMATION",
  "PAID",
  "PROCESSING",
  "READY",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

const flowLabel: Record<string, string> = {
  PENDING_PAYMENT_CONFIRMATION: "Pedido recibido",
  PAID: "Pago confirmado",
  PROCESSING: "Preparando flores",
  READY: "Pedido listo",
  OUT_FOR_DELIVERY: "En camino",
  DELIVERED: "Entregado",
};

const imageOf = (product: Product) =>
  product.images?.find(image => image.isMain)?.url || product.images?.[0]?.url || "";

const baseFlowersOf = (product: Product) => (product.flowers || []).map(item => ({
  id: item.flower.id,
  name: item.flower.name,
  baseQuantity: item.quantity || 1,
  quantity: item.quantity || 1,
}));

function normalizeItems(order: any): EditorItem[] {
  return (order.items || []).map((item: any, index: number) => {
    const stored = item.customization || {};
    const baseFlowers = stored.baseFlowers?.length ? stored.baseFlowers : baseFlowersOf(item.product);
    const inferredSize: Size = stored.bouquetSize ||
      (stored.extraFlowers?.length ? "ENLARGED" : baseFlowers.some((flower: any) => flower.quantity < flower.baseQuantity) ? "REDUCED" : "STANDARD");
    return {
      key: item.id || `${item.product.id}-${index}`,
      product: item.product,
      quantity: Math.max(1, item.quantity || 1),
      price: item.price || item.product.price,
      addons: (item.addons || []).map((entry: any) => entry.addon),
      customization: {
        bouquetSize: inferredSize,
        sizeModes: { reduced: inferredSize === "REDUCED", enlarged: inferredSize === "ENLARGED" },
        baseFlowers,
        extraFlowers: stored.extraFlowers || [],
      },
    };
  });
}

export default function OrderDetailEditor({ initialOrder }: { initialOrder: any }) {
  const router = useRouter();
  const [order, setOrder] = useState(initialOrder);
  const [items, setItems] = useState<EditorItem[]>(() => normalizeItems(initialOrder));
  const [products, setProducts] = useState<Product[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [flowers, setFlowers] = useState<Flower[]>([]);
  const [search, setSearch] = useState("");
  const [showProducts, setShowProducts] = useState(false);
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [customer, setCustomer] = useState({
    name: initialOrder.customerName || "",
    phone: initialOrder.customerPhone || "",
    email: initialOrder.customerEmail || "",
    address: initialOrder.address || "",
    addressRef: initialOrder.addressRef || "",
  });
  const [deliveryFee, setDeliveryFee] = useState(String(initialOrder.deliveryFee || 0));
  const [manualAdjustment, setManualAdjustment] = useState(String(initialOrder.manualAdjustment || 0));
  const [adminNote, setAdminNote] = useState(initialOrder.adminNote || "");

  useEffect(() => {
    Promise.all([
      fetch("/api/products").then(response => response.json()),
      fetch("/api/addons").then(response => response.json()),
      fetch("/api/flowers").then(response => response.json()),
    ]).then(([productData, addonData, flowerData]) => {
      setProducts(Array.isArray(productData) ? productData : productData.products || []);
      setAddons(Array.isArray(addonData) ? addonData : addonData.addons || []);
      setFlowers(Array.isArray(flowerData) ? flowerData : []);
    }).catch(() => toast.error("No fue posible cargar el catálogo de edición"));
  }, []);

  const filteredProducts = useMemo(
    () => products.filter(product => product.name.toLowerCase().includes(search.toLowerCase())),
    [products, search]
  );
  const subtotal = items.reduce((sum, item) =>
    sum + (item.price + item.addons.reduce((addonSum, addon) => addonSum + addon.price, 0)) * item.quantity, 0);
  const delivery = Math.max(0, Number(deliveryFee) || 0);
  const adjustment = Number(manualAdjustment) || 0;
  const total = subtotal + delivery + adjustment;
  const maxDeliveryDays = items.reduce((max, item) => Math.max(max, item.product.deliveryLeadDays || 0), 0);
  const paid = ["PAID", "PROCESSING", "READY", "OUT_FOR_DELIVERY", "DELIVERED"].includes(order.status);
  const whatsapp = customer.phone ? `https://wa.me/${customer.phone.replace(/\D/g, "")}` : "";

  const updateItem = (key: string, update: (item: EditorItem) => EditorItem) =>
    setItems(current => current.map(item => item.key === key ? update(item) : item));

  const addProduct = (product: Product) => {
    setItems(current => {
      const existing = current.find(item => item.product.id === product.id);
      if (existing) return current.map(item => item.key === existing.key ? { ...item, quantity: item.quantity + 1 } : item);
      return [...current, {
        key: `${product.id}-${Date.now()}`,
        product,
        quantity: 1,
        price: product.price,
        addons: [],
        customization: {
          bouquetSize: "STANDARD",
          sizeModes: { reduced: false, enlarged: false },
          baseFlowers: baseFlowersOf(product),
          extraFlowers: [],
        },
      }];
    });
    setShowProducts(false);
  };

  const changeQuantity = (key: string, delta: number) =>
    setItems(current => current
      .map(item => item.key === key ? { ...item, quantity: item.quantity + delta } : item)
      .filter(item => item.quantity > 0));

  const setSize = (key: string, size: Size) => updateItem(key, item => ({
    ...item,
    customization: {
      ...item.customization,
      bouquetSize: size,
      sizeModes: { reduced: size === "REDUCED", enlarged: size === "ENLARGED" },
      baseFlowers: item.customization.baseFlowers.map(flower => ({
        ...flower,
        quantity: size === "REDUCED" ? Math.min(flower.quantity, flower.baseQuantity) : flower.baseQuantity,
      })),
      extraFlowers: size === "ENLARGED" ? item.customization.extraFlowers : [],
    },
  }));

  const changeBaseFlower = (key: string, flowerId: string, delta: number) => updateItem(key, item => {
    if (item.customization.bouquetSize !== "REDUCED") return item;
    return {
      ...item,
      customization: {
        ...item.customization,
        baseFlowers: item.customization.baseFlowers.map(flower =>
          flower.id === flowerId
            ? { ...flower, quantity: Math.max(0, Math.min(flower.baseQuantity, flower.quantity + delta)) }
            : flower
        ),
      },
    };
  });

  const toggleAddon = (key: string, addon: Addon) => updateItem(key, item => ({
    ...item,
    addons: item.addons.some(entry => entry.id === addon.id)
      ? item.addons.filter(entry => entry.id !== addon.id)
      : [...item.addons, addon],
  }));

  const toggleExtraFlower = (key: string, flower: Flower) => updateItem(key, item => {
    if (item.customization.bouquetSize !== "ENLARGED") return item;
    const selected = item.customization.extraFlowers.some(entry => entry.id === flower.id);
    return {
      ...item,
      customization: {
        ...item.customization,
        extraFlowers: selected
          ? item.customization.extraFlowers.filter(entry => entry.id !== flower.id)
          : [...item.customization.extraFlowers, { id: flower.id, name: flower.name, quantity: 1 }],
      },
    };
  });

  const changeExtraFlower = (key: string, flowerId: string, delta: number) => updateItem(key, item => ({
    ...item,
    customization: {
      ...item.customization,
      extraFlowers: item.customization.extraFlowers
        .map(flower => flower.id === flowerId ? { ...flower, quantity: flower.quantity + delta } : flower)
        .filter(flower => flower.quantity > 0),
    },
  }));

  const saveSection = async (section: string, successMessage: string) => {
    if (!customer.name.trim() || !customer.phone.trim() || !customer.address.trim()) {
      toast.error("Cliente, teléfono y dirección son requeridos");
      return;
    }
    if (!items.length) {
      toast.error("El pedido debe contener al menos un producto");
      return;
    }
    setSavingSection(section);
    try {
      const response = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customer.name,
          customerPhone: customer.phone,
          customerEmail: customer.email,
          address: customer.address,
          addressRef: customer.addressRef,
          deliveryFee: delivery,
          manualAdjustment: adjustment,
          adminNote,
          paymentMethodId: order.paymentMethodId || null,
          items: items.map(item => ({
            productId: item.product.id,
            quantity: item.quantity,
            price: item.price,
            addons: item.addons,
            customization: item.customization,
          })),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No fue posible actualizar la información");
      setOrder(data);
      setItems(normalizeItems(data));
      toast.success(successMessage);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "No fue posible actualizar la información");
    } finally {
      setSavingSection(null);
    }
  };

  const changeStatus = async (status: string) => {
    setUpdatingStatus(true);
    try {
      const response = await fetch(`/api/orders/${order.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No fue posible actualizar el estado");
      const refreshedResponse = await fetch(`/api/orders/${order.id}`);
      const refreshed = await refreshedResponse.json();
      if (!refreshedResponse.ok) throw new Error(refreshed.error || "No fue posible recargar el pedido");
      setOrder(refreshed);
      toast.success(`Estado actualizado: ${STATUS_LABELS[status] || status}`);
    } catch (error: any) {
      toast.error(error.message || "No fue posible actualizar el estado");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const currentFlowIndex = FLOW_STATUSES.indexOf(order.status);
  const nextStatus = currentFlowIndex >= 0 && currentFlowIndex < FLOW_STATUSES.length - 1
    ? FLOW_STATUSES[currentFlowIndex + 1]
    : order.status === "PENDING" ? "PENDING_PAYMENT_CONFIRMATION" : null;

  return (
    <div className="min-h-screen bg-[#f7f9fc] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Link href="/dashboard/todos-pedidos" className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-primary-500">
            <RiArrowLeftLine /> Volver a pedidos
          </Link>
          <div className="flex flex-wrap gap-2">
            {whatsapp && (
              <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-2 rounded-xl border border-emerald-300 bg-white px-4 text-xs font-semibold text-emerald-600">
                <RiWhatsappLine /> WhatsApp
              </a>
            )}
            {!paid && (
              <button type="button" onClick={() => changeStatus("PAID")} disabled={updatingStatus} className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-xs font-semibold text-white disabled:opacity-60">
                {updatingStatus ? <RiLoader4Line className="animate-spin" /> : <RiCheckboxCircleLine />} Validar pago
              </button>
            )}
          </div>
        </div>

        <header className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-950 sm:text-3xl">#{order.trackingToken}</h1>
              <div className="mt-4 flex flex-wrap gap-x-8 gap-y-3 text-xs text-slate-600">
                <span className="flex items-center gap-2"><RiUser3Line className="text-primary-500" />{customer.name}<strong>{customer.phone}</strong></span>
                <span className="flex items-center gap-2"><RiMapPin2Line className="text-primary-500" />{customer.address}</span>
                <span className="flex items-center gap-2"><RiTruckLine className="text-primary-500" />{order.estimatedTime}</span>
                <span className="rounded-lg bg-emerald-50 px-3 py-1.5 font-semibold text-emerald-700">{STATUS_LABELS[order.status] || order.status}</span>
                <span className={`rounded-lg px-3 py-1.5 font-semibold ${paid ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{paid ? "Pago validado" : "Pago pendiente"}</span>
              </div>
            </div>
            <div className="lg:text-right"><p className="text-xs text-slate-500">Total del pedido</p><p className="mt-1 text-3xl font-extrabold">{formatPrice(total)}</p></div>
          </div>
        </header>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="space-y-5">
            <Section
              title="Información del cliente"
              Icon={RiUser3Line}
              action={<SectionSaveButton loading={savingSection === "customer"} onClick={() => saveSection("customer", "Información del cliente actualizada")} />}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nombre completo" value={customer.name} onChange={value => setCustomer({ ...customer, name: value })} />
                <Field label="Dirección" value={customer.address} onChange={value => setCustomer({ ...customer, address: value })} />
                <Field label="Teléfono" value={customer.phone} onChange={value => setCustomer({ ...customer, phone: value })} />
                <Field label="Referencia" value={customer.addressRef} onChange={value => setCustomer({ ...customer, addressRef: value })} />
                <Field label="Email" value={customer.email} onChange={value => setCustomer({ ...customer, email: value })} />
                <div><p className="mb-1 text-[10px] text-slate-400">Entrega estimada</p><p className="h-10 pt-2 text-sm font-semibold">{formatDeliveryLeadDays(maxDeliveryDays)}</p></div>
              </div>
            </Section>

            <Section
              title="Productos"
              Icon={RiShoppingBag3Line}
              action={
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setShowProducts(current => !current)} className="text-xs font-semibold text-primary-500"><RiAddLine className="inline" /> Agregar producto</button>
                  <SectionSaveButton loading={savingSection === "products"} onClick={() => saveSection("products", "Productos y personalización actualizados")} />
                </div>
              }
            >
              {showProducts && (
                <div className="mb-4 rounded-xl border border-primary-100 bg-primary-50/40 p-3">
                  <label className="relative block"><RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar producto..." className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs outline-none" /></label>
                  <div className="mt-3 grid max-h-52 gap-2 overflow-y-auto sm:grid-cols-2">
                    {filteredProducts.map(product => (
                      <button key={product.id} type="button" onClick={() => addProduct(product)} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-2 text-left">
                        <img src={imageOf(product)} alt="" className="h-10 w-10 rounded-lg object-cover" />
                        <span className="min-w-0 flex-1"><strong className="block truncate text-xs">{product.name}</strong><small>{formatPrice(product.price)}</small></span><RiAddLine />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {items.map(item => (
                  <article key={item.key} className="rounded-2xl border border-slate-200 p-3 sm:p-4">
                    <div className="grid gap-4 sm:grid-cols-[120px_1fr]">
                      <img src={imageOf(item.product)} alt={item.product.name} className="h-28 w-full rounded-xl object-cover" />
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <div><h3 className="font-bold">{item.product.name}</h3><p className="mt-1 line-clamp-2 text-xs text-slate-500">{item.product.description}</p><p className="mt-3 font-bold">{formatPrice(item.price)}</p></div>
                          <button type="button" onClick={() => setItems(current => current.filter(entry => entry.key !== item.key))} className="text-red-400" aria-label={`Eliminar ${item.product.name}`}><RiDeleteBinLine /></button>
                        </div>
                        <div className="mt-3"><Counter value={item.quantity} onMinus={() => changeQuantity(item.key, -1)} onPlus={() => changeQuantity(item.key, 1)} /></div>
                        <div className="mt-4 grid grid-cols-3 gap-2">
                          {(["REDUCED", "STANDARD", "ENLARGED"] as const).map(size => (
                            <button key={size} type="button" onClick={() => setSize(item.key, size)} className={`h-9 rounded-lg border text-[10px] font-semibold ${item.customization.bouquetSize === size ? "border-primary-500 bg-primary-500 text-white" : "border-slate-200"}`}>
                              {size === "REDUCED" ? "Reducido" : size === "STANDARD" ? "Normal" : "Grande"}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 lg:grid-cols-2">
                      <MiniSection title="Flores base" Icon={RiFlowerLine}>
                        {item.customization.baseFlowers.map(flower => (
                          <div key={flower.id} className="flex items-center justify-between gap-2 border-b border-slate-100 py-2 text-xs last:border-0">
                            <span><strong className="block">{flower.name}</strong><small className="text-slate-400">Base: {flower.baseQuantity}</small></span>
                            {item.customization.bouquetSize === "REDUCED" ? (
                              <Counter
                                value={flower.quantity}
                                onMinus={() => changeBaseFlower(item.key, flower.id, -1)}
                                onPlus={() => changeBaseFlower(item.key, flower.id, 1)}
                                disablePlus={flower.quantity >= flower.baseQuantity}
                              />
                            ) : (
                              <span className="rounded-lg bg-slate-50 px-3 py-1.5 font-semibold">{flower.quantity}</span>
                            )}
                          </div>
                        ))}
                        {item.customization.bouquetSize === "STANDARD" && <p className="mt-3 text-[10px] leading-4 text-slate-400">El tamaño normal conserva exactamente la composición base.</p>}
                        {item.customization.bouquetSize === "REDUCED" && <p className="mt-3 text-[10px] leading-4 text-slate-400">Puedes reducir cantidades, pero no superar la composición base.</p>}
                      </MiniSection>

                      <MiniSection title="Adicionales" Icon={RiAddLine}>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {addons.filter(addon => addon.inStock).map(addon => {
                            const selected = item.addons.some(entry => entry.id === addon.id);
                            return (
                              <button key={addon.id} type="button" onClick={() => toggleAddon(item.key, addon)} className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-[10px] ${selected ? "border-primary-500 bg-primary-50 text-primary-700" : "border-slate-200"}`}>
                                <span><strong className="block">{addon.name}</strong><small>{formatPrice(addon.price)}</small></span>
                                <span className={`grid h-5 w-5 place-items-center rounded-full ${selected ? "bg-primary-500 text-white" : "bg-slate-100"}`}>{selected ? <RiCheckLine size={12} /> : <RiAddLine size={12} />}</span>
                              </button>
                            );
                          })}
                        </div>
                        {!addons.some(addon => addon.inStock) && <p className="text-xs text-slate-400">No hay adicionales disponibles.</p>}
                      </MiniSection>
                    </div>

                    {item.customization.bouquetSize === "ENLARGED" && (
                      <div className="mt-3 rounded-xl border border-primary-200 bg-primary-50/40 p-4">
                        <div className="mb-4">
                          <h4 className="flex items-center gap-2 text-xs font-bold text-primary-700"><RiFlowerLine /> Flores adicionales para agrandar</h4>
                          <p className="mt-1 text-[10px] text-slate-500">Selecciona cualquier flor del inventario y ajusta su cantidad.</p>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                          {flowers.map(flower => {
                            const selected = item.customization.extraFlowers.find(entry => entry.id === flower.id);
                            return (
                              <div key={flower.id} className={`rounded-xl border bg-white p-3 ${selected ? "border-primary-400" : "border-slate-200"}`}>
                                <button type="button" onClick={() => toggleExtraFlower(item.key, flower)} className="flex w-full items-center justify-between gap-2 text-left">
                                  <span><strong className="block text-xs">{flower.name}</strong><small className="text-[9px] text-slate-400">{flower.type}</small></span>
                                  <span className={`grid h-6 w-6 place-items-center rounded-full ${selected ? "bg-primary-500 text-white" : "bg-slate-100 text-slate-500"}`}>{selected ? <RiCheckLine size={13} /> : <RiAddLine size={13} />}</span>
                                </button>
                                {selected && (
                                  <div className="mt-3 border-t border-slate-100 pt-3">
                                    <Counter value={selected.quantity} onMinus={() => changeExtraFlower(item.key, flower.id, -1)} onPlus={() => changeExtraFlower(item.key, flower.id, 1)} />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        {!flowers.length && <p className="text-xs text-slate-400">No hay flores registradas en el inventario.</p>}
                      </div>
                    )}

                    <div className="mt-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
                      <strong className="text-slate-700">Resumen:</strong>{" "}
                      {item.customization.bouquetSize === "STANDARD" && "Composición normal sin modificaciones."}
                      {item.customization.bouquetSize === "REDUCED" && `${item.customization.baseFlowers.filter(flower => flower.quantity < flower.baseQuantity).length} flores base modificadas.`}
                      {item.customization.bouquetSize === "ENLARGED" && `${item.customization.extraFlowers.length} tipos de flores adicionales seleccionados.`}
                      {" "}{item.addons.length ? `${item.addons.length} adicionales incluidos.` : "Sin adicionales."}
                    </div>
                  </article>
                ))}
              </div>
            </Section>

            <Section
              title="Notas del pedido"
              Icon={RiFileList3Line}
              tone="rose"
              action={<SectionSaveButton loading={savingSection === "notes"} onClick={() => saveSection("notes", "Notas del pedido actualizadas")} />}
            >
              <textarea value={adminNote} onChange={event => setAdminNote(event.target.value)} placeholder="Instrucciones o notas internas..." className="min-h-24 w-full resize-y rounded-xl border border-primary-100 bg-white p-3 text-sm outline-none" />
            </Section>
          </div>

          <aside className="space-y-5">
            {order.status === "DELIVERED" && (
              <Section title="Foto de entrega" Icon={RiImage2Line}>
                {order.deliveryPhotoUrl ? (
                  <a
                    href={order.deliveryPhotoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"
                  >
                    <img
                      src={order.deliveryPhotoUrl}
                      alt={`Foto de entrega de ${order.trackingToken}`}
                      className="h-64 w-full object-cover"
                    />
                  </a>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-400">
                    Este pedido ya fue entregado, pero aún no tiene foto de evidencia registrada.
                  </div>
                )}
              </Section>
            )}

            <Section
              title="Resumen del pedido"
              Icon={RiFileList3Line}
              action={<SectionSaveButton loading={savingSection === "summary"} onClick={() => saveSection("summary", "Valores del pedido actualizados")} />}
            >
              <MoneyRow label="Subtotal" value={subtotal} />
              <NumberField label="Domicilio" value={deliveryFee} onChange={setDeliveryFee} />
              <NumberField label="Ajuste manual" value={manualAdjustment} onChange={setManualAdjustment} />
              <div className="mt-4 flex justify-between border-t border-slate-200 pt-4 text-lg font-bold"><span>Total</span><span className="text-primary-500">{formatPrice(total)}</span></div>
              <p className="mt-1 text-[10px] text-slate-400">Entrega estimada: {formatDeliveryLeadDays(maxDeliveryDays)}</p>
            </Section>

            <Section title="Estado del pedido" Icon={RiCheckboxCircleLine}>
              <div className="space-y-0">
                {FLOW_STATUSES.map((status, index) => {
                  const entry = order.statusHistory?.find((history: any) => history.status === status);
                  const done = FLOW_STATUSES.indexOf(order.status) >= index && !["PAYMENT_INVALID", "CANCELLED"].includes(order.status);
                  return (
                    <div key={status} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <span className={`grid h-5 w-5 place-items-center rounded-full ${done ? "bg-emerald-500 text-white" : "border border-slate-300 text-slate-300"}`}>{done && <RiCheckLine size={12} />}</span>
                        {index < FLOW_STATUSES.length - 1 && <span className={`h-7 w-px ${done ? "bg-emerald-300" : "bg-slate-200"}`} />}
                      </div>
                      <div className="flex min-w-0 flex-1 justify-between gap-3 text-xs">
                        <span className={order.status === status ? "font-bold text-emerald-600" : ""}>{flowLabel[status]}</span>
                        <time className="text-[9px] text-slate-400">{entry ? new Date(entry.createdAt).toLocaleString("es-CO", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : ""}</time>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
                {nextStatus && (
                  <button type="button" onClick={() => changeStatus(nextStatus)} disabled={updatingStatus} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary-500 px-4 text-xs font-semibold text-white disabled:opacity-60">
                    {updatingStatus ? <RiLoader4Line className="animate-spin" /> : <RiCheckLine />} Actualizar a {flowLabel[nextStatus] || STATUS_LABELS[nextStatus]}
                  </button>
                )}
                {!["CANCELLED", "DELIVERED"].includes(order.status) && (
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => changeStatus("PAYMENT_INVALID")} disabled={updatingStatus} className="h-9 rounded-xl border border-amber-200 text-[10px] font-semibold text-amber-700">Pago inválido</button>
                    <button type="button" onClick={() => changeStatus("CANCELLED")} disabled={updatingStatus} className="h-9 rounded-xl border border-red-200 text-[10px] font-semibold text-red-600">Cancelar pedido</button>
                  </div>
                )}
              </div>
            </Section>

            <Section title="Pago asociado" Icon={RiBankCardLine}>
              <span className={`inline-flex rounded-lg px-2 py-1 text-[9px] font-semibold ${paid ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{paid ? "Pago validado" : "Pendiente"}</span>
              <p className="mt-4 text-[10px] text-slate-400">Método de pago</p>
              <p className="text-xs font-semibold">{order.paymentMethod?.visibleLabel || order.paymentMethod?.provider || order.paymentMethod?.title || "Sin método asociado"}</p>
              {order.paymentMethod?.accountNumber && <><p className="mt-3 text-[10px] text-slate-400">Número</p><p className="text-xs font-semibold">{order.paymentMethod.accountNumber}</p></>}
              {!paid && (
                <button type="button" onClick={() => changeStatus("PAID")} disabled={updatingStatus} className="mt-4 inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 text-xs font-semibold text-white disabled:opacity-60">
                  {updatingStatus ? <RiLoader4Line className="animate-spin" /> : <RiCheckboxCircleLine />} Validar pago
                </button>
              )}
            </Section>

            <Section title="Actividad reciente" Icon={RiHistoryLine}>
              <div className="space-y-3">
                {[...(order.statusHistory || [])].reverse().slice(0, 6).map((entry: any) => (
                  <div key={entry.id} className="flex items-start justify-between gap-3 text-xs">
                    <span className="flex gap-2"><RiCheckLine className="mt-0.5 text-emerald-500" />{entry.note || STATUS_LABELS[entry.status] || entry.status}</span>
                    <time className="shrink-0 text-[9px] text-slate-400">{new Date(entry.createdAt).toLocaleString("es-CO", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</time>
                  </div>
                ))}
              </div>
            </Section>
          </aside>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  Icon,
  action,
  tone = "white",
  children,
}: {
  title: string;
  Icon: React.ElementType;
  action?: React.ReactNode;
  tone?: "white" | "rose";
  children: React.ReactNode;
}) {
  return (
    <section className={`rounded-2xl border p-5 shadow-sm ${tone === "rose" ? "border-primary-100 bg-rose-50/60" : "border-slate-200 bg-white"}`}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-bold"><Icon className="text-primary-500" size={19} />{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function SectionSaveButton({ loading, onClick }: { loading: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} disabled={loading} className="inline-flex h-9 items-center gap-2 rounded-xl bg-primary-500 px-3 text-[10px] font-semibold text-white disabled:opacity-60">
      {loading ? <RiLoader4Line className="animate-spin" /> : <RiSaveLine />} Actualizar
    </button>
  );
}

function MiniSection({ title, Icon, children }: { title: string; Icon: React.ElementType; children: React.ReactNode }) {
  return <div className="rounded-xl border border-slate-200 p-3"><h4 className="mb-3 flex items-center gap-2 text-xs font-bold"><Icon className="text-primary-500" />{title}</h4>{children}</div>;
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label><span className="mb-1 block text-[10px] text-slate-400">{label}</span><input value={value} onChange={event => onChange(event.target.value)} className="h-10 w-full border-b border-transparent bg-slate-50 px-3 text-sm outline-none transition focus:border-primary-300 focus:bg-white" /></label>;
}

function Counter({
  value,
  onMinus,
  onPlus,
  disablePlus = false,
}: {
  value: number;
  onMinus: () => void;
  onPlus: () => void;
  disablePlus?: boolean;
}) {
  return (
    <div className="inline-flex items-center gap-2">
      <button type="button" onClick={onMinus} className="grid h-7 w-7 place-items-center rounded-full border border-slate-200"><RiSubtractLine size={12} /></button>
      <strong className="w-5 text-center text-xs">{value}</strong>
      <button type="button" onClick={onPlus} disabled={disablePlus} className="grid h-7 w-7 place-items-center rounded-full border border-primary-200 text-primary-500 disabled:border-slate-100 disabled:text-slate-200"><RiAddLine size={12} /></button>
    </div>
  );
}

function MoneyRow({ label, value }: { label: string; value: number }) {
  return <div className="flex justify-between py-1 text-xs text-slate-600"><span>{label}</span><span>{formatPrice(value)}</span></div>;
}

function NumberField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="flex items-center justify-between py-1 text-xs text-slate-600"><span>{label}</span><input type="number" value={value} onChange={event => onChange(event.target.value)} className="w-28 rounded-lg border border-slate-200 px-2 py-1 text-right outline-none focus:border-primary-300" /></label>;
}
