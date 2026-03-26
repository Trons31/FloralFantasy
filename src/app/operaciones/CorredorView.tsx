"use client";
import { useEffect, useRef, useState } from "react";
import {
  RiRunLine, RiReceiptLine, RiLoader4Line, RiLogoutBoxLine, RiRefreshLine,
  RiCameraLine, RiCloseLine, RiCheckLine, RiArrowDownLine, RiDeleteBinLine,
  RiPencilLine, RiImageLine,
} from "react-icons/ri";
import { toast } from "sonner";

const EXPENSE_CATS = ["Insumos", "Flores", "Transporte", "Empaque", "Otro"];

const CAT_COLORS: Record<string, string> = {
  Insumos:    "bg-amber-100 text-amber-700",
  Flores:     "bg-pink-100 text-pink-700",
  Transporte: "bg-blue-100 text-blue-700",
  Empaque:    "bg-purple-100 text-purple-700",
  Otro:       "bg-gray-100 text-gray-600",
};

type Expense = {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  receiptPhotoUrl?: string | null;
};

function formatPrice(n: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);
}

const emptyForm = { description: "", amount: "", category: "Insumos" };

export default function CorredorView({ user, onLogout }: { user: { id: string; name: string; role: string }; onLogout: () => void }) {
  const [expenses,     setExpenses]     = useState<Expense[]>([]);
  const [loading,      setLoading]      = useState(true);
  /* ── Create state ── */
  const [showCreate,   setShowCreate]   = useState(false);
  const [createForm,   setCreateForm]   = useState(emptyForm);
  const [createFile,   setCreateFile]   = useState<File | null>(null);
  const [createPreview,setCreatePreview]= useState<string | null>(null);
  const [saving,       setSaving]       = useState(false);
  /* ── Edit state ── */
  const [editing,      setEditing]      = useState<Expense | null>(null);
  const [editForm,     setEditForm]     = useState(emptyForm);
  const [editFile,     setEditFile]     = useState<File | null>(null);
  const [editPreview,  setEditPreview]  = useState<string | null>(null);
  const [editSaving,   setEditSaving]   = useState(false);
  /* ── Delete ── */
  const [deleting,     setDeleting]     = useState<string | null>(null);

  const createFileRef = useRef<HTMLInputElement>(null);
  const editFileRef   = useRef<HTMLInputElement>(null);

  /* ── Load today's expenses ── */
  const load = async () => {
    setLoading(true);
    const res  = await fetch(`/api/expenses/corredor?registeredBy=${encodeURIComponent(user.name)}`);
    const data = await res.json();
    setExpenses(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const total = expenses.reduce((s, e) => s + e.amount, 0);

  /* ── Create ── */
  const handleCreate = async () => {
    if (!createForm.description.trim() || !createForm.amount) { toast.error("Descripción y monto son requeridos"); return; }
    if (!createFile) { toast.error("La foto de la factura es obligatoria"); return; }
    setSaving(true);
    const fd = new FormData();
    fd.append("description",  createForm.description);
    fd.append("amount",       createForm.amount);
    fd.append("category",     createForm.category);
    fd.append("registeredBy", user.name);
    fd.append("file",         createFile);
    const res = await fetch("/api/expenses/with-photo", { method: "POST", body: fd });
    if (res.ok) {
      toast.success("Gasto registrado");
      closeCreate();
      load();
    } else toast.error("Error al registrar");
    setSaving(false);
  };

  const closeCreate = () => {
    setShowCreate(false);
    setCreateForm(emptyForm);
    setCreateFile(null);
    setCreatePreview(null);
  };

  /* ── Edit ── */
  const openEdit = (e: Expense) => {
    setEditing(e);
    setEditForm({ description: e.description, amount: String(e.amount), category: e.category });
    setEditFile(null);
    setEditPreview(e.receiptPhotoUrl ?? null);
  };

  const handleEdit = async () => {
    if (!editing) return;
    if (!editForm.description.trim() || !editForm.amount) { toast.error("Descripción y monto son requeridos"); return; }
    setEditSaving(true);
    const fd = new FormData();
    fd.append("description", editForm.description);
    fd.append("amount",      editForm.amount);
    fd.append("category",    editForm.category);
    if (editFile) fd.append("file", editFile);
    const res = await fetch(`/api/expenses/${editing.id}`, { method: "PATCH", body: fd });
    if (res.ok) {
      toast.success("Gasto actualizado");
      setEditing(null);
      load();
    } else toast.error("Error al actualizar");
    setEditSaving(false);
  };

  /* ── Delete ── */
  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este gasto?")) return;
    setDeleting(id);
    const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    if (res.ok) {
      setExpenses(p => p.filter(e => e.id !== id));
      toast.success("Gasto eliminado");
    } else toast.error("Error al eliminar");
    setDeleting(null);
  };

  return (
    <div className="min-h-screen bg-green-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <RiRunLine className="text-green-600" size={17}/>
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm leading-none">{user.name}</p>
              <p className="text-xs text-gray-400">Corredor</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={load}
              className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 rounded-xl text-gray-400 transition-colors">
              <RiRefreshLine size={18}/>
            </button>
            <button onClick={onLogout}
              className="w-9 h-9 flex items-center justify-center hover:bg-red-50 rounded-xl text-gray-400 hover:text-red-500 transition-colors">
              <RiLogoutBoxLine size={18}/>
            </button>
          </div>
        </div>
        <div className="px-4 pb-3">
          <button onClick={() => setShowCreate(true)}
            className="w-full flex items-center justify-center gap-2 bg-green-500 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-green-600 active:scale-95 transition-all">
            <RiReceiptLine size={16}/> Registrar gasto
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Summary */}
        {expenses.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">Total gastado hoy</p>
              <p className="text-2xl font-bold text-green-600">{formatPrice(total)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Registros</p>
              <p className="text-2xl font-bold text-gray-700">{expenses.length}</p>
            </div>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-20">
            <RiLoader4Line className="animate-spin text-green-500" size={32}/>
          </div>
        ) : expenses.length === 0 ? (
          <div className="text-center py-20">
            <RiReceiptLine className="text-gray-200 mx-auto mb-3" size={56}/>
            <p className="text-gray-400 font-medium">Sin gastos registrados hoy</p>
            <p className="text-gray-300 text-sm mt-1">Toca "Registrar gasto" para agregar uno</p>
          </div>
        ) : (
          <div className="space-y-3">
            {expenses.map(exp => (
              <div key={exp.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex gap-3 p-4">
                  {/* Receipt thumb */}
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0 border border-gray-100">
                    {exp.receiptPhotoUrl
                      ? <img src={exp.receiptPhotoUrl} alt="Factura" className="w-full h-full object-cover"/>
                      : <div className="w-full h-full flex items-center justify-center"><RiImageLine className="text-gray-300" size={24}/></div>
                    }
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-sm leading-tight truncate">{exp.description}</p>
                    <p className="text-lg font-bold text-green-600 mt-0.5">{formatPrice(exp.amount)}</p>
                    <span className={`inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full ${CAT_COLORS[exp.category] ?? "bg-gray-100 text-gray-600"}`}>
                      {exp.category}
                    </span>
                  </div>
                  {/* Actions */}
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    <button onClick={() => openEdit(exp)}
                      className="w-9 h-9 flex items-center justify-center hover:bg-green-50 rounded-xl text-gray-400 hover:text-green-600 transition-colors">
                      <RiPencilLine size={16}/>
                    </button>
                    <button onClick={() => handleDelete(exp.id)} disabled={deleting === exp.id}
                      className="w-9 h-9 flex items-center justify-center hover:bg-red-50 rounded-xl text-gray-400 hover:text-red-500 transition-colors disabled:opacity-40">
                      {deleting === exp.id
                        ? <RiLoader4Line className="animate-spin" size={16}/>
                        : <RiDeleteBinLine size={16}/>
                      }
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── CREATE modal ── */}
      {showCreate && (
        <ExpenseModal
          title="Registrar gasto"
          form={createForm}
          setForm={setCreateForm}
          file={createFile}
          preview={createPreview}
          fileRef={createFileRef}
          onFileChange={e => {
            const f = e.target.files?.[0]; if (!f) return;
            setCreateFile(f); setCreatePreview(URL.createObjectURL(f));
          }}
          onClearFile={() => { setCreateFile(null); setCreatePreview(null); }}
          onSave={handleCreate}
          onClose={closeCreate}
          saving={saving}
          saveLabel="Registrar gasto"
          accentColor="bg-green-500 hover:bg-green-600"
        />
      )}

      {/* ── EDIT modal ── */}
      {editing && (
        <ExpenseModal
          title="Editar gasto"
          form={editForm}
          setForm={setEditForm}
          file={editFile}
          preview={editPreview}
          fileRef={editFileRef}
          onFileChange={e => {
            const f = e.target.files?.[0]; if (!f) return;
            setEditFile(f); setEditPreview(URL.createObjectURL(f));
          }}
          onClearFile={() => { setEditFile(null); setEditPreview(editing.receiptPhotoUrl ?? null); }}
          onSave={handleEdit}
          onClose={() => setEditing(null)}
          saving={editSaving}
          saveLabel="Guardar cambios"
          accentColor="bg-green-500 hover:bg-green-600"
          photoOptional
        />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Shared modal for create / edit
───────────────────────────────────────────── */
function ExpenseModal({
  title, form, setForm, file, preview, fileRef,
  onFileChange, onClearFile, onSave, onClose,
  saving, saveLabel, accentColor, photoOptional = false,
}: {
  title: string;
  form: { description: string; amount: string; category: string };
  setForm: React.Dispatch<React.SetStateAction<{ description: string; amount: string; category: string }>>;
  file: File | null;
  preview: string | null;
  fileRef: React.RefObject<HTMLInputElement>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearFile: () => void;
  onSave: () => void;
  onClose: () => void;
  saving: boolean;
  saveLabel: string;
  accentColor: string;
  photoOptional?: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 backdrop-blur-sm">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-sm shadow-2xl p-6 pb-8 overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <RiReceiptLine className="text-green-500" size={20}/> {title}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400">
            <RiCloseLine size={20}/>
          </button>
        </div>

        <div className="space-y-4">
          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">¿Qué compraste? *</label>
            <input value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Ej: Rosas rojas mercado central" autoComplete="off"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-green-400"/>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Monto pagado (COP) *</label>
            <input value={form.amount}
              onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
              type="number" placeholder="50000" inputMode="numeric"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-green-400"/>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
            <div className="flex flex-wrap gap-2">
              {EXPENSE_CATS.map(c => (
                <button key={c} type="button" onClick={() => setForm(p => ({ ...p, category: c }))}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    form.category === c ? "bg-green-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Photo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Foto de la factura {photoOptional ? <span className="text-gray-400 font-normal">(opcional — cambia solo si quieres)</span> : "*"}
            </label>
            <input ref={fileRef} type="file" accept="image/*" capture="environment"
              onChange={onFileChange} className="hidden"/>
            {preview ? (
              <div className="relative">
                <img src={preview} alt="Factura" className="w-full h-40 object-cover rounded-2xl"/>
                <button onClick={onClearFile}
                  className="absolute top-2 right-2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center">
                  <RiCloseLine size={16}/>
                </button>
                <div className="absolute bottom-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-lg flex items-center gap-1">
                  <RiCheckLine size={11}/> Foto lista
                </div>
              </div>
            ) : (
              <button onClick={() => fileRef.current?.click()}
                className="w-full h-32 border-2 border-dashed border-green-200 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-green-400 hover:bg-green-50 transition-colors bg-green-50/50">
                <RiCameraLine className="text-green-400" size={32}/>
                <span className="text-sm text-green-600 font-medium">Tomar foto de la factura</span>
                <span className="text-xs text-gray-400">El admin podrá verla en egresos</span>
              </button>
            )}
          </div>

          <div className="flex gap-3 pt-1">
            <button onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 py-3.5 rounded-xl text-sm font-medium">
              Cancelar
            </button>
            <button onClick={onSave} disabled={saving}
              className={`flex-1 text-white py-3.5 rounded-xl text-sm font-semibold disabled:opacity-40 flex items-center justify-center gap-2 active:scale-95 transition-all ${accentColor}`}>
              {saving ? <RiLoader4Line className="animate-spin" size={15}/> : <RiArrowDownLine size={15}/>}
              {saving ? "Guardando..." : saveLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}