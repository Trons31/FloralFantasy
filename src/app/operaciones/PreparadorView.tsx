"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  RiAddCircleLine,
  RiAlarmWarningLine,
  RiArrowDownLine,
  RiArrowUpLine,
  RiCalendarLine,
  RiCheckLine,
  RiCheckboxCircleFill,
  RiFlowerLine,
  RiHourglassLine,
  RiLoader4Line,
  RiLogoutBoxLine,
  RiMapPin2Line,
  RiNotification3Line,
  RiPlayFill,
  RiRefreshLine,
  RiStackLine,
  RiStickyNoteLine,
  RiTimeLine,
  RiUser3Line,
} from "react-icons/ri";

type Tab = "PAID" | "PROCESSING" | "READY";
type FlowerLine = {
  id: string;
  name: string;
  imageUrl?: string | null;
  type?: string | null;
  baseQuantity?: number;
  quantity: number;
};
type ExtraFlower = { id: string; name: string; quantity: number };
type OrderItem = {
  id: string;
  quantity: number;
  addons: Array<{ id: string; addon: { name: string } }>;
  customization?: {
    bouquetSize?: "STANDARD" | "ENLARGED" | "REDUCED";
    baseFlowers?: FlowerLine[];
    extraFlowers?: ExtraFlower[];
  } | null;
  product: {
    name: string;
    images: Array<{ url: string; isMain: boolean }>;
    flowers: Array<{ quantity: number; flower: { name: string; imageUrl?: string | null; type?: string | null } }>;
  };
};
type Order = {
  id: string;
  trackingToken: string;
  customerName: string;
  address: string;
  addressRef?: string | null;
  estimatedTime: string;
  status: string;
  adminNote?: string | null;
  createdAt: string;
  updatedAt: string;
  statusHistory?: Array<{ id: string; status: string; note?: string | null; createdAt: string }>;
  items: OrderItem[];
};

const tabConfig: Array<{ value: Tab; label: string; Icon: React.ElementType }> = [
  { value: "PAID", label: "Por preparar", Icon: RiHourglassLine },
  { value: "PROCESSING", label: "En preparación", Icon: RiFlowerLine },
  { value: "READY", label: "Terminados", Icon: RiCheckboxCircleFill },
];

export default function PreparadorView({ user, onLogout }: { user: any; onLogout: () => void }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("PAID");

  const load = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/orders?status=PAID,PROCESSING,READY");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No fue posible cargar los pedidos");
      setOrders(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast.error(error.message || "No fue posible cargar los pedidos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const updateStatus = async (orderId: string, status: "PROCESSING" | "READY") => {
    setUpdating(orderId);
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          note: status === "PROCESSING" ? "Preparación iniciada" : "Pedido terminado y listo para entrega",
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No fue posible actualizar el pedido");
      const now = new Date().toISOString();
      setOrders(current => current.map(order => order.id === orderId ? {
        ...order,
        status,
        updatedAt: now,
        statusHistory: [...(order.statusHistory || []), { id: `${orderId}-${now}`, status, createdAt: now }],
      } : order));
      setActiveTab(status);
      toast.success(status === "PROCESSING" ? "Pedido en preparación" : "Pedido marcado como listo");
    } catch (error: any) {
      toast.error(error.message || "No fue posible actualizar el pedido");
    } finally {
      setUpdating(null);
    }
  };

  const grouped = useMemo(() => ({
    PAID: orders.filter(order => order.status === "PAID"),
    PROCESSING: orders.filter(order => order.status === "PROCESSING"),
    READY: orders.filter(order => order.status === "READY"),
  }), [orders]);
  const activeOrders = grouped[activeTab];

  return (
    <div className="min-h-screen bg-[#f6f8fb] pb-24 text-[#11182c]">
      <header className="sticky top-0 z-20 border-b border-slate-100 bg-white/95 px-4 py-4 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-xl items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-amber-50 text-amber-500"><RiFlowerLine size={29} /></span>
            <div><h1 className="text-xl font-extrabold">Preparador</h1><p className="text-base text-slate-500">{user.name}</p></div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={load} className="relative grid h-10 w-10 place-items-center rounded-xl text-slate-600 hover:bg-slate-50" aria-label="Actualizar pedidos">
              <RiNotification3Line size={23} /><span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-primary-500 ring-2 ring-white" />
            </button>
            <button type="button" onClick={onLogout} className="grid h-10 w-10 place-items-center rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-500" aria-label="Cerrar sesión"><RiLogoutBoxLine /></button>
            <div className="rounded-2xl border border-primary-100 bg-primary-50 px-4 py-2 text-center"><span className="block text-[10px] font-semibold text-slate-600">Pedidos</span><strong className="text-primary-500">{orders.length}</strong></div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-xl px-4 py-7">
        <div className="mb-5">
          <h2 className="text-2xl font-extrabold">{activeTab === "PAID" ? "Por preparar" : activeTab === "PROCESSING" ? "En preparación" : "Terminados"}</h2>
          <p className="mt-1 flex items-center gap-2 text-sm text-slate-400">
            {activeTab === "PROCESSING" && <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />}
            {activeTab === "PAID" ? `Tienes ${activeOrders.length} pedido${activeOrders.length === 1 ? "" : "s"} pendiente${activeOrders.length === 1 ? "" : "s"}` :
              activeTab === "PROCESSING" ? `Tienes ${activeOrders.length} pedido${activeOrders.length === 1 ? "" : "s"} en proceso` :
              `${activeOrders.length} pedido${activeOrders.length === 1 ? "" : "s"} preparado${activeOrders.length === 1 ? "" : "s"}`}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-24"><RiLoader4Line className="animate-spin text-primary-500" size={34} /></div>
        ) : activeOrders.length ? (
          <div className="space-y-5">
            {activeOrders.map(order => (
              <OrderCard key={order.id} order={order} tab={activeTab} updating={updating === order.id} onAction={updateStatus} />
            ))}
          </div>
        ) : (
          <EmptyState tab={activeTab} preparedToday={grouped.READY.length} />
        )}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-100 bg-white/95 px-3 pb-[max(.75rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-10px_30px_rgba(15,23,42,.08)] backdrop-blur">
        <div className="mx-auto grid max-w-xl grid-cols-3 gap-2">
          {tabConfig.map(tab => {
            const active = activeTab === tab.value;
            const count = grouped[tab.value].length;
            return (
              <button key={tab.value} type="button" onClick={() => setActiveTab(tab.value)} className={`relative flex h-16 flex-col items-center justify-center gap-1 rounded-2xl text-[10px] font-semibold transition ${active ? "border border-primary-100 bg-primary-50 text-primary-500" : tab.value === "READY" ? "text-emerald-600" : "text-slate-500"}`}>
                <tab.Icon size={22} />
                <span>{tab.label}</span>
                <span className={`absolute right-[24%] top-1 grid h-5 min-w-5 place-items-center rounded-full px-1 text-[9px] ${tab.value === "READY" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-primary-500"}`}>{count}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function OrderCard({ order, tab, updating, onAction }: {
  order: Order;
  tab: Tab;
  updating: boolean;
  onAction: (id: string, status: "PROCESSING" | "READY") => void;
}) {
  const [section, setSection] = useState<"summary" | "flowers" | "notes">(tab === "PROCESSING" ? "flowers" : "summary");
  const item = order.items[0];
  const image = item?.product.images.find(image => image.isMain)?.url || item?.product.images[0]?.url;
  const baseFlowers: FlowerLine[] = item?.customization?.baseFlowers?.length
    ? item.customization.baseFlowers
    : item?.product.flowers.map((entry, index) => ({
      id: `${item.id}-${index}`,
      name: entry.flower.name,
      imageUrl: entry.flower.imageUrl,
      type: entry.flower.type,
      baseQuantity: entry.quantity,
      quantity: entry.quantity,
    })) || [];
  const extras = item?.customization?.extraFlowers || [];
  const size = item?.customization?.bouquetSize || "STANDARD";
  const processingStart = order.statusHistory?.find(entry => entry.status === "PROCESSING")?.createdAt || order.updatedAt;

  return (
    <article className={`overflow-hidden rounded-3xl border bg-white shadow-[0_8px_30px_rgba(15,23,42,.06)] ${tab === "PROCESSING" ? "border-amber-200" : tab === "READY" ? "border-emerald-100" : "border-primary-100"}`}>
      <div className="p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-bold text-primary-500">#{order.trackingToken}</span>
          <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-semibold ${tab === "PROCESSING" ? "bg-orange-50 text-orange-600" : tab === "READY" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
            <span className={`h-2 w-2 rounded-full ${tab === "READY" ? "bg-emerald-500" : "bg-amber-400"}`} />
            {tab === "PAID" ? "Por preparar" : tab === "PROCESSING" ? "En preparación" : "Terminado"}
          </span>
        </div>

        <div className="mt-5 grid grid-cols-[130px_1fr] gap-5">
          <div className="h-36 overflow-hidden rounded-2xl bg-slate-50">
            {image ? <img src={image} alt={item?.product.name || ""} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center"><RiFlowerLine className="text-slate-200" size={40} /></div>}
          </div>
          <div className="flex min-w-0 flex-col justify-center">
            <h3 className="text-xl font-extrabold">{item?.product.name || "Arreglo floral"}</h3>
            <p className="mt-4 flex items-center gap-2 text-sm text-slate-500"><RiFlowerLine className="text-primary-500" />{baseFlowers[0]?.name || "Composición floral"} x{baseFlowers[0]?.quantity || 1}</p>
            {tab === "PROCESSING" && <ElapsedTimer startedAt={processingStart} />}
          </div>
        </div>

        {tab === "PAID" && (
          <div className="mt-5 grid grid-cols-2 gap-2">
            <InfoTile Icon={RiTimeLine} label="Tamaño del ramo" value={size === "ENLARGED" ? "Grande" : size === "REDUCED" ? "Reducido" : "Normal"} accent />
            <InfoTile Icon={RiCalendarLine} label="Entrega estimada" value={order.estimatedTime} />
          </div>
        )}
      </div>

      <div className="mx-4 rounded-2xl bg-slate-50 p-1.5">
        <div className="grid grid-cols-3">
          {(["summary", "flowers", "notes"] as const).map(value => (
            <button key={value} type="button" onClick={() => setSection(value)} className={`h-11 rounded-xl text-xs font-semibold transition ${section === value ? "bg-white text-primary-500 shadow-sm" : "text-slate-500"}`}>
              {value === "summary" ? "Resumen" : value === "flowers" ? "Flores" : "Obs."}
            </button>
          ))}
        </div>
      </div>

      <div className="p-5">
        {section === "summary" && <Summary order={order} size={size} />}
        {section === "flowers" && <FlowersList flowers={baseFlowers} extras={extras} processing={tab === "PROCESSING"} />}
        {section === "notes" && <Notes order={order} addons={item?.addons || []} />}

        {tab !== "READY" && (
          <button type="button" onClick={() => onAction(order.id, tab === "PAID" ? "PROCESSING" : "READY")} disabled={updating} className="mt-5 inline-flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[#ff8a00] to-[#ff9f0a] text-sm font-bold text-white shadow-[0_10px_25px_rgba(255,138,0,.25)] disabled:opacity-60">
            {updating ? <RiLoader4Line className="animate-spin" /> : tab === "PAID" ? <RiPlayFill /> : <RiCheckLine />}
            {updating ? "Actualizando..." : tab === "PAID" ? "Empezar a preparar" : "Marcar como listo"}
          </button>
        )}
      </div>
    </article>
  );
}

function Summary({ order, size }: { order: Order; size: "STANDARD" | "ENLARGED" | "REDUCED" }) {
  const totalProducts = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const sizeLabel = size === "ENLARGED" ? "Agrandado" : size === "REDUCED" ? "Reducido" : "Normal";
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-500">
          {size === "ENLARGED" ? <RiArrowUpLine /> : size === "REDUCED" ? <RiArrowDownLine /> : <RiFlowerLine />}
        </span>
        <p className="mt-3 text-[10px] text-slate-400">Tipo de pedido</p>
        <strong className="mt-1 block text-sm">{sizeLabel}</strong>
      </div>
      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-50 text-primary-500"><RiStackLine /></span>
        <p className="mt-3 text-[10px] text-slate-400">Productos</p>
        <strong className="mt-1 block text-sm">{totalProducts} producto{totalProducts === 1 ? "" : "s"}</strong>
      </div>
    </div>
  );
}
function FlowersList({ flowers, extras, processing = false, compact = false }: { flowers: FlowerLine[]; extras: ExtraFlower[]; processing?: boolean; compact?: boolean }) {
  return (
    <div className="space-y-3">
      {!compact && <h4 className="text-sm font-bold text-slate-500">Flores del ramo</h4>}
      {flowers.map(flower => (
        <div key={flower.id} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
          {processing && <RiCheckboxCircleFill className="shrink-0 text-emerald-500" size={23} />}
          <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-rose-50">
            {flower.imageUrl ? <img src={flower.imageUrl} alt="" className="h-full w-full object-cover" /> : <RiFlowerLine className="text-primary-400" size={23} />}
          </div>
          <div className="min-w-0 flex-1"><strong className="block truncate text-xs">{flower.name}</strong><small className="text-[10px] text-slate-400">{flower.type || "Flor principal"}</small></div>
          <div className="text-right"><strong className="text-sm">{processing ? `${flower.quantity} / ${flower.quantity}` : flower.quantity}</strong><small className={`block text-[9px] ${processing ? "text-emerald-600" : "text-slate-400"}`}>{processing ? "completado" : "unidades"}</small></div>
        </div>
      ))}
      {extras.map(flower => (
        <div key={flower.id} className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-3">
          <RiAddCircleLine className="text-emerald-500" /><div className="flex-1"><strong className="text-xs">{flower.name}</strong><small className="block text-[9px] text-emerald-600">Flor adicional</small></div><strong className="text-sm">{flower.quantity}</strong>
        </div>
      ))}
      {!flowers.length && !extras.length && <p className="py-5 text-center text-xs text-slate-400">Sin flores detalladas.</p>}
    </div>
  );
}

function Notes({ order, addons }: { order: Order; addons: Array<{ addon: { name: string } }> }) {
  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
        <h4 className="flex items-center gap-2 text-xs font-bold text-amber-700"><RiStickyNoteLine /> Notas del cliente</h4>
        <p className="mt-2 whitespace-pre-line text-xs leading-5 text-slate-600">{order.adminNote || "Sin observaciones registradas."}</p>
      </div>
      {addons.length > 0 && <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4"><h4 className="text-xs font-bold text-violet-700">Adicionales</h4><p className="mt-2 text-xs text-slate-600">{addons.map(entry => entry.addon.name).join(", ")}</p></div>}
    </div>
  );
}

function ElapsedTimer({ startedAt }: { startedAt: string }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const seconds = Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 1000));
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return (
    <div className="mt-5 flex items-center gap-3">
      <span className="grid h-12 w-12 place-items-center rounded-2xl border border-orange-100 text-orange-500 shadow-sm"><RiTimeLine size={25} /></span>
      <div><p className="text-xs text-slate-500">Tiempo transcurrido</p><strong className="text-2xl text-orange-500">{String(minutes).padStart(2, "0")}:{String(remaining).padStart(2, "0")}</strong></div>
    </div>
  );
}

function InfoTile({ Icon, label, value, accent = false }: { Icon: React.ElementType; label: string; value: string; accent?: boolean }) {
  return <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3"><Icon className="shrink-0 text-primary-500" size={22} /><div><p className="text-[10px] text-slate-500">{label}</p><strong className={`text-xs ${accent ? "text-orange-500" : ""}`}>{value}</strong></div></div>;
}

function EmptyState({ tab, preparedToday }: { tab: Tab; preparedToday: number }) {
  return (
    <div className="rounded-3xl bg-white px-5 py-12 text-center shadow-sm">
      <span className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-gradient-to-b from-rose-50 to-white"><RiFlowerLine className="text-primary-300" size={50} /></span>
      <h3 className="mt-5 text-xl font-extrabold">{tab === "READY" ? "Trabajo completado" : "¡Todo al día!"}</h3>
      <p className="mx-auto mt-2 max-w-xs text-sm leading-5 text-slate-400">{tab === "READY" ? "Los pedidos preparados aparecerán aquí." : "No hay pedidos pendientes en esta sección."}</p>
      <div className="mt-8 flex items-center justify-between rounded-2xl border border-slate-100 p-4 text-left shadow-sm">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary-50 text-primary-500"><RiCalendarLine /></span>
        <div className="flex-1 px-3"><p className="text-xs text-slate-500">Preparados hoy</p><strong>{preparedToday} pedidos</strong></div>
        <RiRefreshLine className="text-primary-300" />
      </div>
    </div>
  );
}
