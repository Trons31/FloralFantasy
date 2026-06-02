"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  RiAddLine,
  RiDeleteBinLine,
  RiEdit2Line,
  RiImageAddLine,
  RiLoader4Line,
  RiSaveLine,
} from "react-icons/ri";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

type PaymentMethod = {
  id: string;
  title: string;
  provider?: string | null;
  visibleLabel?: string | null;
  type: "QR" | "BANK_ACCOUNT" | "INSTRUCTIONS";
  details?: string | null;
  accountNumber?: string | null;
  imageUrl?: string | null;
  isActive: boolean;
  sortOrder: number;
};

type DraftMethod = {
  id: string;
  title: string;
  provider: string;
  visibleLabel: string;
  type: PaymentMethod["type"];
  details: string;
  accountNumber: string;
  imageUrl?: string | null;
  isActive: boolean;
  sortOrder: number;
  file: File | null;
  preview: string | null;
};

const makeDraft = (type: PaymentMethod["type"] = "QR"): DraftMethod => ({
  id: crypto.randomUUID(),
  title: "",
  provider: "",
  visibleLabel: "",
  type,
  details: "",
  accountNumber: "",
  imageUrl: null,
  isActive: true,
  sortOrder: 0,
  file: null,
  preview: null,
});

export default function AjustesClient({
  initialMethods,
  initialDeliveryFee,
}: {
  initialMethods: PaymentMethod[];
  initialDeliveryFee: number;
}) {
  const router = useRouter();
  const [methods, setMethods] = useState(initialMethods);
  const [saving, setSaving] = useState(false);
  const [savingDeliveryFee, setSavingDeliveryFee] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [deliveryFee, setDeliveryFee] = useState<number>(initialDeliveryFee);
  const [drafts, setDrafts] = useState<DraftMethod[]>(
    initialMethods.length
      ? initialMethods.map(m => ({
          id: m.id,
          title: m.title,
          provider: m.provider || "",
          visibleLabel: m.visibleLabel || "",
          type: m.type,
          details: m.details || "",
          accountNumber: m.accountNumber || "",
          imageUrl: m.imageUrl || null,
          isActive: m.isActive,
          sortOrder: m.sortOrder,
          file: null,
          preview: m.imageUrl || null,
        }))
      : []
  );

  const syncDraft = (id: string, patch: Partial<DraftMethod>) => {
    setDrafts(prev => prev.map(d => (d.id === id ? { ...d, ...patch } : d)));
  };

  const addDraft = (type: PaymentMethod["type"]) => {
    const nextSortOrder = (Math.max(0, ...drafts.map(d => d.sortOrder)) || 0) + 1;
    setDrafts(prev => [...prev, { ...makeDraft(type), sortOrder: nextSortOrder }]);
  };

  const removeDraft = (id: string, persisted: boolean) => {
    if (persisted) {
      const current = methods.find(m => m.id === id);
      setDeleteTarget({ id, title: current?.title || "este método de pago" });
      return;
    }
    setDrafts(prev => prev.filter(d => d.id !== id));
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    try {
      const res = await fetch(`/api/payment-methods/${deleteTarget.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo eliminar");
      setMethods(prev => prev.filter(m => m.id !== deleteTarget.id));
      setDrafts(prev => prev.filter(d => d.id !== deleteTarget.id));
      toast.success("Método eliminado");
      router.refresh();
      setDeleteTarget(null);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleFile = (id: string, file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("La imagen debe ser válida");
      return;
    }
    syncDraft(id, { file, preview: URL.createObjectURL(file) });
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      for (const draft of drafts) {
        const title = draft.provider.trim() || draft.visibleLabel.trim() || `Método ${draft.type}`;
        const fd = new FormData();
        fd.append("title", title);
        fd.append("provider", draft.provider);
        fd.append("visibleLabel", draft.visibleLabel);
        fd.append("type", draft.type);
        fd.append("details", draft.details);
        fd.append("accountNumber", draft.accountNumber);
        fd.append("isActive", String(draft.isActive));
        fd.append("sortOrder", String(draft.sortOrder));
        if (draft.file) fd.append("file", draft.file);

        const isPersisted = methods.some(m => m.id === draft.id);
        const res = await fetch(isPersisted ? `/api/payment-methods/${draft.id}` : "/api/payment-methods", {
          method: isPersisted ? "PATCH" : "POST",
          body: fd,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "No se pudo guardar");

        setMethods(prev => {
          const exists = prev.some(m => m.id === data.id);
          return exists ? prev.map(m => (m.id === data.id ? data : m)) : [...prev, data];
        });

        setDrafts(prev =>
          prev.map(item =>
            item.id === draft.id
              ? {
                  ...item,
                  id: data.id,
                  title: data.title,
                  imageUrl: data.imageUrl || item.imageUrl,
                  preview: data.imageUrl || item.preview,
                  sortOrder: data.sortOrder ?? item.sortOrder,
                  file: null,
                }
              : item
          )
        );
      }

      toast.success("Pagos guardados");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const saveDeliveryFee = async () => {
    setSavingDeliveryFee(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliveryFee }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo guardar la configuración");
      setDeliveryFee(Number(data.deliveryFee) || deliveryFee);
      toast.success("Costo de domicilio guardado");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSavingDeliveryFee(false);
    }
  };

  const getSummary = (draft: DraftMethod) => {
    if (draft.type === "QR") return "Configura QR o cuenta para pagos anticipados";
    if (draft.type === "BANK_ACCOUNT") return "Número de cuenta o identificador para transferencias";
    return "Instrucciones visibles para el cliente";
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h3 className="font-bold text-gray-900">Costo de domicilio</h3>
            <p className="text-sm text-gray-400">Este valor se mostrará en checkout, carrito y pedidos creados manualmente.</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="block text-sm text-gray-600 mb-1.5">Valor (COP)</label>
            <input
              type="number"
              min={0}
              value={deliveryFee}
              onChange={e => setDeliveryFee(Number(e.target.value) || 0)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-primary-400"
              placeholder="8000"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={saveDeliveryFee}
              disabled={savingDeliveryFee}
              className="inline-flex items-center gap-2 rounded-2xl bg-primary-600 px-5 py-3 text-white font-semibold hover:bg-primary-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              {savingDeliveryFee ? <RiLoader4Line className="animate-spin" size={16} /> : <RiSaveLine size={16} />}
              {savingDeliveryFee ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => addDraft("QR")}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <RiAddLine size={16} /> Agregar QR
        </button>
        <button
          onClick={() => addDraft("BANK_ACCOUNT")}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <RiAddLine size={16} /> Agregar cuenta
        </button>
      </div>

      {drafts.length > 0 ? (
        <div className="space-y-4">
          {drafts.map((draft, index) => {
            const persisted = methods.some(m => m.id === draft.id);
            return (
              <div key={draft.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div>
                    <h3 className="font-bold text-gray-900">{persisted ? `Método ${index + 1}` : `Nuevo método ${index + 1}`}</h3>
                    <p className="text-sm text-gray-400">{getSummary(draft)}</p>
                  </div>
                  <button
                    onClick={() => removeDraft(draft.id, persisted)}
                    disabled={deletingId === draft.id}
                    className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors disabled:opacity-50"
                  >
                    {deletingId === draft.id ? <RiLoader4Line className="animate-spin" size={16} /> : <RiDeleteBinLine size={16} />}
                  </button>
                </div>

                <div className="grid lg:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1.5">Proveedor</label>
                    <input
                      value={draft.provider}
                      onChange={e => syncDraft(draft.id, { provider: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-primary-400"
                      placeholder="Nequi, Bancolombia, Daviplata..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1.5">Etiqueta visible</label>
                    <input
                      value={draft.visibleLabel}
                      onChange={e => syncDraft(draft.id, { visibleLabel: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-primary-400"
                      placeholder="Empresa, Persona, Tienda..."
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3 mb-3">
                  <button
                    type="button"
                    onClick={() => syncDraft(draft.id, { type: "QR" })}
                    className={`rounded-2xl border px-4 py-3 text-sm font-medium transition-colors ${draft.type === "QR" ? "border-primary-400 bg-primary-50 text-primary-700" : "border-gray-200 bg-white text-gray-700"}`}
                  >
                    QR para escanear
                  </button>
                  <button
                    type="button"
                    onClick={() => syncDraft(draft.id, { type: "BANK_ACCOUNT" })}
                    className={`rounded-2xl border px-4 py-3 text-sm font-medium transition-colors ${draft.type === "BANK_ACCOUNT" ? "border-primary-400 bg-primary-50 text-primary-700" : "border-gray-200 bg-white text-gray-700"}`}
                  >
                    Número de cuenta
                  </button>
                </div>

                <div className="grid lg:grid-cols-[1fr_1fr] gap-3 mb-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1.5">{draft.type === "QR" ? "Código QR" : "Número o identificador"}</label>
                    {draft.type === "QR" ? (
                      <div className="w-full min-h-[160px] rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={e => handleFile(draft.id, e.target.files?.[0] || undefined)}
                          className="hidden"
                          id={`payment-method-image-${draft.id}`}
                        />
                        <label htmlFor={`payment-method-image-${draft.id}`} className="w-full h-full min-h-[160px] flex items-center justify-center cursor-pointer">
                          {draft.preview ? (
                            <img src={draft.preview} alt="QR" className="max-h-[150px] object-contain" />
                          ) : (
                            <div className="flex flex-col items-center gap-2 text-gray-400">
                              <RiImageAddLine size={34} />
                              <span className="text-sm">Subir QR</span>
                            </div>
                          )}
                        </label>
                      </div>
                    ) : (
                      <input
                        value={draft.accountNumber}
                        onChange={e => syncDraft(draft.id, { accountNumber: e.target.value })}
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-primary-400"
                        placeholder="3001234567 o cuenta bancaria"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1.5">Notas / instrucciones</label>
                    <textarea
                      value={draft.details}
                      onChange={e => syncDraft(draft.id, { details: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-primary-400 min-h-[160px]"
                      placeholder="Incluye referencias, titular, instrucciones o texto que verá el cliente"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 justify-between">
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={draft.isActive}
                      onChange={e => syncDraft(draft.id, { isActive: e.target.checked })}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    Método activo
                  </label>

                  <label className="inline-flex items-center gap-2 rounded-xl border border-gray-800 bg-white px-3 py-2 text-sm font-medium text-gray-700">
                    <RiEdit2Line size={16} />
                    Orden:
                    <input
                      type="number"
                      min={1}
                      value={draft.sortOrder}
                      onChange={e => syncDraft(draft.id, { sortOrder: Number(e.target.value) || 1 })}
                      className="w-16 border-0 p-0 text-sm font-semibold text-gray-900 focus:outline-none focus:ring-0"
                    />
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-gray-200 bg-white/70 p-8 text-center text-sm text-gray-400">
          No hay métodos configurados todavía. Usa los botones de arriba para agregar uno nuevo.
        </div>
      )}

      {drafts.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={saveAll}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-2xl bg-primary-600 px-5 py-3 text-white font-semibold hover:bg-primary-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            {saving ? <RiLoader4Line className="animate-spin" size={16} /> : <RiSaveLine size={16} />}
            {saving ? "Guardando..." : "Guardar pagos al reservar"}
          </button>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Eliminar método de pago"
        message={`Vas a eliminar ${deleteTarget?.title || "este método de pago"}. Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        onClose={() => !deletingId && setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={!!deletingId}
      />
    </div>
  );
}
