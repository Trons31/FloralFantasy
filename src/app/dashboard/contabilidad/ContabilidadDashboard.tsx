"use client";

import { useEffect, useRef, useState, type ComponentType, type ReactNode } from "react";
import Link from "next/link";
import { addMonths, format } from "date-fns";
import { es } from "date-fns/locale";
import {
  RiArrowDownLine,
  RiArrowLeftLine,
  RiArrowRightLine,
  RiCalendarLine,
  RiLoader4Line,
  RiMoneyDollarCircleLine,
  RiExternalLinkLine,
  RiShoppingBagLine,
} from "react-icons/ri";
import { formatPrice, STATUS_LABELS } from "@/lib/utils";
import type { AccountingSummary, AccountingMode } from "@/lib/accounting";

const PER_PAGE = 10;
const TAB_STYLES = {
  active: "bg-slate-900 text-white shadow-sm",
  idle: "text-slate-500 hover:bg-slate-50",
};

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon: ComponentType<{ size?: number; className?: string }>;
}) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-50 text-slate-600 sm:h-10 sm:w-10">
        <Icon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
      </div>
      <p className="text-[11px] font-medium text-slate-400 sm:text-xs">{label}</p>
      <p className="mt-1 text-lg font-semibold tracking-tight text-slate-900 sm:text-2xl">{value}</p>
      <p className="mt-1 text-[11px] leading-4 text-slate-500 sm:text-xs">{hint}</p>
    </div>
  );
}

function SectionCard({
  title,
  subtitle,
  children,
  right,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="rounded-[2rem] border border-slate-100 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-4 border-b border-slate-50 px-5 py-4">
        <div>
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
        </div>
        {right}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function TablePager({
  page,
  totalPages,
  total,
  onPrev,
  onNext,
}: {
  page: number;
  totalPages: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 border-t border-slate-50 px-4 py-3 sm:gap-3 sm:px-5">
      <button
        type="button"
        onClick={onPrev}
        disabled={page <= 1}
        className="inline-flex h-9 min-w-9 items-center justify-center rounded-xl px-2 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 sm:min-w-0 sm:px-3"
        aria-label="Página anterior"
      >
        <RiArrowLeftLine size={14} />
        <span className="ml-2 hidden text-sm font-medium sm:inline">Anterior</span>
      </button>
      <span className="flex-1 whitespace-nowrap text-center text-[11px] text-slate-400 sm:text-xs">
        {total} registros · pág. {page} de {Math.max(1, totalPages)}
      </span>
      <button
        type="button"
        onClick={onNext}
        disabled={page >= totalPages}
        className="inline-flex h-9 min-w-9 items-center justify-center rounded-xl px-2 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 sm:min-w-0 sm:px-3"
        aria-label="Página siguiente"
      >
        <span className="mr-2 hidden text-sm font-medium sm:inline">Siguiente</span>
        <RiArrowRightLine size={14} />
      </button>
    </div>
  );
}

function OrdersTable({ orders }: { orders: AccountingSummary["orders"] }) {
  if (!orders.length) {
    return (
      <div className="py-14 text-center">
        <RiShoppingBagLine className="mx-auto mb-3 text-slate-200" size={48} />
        <p className="text-sm text-slate-400">Sin pedidos en este período</p>
      </div>
    );
  }

  return (
    <>
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-50">
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Token</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Cliente</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Productos</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Estado</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Fecha</th>
              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">Total</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-slate-50 last:border-b-0 hover:bg-slate-50/60">
                <td className="px-5 py-3.5">
                  <span className="font-mono text-xs text-primary-600">{order.trackingToken}</span>
                </td>
                <td className="px-5 py-3.5">
                  <p className="font-medium text-slate-900">{order.customerName}</p>
                  <p className="text-xs text-slate-400">{order.customerPhone}</p>
                </td>
                <td className="px-5 py-3.5">
                  <p className="line-clamp-2 text-xs text-slate-600">{order.itemsSummary || "-"}</p>
                </td>
                <td className="px-5 py-3.5">
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                    {STATUS_LABELS[order.status] || order.status}
                  </span>
                </td>
                <td className="px-5 py-3.5 whitespace-nowrap text-xs text-slate-500">
                  {format(new Date(order.createdAt), "d MMM yyyy, h:mm a", { locale: es })}
                </td>
                <td className="px-5 py-3.5 text-right font-semibold text-slate-900">{formatPrice(order.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-slate-50 md:hidden">
        {orders.map((order) => (
          <div key={order.id} className="px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-mono text-[11px] text-primary-600">{order.trackingToken}</p>
                <p className="mt-1 font-medium text-slate-900">{order.customerName}</p>
                <p className="text-xs text-slate-400">{order.customerPhone}</p>
              </div>
              <p className="shrink-0 text-sm font-semibold text-slate-900">{formatPrice(order.total)}</p>
            </div>
            <p className="mt-2 line-clamp-2 text-xs text-slate-600">{order.itemsSummary || "-"}</p>
            <div className="mt-3 flex items-center justify-between gap-2">
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                {STATUS_LABELS[order.status] || order.status}
              </span>
              <span className="text-[11px] text-slate-500">
                {format(new Date(order.createdAt), "d MMM yyyy, h:mm a", { locale: es })}
              </span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function ExpensesTable({ expenses }: { expenses: AccountingSummary["expenses"] }) {
  if (!expenses.length) {
    return (
      <div className="py-14 text-center">
        <RiArrowDownLine className="mx-auto mb-3 text-slate-200" size={48} />
        <p className="text-sm text-slate-400">Sin egresos en este período</p>
      </div>
    );
  }

  return (
    <>
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-50">
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Descripción</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Categoría</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Fecha</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Registrado por</th>
              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">Monto</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((expense) => (
              <tr key={expense.id} className="border-b border-slate-50 last:border-b-0 hover:bg-slate-50/60">
                <td className="px-5 py-3.5">
                  <p className="font-medium text-slate-900">{expense.description}</p>
                </td>
                <td className="px-5 py-3.5">
                  <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                    {expense.category}
                  </span>
                </td>
                <td className="px-5 py-3.5 whitespace-nowrap text-xs text-slate-500">
                  {format(new Date(expense.date), "d MMM yyyy, h:mm a", { locale: es })}
                </td>
                <td className="px-5 py-3.5 text-xs text-slate-500">{expense.registeredBy || "—"}</td>
                <td className="px-5 py-3.5 text-right font-semibold text-rose-600">{formatPrice(expense.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-slate-50 md:hidden">
        {expenses.map((expense) => (
          <div key={expense.id} className="px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-slate-900">{expense.description}</p>
                <p className="mt-1 text-xs text-slate-500">{expense.registeredBy || "—"}</p>
              </div>
              <p className="shrink-0 text-sm font-semibold text-rose-600">{formatPrice(expense.amount)}</p>
            </div>
            <div className="mt-3 flex items-center justify-between gap-2">
              <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                {expense.category}
              </span>
              <span className="text-[11px] text-slate-500">
                {format(new Date(expense.date), "d MMM yyyy, h:mm a", { locale: es })}
              </span>
            </div>
          </div>
        ))}
      </div>
    </>
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
  const maxRevenue = Math.max(...days.map((d) => d.income), 1);
  const selectedRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    selectedRef.current?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [selectedDay, days]);

  return (
    <div className="rounded-[2rem] border border-slate-100 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">Días del mes</p>
          <p className="text-xs text-slate-500">Selecciona un día para ver su detalle.</p>
        </div>
        <span className="rounded-full bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-500">
          {days.length} días
        </span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {days.map((day) => {
          const active = day.dayNumber === selectedDay;
          const fill = day.income > 0 ? Math.max(8, Math.round((day.income / maxRevenue) * 100)) : 6;

          return (
            <button
              key={day.date}
              type="button"
              ref={active ? selectedRef : null}
              onClick={() => onSelectDay(day.dayNumber)}
              className={`min-w-[90px] rounded-2xl border p-3 text-left transition ${
                active ? "border-primary-300 bg-primary-50" : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
            >
              <p className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${active ? "text-primary-700" : "text-slate-400"}`}>
                {day.label}
              </p>
              <div className="mt-1 flex items-center justify-between">
                <span className={`text-sm font-semibold ${active ? "text-slate-900" : "text-slate-600"}`}>{day.dayNumber}</span>
                <span className="text-[11px] text-slate-400">{day.orders} ped.</span>
              </div>
              <div className="mt-3 h-1.5 rounded-full bg-slate-100">
                <div
                  className={`h-1.5 rounded-full ${active ? "bg-primary-500" : "bg-slate-300"}`}
                  style={{ width: `${fill}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-slate-500">{day.income > 0 ? formatPrice(day.income) : "Sin ventas"}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function ContabilidadDashboard({ initialData }: { initialData: AccountingSummary }) {
  const [data, setData] = useState<AccountingSummary>(initialData);
  const [mode, setMode] = useState<AccountingMode>(initialData.mode);
  const [year, setYear] = useState(initialData.year);
  const [month, setMonth] = useState(initialData.month);
  const [day, setDay] = useState(initialData.day ?? new Date().getDate());
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"orders" | "expenses">("orders");
  const [ordersPage, setOrdersPage] = useState(1);
  const [expensesPage, setExpensesPage] = useState(1);
  const skipFirstFetch = useRef(true);

  useEffect(() => {
    setOrdersPage(1);
    setExpensesPage(1);
  }, [mode, year, month, day]);

  useEffect(() => {
    if (skipFirstFetch.current) {
      skipFirstFetch.current = false;
      return;
    }

    const controller = new AbortController();

    const load = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          mode,
          year: String(year),
          month: String(month),
        });
        if (mode === "day") params.set("day", String(day));

        const res = await fetch(`/api/contabilidad?${params.toString()}`, { signal: controller.signal });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "No se pudo cargar la contabilidad");
        setData(json);
      } catch (error: any) {
        if (error?.name !== "AbortError") {
          console.error(error);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    load();
    return () => controller.abort();
  }, [mode, year, month, day]);

  useEffect(() => {
    if (!mode || mode !== "day") return;

    const current = new Date();
    const sameMonth = current.getFullYear() === year && current.getMonth() + 1 === month;
    const maxDay = new Date(year, month, 0).getDate();

    if (sameMonth) {
      setDay(current.getDate());
      return;
    }

    setDay((prev) => Math.min(Math.max(prev || current.getDate(), 1), maxDay));
  }, [mode, year, month]);

  const isDayMode = mode === "day";
  const periodIncome = data.summary.income;
  const periodExpenses = data.summary.expenses;
  const periodProfit = data.summary.profit;
  const margin = periodIncome > 0 ? (periodProfit / periodIncome) * 100 : 0;

  const changeMonth = (delta: number) => {
    const next = addMonths(new Date(year, month - 1, 1), delta);
    setYear(next.getFullYear());
    setMonth(next.getMonth() + 1);
  };

  const ordersTotalPages = Math.max(1, Math.ceil(data.orders.length / PER_PAGE));
  const expensesTotalPages = Math.max(1, Math.ceil(data.expenses.length / PER_PAGE));
  const ordersPageItems = data.orders.slice((ordersPage - 1) * PER_PAGE, ordersPage * PER_PAGE);
  const expensesPageItems = data.expenses.slice((expensesPage - 1) * PER_PAGE, expensesPage * PER_PAGE);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 lg:p-8">
      <div className="rounded-[2rem] border border-slate-100 bg-white px-5 py-5 shadow-sm lg:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-3xl font-extrabold leading-tight tracking-normal text-slate-900 sm:text-4xl">Contabilidad</p>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Revisa ingresos, egresos, ganancia, pedidos y movimientos del período seleccionado.
            </p>
          </div>

          <Link
            href="/dashboard/egresos"
            className="inline-flex items-center gap-2 self-start rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <RiArrowDownLine size={16} /> Gestionar egresos <RiExternalLinkLine size={13} />
          </Link>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[auto_1fr_auto] lg:items-center">
        <div className="inline-flex w-fit rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setMode("day")}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${mode === "day" ? TAB_STYLES.active : TAB_STYLES.idle}`}
          >
            Por día
          </button>
          <button
            type="button"
            onClick={() => setMode("month")}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${mode === "month" ? TAB_STYLES.active : TAB_STYLES.idle}`}
          >
            Por mes
          </button>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => changeMonth(-1)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50"
              aria-label="Mes anterior"
            >
              <RiArrowLeftLine size={18} />
            </button>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                <RiCalendarLine size={14} />
                {isDayMode ? "Mes y día activo" : "Mes activo"}
              </div>
              <p className="mt-1 truncate text-base font-semibold text-slate-900">{data.monthLabel}</p>
              <p className="text-xs text-slate-500">
                {isDayMode ? `Día seleccionado: ${data.periodLabel}` : `Período activo: ${data.periodLabel}`}
              </p>
            </div>

            <button
              type="button"
              onClick={() => changeMonth(1)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50"
              aria-label="Mes siguiente"
            >
              <RiArrowRightLine size={18} />
            </button>
          </div>
        </div>

        <div className="hidden lg:flex items-center justify-end gap-2 text-sm text-slate-500">
          {loading ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-2">
              <RiLoader4Line className="animate-spin" size={16} />
              Actualizando
            </span>
          ) : null}
        </div>
      </div>

      {isDayMode && <DayStrip days={data.days} selectedDay={day} onSelectDay={setDay} />}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Ingresos"
          value={formatPrice(periodIncome)}
          hint={isDayMode ? "Total del día seleccionado" : "Total del mes seleccionado"}
          icon={RiArrowRightLine}
        />
        <StatCard
          label="Egresos"
          value={formatPrice(periodExpenses)}
          hint={isDayMode ? "Gastos del día" : "Gastos del mes"}
          icon={RiArrowDownLine}
        />
        <StatCard
          label="Ganancia"
          value={formatPrice(periodProfit)}
          hint={`${margin.toFixed(1)}% de margen sobre ingresos`}
          icon={RiMoneyDollarCircleLine}
        />
        <StatCard
          label="Pedidos"
          value={String(data.summary.orderCount)}
          hint={isDayMode ? "Pedidos del día" : "Pedidos del mes"}
          icon={RiShoppingBagLine}
        />
      </div>

      <SectionCard
        title="Movimiento del período"
        subtitle="Pedidos y gastos"
        right={
          <div className="inline-flex w-fit rounded-2xl border border-slate-200 bg-white p-1">
            <button
              type="button"
              onClick={() => setActiveTab("orders")}
              className={`rounded-xl px-3 py-2 text-sm font-semibold transition sm:px-4 ${activeTab === "orders" ? TAB_STYLES.active : TAB_STYLES.idle}`}
            >
              Pedidos
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("expenses")}
              className={`rounded-xl px-3 py-2 text-sm font-semibold transition sm:px-4 ${activeTab === "expenses" ? TAB_STYLES.active : TAB_STYLES.idle}`}
            >
              Gastos
            </button>
          </div>
        }
      >
        {activeTab === "orders" ? (
          <div className="rounded-2xl border border-slate-100 overflow-hidden">
            <OrdersTable orders={ordersPageItems} />
            <TablePager
              page={ordersPage}
              totalPages={ordersTotalPages}
              total={data.orders.length}
              onPrev={() => setOrdersPage((prev) => Math.max(1, prev - 1))}
              onNext={() => setOrdersPage((prev) => Math.min(ordersTotalPages, prev + 1))}
            />
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-100 overflow-hidden">
            <ExpensesTable expenses={expensesPageItems} />
            <TablePager
              page={expensesPage}
              totalPages={expensesTotalPages}
              total={data.expenses.length}
              onPrev={() => setExpensesPage((prev) => Math.max(1, prev - 1))}
              onNext={() => setExpensesPage((prev) => Math.min(expensesTotalPages, prev + 1))}
            />
          </div>
        )}
      </SectionCard>
    </div>
  );
}
