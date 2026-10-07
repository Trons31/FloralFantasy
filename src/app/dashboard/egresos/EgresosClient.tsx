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
import Pagination from "@/components/ui/Pagination";
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
  Flores: { icon: RiFlowerLine, circle: "bg-brand-50 text-primary-500", badge: "bg-brand-50 text-primary-600" },
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
                ? "border-primary-500 bg-primary-500 text-white shadow-sm"
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
      toast.error("Completa la descripción y un monto válido");
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
    <div className="min-w-0">
      <div className="mx-auto max-w-[1500px] space-y-4">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Egresos</h1>
                <p className="mt-1 text-sm text-slate-500">Gestiona y controla todos los gastos del negocio.</p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary-500 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-600"
          >
            <RiAddLine size={18} />
            Registrar egreso
          </button>
        </header>

        <section className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm sm:p-4">
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

        <section className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
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

        <section className="grid grid-cols-2 gap-4 sm:grid-cols-3">
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
          ].map((card, index) => {
            const Icon = card.icon;
            return (
              <article key={card.label} className={`min-w-0 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm ${index === 2 ? "col-span-2 sm:col-span-1" : ""}`}>
                <div className="mb-3 flex min-w-0 items-center justify-between gap-2">
                  <span className="min-w-0 break-words text-sm font-medium text-gray-500">{card.label}</span>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                    <Icon className="text-lg" />
                  </span>
                </div>
                <p className="break-words text-xl font-bold tabular-nums text-gray-900 sm:text-2xl">{card.value}</p>
                <p className="mt-1 text-xs text-gray-400">{card.detail}</p>
              </article>
            );
          })}
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
          <form
            onSubmit={event => {
              event.preventDefault();
              navigate({ q: searchValue.trim() || undefined, page: 1 });
            }}
            className="grid grid-cols-[minmax(0,1.15fr)_minmax(0,.85fr)] gap-2 md:grid-cols-[minmax(0,1fr)_260px] md:gap-3"
          >
            <label className="flex h-11 min-w-0 items-center gap-2 rounded-xl border border-slate-200 px-3 focus-within:border-primary-300 focus-within:ring-2 focus-within:ring-primary-50 sm:gap-3 sm:px-4">
              <RiSearchLine className="shrink-0 text-slate-400" size={19} />
              <input
                value={searchValue}
                onChange={event => setSearchValue(event.target.value)}
                className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                placeholder="Buscar egresos..."
              />
            </label>
            <label className="relative flex h-11 min-w-0 items-center gap-2 rounded-xl border border-slate-200 px-3 sm:gap-3 sm:px-4">
              <RiFilter3Line className="shrink-0 text-slate-500" size={18} />
              <select
                value={filters.category || ""}
                onChange={event => navigate({ category: event.target.value || undefined, page: 1 })}
                className="min-w-0 flex-1 truncate appearance-none bg-transparent pr-5 text-xs font-medium text-slate-700 outline-none sm:text-sm"
              >
                <option value="">Todas las categorias</option>
                {CATEGORIES.map(category => <option key={category}>{category}</option>)}
              </select>
              <RiArrowDownLine className="pointer-events-none absolute right-4 text-slate-500" />
            </label>
          </form>
        </section>

        <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-4 sm:px-5">
            <h2 className="font-bold text-gray-900">Egresos del {selection.dayLabel}</h2>
            <p className="text-xs font-medium text-slate-500">
              Total del dia: <strong className="ml-1 text-primary-500">{formatPrice(summary.total)}</strong>
            </p>
          </div>

          {expenses.length ? (
            <>
              {/* Movil: tarjetas */}
              <ul className="divide-y divide-gray-100 md:hidden">
                {expenses.map(expense => {
                  const style = categoryStyles[expense.category] || categoryStyles.Otro;
                  const photos = getExpensePhotoUrls(expense);
                  return (
                    <li key={expense.id} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="break-words font-black text-gray-900">{expense.description}</p>
                          <p className="mt-0.5 truncate text-xs text-gray-500">{expense.registeredBy || "Super Admin"}</p>
                        </div>
                        <strong className="shrink-0 tabular-nums text-red-600">-{formatPrice(expense.amount)}</strong>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-400">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${style.badge}`}>{expense.category || "Otro"}</span>
                        <span className="inline-flex items-center gap-1">
                          <RiCalendarLine />
                          {format(new Date(expense.date), "d MMM yyyy, h:mm a", { locale: es })}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-2 border-t border-gray-100 pt-3">
                        {photos.length ? (
                          <button
                            type="button"
                            onClick={() => setViewPhotos(photos)}
                            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-gray-200 px-3 text-xs font-semibold text-gray-700 transition hover:border-brand-200 hover:text-brand-600"
                          >
                            <RiZoomInLine size={14} /> Comprobante
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">Sin comprobante</span>
                        )}
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => openEdit(expense)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-brand-50 hover:text-brand-600"
                            aria-label={`Editar ${expense.description}`}
                          >
                            <RiEditLine size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteExpense(expense)}
                            disabled={deleting === expense.id}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                            aria-label={`Eliminar ${expense.description}`}
                          >
                            {deleting === expense.id ? <RiLoader4Line className="animate-spin" /> : <RiDeleteBinLine size={16} />}
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>

              {/* Escritorio: tabla */}
              <div className="hidden overflow-x-auto scrollbar-none md:block">
                <table className="w-full min-w-[760px] border-collapse text-left">
                  <thead className="bg-gray-50/80">
                    <tr className="border-b border-gray-100 text-[10px] font-bold uppercase tracking-wide text-gray-400">
                      <th className="px-3 py-2.5">Egreso</th>
                      <th className="w-32 whitespace-nowrap px-3 py-2.5">Categoría</th>
                      <th className="w-44 whitespace-nowrap px-3 py-2.5">Fecha</th>
                      <th className="w-36 whitespace-nowrap px-3 py-2.5">Comprobante</th>
                      <th className="w-32 whitespace-nowrap px-3 py-2.5 text-right">Monto</th>
                      <th className="w-24 px-3 py-2.5"><span className="sr-only">Acciones</span></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {expenses.map(expense => {
                      const style = categoryStyles[expense.category] || categoryStyles.Otro;
                      const photos = getExpensePhotoUrls(expense);
                      return (
                        <tr key={expense.id} className="bg-white text-xs text-gray-600 transition-colors hover:bg-brand-50/40">
                          <td className="max-w-0 px-3 py-2.5">
                            <p className="truncate font-bold text-gray-900">{expense.description}</p>
                            <p className="mt-0.5 truncate text-[10px] text-gray-400">{expense.registeredBy || "Super Admin"}</p>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-bold ${style.badge}`}>{expense.category || "Otro"}</span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-2.5 font-semibold text-gray-700">
                            {format(new Date(expense.date), "d MMM yyyy, h:mm a", { locale: es })}
                          </td>
                          <td className="px-3 py-2.5">
                            {photos.length ? (
                              <button
                                type="button"
                                onClick={() => setViewPhotos(photos)}
                                className="inline-flex items-center gap-1.5 font-semibold text-brand-600 hover:underline"
                              >
                                <RiZoomInLine size={14} /> Ver comprobante
                              </button>
                            ) : (
                              <span className="text-gray-400">Sin comprobante</span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2.5 text-right text-sm font-bold tabular-nums text-red-600">
                            -{formatPrice(expense.amount)}
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => openEdit(expense)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-brand-50 hover:text-brand-600"
                                aria-label={`Editar ${expense.description}`}
                                title="Editar"
                              >
                                <RiEditLine size={15} />
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteExpense(expense)}
                                disabled={deleting === expense.id}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                                aria-label={`Eliminar ${expense.description}`}
                                title="Eliminar"
                              >
                                {deleting === expense.id ? <RiLoader4Line className="animate-spin" /> : <RiDeleteBinLine size={15} />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
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

          <Pagination
            page={pagination.page}
            totalPages={totalPages}
            totalItems={pagination.total}
            perPage={pagination.perPage}
            itemLabel="egresos"
            onPageChange={nextPage => navigate({ page: nextPage })}
          />
        </section>
      </div>

      <ResponsiveModal
        open={showForm}
        onClose={closeForm}
        title={editingExpense ? "Editar egreso" : "Registrar egreso"}
        description={editingExpense ? "Actualiza los datos del movimiento." : `Nuevo egreso para el ${selection.dayLabel}.`}
        size="xl"
        footer={(
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={closeForm}
              className="h-11 rounded-xl border border-gray-200 bg-white px-5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit" form="expense-form"
              disabled={saving}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 disabled:opacity-50"
            >
              {saving && <RiLoader4Line className="animate-spin" />}
              {editingExpense ? "Guardar cambios" : "Registrar egreso"}
            </button>
          </div>
        )}
      >
        <form id="expense-form" onSubmit={saveExpense} className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-700">Descripción</span>
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
