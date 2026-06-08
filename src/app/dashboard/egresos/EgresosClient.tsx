"use client";

import { useEffect, useRef, useState, type ComponentType, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { addMonths, format } from "date-fns";
import { es } from "date-fns/locale";
import PhotoViewer from "@/components/client/PhotoViewer";
import ResponsiveModal from "@/components/ui/ResponsiveModal";
import {
  RiAddLine,
  RiArrowDownLine,
  RiArrowLeftLine,
  RiArrowRightLine,
  RiCalendarLine,
  RiCheckLine,
  RiDeleteBinLine,
  RiLoader4Line,
  RiReceiptLine,
  RiZoomInLine,
} from "react-icons/ri";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";

const CATS = ["Flores", "Transporte", "Decoracion", "Empaque", "Personal", "Servicios", "Otro"];

const CAT_COLORS: Record<string, string> = {
  Flores: "bg-pink-100 text-pink-700",
  Transporte: "bg-blue-100 text-blue-700",
  Decoracion: "bg-purple-100 text-purple-700",
  Empaque: "bg-amber-100 text-amber-700",
  Personal: "bg-teal-100 text-teal-700",
  Servicios: "bg-indigo-100 text-indigo-700",
  Otro: "bg-slate-100 text-slate-600",
  Insumos: "bg-orange-100 text-orange-700",
};

type ExpenseItem = {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  createdAt: string;
  registeredBy?: string | null;
  receiptPhotoUrl?: string | null;
  receiptPublicId?: string | null;
};

type DaySummary = {
  date: string;
  dayNumber: number;
  label: string;
  count: number;
  amount: number;
};

function normalizeCategory(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function getExpensePhotoUrls(expense: ExpenseItem) {
  if (expense.receiptPublicId) {
    try {
      const parsed = JSON.parse(expense.receiptPublicId);
      if (Array.isArray(parsed)) {
        const urls = parsed
          .filter((photo): photo is { url?: unknown } => !!photo && typeof photo === "object")
          .map((photo) => (typeof photo.url === "string" ? photo.url : ""))
          .filter(Boolean);
        if (urls.length) return urls;
      }
    } catch {
      // fall through to the primary photo url
    }
  }
  return expense.receiptPhotoUrl ? [expense.receiptPhotoUrl] : [];
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon: ComponentType<{ className?: string }>;
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
        aria-label="Pagina anterior"
      >
        <RiArrowLeftLine size={14} />
        <span className="ml-2 hidden text-sm font-medium sm:inline">Anterior</span>
      </button>
      <span className="flex-1 whitespace-nowrap text-center text-[11px] text-slate-400 sm:text-xs">
        {total} registros · pag. {page} de {Math.max(1, totalPages)}
      </span>
      <button
        type="button"
        onClick={onNext}
        disabled={page >= totalPages}
        className="inline-flex h-9 min-w-9 items-center justify-center rounded-xl px-2 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 sm:min-w-0 sm:px-3"
        aria-label="Pagina siguiente"
      >
        <span className="mr-2 hidden text-sm font-medium sm:inline">Siguiente</span>
        <RiArrowRightLine size={14} />
      </button>
    </div>
  );
}

function DayStrip({
  days,
  selectedDay,
  onSelectDay,
}: {
  days: DaySummary[];
  selectedDay: number;
  onSelectDay: (day: number) => void;
}) {
  const selectedRef = useRef<HTMLButtonElement | null>(null);
  const maxAmount = Math.max(...days.map((item) => item.amount), 1);

  useEffect(() => {
    selectedRef.current?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [days, selectedDay]);

  return (
    <div className="rounded-[2rem] border border-slate-100 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">Dias del mes</p>
          <p className="text-xs text-slate-500">Selecciona un dia para ver sus egresos.</p>
        </div>
        <span className="rounded-full bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-500">
          {days.length} dias
        </span>
      </div>

      <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2">
        {days.map((day) => {
          const active = day.dayNumber === selectedDay;
          const fill = day.amount > 0 ? Math.max(8, Math.round((day.amount / maxAmount) * 100)) : 6;

          return (
            <button
              key={day.date}
              type="button"
              ref={active ? selectedRef : null}
              onClick={() => onSelectDay(day.dayNumber)}
              className={`min-w-[92px] snap-start rounded-2xl border p-3 text-left transition ${
                active ? "border-primary-300 bg-primary-50" : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
            >
              <p className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${active ? "text-primary-700" : "text-slate-400"}`}>
                {day.label}
              </p>
              <div className="mt-1 flex items-center justify-between gap-2">
                <span className={`text-sm font-semibold ${active ? "text-slate-900" : "text-slate-600"}`}>{day.dayNumber}</span>
                <span className="text-[11px] text-slate-400">{day.count} eg.</span>
              </div>
              <div className="mt-3 h-1.5 rounded-full bg-slate-100">
                <div
                  className={`h-1.5 rounded-full ${active ? "bg-primary-500" : "bg-slate-300"}`}
                  style={{ width: `${fill}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-slate-500">{day.amount > 0 ? formatPrice(day.amount) : "Sin gastos"}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ExpensesTable({
  expenses,
  deleting,
  onDelete,
  onViewPhoto,
}: {
  expenses: ExpenseItem[];
  deleting: string | null;
  onDelete: (id: string) => void;
  onViewPhoto: (urls: string[]) => void;
}) {
  if (!expenses.length) {
    return (
      <div className="py-14 text-center">
        <RiArrowDownLine className="mx-auto mb-3 text-slate-200" size={48} />
        <p className="text-sm text-slate-400">Sin egresos en este dia</p>
      </div>
    );
  }

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-50">
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Descripcion</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Categoria</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Fecha</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Comprobante</th>
              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">Monto</th>
              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((expense) => {
              const photoUrls = getExpensePhotoUrls(expense);
              return (
                <tr key={expense.id} className="border-b border-slate-50 last:border-b-0 hover:bg-slate-50/60">
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-slate-900">{expense.description}</p>
                    {expense.registeredBy ? <p className="mt-1 text-xs text-slate-400">{expense.registeredBy}</p> : null}
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        CAT_COLORS[normalizeCategory(expense.category)] || "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {expense.category}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-xs text-slate-500">
                    {format(new Date(expense.date), "d MMM yyyy, h:mm a", { locale: es })}
                  </td>
                  <td className="px-5 py-3.5">
                    {photoUrls.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => onViewPhoto(photoUrls)}
                        className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-200"
                      >
                        <RiZoomInLine size={12} />
                        Ver{photoUrls.length > 1 ? ` (${photoUrls.length})` : ""}
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400">Sin foto</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right font-semibold text-rose-600">{formatPrice(expense.amount)}</td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => onDelete(expense.id)}
                      disabled={deleting === expense.id}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-300 transition hover:bg-rose-50 hover:text-rose-500 disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="Eliminar egreso"
                    >
                      {deleting === expense.id ? <RiLoader4Line className="animate-spin" size={14} /> : <RiDeleteBinLine size={14} />}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-slate-50 md:hidden">
        {expenses.map((expense) => {
          const photoUrls = getExpensePhotoUrls(expense);
          return (
            <div key={expense.id} className="px-4 py-4">
              <div className="flex items-start gap-3">
                {photoUrls.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => onViewPhoto(photoUrls)}
                    className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-amber-200 bg-amber-50"
                  >
                    <img src={photoUrls[0]} alt="Comprobante" className="h-full w-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition hover:bg-black/20">
                      <RiZoomInLine className="text-white opacity-0 transition hover:opacity-100" size={18} />
                    </div>
                    {photoUrls.length > 1 && (
                      <div className="absolute bottom-1 right-1 rounded-full bg-black/65 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                        +{photoUrls.length - 1}
                      </div>
                    )}
                  </button>
                ) : (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50">
                    <RiReceiptLine className="text-slate-300" size={18} />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900">{expense.description}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        CAT_COLORS[normalizeCategory(expense.category)] || "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {expense.category}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {format(new Date(expense.date), "d MMM yyyy, h:mm a", { locale: es })}
                    </span>
                  </div>
                  {expense.registeredBy ? <p className="mt-1 text-xs text-slate-500">{expense.registeredBy}</p> : null}
                </div>

                <div className="flex shrink-0 flex-col items-end gap-2">
                  <p className="text-sm font-semibold text-rose-600">{formatPrice(expense.amount)}</p>
                  <button
                    type="button"
                    onClick={() => onDelete(expense.id)}
                    disabled={deleting === expense.id}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-300 transition hover:bg-rose-50 hover:text-rose-500 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Eliminar egreso"
                  >
                    {deleting === expense.id ? <RiLoader4Line className="animate-spin" size={14} /> : <RiDeleteBinLine size={14} />}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

export default function EgresosClient({
  expenses,
  summary,
  pagination,
  selection,
  days,
}: {
  expenses: ExpenseItem[];
  summary: { total: number; count: number };
  pagination: { page: number; perPage: number; total: number };
  selection: {
    year: number;
    month: number;
    day: number;
    monthLabel: string;
    dayLabel: string;
    selectedDateValue: string;
  };
  days: DaySummary[];
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [viewPhotos, setViewPhotos] = useState<string[] | null>(null);
  const [form, setForm] = useState({
    description: "",
    amount: "",
    category: "Flores",
  });

  const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.perPage));

  const navigate = (params: Record<string, string | undefined>) => {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) sp.set(key, value);
    });
    router.push(`/dashboard/egresos?${sp.toString()}`);
  };

  const changeMonth = (delta: number) => {
    const next = addMonths(new Date(selection.year, selection.month - 1, 1), delta);
    const maxDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
    const nextDay = Math.min(selection.day, maxDay);

    navigate({
      year: String(next.getFullYear()),
      month: String(next.getMonth() + 1),
      day: String(nextDay),
      page: "1",
    });
  };

  const handleSave = async () => {
    if (!form.description.trim() || !form.amount) {
      toast.error("Completa todos los campos");
      return;
    }

    setSaving(true);
    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        amount: Number.parseFloat(form.amount),
        date: selection.selectedDateValue,
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      toast.error(data.error || "Error");
      setSaving(false);
      return;
    }

    setForm({ description: "", amount: "", category: "Flores" });
    setShowForm(false);
    toast.success("Egreso registrado");
    router.refresh();
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Eliminar este egreso?")) return;
    setDeleting(id);
    const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Eliminado");
      router.refresh();
    } else {
      toast.error("Error al eliminar");
    }
    setDeleting(null);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 lg:p-8">
      <div className="rounded-[2rem] border border-slate-100 bg-white px-5 py-5 shadow-sm lg:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-3xl font-extrabold leading-tight tracking-normal text-slate-900 sm:text-4xl">Egresos</p>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Gestiona todos los gastos del negocio.</p>
          </div>

          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 self-start rounded-2xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-700"
          >
            <RiAddLine size={16} /> Registrar egreso
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => changeMonth(-1)}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50"
            aria-label="Mes anterior"
          >
            <RiArrowLeftLine size={18} />
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
              <RiCalendarLine size={14} />
              Mes activo
            </div>
            <p className="mt-1 truncate text-base font-semibold text-slate-900">{selection.monthLabel}</p>
            <p className="text-xs text-slate-500">Dia seleccionado: {selection.dayLabel}</p>
          </div>

          <button
            type="button"
            onClick={() => changeMonth(1)}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50"
            aria-label="Mes siguiente"
          >
            <RiArrowRightLine size={18} />
          </button>
        </div>
      </div>

      <DayStrip
        days={days}
        selectedDay={selection.day}
        onSelectDay={(day) =>
          navigate({
            year: String(selection.year),
            month: String(selection.month),
            day: String(day),
            page: "1",
          })
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard
          label="Total egresos"
          value={formatPrice(summary.total)}
          hint="Gastos del dia seleccionado"
          icon={RiArrowDownLine}
        />
        <StatCard
          label="Registros"
          value={String(summary.count)}
          hint="Egresos del dia"
          icon={RiReceiptLine}
        />
        <StatCard
          label="Promedio por egreso"
          value={summary.count > 0 ? formatPrice(summary.total / summary.count) : "Sin registros"}
          hint="Promedio del dia seleccionado"
          icon={RiCalendarLine}
        />
      </div>

      <SectionCard
        title="Registros del dia"
        subtitle={selection.dayLabel}
        right={<span className="text-xs font-medium text-slate-400">Total: {pagination.total}</span>}
      >
        <ExpensesTable expenses={expenses} deleting={deleting} onDelete={handleDelete} onViewPhoto={(urls) => setViewPhotos(urls)} />

        <TablePager
          page={pagination.page}
          totalPages={totalPages}
          total={pagination.total}
          onPrev={() =>
            navigate({
              year: String(selection.year),
              month: String(selection.month),
              day: String(selection.day),
              page: String(Math.max(1, pagination.page - 1)),
            })
          }
          onNext={() =>
            navigate({
              year: String(selection.year),
              month: String(selection.month),
              day: String(selection.day),
              page: String(Math.min(totalPages, pagination.page + 1)),
            })
          }
        />
      </SectionCard>

      <ResponsiveModal open={showForm} onClose={() => setShowForm(false)} title="Registrar egreso" panelClassName="sm:max-w-lg">
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Se registrara en</p>
            <p className="mt-1 text-sm font-medium text-slate-900">{selection.dayLabel}</p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Descripcion *</label>
            <input
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              placeholder="Ej: Compra de rosas rojas"
              autoComplete="off"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base focus:border-primary-400 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Monto (COP) *</label>
              <input
                value={form.amount}
                onChange={(event) => setForm((prev) => ({ ...prev, amount: event.target.value }))}
                type="number"
                placeholder="50000"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-base focus:border-primary-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Categoria</label>
              <div className="flex flex-wrap gap-2">
                {CATS.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, category }))}
                    className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                      form.category === category
                        ? "bg-primary-600 text-white"
                        : `${CAT_COLORS[normalizeCategory(category)] || "bg-slate-100 text-slate-600"}`
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 rounded-xl border border-slate-200 py-3.5 text-sm font-medium text-slate-600"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 py-3.5 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:opacity-50"
            >
              {saving ? <RiLoader4Line className="animate-spin" size={15} /> : <RiCheckLine size={15} />}
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>
      </ResponsiveModal>

      {viewPhotos && <PhotoViewer urls={viewPhotos} onClose={() => setViewPhotos(null)} />}
    </div>
  );
}
