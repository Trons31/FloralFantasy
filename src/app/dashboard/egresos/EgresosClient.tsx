"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import PhotoViewer from "@/components/client/PhotoViewer";
import {
  RiArrowDownLine, RiAddLine, RiDeleteBinLine, RiLoader4Line, RiCloseLine,
  RiArrowLeftLine, RiArrowRightLine, RiFilterLine, RiCalendarLine,
  RiCheckLine, RiZoomInLine, RiReceiptLine, RiDownloadLine,
} from "react-icons/ri";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";

const CATS     = ["Flores","Transporte","Decoración","Empaque","Personal","Servicios","Otro"];
const PERIODOS = [
  { value:"hoy",        label:"Hoy"           },
  { value:"semana",     label:"7 días"        },
  { value:"mes",        label:"Este mes"      },
  { value:"mes_pasado", label:"Mes pasado"    },
  { value:"custom",     label:"Personalizado" },
];
const CAT_COLORS: Record<string,string> = {
  Flores:"bg-pink-100 text-pink-700", Transporte:"bg-blue-100 text-blue-700",
  Decoración:"bg-purple-100 text-purple-700", Empaque:"bg-amber-100 text-amber-700",
  Personal:"bg-teal-100 text-teal-700", Servicios:"bg-indigo-100 text-indigo-700",
  Otro:"bg-gray-100 text-gray-600", Insumos:"bg-orange-100 text-orange-700",
};

function formatDate(iso: string) {
  const d = new Date(iso);
  const months = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export default function EgresosClient({ expenses, summary, categories, pagination, filters }: {
  expenses:   any[];
  summary:    { total:number; count:number };
  categories: { category:string; amount:number }[];
  pagination: { page:number; perPage:number; total:number };
  filters?:   { periodo?:string; from?:string; to?:string; categoria?:string };
}) {
  const router = useRouter();
  const [showForm,   setShowForm]   = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [deleting,   setDeleting]   = useState<string|null>(null);
  const [showCustom, setShowCustom] = useState(false);
  const [customFrom, setCustomFrom] = useState(filters?.from || "");
  const [customTo,   setCustomTo]   = useState(filters?.to   || "");
  const [viewPhoto,  setViewPhoto]  = useState<string|null>(null);
  const [form, setForm] = useState({
    description:"", amount:"", category:"Flores",
    date: new Date().toISOString().split("T")[0],
  });

  const totalPages = Math.ceil(pagination.total / pagination.perPage);

  const navigate = (params: Record<string, string|undefined>) => {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k,v]) => { if (v) sp.set(k, v); });
    router.push(`/dashboard/egresos?${sp.toString()}`);
  };

  const handleSave = async () => {
    if (!form.description.trim() || !form.amount) { toast.error("Completa todos los campos"); return; }
    setSaving(true);
    const res  = await fetch("/api/expenses", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
    });
    const data = await res.json();
    if (!res.ok) { toast.error(data.error || "Error"); setSaving(false); return; }
    setForm({ description:"", amount:"", category:"Flores", date: new Date().toISOString().split("T")[0] });
    setShowForm(false);
    toast.success("Egreso registrado");
    router.refresh();
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este egreso?")) return;
    setDeleting(id);
    const res = await fetch(`/api/expenses/${id}`, { method:"DELETE" });
    if (res.ok) { toast.success("Eliminado"); router.refresh(); }
    else toast.error("Error al eliminar");
    setDeleting(null);
  };

  return (
    <div className="p-4 lg:p-8 max-w-5xl space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <RiArrowDownLine className="text-red-500" size={22}/> Egresos
          </h1>
          <p className="text-gray-400 text-sm mt-1">Gestiona todos los gastos del negocio</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-primary-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors active:scale-95">
          <RiAddLine size={16}/> Registrar egreso
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-400 mb-1">Total egresos</p>
          <p className="text-xl font-bold text-red-500">{formatPrice(summary.total)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-400 mb-1">Registros</p>
          <p className="text-xl font-bold text-gray-900">{summary.count}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 col-span-2 sm:col-span-1">
          <p className="text-xs text-gray-400 mb-1">Promedio por egreso</p>
          <p className="text-xl font-bold text-amber-600">
            {summary.count > 0 ? formatPrice(summary.total / summary.count) : "—"}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center gap-2 mb-3">
          <RiFilterLine className="text-gray-400" size={14}/>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Filtros</span>
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          {PERIODOS.map(p => (
            <button key={p.value}
              onClick={() => {
                if (p.value === "custom") { setShowCustom(true); return; }
                setShowCustom(false);
                navigate({ periodo: p.value });
              }}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                (p.value === "custom" && showCustom) ||
                (p.value !== "custom" && filters?.periodo === p.value && !showCustom)
                  ? "bg-primary-600 text-white"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}>
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => navigate({ periodo: filters?.periodo || "mes" })}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              !filters?.categoria ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}>
            Todas
          </button>
          {categories.map(c => (
            <button key={c.category}
              onClick={() => navigate({ periodo: filters?.periodo || "mes", categoria: c.category })}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                filters?.categoria === c.category
                  ? "bg-gray-800 text-white"
                  : `${CAT_COLORS[c.category] || "bg-gray-100 text-gray-600"} opacity-80 hover:opacity-100`
              }`}>
              {c.category} · {formatPrice(c.amount)}
            </button>
          ))}
        </div>
        {showCustom && (
          <div className="flex flex-wrap items-end gap-3 mt-4 pt-4 border-t border-gray-50">
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
            <button onClick={() => { if (customFrom && customTo) navigate({ from:customFrom, to:customTo }); }}
              disabled={!customFrom || !customTo}
              className="flex items-center gap-1.5 bg-primary-600 text-white px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-40">
              <RiCalendarLine size={13}/> Aplicar
            </button>
          </div>
        )}
      </div>

      {/* Expense list */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <p className="font-semibold text-gray-900 text-sm">Registros ({pagination.total})</p>
          {pagination.total > 0 && (
            <p className="text-xs text-gray-400">pág. {pagination.page}/{Math.max(1, totalPages)}</p>
          )}
        </div>

        {expenses.length === 0 ? (
          <div className="text-center py-16">
            <RiArrowDownLine className="text-gray-200 mx-auto mb-3" size={48}/>
            <p className="text-gray-400 text-sm">Sin egresos en este período</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {expenses.map(e => (
              <div key={e.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors group">

                {/* Receipt thumbnail */}
                {e.receiptPhotoUrl ? (
                  <button
                    onClick={() => setViewPhoto(e.receiptPhotoUrl)}
                    className="w-14 h-14 rounded-xl overflow-hidden border-2 border-amber-200 flex-shrink-0 hover:border-amber-400 transition-colors relative group/thumb"
                  >
                    <img src={e.receiptPhotoUrl} alt="Factura" className="w-full h-full object-cover"/>
                    <div className="absolute inset-0 bg-black/0 group-hover/thumb:bg-black/25 transition-colors flex items-center justify-center">
                      <RiZoomInLine className="text-white opacity-0 group-hover/thumb:opacity-100 transition-opacity" size={18}/>
                    </div>
                  </button>
                ) : (
                  <div className="w-14 h-14 rounded-xl border border-dashed border-gray-200 flex-shrink-0 flex items-center justify-center bg-gray-50">
                    <RiReceiptLine className="text-gray-300" size={20}/>
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900">{e.description}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CAT_COLORS[e.category] || "bg-gray-100 text-gray-600"}`}>
                      {e.category}
                    </span>
                    <span className="text-xs text-gray-400">{formatDate(e.date)}</span>
                    {e.registeredBy && (
                      <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                        {e.registeredBy}
                      </span>
                    )}
                  </div>
                </div>

                {/* Amount + delete */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="font-bold text-red-500">{formatPrice(e.amount)}</span>
                  <button onClick={() => handleDelete(e.id)} disabled={deleting === e.id}
                    className="p-1.5 text-gray-200 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                    {deleting === e.id
                      ? <RiLoader4Line className="animate-spin" size={14}/>
                      : <RiDeleteBinLine size={14}/>}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-3">
          <button
            onClick={() => navigate({ periodo: filters?.periodo||"mes", page: String(pagination.page-1), categoria: filters?.categoria })}
            disabled={pagination.page <= 1}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
            <RiArrowLeftLine size={14}/> Anterior
          </button>
          <span className="text-sm text-gray-500">{pagination.page} / {totalPages}</span>
          <button
            onClick={() => navigate({ periodo: filters?.periodo||"mes", page: String(pagination.page+1), categoria: filters?.categoria })}
            disabled={pagination.page >= totalPages}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
            Siguiente <RiArrowRightLine size={14}/>
          </button>
        </div>
      )}

      {/* Create modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md shadow-2xl p-6 pb-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-lg">Registrar egreso</h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400">
                <RiCloseLine size={20}/>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Descripción *</label>
                <input value={form.description} onChange={e => setForm(p=>({...p,description:e.target.value}))}
                  placeholder="Ej: Compra de rosas rojas" autoComplete="off"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-primary-400"/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Monto (COP) *</label>
                  <input value={form.amount} onChange={e => setForm(p=>({...p,amount:e.target.value}))}
                    type="number" placeholder="50000"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-primary-400"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Fecha</label>
                  <input value={form.date} onChange={e => setForm(p=>({...p,date:e.target.value}))}
                    type="date"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-primary-400"/>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
                <div className="flex flex-wrap gap-2">
                  {CATS.map(c => (
                    <button key={c} type="button" onClick={() => setForm(p=>({...p,category:c}))}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        form.category === c ? "bg-primary-600 text-white" : `${CAT_COLORS[c]||"bg-gray-100 text-gray-600"}`
                      }`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-200 text-gray-600 py-3.5 rounded-xl text-sm font-medium">
                  Cancelar
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 bg-primary-600 text-white py-3.5 rounded-xl text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95">
                  {saving ? <RiLoader4Line className="animate-spin" size={15}/> : <RiCheckLine size={15}/>}
                  {saving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Photo viewer — portal renders directly in document.body */}
      {viewPhoto && <PhotoViewer url={viewPhoto} onClose={() => setViewPhoto(null)}/>}

    </div>
  );
}