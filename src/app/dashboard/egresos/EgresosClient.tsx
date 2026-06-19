"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { addMonths, format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import {
  RiAddLine,
  RiArrowDownLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiBox3Line,
  RiCalendarLine,
  RiDeleteBinLine,
  RiDropLine,
  RiEditLine,
  RiFilter3Line,
  RiFlowerLine,
  RiLoader4Line,
  RiMegaphoneLine,
  RiReceiptLine,
  RiSearchLine,
  RiTruckLine,
  RiZoomInLine,
} from "react-icons/ri";
import PhotoViewer from "@/components/client/PhotoViewer";
import ResponsiveModal from "@/components/ui/ResponsiveModal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { formatPrice } from "@/lib/utils";

type ExpenseItem = {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  createdAt: string;
  registeredBy: string | null;
  receiptPhotoUrl: string | null;
  receiptPublicId: string | null;
};

type DaySummary = {
  date: string;
  dayNumber: number;
  label: string;
  count: number;
  amount: number;
};

type Props = {
  expenses: ExpenseItem[];
  summary: {
    total: number;
    count: number;
    monthTotal: number;
    monthCount: number;
  };
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
  filters: { q?: string; category?: string };
};

const CATEGORIES = ["Flores", "Transporte", "Decoracion", "Empaque", "Personal", "Servicios", "Marketing", "Otro"];

const categoryStyles: Record<string, { icon: typeof RiReceiptLine; circle: string; badge: string }> = {
  Flores: { icon: RiFlowerLine, circle: "bg-rose-50 text-primary-500", badge: "bg-rose-50 text-primary-600" },
  Transporte: { icon: RiTruckLine, circle: "bg-emerald-50 text-emerald-600", badge: "bg-emerald-50 text-emerald-700" },
  Decoracion: { icon: RiFlowerLine, circle: "bg-fuchsia-50 text-fuchsia-600", badge: "bg-fuchsia-50 text-fuchsia-700" },
  Empaque: { icon: RiBox3Line, circle: "bg-amber-50 text-amber-500", badge: "bg-amber-50 text-amber-700" },
  Personal: { icon: RiReceiptLine, circle: "bg-blue-50 text-blue-600", badge: "bg-blue-50 text-blue-700" },
  Servicios: { icon: RiDropLine, circle: "bg-sky-50 text-sky-600", badge: "bg-sky-50 text-sky-700" },
  Marketing: { icon: RiMegaphoneLine, circle: "bg-violet-50 text-violet-600", badge: "bg-violet-50 text-violet-700" },
  Otro: { icon: RiReceiptLine, circle: "bg-slate-100 text-slate-600", badge: "bg-slate-100 text-slate-700" },
};

function getExpensePhotoUrls(expense: ExpenseItem) {
  if (expense.receiptPublicId) {
    try {
      const parsed = JSON.parse(expense.receiptPublicId);
      if (Array.isArray(parsed)) {
        const urls = parsed
          .map(item => (item && typeof item.url === "string" ? item.url : ""))
          .filter(Boolean);
        if (urls.length) return urls;
      }
    } catch {
      // A single Cloudinary public id is stored for older records.
    }
  }
  return expense.receiptPhotoUrl ? [expense.receiptPhotoUrl] : [];
}

function DayCarousel({
  days,
  selectedDay,
  onSelectDay,
}: {
  days: DaySummary[];
  selectedDay: number;
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
              onSelectDay(item.dayNumber);
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
              {item.count} eg.
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default function EgresosClient({
  expenses,
  summary,
  pagination,
  selection,
  days,
  filters,
}: Props) {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState(filters.q || "");
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ExpenseItem | null>(null);
  const [viewPhotos, setViewPhotos] = useState<string[] | null>(null);
  const [form, setForm] = useState({ description: "", amount: "", category: "Flores" });

  const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.perPage));
  const monthDate = new Date(selection.year, selection.month - 1, 1);
  const average = summary.monthCount ? summary.monthTotal / summary.monthCount : 0;

  const navigate = (overrides: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams();
    const values = {
      year: selection.year,
      month: selection.month,
      day: selection.day,
      page: pagination.page,
      q: filters.q,
      category: filters.category,
      ...overrides,
    };
    Object.entries(values).forEach(([key, value]) => {
      if (value !== undefined && value !== "") params.set(key, String(value));
    });
    router.push(`/dashboard/egresos?${params.toString()}`);
  };

  const changeMonth = (delta: number) => {
    const next = addMonths(monthDate, delta);
    navigate({
      year: next.getFullYear(),
      month: next.getMonth() + 1,
      day: 1,
      page: 1,
    });
  };

  const goToToday = () => {
    const today = new Date();
    navigate({
      year: today.getFullYear(),
      month: today.getMonth() + 1,
      day: today.getDate(),
      page: 1,
    });
  };

  const openCreate = () => {
    setEditingExpense(null);
    setForm({ description: "", amount: "", category: "Flores" });
    setShowForm(true);
  };

  const openEdit = (expense: ExpenseItem) => {
    setEditingExpense(expense);
    setForm({
      description: expense.description,
      amount: String(expense.amount),
      category: expense.category || "Otro",
    });
    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) return;
    setShowForm(false);
    setEditingExpense(null);
  };

  const saveExpense = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.description.trim() || !form.amount || Number(form.amount) <= 0) {
      toast.error("Completa la descripcion y un monto valido");
      return;
    }

    setSaving(true);
    try {
      let response: Response;
      if (editingExpense) {
        const body = new FormData();
        body.set("description", form.description.trim());
        body.set("amount", form.amount);
        body.set("category", form.category);
        response = await fetch(`/api/expenses/${editingExpense.id}`, { method: "PATCH", body });
      } else {
        response = await fetch("/api/expenses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            description: form.description.trim(),
            amount: Number(form.amount),
            category: form.category,
            date: new Date(`${selection.selectedDateValue}T12:00:00`).toISOString(),
            registeredBy: "Super Admin",
          }),
        });
      }

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "No fue posible guardar el egreso");
      }

      toast.success(editingExpense ? "Egreso actualizado" : "Egreso registrado");
      closeForm();
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No fue posible guardar el egreso");
    } finally {
      setSaving(false);
    }
  };

  const deleteExpense = (expense: ExpenseItem) => {
    setDeleteTarget(expense);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(deleteTarget.id);
    try {
      const response = await fetch(`/api/expenses/${deleteTarget.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("No fue posible eliminar el egreso");
      toast.success("Egreso eliminado");
      setDeleteTarget(null);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No fue posible eliminar el egreso");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="min-h-full bg-slate-50/70 p-3 sm:p-5 lg:p-7">
      <div className="mx-auto max-w-[1500px] space-y-4">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-50 text-primary-500">
                <RiArrowDownLine size={22} />
              </span>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Egresos</h1>
                <p className="mt-1 text-sm text-slate-500">Gestiona y controla todos los gastos del negocio.</p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary-500 px-5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(236,18,91,.2)] transition hover:bg-primary-600"
          >
            <RiAddLine size={18} />
            Registrar egreso
          </button>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => changeMonth(-1)}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-primary-200 hover:text-primary-500"
              aria-label="Mes anterior"
            >
              <RiArrowLeftSLine size={22} />
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <RiCalendarLine className="text-slate-700" size={20} />
                <strong className="capitalize text-base text-slate-950 sm:text-lg">{selection.monthLabel}</strong>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
                  Periodo activo
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                {format(monthDate, "d MMM yyyy", { locale: es })} -{" "}
                {format(new Date(selection.year, selection.month, 0), "d MMM yyyy", { locale: es })}
              </p>
            </div>
            <button
              type="button"
              onClick={() => changeMonth(1)}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-primary-200 hover:text-primary-500"
              aria-label="Mes siguiente"
            >
              <RiArrowRightSLine size={22} />
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3 px-1">
            <div>
              <h2 className="text-sm font-bold text-slate-950">Dias del mes</h2>
              <p className="text-xs text-slate-500">Desliza o arrastra para seleccionar un dia.</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={goToToday}
                className="rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-600 transition hover:border-primary-500 hover:bg-primary-500 hover:text-white"
              >
                Hoy
              </button>
              <span className="rounded-full bg-slate-50 px-3 py-1 text-xs text-slate-500">{days.length} dias</span>
            </div>
          </div>
          <DayCarousel days={days} selectedDay={selection.day} onSelectDay={day => navigate({ day, page: 1 })} />
        </section>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            {
              label: "Total hoy",
              value: formatPrice(summary.total),
              detail: `${summary.count} ${summary.count === 1 ? "egreso" : "egresos"}`,
              icon: RiArrowDownLine,
            },
            {
              label: "Total del mes",
              value: formatPrice(summary.monthTotal),
              detail: `${summary.monthCount} egresos`,
              icon: RiArrowDownLine,
            },
            {
              label: "Promedio por egreso",
              value: summary.monthCount ? formatPrice(average) : "Sin registros",
              detail: "Este mes",
              icon: RiReceiptLine,
            },
          ].map(card => {
            const Icon = card.icon;
            return (
              <article key={card.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="flex items-center gap-4">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary-50 text-primary-500">
                    <Icon size={23} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-500">{card.label}</p>
                    <strong className="mt-1 block truncate text-xl font-bold text-slate-950 sm:text-2xl">{card.value}</strong>
                    <p className="mt-1 text-xs font-medium text-primary-500">{card.detail}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <form
            onSubmit={event => {
              event.preventDefault();
              navigate({ q: searchValue.trim() || undefined, page: 1 });
            }}
            className="grid gap-3 md:grid-cols-[minmax(0,1fr)_260px]"
          >
            <label className="flex h-11 items-center gap-3 rounded-xl border border-slate-200 px-4 focus-within:border-primary-300 focus-within:ring-2 focus-within:ring-primary-50">
              <RiSearchLine className="shrink-0 text-slate-400" size={19} />
              <input
                value={searchValue}
                onChange={event => setSearchValue(event.target.value)}
                className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                placeholder="Buscar egresos..."
              />
            </label>
            <label className="relative flex h-11 items-center gap-3 rounded-xl border border-slate-200 px-4">
              <RiFilter3Line className="shrink-0 text-slate-500" size={18} />
              <select
                value={filters.category || ""}
                onChange={event => navigate({ category: event.target.value || undefined, page: 1 })}
                className="min-w-0 flex-1 appearance-none bg-transparent pr-6 text-sm font-medium text-slate-700 outline-none"
              >
                <option value="">Todas las categorias</option>
                {CATEGORIES.map(category => <option key={category}>{category}</option>)}
              </select>
              <RiArrowDownLine className="pointer-events-none absolute right-4 text-slate-500" />
            </label>
          </form>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-4 sm:px-5">
            <h2 className="text-sm font-bold text-slate-950 sm:text-base">Egresos del {selection.dayLabel}</h2>
            <p className="text-xs font-medium text-slate-500">
              Total del dia: <strong className="ml-1 text-primary-500">{formatPrice(summary.total)}</strong>
            </p>
          </div>

          {expenses.length ? (
            <div className="divide-y divide-slate-100 px-4 sm:px-5">
              {expenses.map(expense => {
                const style = categoryStyles[expense.category] || categoryStyles.Otro;
                const Icon = style.icon;
                const photos = getExpensePhotoUrls(expense);
                return (
                  <article
                    key={expense.id}
                    className="grid gap-4 py-4 md:grid-cols-[minmax(260px,1.5fr)_minmax(150px,.75fr)_minmax(120px,.55fr)_auto] md:items-center"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-full ${style.circle}`}>
                        <Icon size={23} />
                      </span>
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-bold text-slate-950 sm:text-base">{expense.description}</h3>
                        <p className="mt-0.5 truncate text-xs font-medium text-slate-500">
                          {expense.registeredBy || "Super Admin"}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${style.badge}`}>
                            {expense.category || "Otro"}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 sm:text-xs">
                            <RiCalendarLine />
                            {format(new Date(expense.date), "d MMM yyyy, h:mm a", { locale: es })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="mb-1.5 text-[10px] font-medium text-slate-500">Comprobante</p>
                      {photos.length ? (
                        <button
                          type="button"
                          onClick={() => setViewPhotos(photos)}
                          className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 transition hover:border-primary-200 hover:text-primary-500"
                        >
                          <RiZoomInLine size={15} />
                          Ver comprobante
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">Sin comprobante</span>
                      )}
                    </div>

                    <div>
                      <p className="mb-1 text-[10px] font-medium text-slate-500">Monto</p>
                      <strong className="text-base font-bold text-primary-500">-{formatPrice(expense.amount)}</strong>
                    </div>

                    <div className="flex items-center gap-2 md:justify-end">
                      <button
                        type="button"
                        onClick={() => openEdit(expense)}
                        className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-primary-200 hover:text-primary-500"
                        aria-label={`Editar ${expense.description}`}
                      >
                        <RiEditLine size={17} />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteExpense(expense)}
                        disabled={deleting === expense.id}
                        className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-red-500 transition hover:border-red-200 hover:bg-red-50 disabled:opacity-50"
                        aria-label={`Eliminar ${expense.description}`}
                      >
                        {deleting === expense.id ? <RiLoader4Line className="animate-spin" /> : <RiDeleteBinLine size={17} />}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="grid min-h-52 place-items-center px-5 py-10 text-center">
              <div>
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-slate-50 text-slate-400">
                  <RiReceiptLine size={22} />
                </span>
                <h3 className="mt-3 text-sm font-semibold text-slate-800">No hay egresos para este dia</h3>
                <p className="mt-1 text-xs text-slate-500">Cambia de dia o registra un nuevo egreso.</p>
              </div>
            </div>
          )}

          <footer className="flex flex-col gap-3 border-t border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <p className="text-xs text-slate-500">
              Mostrando {pagination.total ? (pagination.page - 1) * pagination.perPage + 1 : 0} a{" "}
              {Math.min(pagination.page * pagination.perPage, pagination.total)} de {pagination.total} egresos
            </p>
            <div className="flex items-center justify-between gap-2 sm:justify-end">
              <button
                type="button"
                disabled={pagination.page <= 1}
                onClick={() => navigate({ page: pagination.page - 1 })}
                className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-500 disabled:opacity-35"
              >
                <RiArrowLeftSLine />
              </button>
              <span className="grid h-9 min-w-9 place-items-center rounded-lg bg-primary-500 px-3 text-xs font-bold text-white">
                {pagination.page}
              </span>
              <span className="text-xs text-slate-400">de {totalPages}</span>
              <button
                type="button"
                disabled={pagination.page >= totalPages}
                onClick={() => navigate({ page: pagination.page + 1 })}
                className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-500 disabled:opacity-35"
              >
                <RiArrowRightSLine />
              </button>
            </div>
          </footer>
        </section>
      </div>

      <ResponsiveModal
        open={showForm}
        onClose={closeForm}
        title={editingExpense ? "Editar egreso" : "Registrar egreso"}
        description={editingExpense ? "Actualiza los datos del movimiento." : `Nuevo egreso para el ${selection.dayLabel}.`}
        panelClassName="sm:max-w-xl"
      >
        <form onSubmit={saveExpense} className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-700">Descripcion</span>
            <input
              value={form.description}
              onChange={event => setForm(current => ({ ...current, description: event.target.value }))}
              className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-primary-300 focus:ring-2 focus:ring-primary-50"
              placeholder="Ej. Compra de rosas"
              autoFocus
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-slate-700">Monto</span>
              <input
                type="number"
                min="1"
                step="1"
                value={form.amount}
                onChange={event => setForm(current => ({ ...current, amount: event.target.value }))}
                className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-primary-300 focus:ring-2 focus:ring-primary-50"
                placeholder="0"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-slate-700">Categoria</span>
              <select
                value={form.category}
                onChange={event => setForm(current => ({ ...current, category: event.target.value }))}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-primary-300 focus:ring-2 focus:ring-primary-50"
              >
                {CATEGORIES.map(category => <option key={category}>{category}</option>)}
              </select>
            </label>
          </div>
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={closeForm}
              className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-600"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary-500 px-5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving && <RiLoader4Line className="animate-spin" />}
              {editingExpense ? "Guardar cambios" : "Registrar egreso"}
            </button>
          </div>
        </form>
      </ResponsiveModal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Eliminar egreso"
        message={`Vas a eliminar ${deleteTarget?.description || "este egreso"}. Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        loading={!!deleting}
        onClose={() => !deleting && setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />

      {viewPhotos && <PhotoViewer urls={viewPhotos} onClose={() => setViewPhotos(null)} />}
    </div>
  );
}
