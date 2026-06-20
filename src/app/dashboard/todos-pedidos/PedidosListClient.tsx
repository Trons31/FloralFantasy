"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import PhotoViewer from "@/components/client/PhotoViewer";
import CreateOrderModal from "@/components/admin/CreateOrderModal";
import ResponsiveModal from "@/components/ui/ResponsiveModal";
import Pagination from "@/components/ui/Pagination";
import { formatPrice } from "@/lib/utils";
import {
  RiAddLine,
  RiArrowDownSLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiBarChartLine,
  RiCheckboxCircleLine,
  RiCloseCircleLine,
  RiCloseLine,
  RiDownload2Line,
  RiEditLine,
  RiFilter3Line,
  RiFlashlightLine,
  RiFlowerLine,
  RiImageLine,
  RiLoader4Line,
  RiMapPin2Line,
  RiRouteLine,
  RiSearchLine,
  RiShoppingBagLine,
  RiTimeLine,
  RiWhatsappLine,
  RiWifiOffLine,
  RiZoomInLine,
} from "react-icons/ri";

type DayItem = { date: string; count: number };

const STATUS_CONFIG: Record<string, {
  label: string;
  shortLabel: string;
  color: string;
  dot: string;
}> = {
  PENDING_PAYMENT_CONFIRMATION: {
    label: "Pendiente de confirmación",
    shortLabel: "Pendiente",
    color: "border-amber-200 bg-amber-50 text-amber-600",
    dot: "bg-amber-400",
  },
  PAYMENT_INVALID: {
    label: "Pago inválido",
    shortLabel: "Pago inválido",
    color: "border-red-200 bg-red-50 text-red-600",
    dot: "bg-red-500",
  },
  PENDING: {
    label: "Pendiente",
    shortLabel: "Pendiente",
    color: "border-amber-200 bg-amber-50 text-amber-600",
    dot: "bg-amber-400",
  },
  PAID: {
    label: "En producción",
    shortLabel: "En producción",
    color: "border-blue-100 bg-blue-50 text-blue-600",
    dot: "bg-blue-500",
  },
  PROCESSING: {
    label: "En producción",
    shortLabel: "En producción",
    color: "border-blue-100 bg-blue-50 text-blue-600",
    dot: "bg-blue-500",
  },
  READY: {
    label: "En producción",
    shortLabel: "En producción",
    color: "border-blue-100 bg-blue-50 text-blue-600",
    dot: "bg-blue-500",
  },
  OUT_FOR_DELIVERY: {
    label: "En ruta",
    shortLabel: "En ruta",
    color: "border-violet-100 bg-violet-50 text-violet-600",
    dot: "bg-violet-600",
  },
  DELIVERED: {
    label: "Entregado",
    shortLabel: "Entregado",
    color: "border-emerald-100 bg-emerald-50 text-emerald-600",
    dot: "bg-emerald-500",
  },
  CANCELLED: {
    label: "Cancelado",
    shortLabel: "Cancelado",
    color: "border-slate-200 bg-slate-50 text-slate-600",
    dot: "bg-slate-500",
  },
};

const STATUS_FILTERS = [
  { value: "PENDING", label: "Pendiente", dot: "bg-amber-400" },
  { value: "PAYMENT_INVALID", label: "Pago inválido", dot: "bg-red-500" },
  { value: "PAID", label: "Pagado", dot: "bg-cyan-500" },
  { value: "PRODUCTION", label: "En producción", dot: "bg-blue-500" },
  { value: "OUT_FOR_DELIVERY", label: "En ruta", dot: "bg-violet-600" },
  { value: "DELIVERED", label: "Entregado", dot: "bg-emerald-500" },
  { value: "CANCELLED", label: "Cancelado", dot: "bg-slate-500" },
];

function parseDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function shiftMonth(value: string, amount: number) {
  const current = parseDate(value);
  const targetMonth = new Date(current.getFullYear(), current.getMonth() + amount, 1);
  const lastDay = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0).getDate();
  targetMonth.setDate(Math.min(current.getDate(), lastDay));
  return dateKey(targetMonth);
}

function monthLabel(value: string) {
  const label = parseDate(value).toLocaleDateString("es-CO", {
    month: "long",
    year: "numeric",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function formatDay(value: string) {
  const date = parseDate(value);
  const weekday = date.toLocaleDateString("es-CO", { weekday: "short" }).replace(".", "");
  return {
    number: String(date.getDate()).padStart(2, "0"),
    weekday: weekday.charAt(0).toUpperCase() + weekday.slice(1),
  };
}


function formatDateTime(iso: string) {
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getProductName(order: any) {
  const items = Array.isArray(order.items) ? order.items : [];
  if (!items.length) return "Pedido floral";
  const firstName = items[0]?.product?.name || "Arreglo personalizado";
  return items.length > 1 ? `${firstName} +${items.length - 1}` : firstName;
}

function getProductImage(order: any) {
  return order.items?.[0]?.product?.images?.[0]?.url || null;
}

function isPaid(status: string) {
  return ["PAID", "PROCESSING", "READY", "OUT_FOR_DELIVERY", "DELIVERED"].includes(status);
}

function whatsappUrl(order: any) {
  const digits = String(order.customerPhone || "").replace(/\D/g, "");
  const phone = digits.length === 10 && digits.startsWith("3") ? `57${digits}` : digits;
  const text = encodeURIComponent(
    `Hola ${order.customerName}, te escribo por tu pedido ${order.trackingToken}.`
  );
  return phone ? `https://wa.me/${phone}?text=${text}` : "";
}

function getBouquetSummary(customization: any) {
  const baseFlowers = Array.isArray(customization?.baseFlowers) ? customization.baseFlowers : [];
  const extraFlowers = Array.isArray(customization?.extraFlowers) ? customization.extraFlowers : [];
  const sizeModes = customization?.sizeModes || {};
  const hasIncrease =
    Boolean(sizeModes.enlarged) ||
    baseFlowers.some((flower: any) => (flower.quantity ?? 0) > (flower.baseQuantity ?? flower.quantity ?? 0));
  const hasDecrease =
    Boolean(sizeModes.reduced) ||
    baseFlowers.some((flower: any) => (flower.quantity ?? 0) < (flower.baseQuantity ?? flower.quantity ?? 0));
  const hasExtras = extraFlowers.length > 0;
  if (((hasIncrease || hasExtras) && hasDecrease) || (hasIncrease && hasExtras && hasDecrease)) {
    return { label: "Mixto", detail: "flores aumentadas, reducidas y agregadas" };
  }
  if (hasIncrease || hasExtras) {
    return {
      label: "Agrandado",
      detail: hasExtras
        ? `${extraFlowers.length} flor${extraFlowers.length !== 1 ? "es" : ""} extra`
        : "flores base aumentadas",
    };
  }
  if (hasDecrease) return { label: "Reducido", detail: "flores base reducidas" };
  return { label: "Normal", detail: "sin cambios" };
}

function csvCell(value: unknown) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function getTrend(current: number, previous: number) {
  if (previous === 0) return { value: current === 0 ? "0%" : "100%", down: false };
  const percentage = Math.round(Math.abs(((current - previous) / previous) * 1000)) / 10;
  return { value: `${percentage}%`, down: current < previous };
}

function visiblePages(page: number, total: number) {
  if (total <= 5) return Array.from({ length: total }, (_, index) => index + 1);
  const pages: Array<number | "ellipsis"> = [1];
  if (page > 3) pages.push("ellipsis");
  for (let value = Math.max(2, page - 1); value <= Math.min(total - 1, page + 1); value++) {
    pages.push(value);
  }
  if (page < total - 2) pages.push("ellipsis");
  pages.push(total);
  return pages;
}

export default function PedidosListClient({
  orders,
  summary,
  statusBreakdown,
  dashboardStats,
  previousStats,
  days,
  pagination,
  filters,
  databaseError = false,
}: {
  orders: any[];
  summary: { total: number; count: number };
  statusBreakdown: { status: string; count: number }[];
  dashboardStats: {
    total: number;
    pending: number;
    production: number;
    route: number;
    delivered: number;
    cancelled: number;
  };
  previousStats: {
    total: number;
    pending: number;
    production: number;
    route: number;
    delivered: number;
    cancelled: number;
  };
  days: DayItem[];
  pagination: { page: number; perPage: number; total: number };
  filters: { date: string; anchor: string; status?: string; q?: string };
  databaseError?: boolean;
}) {
  const router = useRouter();
  const [isNavigating, startNavigation] = useTransition();
  const [searchVal, setSearchVal] = useState(filters.q || "");
  const [updating, setUpdating] = useState<string | null>(null);
  const [viewPhoto, setViewPhoto] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const daysTrackRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef({ active: false, moved: false, startX: 0, scrollLeft: 0 });
  const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.perPage));

  const navigate = (params: Record<string, string | undefined>) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) searchParams.set(key, value);
    });
    startNavigation(() => {
      router.push(`/dashboard/todos-pedidos?${searchParams.toString()}`);
    });
  };

  const currentFilters = (overrides: Record<string, string | undefined> = {}) => ({
    date: filters.date,
    anchor: filters.anchor,
    status: filters.status,
    q: filters.q,
    ...overrides,
  });

  const selectDay = (date: string) => {
    navigate(currentFilters({ date, page: undefined }));
  };

  const changeMonth = (amount: number) => {
    const date = shiftMonth(filters.date, amount);
    navigate(currentFilters({ date, anchor: date, page: undefined }));
  };

  const startDaysDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse") return;
    const track = daysTrackRef.current;
    if (!track) return;
    dragStateRef.current = {
      active: true,
      moved: false,
      startX: event.clientX,
      scrollLeft: track.scrollLeft,
    };
  };

  const moveDaysDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse") return;
    const track = daysTrackRef.current;
    const drag = dragStateRef.current;
    if (!track || !drag.active) return;
    const distance = event.clientX - drag.startX;
    if (Math.abs(distance) > 4 && !drag.moved) {
      drag.moved = true;
      track.setPointerCapture(event.pointerId);
    }
    if (!drag.moved) return;
    track.scrollLeft = drag.scrollLeft - distance;
  };

  const endDaysDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse") return;
    const track = daysTrackRef.current;
    dragStateRef.current.active = false;
    if (track?.hasPointerCapture(event.pointerId)) track.releasePointerCapture(event.pointerId);
  };

  const handleDayClick = (date: string) => {
    if (dragStateRef.current.moved) {
      dragStateRef.current.moved = false;
      return;
    }
    selectDay(date);
  };

  useEffect(() => {
    const track = daysTrackRef.current;
    const activeDay = track?.querySelector<HTMLElement>("[data-active-day='true']");
    if (!track || !activeDay) return;
    track.scrollTo({
      left: activeDay.offsetLeft - track.clientWidth / 2 + activeDay.clientWidth / 2,
      behavior: "smooth",
    });
  }, [filters.date, filters.anchor]);

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    navigate(currentFilters({ q: searchVal || undefined, page: undefined }));
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdating(orderId);
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) throw new Error("No fue posible actualizar");
      toast.success("Estado actualizado");
      setSelectedOrder((previous: any) =>
        previous?.id === orderId ? { ...previous, status: newStatus } : previous
      );
      router.refresh();
    } catch {
      toast.error("Error al actualizar");
    } finally {
      setUpdating(null);
    }
  };

  const handleExport = () => {
    if (!orders.length) {
      toast.error("No hay pedidos para exportar");
      return;
    }
    const rows = [
      ["Token", "Cliente", "Teléfono", "Dirección", "Producto", "Estado", "Total", "Fecha"],
      ...orders.map(order => [
        order.trackingToken,
        order.customerName,
        order.customerPhone,
        order.address,
        getProductName(order),
        STATUS_CONFIG[order.status]?.label || order.status,
        order.total,
        formatDateTime(order.createdAt),
      ]),
    ];
    const csv = rows.map(row => row.map(csvCell).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `pedidos-${filters.date}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const stats = [
    { key: "total" as const, label: "Total pedidos", value: dashboardStats.total, icon: RiShoppingBagLine, iconStyle: "bg-rose-50 text-primary-500" },
    { key: "pending" as const, label: "Pendientes", value: dashboardStats.pending, icon: RiFlashlightLine, iconStyle: "bg-orange-50 text-orange-500" },
    { key: "production" as const, label: "En producción", value: dashboardStats.production, icon: RiFlowerLine, iconStyle: "bg-blue-50 text-blue-600" },
    { key: "route" as const, label: "En ruta", value: dashboardStats.route, icon: RiRouteLine, iconStyle: "bg-violet-50 text-violet-600" },
    { key: "delivered" as const, label: "Entregados hoy", value: dashboardStats.delivered, icon: RiCheckboxCircleLine, iconStyle: "bg-emerald-50 text-emerald-600" },
    { key: "cancelled" as const, label: "Cancelados", value: dashboardStats.cancelled, icon: RiCloseCircleLine, iconStyle: "bg-red-50 text-red-500" },
  ].map(stat => ({ ...stat, trend: getTrend(stat.value, previousStats[stat.key]) }));

  return (
    <div className="min-h-screen bg-[#f8f9fc] px-4 py-5 sm:px-6 lg:px-7">
      <div className={`mx-auto max-w-[1500px] space-y-4 transition-opacity ${isNavigating ? "opacity-65" : "opacity-100"}`}>
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <RiShoppingBagLine className="text-primary-500" size={27} />
              <h1 className="text-[28px] font-bold tracking-tight text-[#11182c]">Pedidos</h1>
            </div>
            <p className="mt-1 text-sm text-slate-500">Gestiona y monitorea todos los pedidos de tu tienda</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={handleExport}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50">
              <RiDownload2Line size={17} /> Exportar
            </button>
            <button type="button" onClick={() => setCreateOpen(true)}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 px-5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(232,24,90,0.22)] transition hover:-translate-y-0.5">
              <RiAddLine size={18} /> Nuevo pedido
            </button>
          </div>
        </header>

        {databaseError && (
          <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900 sm:flex-row sm:items-center">
            <div className="flex flex-1 items-start gap-3">
              <RiWifiOffLine className="mt-0.5 shrink-0 text-amber-600" size={20} />
              <div>
                <p className="text-sm font-semibold">No fue posible conectar con la base de datos</p>
                <p className="mt-0.5 text-xs text-amber-700">Puedes volver a intentar sin salir de esta pantalla.</p>
              </div>
            </div>
            <button type="button" onClick={() => router.refresh()}
              className="w-fit rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white">
              Reintentar
            </button>
          </div>
        )}

        <section className="grid grid-cols-2 gap-2.5 lg:grid-cols-3 2xl:grid-cols-6">
          {stats.map(stat => (
            <div key={stat.label}
              className="flex min-h-[96px] items-center gap-2.5 rounded-2xl border border-slate-200/80 bg-white px-3 py-3 shadow-[0_7px_22px_rgba(15,23,42,0.04)] sm:gap-4 sm:px-4 sm:py-4">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full sm:h-12 sm:w-12 ${stat.iconStyle}`}>
                <stat.icon size={21} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[9px] font-medium text-slate-500 sm:text-[11px]">{stat.label}</p>
                <p className="mt-0.5 text-lg font-bold text-[#11182c] sm:text-xl">{stat.value}</p>
                <p className={`mt-1 truncate text-[8px] sm:text-[10px] ${stat.trend.down ? "text-red-500" : "text-emerald-600"}`}>
                  {stat.trend.down ? "↓" : "↑"} <span className="font-semibold">{stat.trend.value}</span>
                  <span className="ml-1 text-slate-400">vs ayer</span>
                </p>
              </div>
            </div>
          ))}
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white px-3 py-3 shadow-[0_7px_22px_rgba(15,23,42,0.04)] sm:px-4">
          <div className="mb-2 flex items-center justify-between gap-3 px-1">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Calendario de pedidos</p>
              <p className="text-sm font-bold text-slate-800">{monthLabel(filters.anchor)}</p>
            </div>
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-1">
              <button type="button" onClick={() => changeMonth(-1)} aria-label="Mes anterior"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white hover:text-primary-500">
                <RiArrowLeftSLine size={20} />
              </button>
              <span className="min-w-[112px] text-center text-xs font-semibold text-slate-700 sm:min-w-[128px]">
                {monthLabel(filters.anchor)}
              </span>
              <button type="button" onClick={() => changeMonth(1)} aria-label="Mes siguiente"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white hover:text-primary-500">
                <RiArrowRightSLine size={20} />
              </button>
            </div>
          </div>

          <div
            ref={daysTrackRef}
            onPointerDown={startDaysDrag}
            onPointerMove={moveDaysDrag}
            onPointerUp={endDaysDrag}
            onPointerCancel={endDaysDrag}
            onPointerLeave={event => {
              if (event.pointerType === "mouse" && dragStateRef.current.active) endDaysDrag(event);
            }}
            style={{ touchAction: "pan-x", WebkitOverflowScrolling: "touch" }}
            className="flex w-full cursor-grab select-none gap-1.5 overflow-x-auto px-0.5 py-1 active:cursor-grabbing [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {days.map(day => {
              const formatted = formatDay(day.date);
              const active = day.date === filters.date;
              return (
                <button key={day.date} type="button" data-active-day={active ? "true" : "false"}
                  onClick={() => handleDayClick(day.date)}
                  className={`relative min-w-[56px] flex-none snap-center rounded-xl border px-1 py-1.5 text-center transition sm:min-w-[60px] ${
                    active
                      ? "border-primary-500 bg-gradient-to-b from-primary-500 to-primary-600 text-white shadow-[0_8px_18px_rgba(232,24,90,0.22)]"
                      : "border-slate-200 bg-white text-slate-800 hover:border-primary-200 hover:bg-primary-50/30"
                  }`}>
                  <span className="block text-sm font-bold leading-none">{formatted.number}</span>
                  <span className={`mt-0.5 block text-[10px] font-medium ${active ? "text-white" : "text-slate-600"}`}>
                    {formatted.weekday}
                  </span>
                  <span className={`mt-0.5 block text-[8px] ${active ? "font-semibold text-white" : "text-slate-400"}`}>
                    {day.count} ped.
                  </span>

                </button>
              );
            })}
          </div>
        </section>
        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_7px_22px_rgba(15,23,42,0.04)]">
          <div className="p-3">
            <form onSubmit={handleSearch} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_150px]">
              <div className="relative">
                <RiSearchLine className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={19} />
                <input value={searchVal} onChange={event => setSearchVal(event.target.value)}
                  placeholder="Buscar por nombre, teléfono, token o dirección..."
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-12 pr-11 text-sm outline-none transition placeholder:text-slate-400 focus:border-primary-300 focus:ring-4 focus:ring-primary-50" />
                {searchVal && (
                  <button type="button" aria-label="Limpiar búsqueda"
                    onClick={() => {
                      setSearchVal("");
                      if (filters.q) navigate(currentFilters({ q: undefined, page: undefined }));
                    }}
                    className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100">
                    <RiCloseLine size={16} />
                  </button>
                )}
              </div>


              <button type="button" onClick={() => setFiltersOpen(open => !open)}
                className={`inline-flex h-12 items-center justify-between rounded-xl border px-4 text-sm font-medium transition ${
                  filtersOpen || filters.status
                    ? "border-primary-200 bg-primary-50 text-primary-600"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}>
                <span className="flex items-center gap-2"><RiFilter3Line size={18} /> Filtros</span>
                <RiArrowDownSLine size={17} />
              </button>
            </form>

            {filtersOpen && (
              <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                <button type="button" onClick={() => navigate(currentFilters({ status: undefined, page: undefined }))}
                  className={`rounded-xl border px-5 py-2 text-xs font-semibold transition ${
                    !filters.status
                      ? "border-primary-400 bg-primary-50/40 text-primary-500"
                      : "border-slate-200 bg-white text-slate-600"
                  }`}>
                  Todos
                </button>
                {STATUS_FILTERS.map(filter => (
                  <button key={filter.value} type="button"
                    onClick={() => navigate(currentFilters({ status: filter.value, page: undefined }))}
                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium transition ${
                      filters.status === filter.value
                        ? "border-slate-300 bg-slate-100 text-slate-900"
                        : "border-slate-100 bg-slate-50/80 text-slate-700 hover:border-slate-200"
                    }`}>
                    <span className={`h-2 w-2 rounded-full ${filter.dot}`} />
                    {filter.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {orders.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center border-t border-slate-100 px-6 py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-50 text-primary-400">
                <RiShoppingBagLine size={28} />
              </div>
              <h2 className="mt-4 text-base font-semibold text-slate-900">No hay pedidos para este día</h2>
              <p className="mt-1 text-sm text-slate-500">Selecciona otra fecha o cambia los filtros.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border-t border-slate-100">
              {orders.map(order => {
                const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
                const productImage = getProductImage(order);
                const whatsapp = whatsappUrl(order);
                return (
                  <article key={order.id}
                    className="grid grid-cols-3 gap-x-3 gap-y-2 px-3 py-2.5 transition hover:bg-slate-50/60 lg:grid-cols-[minmax(210px,1fr)_82px_72px_82px_minmax(240px,auto)] lg:items-center">
                    <div className="col-span-3 flex min-w-0 gap-3 lg:col-span-1">
                      <button type="button" disabled={!productImage}
                        onClick={() => productImage && setViewPhoto(productImage)}
                        className="group relative flex h-[72px] w-[72px] sm:h-[78px] sm:w-[78px] shrink-0 items-center justify-center overflow-hidden rounded-xl bg-rose-50 text-primary-300 disabled:cursor-default">
                        {productImage ? (
                          <>
                            <img src={productImage} alt={getProductName(order)} className="h-full w-full object-cover" />
                            <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100">
                              <RiZoomInLine size={22} />
                            </span>
                          </>
                        ) : <RiFlowerLine size={30} />}
                      </button>
                      <div className="min-w-0 py-0.5">
                        <p className="text-xs font-semibold text-primary-500">#{order.trackingToken}</p>
                        <h3 className="mt-0.5 truncate text-sm font-bold text-[#11182c] sm:text-[15px]">{order.customerName}</h3>
                        <div className="mt-0.5 flex items-center gap-2">
                          <p className="text-xs text-slate-500">{order.customerPhone}</p>
                          {whatsapp && <RiWhatsappLine className="text-emerald-500" size={14} />}
                        </div>
                        <p className="mt-1 flex items-center gap-1.5 truncate text-[11px] text-slate-600">
                          <RiFlowerLine className="text-slate-400" size={13} /> {getProductName(order)}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-slate-400">
                          <span className="flex min-w-0 items-center gap-1">
                            <RiMapPin2Line size={13} />
                            <span className="max-w-[210px] truncate">{order.address}</span>
                          </span>
                          <span className="flex items-center gap-1"><RiTimeLine size={13} /> {formatDateTime(order.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="mb-1 text-[9px] text-slate-400">Estado</p>
                      <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[9px] font-medium ${status.color}`}>
                        <span className={`h-2 w-2 rounded-full ${status.dot}`} /> {status.shortLabel}
                      </span>
                    </div>

                    <div>
                      <p className="mb-1 text-[9px] text-slate-400">Pago</p>
                      <span className={`inline-flex rounded-lg px-2 py-1.5 text-[9px] font-medium ${
                        isPaid(order.status) ? "bg-emerald-50 text-emerald-600" : "border border-red-100 bg-red-50 text-red-500"
                      }`}>
                        {isPaid(order.status) ? "Validado ✓" : "Pendiente"}
                      </span>
                    </div>

                    <div>
                      <p className="mb-1 text-[9px] text-slate-400">Total</p>
                      <p className="text-sm font-bold text-[#11182c]">{formatPrice(order.total)}</p>
                    </div>

                    <div className="col-span-3 grid w-full grid-cols-3 gap-1.5 border-t border-slate-100 pt-2 lg:col-span-1 lg:flex lg:w-auto lg:justify-end lg:border-0 lg:pt-0">
                      <button type="button" onClick={() => setSelectedOrder(order)}
                        className="inline-flex h-8 w-full items-center justify-center gap-1 whitespace-nowrap rounded-lg bg-emerald-600 px-1.5 text-[9px] sm:gap-1.5 sm:px-2 sm:text-[10px] sm:w-auto font-semibold text-white shadow-sm transition hover:bg-emerald-700">
                        <RiCheckboxCircleLine size={16} /> Validar pago
                      </button>
                      <button type="button" onClick={() => router.push(`/dashboard/pedidos/${order.id}`)}
                        className="inline-flex h-8 w-full items-center justify-center gap-1 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-1.5 text-[9px] sm:gap-1.5 sm:px-2 sm:text-[10px] sm:w-auto font-semibold text-slate-800 transition hover:bg-slate-50">
                        <RiEditLine size={15} /> Editar pedido
                      </button>
                      {whatsapp ? (
                        <a href={whatsapp} target="_blank" rel="noopener noreferrer"
                          className="inline-flex h-8 w-full items-center justify-center gap-1 whitespace-nowrap rounded-lg border border-emerald-200 bg-white px-1.5 text-[9px] sm:gap-1.5 sm:px-2 sm:text-[10px] sm:w-auto font-semibold text-emerald-600 transition hover:bg-emerald-50">
                          <RiWhatsappLine size={16} /> WhatsApp
                        </a>
                      ) : (
                        <button type="button" disabled
                          className="inline-flex h-8 w-full items-center justify-center gap-1 whitespace-nowrap rounded-lg border border-slate-200 px-1.5 text-[9px] sm:gap-1.5 sm:px-2 sm:text-[10px] sm:w-auto font-semibold text-slate-300">
                          <RiWhatsappLine size={16} /> WhatsApp
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          <Pagination
            page={pagination.page}
            totalPages={totalPages}
            totalItems={pagination.total}
            perPage={pagination.perPage}
            itemLabel="pedidos"
            onPageChange={nextPage => navigate(currentFilters({ page: String(nextPage) }))}
          />
        </section>
      </div>

      <ResponsiveModal
        open={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title="Detalle del pedido"
        description={selectedOrder?.trackingToken || ""}
        panelClassName="md:max-w-4xl"
      >
        {selectedOrder && (
          <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-4">
              <div className="space-y-1.5 rounded-2xl bg-gray-50 p-4 text-sm">
                <p><span className="text-gray-400">Cliente:</span> <strong>{selectedOrder.customerName}</strong></p>
                <p><span className="text-gray-400">Teléfono:</span> {selectedOrder.customerPhone}</p>
                <p><span className="text-gray-400">Dirección:</span> {selectedOrder.address}</p>
                {selectedOrder.addressRef && <p><span className="text-gray-400">Referencia:</span> {selectedOrder.addressRef}</p>}
                <p><span className="text-gray-400">Estado:</span> <strong>{STATUS_CONFIG[selectedOrder.status]?.label || selectedOrder.status}</strong></p>
                <p><span className="text-gray-400">Método:</span> {selectedOrder.paymentMethodTitle || "Sin método seleccionado"}</p>
                {typeof selectedOrder.manualAdjustment === "number" && selectedOrder.manualAdjustment !== 0 && (
                  <p>
                    <span className="text-gray-400">Ajuste manual:</span>{" "}
                    <strong className={selectedOrder.manualAdjustment > 0 ? "text-green-600" : "text-red-600"}>
                      {selectedOrder.manualAdjustment > 0 ? "+" : ""}{formatPrice(selectedOrder.manualAdjustment)}
                    </strong>
                  </p>
                )}
              </div>

              {selectedOrder.adminNote && (
                <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                  <p className="mb-2 text-sm font-semibold text-amber-800">Observaciones del pedido</p>
                  <p className="whitespace-pre-line text-sm text-amber-900">{selectedOrder.adminNote}</p>
                </div>
              )}

              <div className="rounded-2xl border border-gray-100 bg-white p-4">
                <p className="mb-3 text-sm font-semibold text-gray-900">Productos</p>
                <div className="space-y-2">
                  {selectedOrder.items.map((item: any, index: number) => (
                    <div key={index} className="flex items-start justify-between gap-3 text-sm">
                      <div>
                        <p className="font-medium text-gray-900">{item.quantity > 1 ? `x${item.quantity} ` : ""}{item.product?.name || "-"}</p>
                        {item.addons?.length > 0 && (
                          <p className="text-xs text-gray-400">+ {item.addons.map((addon: any) => addon.addon?.name).filter(Boolean).join(", ")}</p>
                        )}
                        {item.customization?.bouquetSize && (
                          <p className="mt-1 text-xs font-semibold text-rose-500">
                            {getBouquetSummary(item.customization).label}
                            {getBouquetSummary(item.customization).detail !== "sin cambios"
                              ? ` · ${getBouquetSummary(item.customization).detail}`
                              : ""}
                          </p>
                        )}
                      </div>
                      <p className="font-semibold text-gray-900">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {selectedOrder.paymentProofUrl ? (
                <button type="button" onClick={() => setViewPhoto(selectedOrder.paymentProofUrl)}
                  className="w-full rounded-2xl border border-dashed border-primary-200 bg-primary-50 p-3 text-left">
                  <p className="mb-2 text-sm font-semibold text-primary-700">Comprobante cargado</p>
                  <img src={selectedOrder.paymentProofUrl} alt="Comprobante" className="h-56 w-full rounded-xl object-cover" />
                  <p className="mt-2 text-xs text-primary-600">Toca para ampliarlo</p>
                </button>
              ) : (
                <div className="rounded-2xl border border-dashed border-gray-200 p-4 text-sm text-gray-400">
                  Aún no hay comprobante asociado a este pedido.
                </div>
              )}

              {selectedOrder.deliveryPhotoUrl && (
                <button type="button" onClick={() => setViewPhoto(selectedOrder.deliveryPhotoUrl)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-left text-sm font-semibold text-emerald-700">
                  <RiImageLine size={20} /> Ver foto de entrega
                </button>
              )}
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl border border-gray-100 bg-white p-4">
                {["PENDING", "PENDING_PAYMENT_CONFIRMATION", "PAYMENT_INVALID"].includes(selectedOrder.status) ? (
                  <>
                    <p className="mb-2 text-sm font-semibold text-gray-900">Acciones de validación</p>
                    <div className="space-y-2">
                      <button type="button" onClick={() => handleStatusChange(selectedOrder.id, "PAID")}
                        disabled={updating === selectedOrder.id}
                        className="w-full rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">
                        {updating === selectedOrder.id ? <RiLoader4Line className="mx-auto animate-spin" size={18} /> : "Validar pago"}
                      </button>
                      <button type="button" onClick={() => handleStatusChange(selectedOrder.id, "PAYMENT_INVALID")}
                        disabled={updating === selectedOrder.id}
                        className="w-full rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 disabled:opacity-50">
                        Pago inválido
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="mb-2 text-sm font-semibold text-gray-900">Estado del pago</p>
                    <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
                      <p className="text-sm font-semibold text-green-700">El pago fue validado correctamente.</p>
                      <p className="mt-1 text-xs text-green-600">El pedido continúa en el flujo de preparación y entrega.</p>
                    </div>
                  </>
                )}
              </div>

              <button type="button"
                onClick={() => router.push(`/dashboard/pedidos/${selectedOrder.id}`)}
                className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">
                Editar pedido
              </button>
            </div>
          </div>
        )}
      </ResponsiveModal>

      {viewPhoto && <PhotoViewer url={viewPhoto} onClose={() => setViewPhoto(null)} />}
      <CreateOrderModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => router.refresh()}
      />
    </div>
  );
}
