"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import PhotoViewer from "@/components/client/PhotoViewer";
import {
  RiShoppingBagLine, RiArrowLeftLine, RiArrowRightLine, RiFilterLine,
  RiCalendarLine, RiSearchLine, RiCloseLine, RiTimeLine, RiMapPin2Line,
  RiTruckLine, RiCheckLine, RiFlowerLine,
  RiLayoutGridLine, RiLoader4Line, RiZoomInLine, RiImageLine,
} from "react-icons/ri";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";

const STATUS_CONFIG: Record<string,{ label:string; color:string; dot:string }> = {
  PENDING:          { label:"Pendiente",  color:"bg-gray-100 text-gray-600",      dot:"bg-gray-400"    },
  PAID:             { label:"Pagado",     color:"bg-blue-100 text-blue-700",      dot:"bg-blue-500"    },
  PROCESSING:       { label:"Procesando", color:"bg-amber-100 text-amber-700",    dot:"bg-amber-500"   },
  READY:            { label:"Listo",      color:"bg-green-100 text-green-700",    dot:"bg-green-500"   },
  OUT_FOR_DELIVERY: { label:"En camino",  color:"bg-purple-100 text-purple-700",  dot:"bg-purple-500"  },
  DELIVERED:        { label:"Entregado",  color:"bg-emerald-100 text-emerald-700",dot:"bg-emerald-500" },
  CANCELLED:        { label:"Cancelado",  color:"bg-red-100 text-red-500",        dot:"bg-red-400"     },
};

const PERIODOS = [
  { value:"todos",      label:"Todos"         },
  { value:"hoy",        label:"Hoy"           },
  { value:"semana",     label:"7 días"        },
  { value:"mes",        label:"Este mes"      },
  { value:"mes_pasado", label:"Mes pasado"    },
  { value:"custom",     label:"Personalizado" },
];

function formatDate(iso: string) {
  const d = new Date(iso);
  const months = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
  const h = d.getHours(), m = String(d.getMinutes()).padStart(2,"0");
  const ampm = h >= 12 ? "p.m." : "a.m.";
  return `${d.getDate()} ${months[d.getMonth()]}, ${h % 12 || 12}:${m} ${ampm}`;
}

export default function PedidosListClient({ orders, summary, statusBreakdown, pagination, filters }: {
  orders:          any[];
  summary:         { total:number; count:number };
  statusBreakdown: { status:string; count:number }[];
  pagination:      { page:number; perPage:number; total:number };
  filters:         { periodo?:string; from?:string; to?:string; status?:string; q?:string };
}) {
  const router = useRouter();

  const [showCustom, setShowCustom] = useState(false);
  const [customFrom, setCustomFrom] = useState(filters.from || "");
  const [customTo,   setCustomTo]   = useState(filters.to   || "");
  const [searchVal,  setSearchVal]  = useState(filters.q    || "");
  const [updating,   setUpdating]   = useState<string|null>(null);
  const [viewPhoto,  setViewPhoto]  = useState<string|null>(null);

  const totalPages = Math.ceil(pagination.total / pagination.perPage);

  const navigate = (params: Record<string, string|undefined>) => {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v) sp.set(k, v); });
    router.push(`/dashboard/todos-pedidos?${sp.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ periodo: filters.periodo || "mes", q: searchVal || undefined, status: filters.status });
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdating(orderId);
    const res = await fetch(`/api/orders/${orderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      toast.success("Estado actualizado");
      router.refresh();
    } else {
      toast.error("Error al actualizar");
    }
    setUpdating(null);
  };

  const STATUS_FLOW: Record<string, string|null> = {
    PENDING: "PAID", PAID: "PROCESSING", PROCESSING: "READY",
    READY: "OUT_FOR_DELIVERY", OUT_FOR_DELIVERY: "DELIVERED",
    DELIVERED: null, CANCELLED: null,
  };

  return (
    <div className="p-4 lg:p-8 space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <RiShoppingBagLine className="text-primary-500" size={24}/> Pedidos
          </h1>
          <p className="text-gray-400 text-sm mt-1">Historial completo de pedidos</p>
        </div>
        <Link href="/dashboard/pedidos"
          className="flex w-fit items-center gap-2 border-2 border-primary-200 text-primary-600 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-50 transition-colors">
          <RiLayoutGridLine size={15}/> Ver tablero Kanban
        </Link>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-400 mb-1">Total pedidos</p>
          <p className="text-xl font-bold text-gray-900">{summary.count}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-400 mb-1">Ingresos</p>
          <p className="text-xl font-bold text-green-600">{formatPrice(summary.total)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 col-span-2 sm:col-span-1">
          <p className="text-xs text-gray-400 mb-1">Ticket promedio</p>
          <p className="text-xl font-bold text-primary-600">
            {summary.count > 0 ? formatPrice(summary.total / summary.count) : "—"}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15}/>
            <input
              value={searchVal}
              onChange={e => setSearchVal(e.target.value)}
              placeholder="Buscar por nombre, token o teléfono..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-400"
            />
          </div>
          <button type="submit"
            className="px-4 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors">
            Buscar
          </button>
          {filters.q && (
            <button type="button"
              onClick={() => { setSearchVal(""); navigate({ periodo: filters.periodo || "mes", status: filters.status }); }}
              className="px-3 py-2.5 bg-gray-100 text-gray-500 rounded-xl text-sm hover:bg-gray-200 transition-colors">
              <RiCloseLine size={16}/>
            </button>
          )}
        </form>

        {/* Period */}
        <div className="flex items-center gap-2 flex-wrap">
          <RiFilterLine className="text-gray-400 flex-shrink-0" size={14}/>
          {PERIODOS.map(p => (
            <button key={p.value}
              onClick={() => {
                if (p.value === "custom") { setShowCustom(true); return; }
                setShowCustom(false);
                navigate({ periodo: p.value, status: filters.status, q: filters.q });
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                (p.value === "custom" && showCustom) ||
                (p.value !== "custom" && filters.periodo === p.value && !showCustom)
                  ? "bg-primary-600 text-white"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}>
              {p.label}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => navigate({ periodo: filters.periodo || "mes", q: filters.q })}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              !filters.status ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}>
            Todos los estados
          </button>
          {Object.entries(STATUS_CONFIG).map(([k, cfg]) => (
            <button key={k}
              onClick={() => navigate({ periodo: filters.periodo || "mes", status: k, q: filters.q })}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                filters.status === k ? "bg-gray-800 text-white" : cfg.color
              }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}/>
              {cfg.label}
              {statusBreakdown.find(s => s.status === k)?.count
                ? ` · ${statusBreakdown.find(s => s.status === k)?.count}`
                : ""}
            </button>
          ))}
        </div>

        {showCustom && (
          <div className="flex flex-wrap items-end gap-3 pt-3 border-t border-gray-50">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Desde</label>
              <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary-400"/>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Hasta</label>
              <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary-400"/>
            </div>
            <button
              onClick={() => { if (customFrom && customTo) navigate({ from: customFrom, to: customTo, status: filters.status, q: filters.q }); }}
              disabled={!customFrom || !customTo}
              className="flex items-center gap-1.5 bg-primary-600 text-white px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-40 hover:bg-primary-700">
              <RiCalendarLine size={13}/> Aplicar
            </button>
          </div>
        )}
      </div>

      {/* Orders list */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <p className="font-semibold text-gray-900 text-sm">
            {pagination.total} pedido{pagination.total !== 1 ? "s" : ""}
          </p>
          <p className="text-xs text-gray-400">pág. {pagination.page}/{Math.max(1, totalPages)}</p>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-16">
            <RiShoppingBagLine className="text-gray-200 mx-auto mb-3" size={48}/>
            <p className="text-gray-400 text-sm">Sin pedidos en este período</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {orders.map(order => {
              const cfg    = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
              const next   = STATUS_FLOW[order.status];
              const nextCfg = next ? STATUS_CONFIG[next] : null;
              const isUpd  = updating === order.id;

              return (
                <div key={order.id} className="p-4 lg:p-5 hover:bg-gray-50/50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">

                    {/* Delivery photo thumbnail */}
                    <div className="flex-shrink-0">
                      {order.deliveryPhotoUrl ? (
                        <button
                          onClick={() => setViewPhoto(order.deliveryPhotoUrl)}
                          className="w-14 h-14 rounded-xl overflow-hidden border-2 border-emerald-200 flex-shrink-0 hover:border-emerald-400 transition-colors relative group/thumb"
                          title="Ver foto de entrega"
                        >
                          <img
                            src={order.deliveryPhotoUrl}
                            alt="Foto de entrega"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover/thumb:bg-black/30 transition-colors flex items-center justify-center">
                            <RiZoomInLine className="text-white opacity-0 group-hover/thumb:opacity-100 transition-opacity" size={18}/>
                          </div>
                        </button>
                      ) : (
                        <div className="w-14 h-14 rounded-xl border border-dashed border-gray-200 flex-shrink-0 flex items-center justify-center bg-gray-50">
                          <RiImageLine className="text-gray-300" size={20}/>
                        </div>
                      )}
                    </div>

                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className="font-mono text-xs text-primary-600 font-bold">{order.trackingToken}</span>
                        <span className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}/>
                          {cfg.label}
                        </span>
                      </div>
                      <p className="font-bold text-gray-900">{order.customerName}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{order.customerPhone}</p>

                      {/* Products */}
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        <RiFlowerLine className="text-primary-400 flex-shrink-0" size={12}/>
                        <p className="text-xs text-gray-600 line-clamp-1">
                          {order.items.map((i: any) =>
                            `${i.quantity > 1 ? `x${i.quantity} ` : ""}${i.product?.name || "-"}`
                          ).join(" · ")}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><RiMapPin2Line size={11}/> {order.address}</span>
                        <span className="flex items-center gap-1"><RiTimeLine size={11}/> {formatDate(order.createdAt)}</span>
                      </div>
                    </div>

                    {/* Right col: price + actions */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 flex-shrink-0">
                      <p className="font-bold text-gray-900 text-lg">{formatPrice(order.total)}</p>
                      {next && nextCfg && (
                        <button
                          onClick={() => handleStatusChange(order.id, next)}
                          disabled={isUpd}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 ${nextCfg.color} hover:opacity-80`}>
                          {isUpd
                            ? <RiLoader4Line className="animate-spin" size={11}/>
                            : <RiCheckLine size={11}/>}
                          → {nextCfg.label}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-3">
          <button
            onClick={() => navigate({ periodo: filters.periodo || "mes", page: String(pagination.page - 1), status: filters.status, q: filters.q })}
            disabled={pagination.page <= 1}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            <RiArrowLeftLine size={14}/> Anterior
          </button>
          <span className="text-sm text-gray-500">{pagination.page} / {totalPages}</span>
          <button
            onClick={() => navigate({ periodo: filters.periodo || "mes", page: String(pagination.page + 1), status: filters.status, q: filters.q })}
            disabled={pagination.page >= totalPages}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            Siguiente <RiArrowRightLine size={14}/>
          </button>
        </div>
      )}

      {/* Photo viewer — portal renders directly in document.body */}
      {viewPhoto && <PhotoViewer url={viewPhoto} onClose={() => setViewPhoto(null)}/>}

    </div>
  );
}