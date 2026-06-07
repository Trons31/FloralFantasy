"use client";

import { useEffect, useState } from "react";
import {
  RiAddLine,
  RiArrowLeftLine,
  RiArrowRightLine,
  RiCloseLine,
  RiDeleteBinLine,
  RiFlowerLine,
  RiImageAddLine,
  RiLoader4Line,
  RiPencilLine,
} from "react-icons/ri";
import { toast } from "sonner";
import ResponsiveModal from "@/components/ui/ResponsiveModal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

const FLOWER_TYPES = [
  "Rosa",
  "Girasol",
  "Lirio",
  "Tulipán",
  "Orquídea",
  "Margarita",
  "Clavel",
  "Crisantemo",
  "Gerbera",
  "Gladiolo",
  "Iris",
  "Lavanda",
  "Peonia",
  "Protea",
  "Otro",
];

type Flower = { id: string; name: string; type: string; description?: string | null; imageUrl?: string | null };

export default function FloresManager({ flowers: initial }: { flowers: Flower[] }) {
  const [flowers, setFlowers] = useState(initial);
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Flower | null>(null);
  const [saving, setSaving] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [form, setForm] = useState({ name: "", type: "Rosa", description: "", imageUrl: "" });
  const [deleteTarget, setDeleteTarget] = useState<Flower | null>(null);
  const PER_PAGE = 10;

  useEffect(() => {
    return () => {
      if (previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const clearDraft = () => {
    setForm({ name: "", type: "Rosa", description: "", imageUrl: "" });
    setPendingFile(null);
    if (previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    setPreviewUrl("");
  };

  const openCreate = () => {
    setEditing(null);
    clearDraft();
    setShowForm(true);
  };

  const openEdit = (f: Flower) => {
    setEditing(f);
    setForm({ name: f.name, type: f.type, description: f.description || "", imageUrl: f.imageUrl || "" });
    setPendingFile(null);
    if (previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(f.imageUrl || "");
    setShowForm(true);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("La imagen debe ser válida");
      return;
    }
    if (previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    setPendingFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }

    setSaving(true);
    try {
      let imageUrl = form.imageUrl || "";

      if (pendingFile) {
        const fd = new FormData();
        fd.append("file", pendingFile);
        fd.append("folder", "gardentech/flowers");
        const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || "Error subiendo imagen");
        imageUrl = uploadData.url;
      }

      const url = editing ? `/api/flowers/${editing.id}` : "/api/flowers";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, imageUrl }),
      });
      const saved = await res.json();
      if (!res.ok) throw new Error(saved.error);
      if (editing) setFlowers((p) => p.map((f) => (f.id === editing.id ? saved : f)));
      else setFlowers((p) => [...p, saved]);
      toast.success(editing ? "Flor actualizada" : "Flor registrada");
      setShowForm(false);
      clearDraft();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditing(null);
    clearDraft();
  };

  const handleDelete = (id: string) => {
    const flower = flowers.find((f) => f.id === id) || null;
    setDeleteTarget(flower);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const res = await fetch(`/api/flowers/${deleteTarget.id}`, { method: "DELETE" });
    if (res.ok) {
      setFlowers((p) => p.filter((f) => f.id !== deleteTarget.id));
      toast.success("Eliminada");
    } else {
      toast.error("No se puede eliminar, está en uso");
    }
    setDeleteTarget(null);
  };

  const groupedByType = flowers.reduce((acc, f) => {
    acc[f.type] = acc[f.type] || [];
    acc[f.type].push(f);
    return acc;
  }, {} as Record<string, Flower[]>);
  const totalPages = Math.max(1, Math.ceil(flowers.length / PER_PAGE));
  const pageItems = flowers.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);
  const groupedPageByType = pageItems.reduce((acc, f) => {
    acc[f.type] = acc[f.type] || [];
    acc[f.type].push(f);
    return acc;
  }, {} as Record<string, Flower[]>);

  return (
    <>
      <div className="flex justify-end mb-4">
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          <RiAddLine size={16} /> Registrar flor
        </button>
      </div>

      {flowers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 text-center py-16">
          <RiFlowerLine className="text-5xl text-gray-200 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-600 mb-1">Sin flores registradas</h3>
          <p className="text-gray-400 text-sm">Registra las flores disponibles para crear productos</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedPageByType).map(([type, items]) => (
            <div key={type}>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">{type}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {items.map((f) => (
                  <div key={f.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
                    <div className="aspect-square bg-gray-50 relative overflow-hidden">
                      {f.imageUrl ? (
                        <img src={f.imageUrl} alt={f.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <RiFlowerLine size={44} className="text-gray-200" />
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="font-semibold text-sm text-gray-900">{f.name}</p>
                      <span className="text-xs bg-primary-50 text-primary-600 px-2 py-0.5 rounded-full">{f.type}</span>
                      <div className="flex gap-1 mt-2">
                        <button onClick={() => openEdit(f)} className="flex-1 p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors flex items-center justify-center">
                          <RiPencilLine size={14} />
                        </button>
                        <button onClick={() => handleDelete(f.id)} className="flex-1 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center">
                          <RiDeleteBinLine size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-5 flex items-center justify-between gap-2 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm sm:px-5">
          <button
            type="button"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page <= 1}
            className="inline-flex h-9 min-w-9 items-center justify-center rounded-xl px-2 text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 sm:min-w-0 sm:px-3"
            aria-label="Página anterior"
          >
            <RiArrowLeftLine size={14} />
            <span className="ml-2 hidden text-sm font-medium sm:inline">Anterior</span>
          </button>

          <span className="flex-1 whitespace-nowrap text-center text-[11px] text-gray-400 sm:text-xs">
            {flowers.length} registros · pág. {page} de {totalPages}
          </span>

          <button
            type="button"
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={page >= totalPages}
            className="inline-flex h-9 min-w-9 items-center justify-center rounded-xl px-2 text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 sm:min-w-0 sm:px-3"
            aria-label="Página siguiente"
          >
            <span className="mr-2 hidden text-sm font-medium sm:inline">Siguiente</span>
            <RiArrowRightLine size={14} />
          </button>
        </div>
      )}

      <ResponsiveModal
        open={showForm}
        onClose={handleCancel}
        title={editing ? "Editar flor" : "Registrar flor"}
        panelClassName="md:max-w-md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Imagen</label>
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                {previewUrl ? (
                  <img src={previewUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <RiFlowerLine size={24} />
                  </div>
                )}
              </div>
              <label className="flex-1 flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl py-3 cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors text-sm text-gray-500">
                {saving ? <RiLoader4Line className="animate-spin text-primary-500" size={18} /> : <RiImageAddLine size={18} />}
                {pendingFile ? "Imagen lista para guardar" : "Seleccionar imagen"}
                <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" disabled={saving} />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Ej: Rosa Roja"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
            <select
              value={form.type}
              onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-primary-400"
            >
              {FLOWER_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              rows={2}
              placeholder="Descripción opcional..."
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary-400 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              onClick={handleCancel}
              className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-primary-600 text-white py-3 rounded-xl text-sm font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
            >
              {saving ? <><RiLoader4Line className="animate-spin" /> Guardando...</> : (editing ? "Actualizar" : "Registrar flor")}
            </button>
          </div>
        </div>
      </ResponsiveModal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Eliminar flor"
        message={`Vas a eliminar ${deleteTarget?.name || "esta flor"}. Si está en uso, no se podrá borrar.`}
        confirmText="Eliminar"
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </>
  );
}
