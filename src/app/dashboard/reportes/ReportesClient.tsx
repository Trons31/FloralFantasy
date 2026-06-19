"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { addMonths } from "date-fns";
import {
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiBarChartBoxLine,
  RiCalendarLine,
  RiDownloadLine,
  RiFileList3Line,
  RiInformationLine,
  RiLoader4Line,
  RiMoneyDollarCircleLine,
  RiShoppingBag3Line,
  RiTeamLine,
  RiTimeLine,
  RiTruckLine,
  RiWallet3Line,
} from "react-icons/ri";
import { toast } from "sonner";
import { formatPrice } from "@/lib/utils";

type ReportMode = "day" | "month";

type DayItem = {
  date: string;
  dayNumber: number;
  label: string;
  activity: number;
};

type ActivityItem = {
  id: string;
  member: string;
  role: string;
  type: string;
  count: number;
  items: string[];
  evidenceCount?: number;
  lastActivity: string | null;
};

type ReportOrder = {
  id: string;
  trackingToken: string;
  customerName: string;
  customerPhone: string;
  status: string;
  total: number;
  createdAt: string;
  items: { quantity: number; product: { name: string } }[];
};

type ReportExpense = {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  registeredBy: string | null;
  receiptPhotoUrl: string | null;
};

type Props = {
  selection: {
    mode: ReportMode;
    year: number;
    month: number;
    day: number;
    monthLabel: string;
    periodLabel: string;
    periodFrom: string;
    periodTo: string;
  };
  days: DayItem[];
  summary: {
    income: number;
    expenses: number;
    profit: number;
    totalOrders: number;
    prepared: number;
    delivered: number;
  };
  activity: ActivityItem[];
  orders: ReportOrder[];
  expenses: ReportExpense[];
  teamLastAccess: { at?: string } | null;
};

const REVENUE_STATUSES = new Set(["PAID", "PROCESSING", "READY", "OUT_FOR_DELIVERY", "DELIVERED"]);

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  PENDING_PAYMENT_CONFIRMATION: "Por confirmar",
  PAYMENT_INVALID: "Pago inválido",
  PAID: "Pagado",
  PROCESSING: "En producción",
  READY: "Listo",
  OUT_FOR_DELIVERY: "En ruta",
  DELIVERED: "Entregado",
};

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-slate-100 text-slate-600",
  PENDING_PAYMENT_CONFIRMATION: "bg-amber-50 text-amber-700",
  PAYMENT_INVALID: "bg-red-50 text-red-600",
  PAID: "bg-blue-50 text-blue-600",
  PROCESSING: "bg-cyan-50 text-cyan-700",
  READY: "bg-emerald-50 text-emerald-600",
  OUT_FOR_DELIVERY: "bg-violet-50 text-violet-600",
  DELIVERED: "bg-green-50 text-green-600",
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatTime(value: string | null) {
  if (!value) return "Sin actividad";
  return new Intl.DateTimeFormat("es-CO", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function DayCarousel({
  days,
  selectedDay,
  onSelect,
}: {
  days: DayItem[];
  selectedDay: number;
  onSelect: (day: number) => void;
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
  }, [days, selectedDay]);

  return (
    <div
      ref={trackRef}
      onPointerDown={event => {
        if (event.pointerType !== "mouse" || !trackRef.current) return;
        dragRef.current = {
          active: true,
          moved: false,
          startX: event.clientX,
          scrollLeft: trackRef.current.scrollLeft,
        };
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
        if (trackRef.current?.hasPointerCapture(event.pointerId)) {
          trackRef.current.releasePointerCapture(event.pointerId);
        }
      }}
      onPointerCancel={() => {
        dragRef.current.active = false;
      }}
      style={{ touchAction: "pan-x", WebkitOverflowScrolling: "touch" }}
      className="flex cursor-grab select-none gap-1.5 overflow-x-auto active:cursor-grabbing [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
              onSelect(item.dayNumber);
            }}
            className={`min-w-[58px] flex-none rounded-xl border px-1 py-2 text-center transition sm:min-w-[64px] ${
              active
                ? "border-primary-500 bg-primary-500 text-white shadow-[0_8px_18px_rgba(236,18,91,.2)]"
                : "border-slate-200 bg-white text-slate-600 hover:border-primary-200"
            }`}
          >
            <span className="block text-sm font-bold">{String(item.dayNumber).padStart(2, "0")}</span>
            <span className="block text-[10px] capitalize">{item.label}</span>
            <span className={`mt-0.5 block text-[9px] ${active ? "font-semibold text-white" : "text-slate-400"}`}>
              {item.activity} act.
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default function ReportesClient({
  selection,
  days,
  summary,
  activity,
  orders,
  expenses,
  teamLastAccess,
}: Props) {
  const router = useRouter();
  const [movementTab, setMovementTab] = useState<"orders" | "expenses">("orders");
  const [exporting, setExporting] = useState(false);
  const monthDate = new Date(selection.year, selection.month - 1, 1);

  const navigate = ({
    year = selection.year,
    month = selection.month,
    day = selection.day,
    mode = selection.mode,
  }: Partial<{ year: number; month: number; day: number; mode: ReportMode }>) => {
    router.push(`/dashboard/reportes?year=${year}&month=${month}&day=${day}&mode=${mode}`);
  };

  const changeMonth = (delta: number) => {
    const next = addMonths(monthDate, delta);
    navigate({ year: next.getFullYear(), month: next.getMonth() + 1, day: 1 });
  };

  const goToday = () => {
    const today = new Date();
    navigate({
      year: today.getFullYear(),
      month: today.getMonth() + 1,
      day: today.getDate(),
      mode: "day",
    });
  };

  const exportPdf = () => {
    setExporting(true);
    try {
      const params = new URLSearchParams({
        from: selection.periodFrom,
        to: selection.periodTo,
        label: `Reporte de ${selection.periodLabel}`,
      });
      const reportUrl = `/api/reportes/pdf?${params.toString()}`;
      const popup = window.open(reportUrl, "_blank");
      if (!popup) throw new Error("Permite las ventanas emergentes para exportar el PDF");

      const startedAt = Date.now();
      const waitForReport = window.setInterval(() => {
        if (popup.closed) {
          window.clearInterval(waitForReport);
          setExporting(false);
          return;
        }

        try {
          const reportLoaded =
            popup.location.pathname === "/api/reportes/pdf" &&
            popup.document.readyState === "complete";

          if (reportLoaded) {
            window.clearInterval(waitForReport);
            window.setTimeout(() => {
              popup.focus();
              popup.print();
              setExporting(false);
            }, 300);
            return;
          }
        } catch {
          // The window may be navigating; retry until the report is ready.
        }

        if (Date.now() - startedAt > 15000) {
          window.clearInterval(waitForReport);
          setExporting(false);
          toast.error("El reporte tardó demasiado en cargar");
        }
      }, 150);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo exportar el reporte");
      setExporting(false);
    }
  };

  const financialCards = [
    {
      label: "Ingresos",
      value: formatPrice(summary.income),
      detail: `${orders.filter(order => REVENUE_STATUSES.has(order.status)).length} pedidos con ingreso`,
      Icon: RiMoneyDollarCircleLine,
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Egresos",
      value: formatPrice(summary.expenses),
      detail: `${expenses.length} movimientos`,
      Icon: RiWallet3Line,
      color: "bg-rose-50 text-primary-500",
    },
    {
      label: "Balance",
      value: formatPrice(summary.profit),
      detail: summary.profit >= 0 ? "Resultado positivo" : "Resultado negativo",
      Icon: RiBarChartBoxLine,
      color: summary.profit >= 0 ? "bg-violet-50 text-violet-600" : "bg-red-50 text-red-600",
    },
    {
      label: "Pedidos",
      value: String(summary.totalOrders),
      detail: `${summary.delivered} entregados`,
      Icon: RiShoppingBag3Line,
      color: "bg-blue-50 text-blue-600",
    },
  ];

  return (
    <div className="min-h-full bg-slate-50/70 p-3 sm:p-5 lg:p-7">
      <div className="mx-auto max-w-[1500px] space-y-5">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary-50 text-primary-500">
              <RiBarChartBoxLine size={23} />
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Reportes</h1>
              <p className="mt-1 text-sm text-slate-500">Ingresos, egresos y actividad operativa del negocio.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={exportPdf}
            disabled={exporting}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary-500 px-5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(236,18,91,.2)] transition hover:bg-primary-600 disabled:opacity-60"
          >
            {exporting ? <RiLoader4Line className="animate-spin" /> : <RiDownloadLine />}
            {exporting ? "Generando..." : "Exportar PDF"}
          </button>
        </header>

        <section className="grid gap-3 lg:grid-cols-[220px_minmax(0,1fr)]">
          <div className="inline-flex rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
            {(["day", "month"] as ReportMode[]).map(mode => (
              <button
                key={mode}
                type="button"
                onClick={() => navigate({ mode })}
                className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  selection.mode === mode
                    ? "bg-[#0d1830] text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {mode === "day" ? "Por día" : "Por mes"}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-sm sm:px-4">
            <button
              type="button"
              onClick={() => changeMonth(-1)}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-500 hover:border-primary-200 hover:text-primary-500"
              aria-label="Mes anterior"
            >
              <RiArrowLeftSLine size={20} />
            </button>
            <RiCalendarLine className="hidden shrink-0 text-slate-500 sm:block" size={18} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-base font-bold capitalize text-slate-900">{selection.monthLabel}</p>
                <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-600">Período activo</span>
              </div>
              <p className="truncate text-xs capitalize text-slate-400">{selection.periodLabel}</p>
            </div>
            <button
              type="button"
              onClick={goToday}
              className="hidden rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-600 transition hover:bg-primary-500 hover:text-white sm:block"
            >
              Hoy
            </button>
            <button
              type="button"
              onClick={() => changeMonth(1)}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-500 hover:border-primary-200 hover:text-primary-500"
              aria-label="Mes siguiente"
            >
              <RiArrowRightSLine size={20} />
            </button>
          </div>
        </section>

        {selection.mode === "day" && (
          <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="mb-3 flex items-center justify-between px-1 sm:hidden">
              <span className="text-xs font-semibold capitalize text-slate-700">{selection.periodLabel}</span>
              <button type="button" onClick={goToday} className="rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-600">Hoy</button>
            </div>
            <DayCarousel
              days={days}
              selectedDay={selection.day}
              onSelect={day => navigate({ day, mode: "day" })}
            />
          </section>
        )}

        <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {financialCards.map(card => (
            <article key={card.label} className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${card.color}`}>
                  <card.Icon size={21} />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-500">{card.label}</p>
                  <strong className="mt-1 block truncate text-lg font-bold text-slate-950 sm:text-xl" title={card.value}>{card.value}</strong>
                  <p className="mt-1 truncate text-[11px] text-slate-500">{card.detail}</p>
                </div>
              </div>
            </article>
          ))}
        </section>

        {activity.length > 0 && (
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="font-bold text-slate-950">Actividad operativa</h2>
                <p className="mt-1 text-xs text-slate-500">Resumen compacto de preparación y entregas.</p>
              </div>
              <div className="flex flex-wrap gap-2 text-[11px] text-slate-500">
                <span className="rounded-lg bg-emerald-50 px-3 py-2 font-semibold text-emerald-700">{summary.prepared} preparados</span>
                <span className="rounded-lg bg-blue-50 px-3 py-2 font-semibold text-blue-700">{summary.delivered} entregados</span>
              </div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {activity.map(item => {
                const isDelivery = item.role === "REPARTIDOR";
                const Icon = isDelivery ? RiTruckLine : RiTeamLine;
                return (
                  <article key={item.id} className="flex items-center gap-4 rounded-xl border border-slate-200 p-4">
                    <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${isDelivery ? "bg-blue-50 text-blue-600" : "bg-emerald-50 text-emerald-600"}`}>
                      <Icon size={20} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-900">{item.member}</p>
                      <p className="mt-1 text-xs text-slate-500">{item.type}: <strong>{item.count}</strong></p>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1 text-[10px] text-slate-400">
                      <RiTimeLine /> {formatTime(item.lastActivity)}
                    </span>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div>
              <h2 className="font-bold text-slate-950">Movimientos del período</h2>
              <p className="mt-1 text-xs text-slate-500">Detalle financiero de {selection.periodLabel}.</p>
            </div>
            <div className="inline-flex rounded-xl bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => setMovementTab("orders")}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition ${
                  movementTab === "orders" ? "bg-white text-primary-600 shadow-sm" : "text-slate-500"
                }`}
              >
                <RiShoppingBag3Line /> Pedidos ({orders.length})
              </button>
              <button
                type="button"
                onClick={() => setMovementTab("expenses")}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition ${
                  movementTab === "expenses" ? "bg-white text-primary-600 shadow-sm" : "text-slate-500"
                }`}
              >
                <RiWallet3Line /> Egresos ({expenses.length})
              </button>
            </div>
          </div>

          {movementTab === "orders" ? (
            <OrdersTable orders={orders} />
          ) : (
            <ExpensesTable expenses={expenses} />
          )}

          <div className="m-4 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/60 p-4 sm:m-5">
            <RiInformationLine className="mt-0.5 shrink-0 text-blue-600" size={20} />
            <p className="text-[11px] leading-5 text-slate-500">
              Los ingresos consideran pedidos pagados o que ya entraron al flujo operativo. El PDF incluye el resumen financiero, pedidos, egresos y actividad del equipo.
              {teamLastAccess?.at ? ` Último acceso a operaciones: ${formatTime(teamLastAccess.at)}.` : ""}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

function OrdersTable({ orders }: { orders: ReportOrder[] }) {
  if (!orders.length) return <EmptyMovements text="No hay pedidos en este período." />;
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[820px] text-left text-xs">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-5 py-3 font-semibold">Pedido</th>
              <th className="px-5 py-3 font-semibold">Cliente</th>
              <th className="px-5 py-3 font-semibold">Productos</th>
              <th className="px-5 py-3 font-semibold">Estado</th>
              <th className="px-5 py-3 font-semibold">Fecha</th>
              <th className="px-5 py-3 text-right font-semibold">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.map(order => (
              <tr key={order.id}>
                <td className="px-5 py-4 font-mono font-semibold text-primary-500">{order.trackingToken}</td>
                <td className="px-5 py-4">
                  <p className="font-semibold text-slate-900">{order.customerName}</p>
                  <p className="mt-1 text-[10px] text-slate-400">{order.customerPhone}</p>
                </td>
                <td className="max-w-56 px-5 py-4 text-slate-600">
                  <p className="line-clamp-2">{order.items.map(item => `${item.quantity > 1 ? `${item.quantity}x ` : ""}${item.product.name}`).join(", ")}</p>
                </td>
                <td className="px-5 py-4">
                  <span className={`rounded-lg px-2.5 py-1 text-[10px] font-semibold ${STATUS_STYLES[order.status] || "bg-slate-100 text-slate-600"}`}>
                    {STATUS_LABELS[order.status] || order.status}
                  </span>
                </td>
                <td className="whitespace-nowrap px-5 py-4 text-slate-500">{formatDateTime(order.createdAt)}</td>
                <td className="whitespace-nowrap px-5 py-4 text-right font-bold text-slate-900">{formatPrice(order.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="divide-y divide-slate-100 md:hidden">
        {orders.map(order => (
          <article key={order.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-xs font-semibold text-primary-500">{order.trackingToken}</p>
                <p className="mt-1 font-semibold text-slate-900">{order.customerName}</p>
              </div>
              <strong className="shrink-0 text-sm text-slate-900">{formatPrice(order.total)}</strong>
            </div>
            <p className="mt-2 line-clamp-2 text-xs text-slate-500">{order.items.map(item => item.product.name).join(", ")}</p>
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className={`rounded-lg px-2.5 py-1 text-[10px] font-semibold ${STATUS_STYLES[order.status] || "bg-slate-100 text-slate-600"}`}>{STATUS_LABELS[order.status] || order.status}</span>
              <span className="text-[10px] text-slate-400">{formatDateTime(order.createdAt)}</span>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

function ExpensesTable({ expenses }: { expenses: ReportExpense[] }) {
  if (!expenses.length) return <EmptyMovements text="No hay egresos en este período." />;
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[720px] text-left text-xs">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-5 py-3 font-semibold">Descripción</th>
              <th className="px-5 py-3 font-semibold">Categoría</th>
              <th className="px-5 py-3 font-semibold">Responsable</th>
              <th className="px-5 py-3 font-semibold">Fecha</th>
              <th className="px-5 py-3 text-right font-semibold">Monto</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {expenses.map(expense => (
              <tr key={expense.id}>
                <td className="px-5 py-4 font-semibold text-slate-900">{expense.description}</td>
                <td className="px-5 py-4"><span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600">{expense.category}</span></td>
                <td className="px-5 py-4 text-slate-600">{expense.registeredBy || "Sin responsable"}</td>
                <td className="whitespace-nowrap px-5 py-4 text-slate-500">{formatDateTime(expense.date)}</td>
                <td className="whitespace-nowrap px-5 py-4 text-right font-bold text-primary-500">-{formatPrice(expense.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="divide-y divide-slate-100 md:hidden">
        {expenses.map(expense => (
          <article key={expense.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900">{expense.description}</p>
                <p className="mt-1 text-xs text-slate-500">{expense.registeredBy || "Sin responsable"}</p>
              </div>
              <strong className="shrink-0 text-sm text-primary-500">-{formatPrice(expense.amount)}</strong>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600">{expense.category}</span>
              <span className="text-[10px] text-slate-400">{formatDateTime(expense.date)}</span>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

function EmptyMovements({ text }: { text: string }) {
  return (
    <div className="grid min-h-52 place-items-center px-5 py-10 text-center">
      <div>
        <RiFileList3Line className="mx-auto text-slate-300" size={34} />
        <p className="mt-3 text-sm font-semibold text-slate-700">{text}</p>
        <p className="mt-1 text-xs text-slate-500">Prueba seleccionando otro período.</p>
      </div>
    </div>
  );
}
