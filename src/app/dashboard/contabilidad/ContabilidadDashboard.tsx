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
import { formatPrice, formatTime, STATUS_LABELS } from "@/lib/utils";
import Pagination from "@/components/ui/Pagination";
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
    <div className="min-w-0 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-3 flex min-w-0 items-center justify-between gap-2">
        <span className="min-w-0 break-words text-sm font-medium text-gray-500">{label}</span>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${style}`}>
          <Icon className="text-lg" />
        </div>
      </div>
      <p className="break-words text-xl font-bold tabular-nums text-gray-900 sm:text-2xl">{value}</p>
      <p className="mt-1 break-words text-xs text-gray-400">{hint}</p>
      <p className={`mt-1 text-[11px] font-semibold ${trend.down ? "text-red-500" : "text-emerald-600"}`}>
        {trend.down ? "↓" : "↑"} {trend.value}% <span className="font-normal text-gray-400">vs período anterior</span>
      </p>
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
        `${format(new Date(item.date), "yyyy-MM-dd")} ${formatTime(item.date)}`,
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
      style: "bg-brand-50 text-primary-500",
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
    <div className="min-w-0">
      <div className="mx-auto max-w-[1500px] space-y-4">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <RiBarChartBoxLine className="text-primary-500" size={28} />
              <h1 className="text-2xl font-bold text-gray-900">Contabilidad</h1>
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
                  mode === item ? "bg-brand-500 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"
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

        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map(stat => <StatCard key={stat.label} {...stat} />)}
        </section>

        <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
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
                        movementType === value ? "bg-brand-500 text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
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
            <div className="py-16 text-center text-sm text-gray-400">No hay movimientos para mostrar.</div>
          ) : (
            <>
              {/* Movil: tarjetas */}
              <ul className="divide-y divide-gray-100 md:hidden">
                {pageItems.map(item => {
                  const date = new Date(item.date);
                  const isOrder = item.type === "order";
                  return (
                    <li key={`${item.type}-${item.id}`}>
                      <Link
                        href={isOrder ? `/dashboard/pedidos/${item.id}` : "/dashboard/egresos"}
                        className="block p-4 transition-colors hover:bg-brand-50/40"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="flex flex-wrap items-center gap-2 font-black text-gray-900">
                              {isOrder ? "Pedido" : "Egreso"}
                              {isOrder && <span className="text-xs font-semibold text-brand-600">#{item.token}</span>}
                            </p>
                            <p className="mt-0.5 break-words text-sm font-semibold text-gray-700">{item.title}</p>
                          </div>
                          <strong className={`shrink-0 tabular-nums ${isOrder ? "text-emerald-600" : "text-brand-600"}`}>
                            {isOrder ? "+" : "-"}{formatPrice(item.amount)}
                          </strong>
                        </div>
                        {item.subtitle && <p className="mt-1 truncate text-xs text-gray-500">{item.subtitle}</p>}
                        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3 text-xs text-gray-400">
                          <span className="capitalize">{format(date, "d MMM yyyy", { locale: es })}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${isOrder ? "bg-emerald-50 text-emerald-700" : "bg-brand-50 text-brand-700"}`}>
                            {isOrder ? STATUS_LABELS[item.status] || item.status : "Gasto"}
                          </span>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>

              {/* Escritorio: tabla */}
              <div className="hidden overflow-x-auto scrollbar-none md:block">
                <table className="w-full min-w-[760px] border-collapse text-left">
                  <thead className="bg-gray-50/80">
                    <tr className="border-b border-gray-100 text-[10px] font-bold uppercase tracking-wide text-gray-400">
                      <th className="w-28 whitespace-nowrap px-3 py-2.5">Fecha</th>
                      <th className="w-24 whitespace-nowrap px-3 py-2.5">Tipo</th>
                      <th className="px-3 py-2.5">Detalle</th>
                      <th className="w-40 whitespace-nowrap px-3 py-2.5">Estado</th>
                      <th className="w-32 whitespace-nowrap px-3 py-2.5 text-right">Monto</th>
                      <th className="w-12 px-3 py-2.5"><span className="sr-only">Acciones</span></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pageItems.map(item => {
                      const date = new Date(item.date);
                      const isOrder = item.type === "order";
                      return (
                        <tr key={`${item.type}-${item.id}`} className="group bg-white text-xs text-gray-600 transition-colors hover:bg-brand-50/40">
                          <td className="whitespace-nowrap px-3 py-2.5 font-semibold capitalize text-gray-700">
                            {format(date, "d MMM yyyy", { locale: es })}
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="inline-flex items-center gap-1.5 font-bold text-gray-900">
                              <span className={`flex h-6 w-6 items-center justify-center rounded-lg ${isOrder ? "bg-emerald-50 text-emerald-600" : "bg-brand-50 text-brand-600"}`}>
                                {isOrder ? <RiShoppingBagLine size={13} /> : <RiBankCardLine size={13} />}
                              </span>
                              {isOrder ? "Pedido" : "Egreso"}
                            </span>
                          </td>
                          <td className="max-w-0 px-3 py-2.5">
                            <p className="truncate font-bold text-gray-900">
                              {item.title}
                              {isOrder && <span className="ml-1.5 font-semibold text-brand-600">#{item.token}</span>}
                            </p>
                            <p className="mt-0.5 truncate text-[10px] text-gray-400">{[item.subtitle, item.detail].filter(Boolean).join(" · ")}</p>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${isOrder ? "bg-emerald-50 text-emerald-700" : "bg-brand-50 text-brand-700"}`}>
                              {isOrder ? STATUS_LABELS[item.status] || item.status : "Gasto"}
                            </span>
                          </td>
                          <td className={`whitespace-nowrap px-3 py-2.5 text-right text-sm font-bold tabular-nums ${isOrder ? "text-emerald-600" : "text-brand-600"}`}>
                            {isOrder ? "+" : "-"}{formatPrice(item.amount)}
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <Link
                              href={isOrder ? `/dashboard/pedidos/${item.id}` : "/dashboard/egresos"}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-brand-50 hover:text-brand-600"
                              aria-label={`Ver ${isOrder ? "pedido" : "egreso"}`}
                              title={`Ver ${isOrder ? "pedido" : "egreso"}`}
                            >
                              <RiEyeLine size={15} />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          <Pagination
            page={page}
            totalPages={totalPages}
            totalItems={movements.length}
            perPage={PER_PAGE}
            itemLabel="movimientos"
            onPageChange={setPage}
          />
        </section>
      </div>
    </div>
  );
}
