"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  RiBarChartLine, RiDownloadLine, RiFilterLine, RiArrowLeftLine, RiArrowRightLine,
  RiMoneyDollarCircleLine, RiShoppingBagLine, RiArrowUpLine, RiArrowDownLine,
  RiCalendarLine, RiLoader4Line, RiCheckLine, RiTimeLine, RiTruckLine, RiFlowerLine,
} from "react-icons/ri";
import { formatPrice } from "@/lib/utils";

const PERIODOS = [
  { value:"hoy",         label:"Hoy"         },
  { value:"semana",      label:"Esta semana"  },
  { value:"mes",         label:"Este mes"     },
  { value:"mes_pasado",  label:"Mes pasado"   },
  { value:"personalizado", label:"Personalizado" },
];

const STATUS_CONFIG: Record<string,{label:string;color:string;Icon:any}> = {
  PAID:             { label:"Pagado",      color:"bg-blue-100 text-blue-700",   Icon: RiMoneyDollarCircleLine },
  PROCESSING:       { label:"Procesando",  color:"bg-amber-100 text-amber-700", Icon: RiFlowerLine },
  READY:            { label:"Listo",       color:"bg-green-100 text-green-700", Icon: RiCheckLine },
  OUT_FOR_DELIVERY: { label:"En camino",   color:"bg-purple-100 text-purple-700", Icon: RiTruckLine },
  DELIVERED:        { label:"Entregado",   color:"bg-emerald-100 text-emerald-700", Icon: RiCheckLine },
  PENDING:          { label:"Pendiente",   color:"bg-gray-100 text-gray-600",   Icon: RiTimeLine },
};

function formatDate(iso: string) {
  const d = new Date(iso);
  const months = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export default function ReportesClient({
  orders, expenses, summary, statusCounts, pagination, filters, periodoLabel, dateRange,
}: {
  orders: any[]; expenses: any[];
  summary: { totalIncome:number; totalExpenses:number; totalOrders:number };
  statusCounts: { status:string; count:number }[];
  pagination: { page:number; perPage:number; total:number };
  filters: { periodo?:string; from?:string; to?:string };
  periodoLabel: string;
  dateRange: { from:string; to:string };
}) {
  const router = useRouter();
  const [exporting, setExporting] = useState(false);
  const [showCustom, setShowCustom] = useState(filters.periodo === "personalizado" || !!(filters.from && filters.to));
  const [customFrom, setCustomFrom] = useState(filters.from || "");
  const [customTo,   setCustomTo]   = useState(filters.to   || "");

  const ganancia    = summary.totalIncome - summary.totalExpenses;
  const totalPages  = Math.ceil(pagination.total / pagination.perPage);

  const navigate = (params: Record<string,string>) => {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k,v]) => v && sp.set(k, v));
    router.push(`/dashboard/reportes?${sp.toString()}`);
  };

  const handlePeriodo = (v: string) => {
    if (v === "personalizado") { setShowCustom(true); return; }
    setShowCustom(false);
    navigate({ periodo: v });
  };

  const handleCustom = () => {
    if (!customFrom || !customTo) return;
    navigate({ from: customFrom, to: customTo });
  };

  const handleExport = async () => {
    setExporting(true);
    const params = new URLSearchParams({ label: periodoLabel });
    params.set("from", dateRange.from);
    params.set("to",   dateRange.to);
    const res  = await fetch(`/api/reportes/pdf?${params.toString()}`);
    const html = await res.text();
    const win  = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      setTimeout(() => { win.focus(); win.print(); }, 500);
    }
    setExporting(false);
  };

  return (
    <div className="p-4 lg:p-8 max-w-7xl">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <RiBarChartLine className="text-primary-500" size={24}/> Reportes
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {periodoLabel} · {new Date(dateRange.from).toLocaleDateString("es-CO",{dateStyle:"medium"})} — {new Date(dateRange.to).toLocaleDateString("es-CO",{dateStyle:"medium"})}
          </p>
        </div>
        <button onClick={handleExport} disabled={exporting}
          className="flex w-fit items-center gap-2 bg-primary-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 transition-all active:scale-95">
          {exporting ? <RiLoader4Line className="animate-spin" size={16}/> : <RiDownloadLine size={16}/>}
          {exporting ? "Generando..." : "Exportar PDF"}
        </button>
      </div>

      {/* Period filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <RiFilterLine className="text-gray-400" size={14}/>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Filtrar por período</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {PERIODOS.map(p => (
            <button key={p.value}
              onClick={() => handlePeriodo(p.value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all active:scale-95 ${
                (p.value === "personalizado" && showCustom) || (p.value !== "personalizado" && filters.periodo === p.value && !showCustom)
                  ? "bg-primary-600 text-white shadow-sm"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}>
              {p.label}
            </button>
          ))}
        </div>

        {showCustom && (
          <div className="mt-4 flex flex-wrap items-end gap-3 pt-4 border-t border-gray-50">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Desde</label>
              <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary-400"/>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Hasta</label>
              <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary-400"/>
            </div>
            <button onClick={handleCustom} disabled={!customFrom || !customTo}
              className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40 hover:bg-primary-700 transition-colors">
              <RiCalendarLine size={14}/> Aplicar
            </button>
          </div>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label:"Pedidos",      value: String(summary.totalOrders), icon: RiShoppingBagLine,       color:"text-gray-900",    bg:"bg-gray-50",    sub:"órdenes" },
          { label:"Ingresos",     value: formatPrice(summary.totalIncome),   icon: RiArrowUpLine,   color:"text-green-600",   bg:"bg-green-50",   sub:"ventas confirmadas" },
          { label:"Egresos",      value: formatPrice(summary.totalExpenses), icon: RiArrowDownLine, color:"text-red-500",     bg:"bg-red-50",     sub:"gastos registrados" },
          { label:"Ganancia neta",value: formatPrice(ganancia),              icon: RiBarChartLine,  color: ganancia>=0?"text-primary-600":"text-red-600", bg: ganancia>=0?"bg-primary-50":"bg-red-50", sub: ganancia>=0?"utilidad":"pérdida" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className={`w-9 h-9 ${s.bg} rounded-xl flex items-center justify-center mb-3`}>
              <s.icon className={s.color} size={18}/>
            </div>
            <p className="text-xs text-gray-400 mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Status breakdown */}
      {statusCounts.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
          <p className="text-sm font-semibold text-gray-700 mb-4">Estado de pedidos</p>
          <div className="flex flex-wrap gap-3">
            {statusCounts.map(sc => {
              const cfg = STATUS_CONFIG[sc.status] || { label: sc.status, color:"bg-gray-100 text-gray-600", Icon: RiShoppingBagLine };
              return (
                <div key={sc.status} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold ${cfg.color}`}>
                  <cfg.Icon size={13}/>
                  {cfg.label} · {sc.count}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Orders table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-4">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <p className="font-semibold text-gray-900 text-sm">Detalle de pedidos</p>
          <p className="text-xs text-gray-400">{pagination.total} total · pág. {pagination.page} de {Math.max(1,totalPages)}</p>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-16">
            <RiShoppingBagLine className="text-gray-200 mx-auto mb-3" size={48}/>
            <p className="text-gray-400 text-sm">Sin pedidos en este período</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-50">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Token</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Cliente</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Productos</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Estado</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Fecha</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => {
                    const cfg = STATUS_CONFIG[order.status] || { label: order.status, color:"bg-gray-100 text-gray-600", Icon: RiShoppingBagLine };
                    return (
                      <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-3.5">
                          <span className="font-mono text-xs text-primary-600">{order.trackingToken}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="font-medium text-gray-900">{order.customerName}</p>
                          <p className="text-xs text-gray-400">{order.customerPhone}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="text-gray-700 text-xs line-clamp-2">
                            {order.items.map((i:any) => `${i.quantity>1?`x${i.quantity} `:""}${i.product?.name||"-"}`).join(" · ")}
                          </p>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.color}`}>
                            <cfg.Icon size={10}/> {cfg.label}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-gray-500 whitespace-nowrap">{formatDate(order.createdAt)}</td>
                        <td className="px-5 py-3.5 text-right font-bold text-gray-900">{formatPrice(order.total)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-primary-50 border-t-2 border-primary-100">
                    <td colSpan={5} className="px-5 py-3 text-sm font-bold text-primary-700">Total período</td>
                    <td className="px-5 py-3 text-right font-bold text-primary-700">{formatPrice(summary.totalIncome)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-50">
              {orders.map(order => {
                const cfg = STATUS_CONFIG[order.status] || { label: order.status, color:"bg-gray-100 text-gray-600", Icon: RiShoppingBagLine };
                return (
                  <div key={order.id} className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className="font-mono text-xs text-primary-600">{order.trackingToken}</span>
                        <p className="font-semibold text-gray-900 mt-0.5">{order.customerName}</p>
                      </div>
                      <p className="font-bold text-gray-900">{formatPrice(order.total)}</p>
                    </div>
                    <p className="text-xs text-gray-500 mb-2 line-clamp-1">
                      {order.items.map((i:any) => `${i.quantity>1?`x${i.quantity} `:""}${i.product?.name||"-"}`).join(" · ")}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.color}`}>
                        <cfg.Icon size={10}/> {cfg.label}
                      </span>
                      <span className="text-xs text-gray-400">{formatDate(order.createdAt)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-3">
          <button
            onClick={() => navigate({ periodo: filters.periodo||"semana", page: String(pagination.page - 1), ...(filters.from?{from:filters.from,to:filters.to||""}:{}) })}
            disabled={pagination.page <= 1}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            <RiArrowLeftLine size={15}/> Anterior
          </button>
          <span className="text-sm text-gray-500">
            {pagination.page} / {totalPages}
          </span>
          <button
            onClick={() => navigate({ periodo: filters.periodo||"semana", page: String(pagination.page + 1), ...(filters.from?{from:filters.from,to:filters.to||""}:{}) })}
            disabled={pagination.page >= totalPages}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            Siguiente <RiArrowRightLine size={15}/>
          </button>
        </div>
      )}
    </div>
  );
}