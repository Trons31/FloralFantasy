"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { addMonths, format } from "date-fns";
import { es } from "date-fns/locale";
import {
  RiArrowDownLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiArrowUpLine,
  RiBankCardLine,
  RiBarChartBoxLine,
  RiCalendarLine,
  RiDownload2Line,
  RiEyeLine,
  RiFilter3Line,
  RiLoader4Line,
  RiMoneyDollarCircleLine,
  RiSearchLine,
  RiShoppingBagLine,
} from "react-icons/ri";
import { formatPrice, STATUS_LABELS } from "@/lib/utils";
import type {
  AccountingMode,
  AccountingSummary,
} from "@/lib/accounting";

const PER_PAGE = 10;

type MovementType = "all" | "orders" | "expenses";

type Movement =
  | {
      type: "order";
      id: string;
      date: string;
      title: string;
      subtitle: string;
      detail: string;
      token: string;
      status: string;
      amount: number;
    }
  | {
      type: "expense";
      id: string;
      date: string;
      title: string;
      subtitle: string;
      detail: string;
      category: string;
      amount: number;
    };

function percentChange(current: number, previous: number) {
  if (previous === 0) return { value: current === 0 ? 0 : 100, down: false };
  const raw = ((current - previous) / previous) * 100;
  return { value: Math.abs(Math.round(raw * 10) / 10), down: raw < 0 };
}

function StatCard({
  label,
  value,
  hint,
  trend,
  icon: Icon,
  style,
}: {
  label: string;
  value: string;
  hint: string;
  trend: { value: number; down: boolean };
  icon: ComponentType<{ size?: number; className?: string }>;
  style: string;
}) {
  return (
    <div className="flex min-h-[126px] items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${style}`}>
        <Icon size={25} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="mt-1 truncate text-xl font-bold text-[#11182c]">{value}</p>
        <p className="mt-1 truncate text-[10px] text-slate-400">{hint}</p>
        <p className={`mt-1.5 text-[10px] font-medium ${trend.down ? "text-rose-500" : "text-emerald-600"}`}>
          {trend.down ? "↓" : "↑"} {trend.value}% <span className="font-normal text-slate-400">vs período anterior</span>
        </p>
      </div>
    </div>
  );
}

function DayStrip({
  days,
  selectedDay,
  onSelectDay,
}: {
  days: AccountingSummary["days"];
  selectedDay: number | null;
  onSelectDay: (day: number) => void;
}) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef({ active: false, moved: false, startX: 0, scrollLeft: 0 });

  useEffect(() => {
    const track = trackRef.current;
    const active = track?.querySelector<HTMLElement>("[data-active-day='true']");
    if (!track || !active) return;
    track.scrollTo({
      left: active.offsetLeft - track.clientWidth / 2 + active.clientWidth / 2,
      behavior: "smooth",
    });
  }, [selectedDay, days]);

  return (
    <div
      ref={trackRef}
      onPointerDown={event => {
        if (event.pointerType !== "mouse" || !trackRef.current) return;
        dragRef.current = { active: true, moved: false, startX: event.clientX, scrollLeft: trackRef.current.scrollLeft };
      }}
      onPointerMove={event => {
        const track = trackRef.current;
        const drag = dragRef.current;
        if (event.pointerType !== "mouse" || !track || !drag.active) return;
        const distance = event.clientX - drag.startX;
        if (Math.abs(distance) > 4 && !drag.moved) {
          drag.moved = true;
          track.setPointerCapture(event.pointerId);
        }
        if (drag.moved) track.scrollLeft = drag.scrollLeft - distance;
      }}
      onPointerUp={event => {
        if (event.pointerType !== "mouse") return;
        dragRef.current.active = false;
        if (trackRef.current?.hasPointerCapture(event.pointerId)) trackRef.current.releasePointerCapture(event.pointerId);
      }}
      onPointerCancel={() => { dragRef.current.active = false; }}
      style={{ touchAction: "pan-x", WebkitOverflowScrolling: "touch" }}
      className="flex cursor-grab select-none gap-1.5 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-3 active:cursor-grabbing [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {days.map(item => {
        const active = item.dayNumber === selectedDay;
        return (
          <button
            key={item.date}
            type="button"
            data-active-day={active ? "true" : "false"}
            onClick={() => {
              if (dragRef.current.moved) {
                dragRef.current.moved = false;
                return;
              }
              onSelectDay(item.dayNumber);
            }}
            className={`min-w-[56px] flex-none rounded-xl border px-1 py-1.5 text-center transition sm:min-w-[60px] ${
              active ? "border-primary-500 bg-primary-500 text-white" : "border-slate-200 text-slate-600 hover:border-primary-200"
            }`}
          >
            <span className="block text-sm font-bold">{String(item.dayNumber).padStart(2, "0")}</span>
            <span className="block text-[10px] capitalize">{item.label}</span>
            <span className={`mt-0.5 block text-[8px] ${active ? "text-white/85" : "text-slate-400"}`}>{item.orders} ped.</span>
          </button>
        );
      })}
    </div>
  );
}
export default function ContabilidadDashboard({ initialData }: { initialData: AccountingSummary }) {
  const [data, setData] = useState(initialData);
  const [comparison, setComparison] = useState<AccountingSummary | null>(null);
  const [mode, setMode] = useState<AccountingMode>(initialData.mode);
  const [year, setYear] = useState(initialData.year);
  const [month, setMonth] = useState(initialData.month);
  const [day, setDay] = useState(initialData.day ?? new Date().getDate());
  const [loading, setLoading] = useState(false);
  const [movementType, setMovementType] = useState<MovementType>("all");
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);
  const skipFirstFetch = useRef(true);

  useEffect(() => {
    setPage(1);
  }, [mode, year, month, day, movementType, search]);

  useEffect(() => {
    if (skipFirstFetch.current) {
      skipFirstFetch.current = false;
      return;
    }
    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ mode, year: String(year), month: String(month) });
        if (mode === "day") params.set("day", String(day));
        const response = await fetch(`/api/contabilidad?${params}`, { signal: controller.signal });
        const json = await response.json();
        if (!response.ok) throw new Error(json.error || "No se pudo cargar la contabilidad");
        setData(json);
      } catch (error: any) {
        if (error?.name !== "AbortError") console.error(error);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    load();
    return () => controller.abort();
  }, [mode, year, month, day]);

  useEffect(() => {
    const controller = new AbortController();
    const previousDate =
      mode === "month"
        ? addMonths(new Date(year, month - 1, 1), -1)
        : new Date(year, month - 1, Math.max(1, day - 1));
    const params = new URLSearchParams({
      mode,
      year: String(previousDate.getFullYear()),
      month: String(previousDate.getMonth() + 1),
    });
    if (mode === "day") params.set("day", String(previousDate.getDate()));
    fetch(`/api/contabilidad?${params}`, { signal: controller.signal })
      .then(response => response.ok ? response.json() : null)
      .then(json => setComparison(json))
      .catch(error => {
        if (error?.name !== "AbortError") console.error(error);
      });
    return () => controller.abort();
  }, [mode, year, month, day]);

  useEffect(() => {
    if (mode !== "day") return;
    const maxDay = new Date(year, month, 0).getDate();
    setDay(previous => Math.min(Math.max(previous, 1), maxDay));
  }, [mode, year, month]);

  const changeMonth = (delta: number) => {
    const next = addMonths(new Date(year, month - 1, 1), delta);
    setYear(next.getFullYear());
    setMonth(next.getMonth() + 1);
  };

  const summary = data.summary;
  const previous = comparison?.summary;
  const margin = summary.income > 0 ? (summary.profit / summary.income) * 100 : 0;

  const movements = useMemo<Movement[]>(() => {
    const orderRows: Movement[] = data.orders.map(order => ({
      type: "order",
      id: order.id,
      date: order.createdAt,
      title: order.customerName,
      subtitle: order.itemsSummary || "Pedido floral",
      detail: order.customerPhone,
      token: order.trackingToken,
      status: order.status,
      amount: order.total,
    }));
    const expenseRows: Movement[] = data.expenses.map(expense => ({
      type: "expense",
      id: expense.id,
      date: expense.date,
      title: expense.description,
      subtitle: expense.category,
      detail: expense.registeredBy || "Sin responsable",
      category: expense.category,
      amount: expense.amount,
    }));
    const query = search.trim().toLowerCase();
    return [...orderRows, ...expenseRows]
      .filter(item => movementType === "all" || (movementType === "orders" ? item.type === "order" : item.type === "expense"))
      .filter(item => !query || `${item.title} ${item.subtitle} ${item.detail} ${item.type === "order" ? item.token : item.category}`.toLowerCase().includes(query))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [data.orders, data.expenses, movementType, search]);

  const totalPages = Math.max(1, Math.ceil(movements.length / PER_PAGE));
  const pageItems = movements.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const exportReport = () => {
    const rows = [
      ["Tipo", "Fecha", "Descripción", "Detalle", "Monto"],
      ...movements.map(item => [
        item.type === "order" ? "Pedido" : "Gasto",
        format(new Date(item.date), "yyyy-MM-dd HH:mm"),
        item.title,
        item.subtitle,
        item.type === "order" ? item.amount : -item.amount,
      ]),
    ];
    const csv = rows
      .map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `contabilidad-${year}-${String(month).padStart(2, "0")}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const stats = [
    {
      label: "Ingresos",
      value: formatPrice(summary.income),
      hint: "Total del período",
      trend: percentChange(summary.income, previous?.income || 0),
      icon: RiArrowUpLine,
      style: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Gastos",
      value: formatPrice(summary.expenses),
      hint: "Total del período",
      trend: percentChange(summary.expenses, previous?.expenses || 0),
      icon: RiArrowDownLine,
      style: "bg-rose-50 text-primary-500",
    },
    {
      label: "Ganancia",
      value: formatPrice(summary.profit),
      hint: `${margin.toFixed(1)}% de margen sobre ingresos`,
      trend: percentChange(summary.profit, previous?.profit || 0),
      icon: RiMoneyDollarCircleLine,
      style: "bg-violet-50 text-violet-600",
    },
    {
      label: "Pedidos",
      value: String(summary.orderCount),
      hint: "Pedidos en el período",
      trend: percentChange(summary.orderCount, previous?.orderCount || 0),
      icon: RiShoppingBagLine,
      style: "bg-blue-50 text-blue-600",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fc] px-4 py-6 sm:px-6 lg:px-7">
      <div className="mx-auto max-w-[1500px] space-y-4">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <RiBarChartBoxLine className="text-primary-500" size={28} />
              <h1 className="text-[28px] font-bold tracking-tight text-[#11182c]">Contabilidad</h1>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Revisa ingresos, egresos, ganancia, pedidos y movimientos del período seleccionado.
            </p>
          </div>
          <button
            type="button"
            onClick={exportReport}
            className="inline-flex h-11 w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
          >
            <RiDownload2Line size={17} /> Exportar reporte
          </button>
        </header>

        <div className="grid gap-3 lg:grid-cols-[200px_1fr]">
          <div className="inline-flex rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
            {(["day", "month"] as AccountingMode[]).map(item => (
              <button
                key={item}
                type="button"
                onClick={() => setMode(item)}
                className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  mode === item ? "bg-[#0d1830] text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {item === "day" ? "Por día" : "Por mes"}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <button type="button" onClick={() => changeMonth(-1)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50">
              <RiArrowLeftSLine size={20} />
            </button>
            <RiCalendarLine className="text-slate-500" size={18} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-base font-bold capitalize text-slate-900">{data.monthLabel}</p>
                <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-600">Período activo</span>
              </div>
              <p className="text-xs text-slate-400">
                {format(new Date(data.periodStart), "d MMM yyyy", { locale: es })} - {format(new Date(data.periodEnd), "d MMM yyyy", { locale: es })}
              </p>
            </div>
            {loading && <RiLoader4Line className="animate-spin text-primary-500" size={18} />}
            <button type="button" onClick={() => changeMonth(1)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50">
              <RiArrowRightSLine size={20} />
            </button>
          </div>
        </div>

        {mode === "day" && <DayStrip days={data.days} selectedDay={day} onSelectDay={setDay} />}

        <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {stats.map(stat => <StatCard key={stat.label} {...stat} />)}
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
          <div className="border-b border-slate-100 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Movimiento del período</h2>
                <div className="mt-2 flex flex-wrap gap-2">
                  {([
                    ["all", "Todos"],
                    ["orders", "Pedidos"],
                    ["expenses", "Gastos"],
                  ] as const).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setMovementType(value)}
                      className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
                        movementType === value ? "bg-[#0d1830] text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <div className="relative min-w-0 flex-1 lg:w-[285px]">
                  <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                  <input
                    value={search}
                    onChange={event => setSearch(event.target.value)}
                    placeholder="Buscar movimiento..."
                    className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-sm outline-none focus:border-primary-300"
                  />
                </div>
                <button type="button" onClick={() => setFiltersOpen(value => !value)}
                  className={`inline-flex h-11 items-center gap-2 rounded-xl border px-4 text-sm font-semibold ${
                    filtersOpen ? "border-primary-200 bg-primary-50 text-primary-600" : "border-slate-200 text-slate-700"
                  }`}>
                  <RiFilter3Line size={17} /> Filtros
                </button>
              </div>
            </div>
            {filtersOpen && (
              <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                <Link href="/dashboard/egresos" className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                  Gestionar egresos
                </Link>
                <button type="button" onClick={() => { setSearch(""); setMovementType("all"); }}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                  Limpiar filtros
                </button>
              </div>
            )}
          </div>

          {pageItems.length === 0 ? (
            <div className="py-16 text-center text-sm text-slate-400">No hay movimientos para mostrar.</div>
          ) : (
            <div className="divide-y divide-slate-100 px-4">
              {pageItems.map(item => {
                const date = new Date(item.date);
                const isOrder = item.type === "order";
                return (
                  <article key={`${item.type}-${item.id}`} className="grid gap-3 py-3 lg:grid-cols-[58px_48px_minmax(260px,1fr)_120px_145px] lg:items-center">
                    <div className="text-center">
                      <p className="text-lg font-bold leading-none text-slate-900">{date.getDate()}</p>
                      <p className="mt-1 text-[9px] font-semibold uppercase text-slate-500">{format(date, "MMM", { locale: es })}</p>
                    </div>
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${isOrder ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-primary-500"}`}>
                      {isOrder ? <RiShoppingBagLine size={18} /> : <RiBankCardLine size={18} />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-slate-900">{isOrder ? "Pedido" : "Egreso"}</p>
                        {isOrder && <span className="text-xs font-semibold text-primary-500">#{item.token}</span>}
                      </div>
                      <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                      <p className="truncate text-xs text-slate-500">{item.subtitle}</p>
                      <p className="truncate text-[10px] text-slate-400">{item.detail}</p>
                    </div>
                    <div>
                      <span className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[10px] font-semibold ${
                        isOrder ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-primary-500"
                      }`}>
                        <i className={`h-2 w-2 rounded-full ${isOrder ? "bg-emerald-500" : "bg-primary-500"}`} />
                        {isOrder ? STATUS_LABELS[item.status] || item.status : "Gasto"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 lg:flex-col lg:items-end">
                      <strong className={isOrder ? "text-emerald-600" : "text-primary-500"}>
                        {isOrder ? "+" : "-"}{formatPrice(item.amount)}
                      </strong>
                      <Link
                        href={isOrder ? `/dashboard/pedidos/${item.id}` : "/dashboard/egresos"}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-[10px] font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <RiEyeLine size={14} /> Ver {isOrder ? "pedido" : "egreso"}
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-center text-xs text-slate-500 sm:text-left">
              Mostrando {pageItems.length ? (page - 1) * PER_PAGE + 1 : 0} a {Math.min(page * PER_PAGE, movements.length)} de {movements.length} movimientos
            </p>
            <div className="flex justify-center gap-2">
              <button type="button" disabled={page <= 1} onClick={() => setPage(value => Math.max(1, value - 1))}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 text-slate-500 disabled:opacity-35">
                <RiArrowLeftSLine size={18} />
              </button>
              <span className="flex h-9 min-w-9 items-center justify-center rounded-lg bg-primary-500 px-3 text-sm font-semibold text-white">{page}</span>
              <button type="button" disabled={page >= totalPages} onClick={() => setPage(value => Math.min(totalPages, value + 1))}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 text-slate-500 disabled:opacity-35">
                <RiArrowRightSLine size={18} />
              </button>
            </div>
            <p className="text-center text-xs text-slate-500 sm:text-right">
              Mostrar <span className="ml-2 rounded-lg border border-slate-200 px-3 py-2 font-semibold">{PER_PAGE}</span>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
