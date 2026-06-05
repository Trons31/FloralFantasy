"use client";
import { useEffect, useState } from "react";
import {
  RiArrowUpLine,
  RiArrowDownLine,
  RiCheckLine,
  RiFlowerLine,
  RiLoader4Line,
  RiLogoutBoxLine,
  RiRefreshLine,
  RiStackLine,
  RiStickyNoteLine,
  RiAddCircleLine,
} from "react-icons/ri";
import { toast } from "sonner";

type Addon = { id: string; addon: { name: string } };
type FlowerLine = {
  id: string;
  name: string;
  imageUrl?: string | null;
  type?: string | null;
  baseQuantity?: number;
  quantity: number;
};
type ExtraFlower = { id: string; name: string; quantity: number };
type Customization = {
  bouquetSize?: "STANDARD" | "ENLARGED" | "REDUCED";
  baseFlowers?: FlowerLine[];
  extraFlowers?: ExtraFlower[];
};
type OrderItem = {
  id: string;
  quantity: number;
  price: number;
  addons: Addon[];
  customization?: Customization | null;
  product: {
    name: string;
    images: { url: string; isMain: boolean }[];
    flowers: { quantity: number; flower: { name: string; imageUrl?: string | null; type?: string | null } }[];
  };
};
type Order = {
  id: string;
  trackingToken: string;
  customerName: string;
  address: string;
  estimatedTime: string;
  total: number;
  status: string;
  adminNote?: string | null;
  items: OrderItem[];
};

export default function PreparadorView({ user, onLogout }: { user: any; onLogout: () => void }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"PAID" | "PROCESSING">("PAID");

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/orders?status=PAID,PROCESSING");
    const data = await res.json();
    setOrders(Array.isArray(data) ? data.filter((o: any) => ["PAID", "PROCESSING"].includes(o.status)) : []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (orderId: string, status: "PROCESSING" | "READY") => {
    setUpdating(orderId);
    const res = await fetch(`/api/orders/${orderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, note: status === "PROCESSING" ? "Preparando pedido" : "Pedido listo para entrega" }),
    });
    if (res.ok) {
      setOrders((p) =>
        status === "READY" ? p.filter((o) => o.id !== orderId) : p.map((o) => (o.id === orderId ? { ...o, status } : o))
      );
      toast.success(status === "PROCESSING" ? "En preparacion" : "Marcado como listo");
    }
    setUpdating(null);
  };

  const paid = orders.filter((o) => o.status === "PAID");
  const processing = orders.filter((o) => o.status === "PROCESSING");
  const activeOrders = activeTab === "PAID" ? paid : processing;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100">
            <RiFlowerLine className="text-amber-600" size={20} />
          </div>
          <div>
            <p className="text-sm font-bold leading-none text-gray-900">Preparador</p>
            <p className="text-xs text-gray-400">{user.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-gray-100">
            <RiRefreshLine size={18} />
          </button>
          <button onClick={onLogout} className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500">
            <RiLogoutBoxLine size={18} />
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-6 pb-28">
        {loading ? (
          <div className="flex justify-center py-20">
            <RiLoader4Line className="animate-spin text-amber-500" size={32} />
          </div>
        ) : orders.length === 0 ? (
          <div className="py-20 text-center">
            <RiFlowerLine className="mx-auto mb-3 text-gray-200" size={56} />
            <p className="font-medium text-gray-400">Sin pedidos pendientes</p>
            <p className="mt-1 text-sm text-gray-300">Toca actualizar para revisar</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeOrders.length > 0 ? (
              activeOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  updating={updating}
                  action={
                    activeTab === "PAID"
                      ? { label: "Empezar a preparar", status: "PROCESSING", color: "bg-amber-500 hover:bg-amber-600", shadow: "shadow-amber-200" }
                      : { label: "Marcar como listo", status: "READY", color: "bg-green-500 hover:bg-green-600", shadow: "shadow-green-200" }
                  }
                  onAction={updateStatus}
                />
              ))
            ) : (
              <div className="rounded-2xl border border-gray-100 bg-white py-16 text-center">
                <RiFlowerLine className="mx-auto mb-3 text-gray-200" size={48} />
                <p className="text-sm text-gray-400">Sin pedidos en esta sección</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom tab bar */}
      {!loading && orders.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-gray-100 bg-white/95 px-3 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.06)] backdrop-blur-md">
          <div className="mx-auto max-w-2xl">
            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-gray-100 p-1.5">
              <button
                onClick={() => setActiveTab("PAID")}
                className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                  activeTab === "PAID" ? "bg-white text-blue-700 shadow-sm" : "text-gray-500"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${activeTab === "PAID" ? "bg-blue-500" : "bg-blue-300"}`} />
                  Por preparar
                </span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${activeTab === "PAID" ? "bg-blue-50 text-blue-700" : "bg-white text-gray-400"}`}>
                  {paid.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab("PROCESSING")}
                className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                  activeTab === "PROCESSING" ? "bg-white text-amber-700 shadow-sm" : "text-gray-500"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${activeTab === "PROCESSING" ? "bg-amber-500 animate-pulse" : "bg-amber-300"}`} />
                  En preparación
                </span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${activeTab === "PROCESSING" ? "bg-amber-50 text-amber-700" : "bg-white text-gray-400"}`}>
                  {processing.length}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function OrderCard({
  order,
  updating,
  action,
  onAction,
}: {
  order: Order;
  updating: string | null;
  action: { label: string; status: any; color: string; shadow: string };
  onAction: (id: string, status: any) => void;
}) {
  const isUpdating = updating === order.id;
  const [activeSection, setActiveSection] = useState<"summary" | "flowers" | "notes">("summary");
  const mainItem = order.items[0];
  const totalProducts = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const mainProductImg = mainItem?.product?.images?.find((i) => i.isMain)?.url || mainItem?.product?.images?.[0]?.url;

  // Base flowers: prefer customization.baseFlowers, else fallback to product.flowers
  const baseFlowers: FlowerLine[] =
    mainItem?.customization?.baseFlowers?.length
      ? mainItem.customization.baseFlowers
      : mainItem?.product.flowers.map((f, idx) => ({
          id: `${mainItem.id}-f-${idx}`,
          name: f.flower?.name || "-",
          imageUrl: f.flower?.imageUrl || null,
          type: f.flower?.type || null,
          baseQuantity: f.quantity,
          quantity: f.quantity,
        })) || [];

  const extraFlowers: ExtraFlower[] = mainItem?.customization?.extraFlowers || [];
  const baseDelta = baseFlowers.reduce((sum, flower) => {
    const baseQty = flower.baseQuantity ?? flower.quantity;
    return sum + (flower.quantity - baseQty);
  }, 0);
  const hasSizeOverride = Boolean(mainItem?.customization?.bouquetSize);
  const inferredSize: "STANDARD" | "ENLARGED" | "REDUCED" =
    mainItem?.customization?.bouquetSize ||
    (extraFlowers.length > 0 || baseDelta > 0 ? "ENLARGED" : baseDelta < 0 ? "REDUCED" : "STANDARD");
  const isEnlarged = inferredSize === "ENLARGED";
  const isReduced = inferredSize === "REDUCED";
  const sizeLabel = isEnlarged ? "Agrandado" : isReduced ? "Reducido" : "Normal";
  const sizeDescription = isEnlarged
    ? extraFlowers.length > 0
      ? `Incluye ${extraFlowers.length} flor${extraFlowers.length !== 1 ? "es" : ""} adicional${extraFlowers.length !== 1 ? "es" : ""}`
      : "Cantidad ampliada para el ramo"
    : isReduced
      ? "Cantidad reducida para el ramo"
      : "Tamaño estándar";

  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-[0_2px_16px_rgba(0,0,0,0.08)]">

      {/* ── Header row ─────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-50">
            <RiFlowerLine className="text-amber-500" size={20} />
          </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-gray-400">PEDIDO</p>
              <p className="text-sm font-semibold text-gray-800">
                {totalProducts} producto{totalProducts !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

        <button
          type="button"
          onClick={() => onAction(order.id, action.status)}
          disabled={isUpdating}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-amber-50 px-3.5 py-2 text-xs font-semibold text-amber-700 transition-all hover:bg-amber-100 disabled:opacity-50"
        >
          {isUpdating ? <RiLoader4Line className="animate-spin" size={14} /> : null}
          {action.label}
        </button>
      </div>

      {/* ── Product block ───────────────────────────────── */}
      <div className="mx-5 overflow-hidden rounded-2xl border border-gray-100 bg-gray-50">
        <div className="flex gap-3 p-3">
          {/* Image */}
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-white shadow-sm">
            {mainProductImg ? (
              <img src={mainProductImg} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <RiFlowerLine className="text-gray-200" size={22} />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1 py-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-base font-black text-gray-900">
                {mainItem?.product.name || "Producto"}
              </h3>
              {mainItem?.quantity > 1 && (
                <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-black text-rose-500">
                  x{mainItem.quantity}
                </span>
              )}
            </div>

            <p className="mt-1 text-xs text-gray-400 line-clamp-2">
              {baseFlowers.length > 0
                ? baseFlowers.map((f) => `${f.name} x${f.quantity}`).join(" · ")
                : "Sin detalle de flores"}
            </p>

          </div>
        </div>




      </div>

      <div className="mx-5 mt-3 grid grid-cols-3 gap-2 rounded-2xl bg-gray-100 p-1.5">
        <button
          type="button"
          onClick={() => setActiveSection("summary")}
          className={`rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
            activeSection === "summary" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
          }`}
        >
          Resumen
        </button>
        <button
          type="button"
          onClick={() => setActiveSection("flowers")}
          className={`rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
            activeSection === "flowers" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
          }`}
        >
          Flores
        </button>
        <button
          type="button"
          onClick={() => setActiveSection("notes")}
          className={`rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
            activeSection === "notes" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
          }`}
        >
          <span className="inline-flex items-center gap-1.5">
            Obs.
            {order.adminNote?.trim() && (
              <span className="inline-block h-2 w-2 rounded-full bg-red-500 shadow-[0_0_0_2px_rgba(255,255,255,0.95)]" />
            )}
          </span>
        </button>
      </div>

      {activeSection === "summary" && (
        <div
          className={`mx-5 mt-3 flex items-start gap-3 rounded-2xl border px-4 py-3 ${
            isEnlarged
              ? "border-green-100 bg-green-50 text-green-700"
              : isReduced
                ? "border-rose-100 bg-rose-50 text-rose-600"
                : "border-gray-100 bg-gray-50 text-gray-600"
          }`}
        >
          <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
            isEnlarged ? "bg-green-100" : isReduced ? "bg-rose-100" : "bg-gray-100"
          }`}>
            {isEnlarged ? <RiArrowUpLine size={14} /> : isReduced ? <RiArrowDownLine size={14} /> : null}
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Tamaño del ramo</p>
            <p className="text-sm font-bold">{sizeLabel}</p>
            <p className="mt-0.5 text-xs font-medium opacity-80">{sizeDescription}</p>
          </div>
        </div>
      )}

      {/* ── Admin note ──────────────────────────────────── */}
      {activeSection === "notes" && order.adminNote?.trim() && (
        <div className="mx-5 mt-3 flex gap-3 rounded-2xl bg-amber-50 px-4 py-3">
          <RiStickyNoteLine size={15} className="mt-0.5 shrink-0 text-amber-500" />
          <div>
            <p className="mb-0.5 text-[10px] font-bold uppercase tracking-widest text-amber-500">Observaciones</p>
            <p className="whitespace-pre-line text-sm leading-5 text-amber-900">{order.adminNote}</p>
          </div>
        </div>
      )}

      {/* ── Flores del ramo ─────────────────────────────── */}
      {activeSection === "flowers" && (
      <div className="mx-5 mt-3 rounded-2xl border border-gray-100 bg-white p-4">
        <p className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
          <RiStackLine size={13} />
          Flores del ramo
        </p>

        <div className="divide-y divide-gray-50">
          {baseFlowers.map((flower) => {
            const baseQty = flower.baseQuantity ?? flower.quantity;
            const currentQty = flower.quantity;
            const delta = currentQty - baseQty;

            return (
              <div key={flower.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
                  {flower.imageUrl ? (
                    <img src={flower.imageUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-rose-50 to-amber-50">
                      <RiFlowerLine size={16} className="text-gray-300" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-gray-900">{flower.name}</p>
                  {flower.type && (
                    <p className="text-xs text-gray-400">{flower.type}</p>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {/* Show base quantity if reduced (strikethrough style) */}
                  {isReduced && delta < 0 && (
                    <span className="text-xs text-gray-300 line-through">x{baseQty}</span>
                  )}
                  <span className={`rounded-full px-3 py-1 text-sm font-bold ${
                    delta > 0 ? "bg-green-50 text-green-700" :
                    delta < 0 ? "bg-rose-50 text-rose-600" :
                    "bg-gray-100 text-gray-700"
                  }`}>
                    x{currentQty}
                  </span>
                  {delta !== 0 && (
                    <span className={`text-xs font-semibold ${delta > 0 ? "text-green-600" : "text-rose-500"}`}>
                      {delta > 0 ? `+${delta}` : delta}
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {baseFlowers.length === 0 && (
            <p className="py-2 text-sm text-gray-400">Sin flores base detalladas</p>
          )}
        </div>
      </div>
      )}

      {/* ── Flores extra (solo si agrandado) ────────────── */}
      {activeSection === "flowers" && isEnlarged && extraFlowers.length > 0 && (
        <div className="mx-5 mt-3 overflow-hidden rounded-2xl border border-green-100 bg-green-50/60">
          <div className="flex items-center gap-2 border-b border-green-100 px-4 py-2.5">
            <RiAddCircleLine size={14} className="text-green-600" />
            <p className="text-[10px] font-black uppercase tracking-widest text-green-700">
              Flores adicionales por agrandado
            </p>
          </div>
          <div className="divide-y divide-green-100 px-4">
            {extraFlowers.map((ef) => (
              <div key={ef.id} className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm">
                    <RiFlowerLine size={14} className="text-green-500" />
                  </div>
                  <span className="text-sm font-semibold text-green-900">{ef.name}</span>
                </div>
                <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-bold text-green-700">
                  x{ef.quantity}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── CTA button ──────────────────────────────────── */}
      <div className="px-5 py-4 pt-4">
        <button
          onClick={() => onAction(order.id, action.status)}
          disabled={isUpdating}
          className={`flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-white shadow-lg transition-all ${action.color} ${action.shadow} disabled:opacity-50`}
        >
          {isUpdating
            ? <><RiLoader4Line size={16} className="animate-spin" /> Actualizando...</>
            : <><RiCheckLine size={16} /> {action.label}</>
          }
        </button>
      </div>

    </div>
  );
}

