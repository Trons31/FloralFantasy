"use client";

import { useMemo, useState } from "react";
import {
  RiAddLine,
  RiDeleteBinLine,
  RiEditLine,
  RiImageAddLine,
  RiLoader4Line,
  RiCalendar2Line,
  RiShieldCheckLine,
  RiEyeLine,
  RiEyeOffLine,
} from "react-icons/ri";
import { toast } from "sonner";
import ResponsiveModal from "@/components/ui/ResponsiveModal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

type OccasionImage = {
  id: string;
  url: string;
  publicId?: string | null;
  isMain: boolean;
  order: number;
};

type Occasion = {
  id: string;
  name: string;
  slug: string;
  subtitle?: string | null;
  advanceOrderDays: number;
  sortOrder: number;
  isActive: boolean;
  images: OccasionImage[];
};

type ImageSlot =
  | { kind: "pending"; file: File; previewUrl: string; isMain: boolean }
  | { kind: "uploaded"; url: string; publicId: string; isMain: boolean };

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function toInputImages(images: OccasionImage[]): ImageSlot[] {
  if (!images.length) {
    return [{ kind: "uploaded", url: "", publicId: "", isMain: true }];
  }
  return images.map((img) => ({
    kind: "uploaded" as const,
    url: img.url,
    publicId: img.publicId || "",
    isMain: img.isMain,
  }));
}

export default function OcasionesManager({ occasions: initial }: { occasions: Occasion[] }) {
  const [occasions, setOccasions] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Occasion | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Occasion | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [imageSlots, setImageSlots] = useState<ImageSlot[]>([{ kind: "uploaded", url: "", publicId: "", isMain: true }]);
  const [uploadingSlots, setUploadingSlots] = useState<Set<number>>(new Set());
  const [form, setForm] = useState({
    name: "",
    slug: "",
    subtitle: "",
    advanceOrderDays: "0",
    sortOrder: "0",
    isActive: true,
  });

  const activeCount = useMemo(() => occasions.filter((o) => o.isActive).length, [occasions]);

  const maxSortOrder = useMemo(
    () => occasions.reduce((max, occasion) => Math.max(max, occasion.sortOrder || 0), 0),
    [occasions]
  );

  const clearDraft = () => {
    setForm({
      name: "",
      slug: "",
      subtitle: "",
      advanceOrderDays: "0",
      sortOrder: String(maxSortOrder + 1),
      isActive: true,
    });
    setImageSlots([{ kind: "uploaded", url: "", publicId: "", isMain: true }]);
    setUploadingSlots(new Set());
  };

  const openCreate = () => {
    setEditing(null);
    clearDraft();
    setShowForm(true);
  };

  const openEdit = (occasion: Occasion) => {
    setEditing(occasion);
    setForm({
      name: occasion.name,
      slug: occasion.slug,
      subtitle: occasion.subtitle || "",
      advanceOrderDays: String(occasion.advanceOrderDays || 0),
      sortOrder: String(occasion.sortOrder || 0),
      isActive: occasion.isActive,
    });
    setImageSlots(toInputImages(occasion.images));
    setShowForm(true);
  };

  const closeForm = () => {
    imageSlots.forEach((slot) => {
      if (slot.kind === "pending") URL.revokeObjectURL(slot.previewUrl);
    });
    setShowForm(false);
    setEditing(null);
    clearDraft();
  };

  const setMainImage = (idx: number) => {
    setImageSlots((prev) =>
      prev.map((slot, i) => ({ ...slot, isMain: i === idx }))
    );
  };

  const addImageSlot = () => {
    setImageSlots((prev) => [...prev, { kind: "uploaded", url: "", publicId: "", isMain: prev.length === 0 }]);
  };

  const removeImage = (idx: number) => {
    setImageSlots((prev) => {
      const slot = prev[idx];
      if (slot?.kind === "pending") URL.revokeObjectURL(slot.previewUrl);
      const next = prev.filter((_, i) => i !== idx);
      if (next.length > 0 && !next.some((slot) => slot.isMain)) {
        next[0] = { ...next[0], isMain: true };
      }
      return next.length > 0 ? next : [{ kind: "uploaded", url: "", publicId: "", isMain: true }];
    });
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("La imagen debe ser válida");
      return;
    }

    setImageSlots((prev) => {
      const next = [...prev];
      const current = next[idx];
      if (current?.kind === "pending") URL.revokeObjectURL(current.previewUrl);
      next[idx] = {
        kind: "pending",
        file,
        previewUrl: URL.createObjectURL(file),
        isMain: current?.isMain ?? idx === 0,
      };
      if (!next.some((slot) => slot.isMain)) next[0].isMain = true;
      return next;
    });
  };

  const uploadSlot = async (slot: Extract<ImageSlot, { kind: "pending" }>, idx: number) => {
    setUploadingSlots((prev) => new Set(prev).add(idx));
    const fd = new FormData();
    fd.append("file", slot.file);
    fd.append("folder", "gardentech/occasions");
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    setUploadingSlots((prev) => {
      const next = new Set(prev);
      next.delete(idx);
      return next;
    });
    URL.revokeObjectURL(slot.previewUrl);
    if (!res.ok) throw new Error(data.error || "Error subiendo imagen");
    return { url: data.url as string, publicId: data.publicId as string, isMain: slot.isMain };
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    if (!form.slug.trim()) {
      toast.error("El slug es obligatorio");
      return;
    }

    const filledSlots = imageSlots.filter((slot) => slot.kind === "pending" || (slot.kind === "uploaded" && slot.url));
    if (filledSlots.length === 0) {
      toast.error("Agrega al menos una imagen");
      return;
    }

    setSaving(true);
    try {
      const resolvedImages = await Promise.all(
        imageSlots.map(async (slot, idx) => {
          if (slot.kind === "pending") return uploadSlot(slot, idx);
          if (!slot.url) return null;
          return { url: slot.url, publicId: slot.publicId || null, isMain: slot.isMain, order: idx };
        })
      );

      const normalizedImages = resolvedImages
        .filter(Boolean)
        .map((img, idx) => ({
          ...img!,
          order: idx,
        }));

      if (normalizedImages.length === 0) {
        toast.error("Agrega al menos una imagen");
        setSaving(false);
        return;
      }

      if (!normalizedImages.some((img) => img.isMain)) {
        normalizedImages[0].isMain = true;
      }

      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        subtitle: form.subtitle.trim(),
        advanceOrderDays: Number(form.advanceOrderDays || 0),
        sortOrder: Number(form.sortOrder || 0),
        isActive: Boolean(form.isActive),
        images: normalizedImages,
      };

      const url = editing ? `/api/occasions/${editing.id}` : "/api/occasions";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const saved = await res.json();
      if (!res.ok) throw new Error(saved.error || "No fue posible guardar");

      if (editing) {
        setOccasions((prev) => prev.map((item) => (item.id === editing.id ? saved : item)));
      } else {
        setOccasions((prev) => [saved, ...prev]);
      }
      toast.success(editing ? "Ocasión actualizada" : "Ocasión creada");
      closeForm();
    } catch (error: any) {
      toast.error(error.message || "No fue posible guardar");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/occasions/${deleteTarget.id}`, { method: "DELETE" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "No fue posible eliminar la ocasión");
      setOccasions(prev => prev.filter(item => item.id !== deleteTarget.id));
      toast.success("Ocasión eliminada");
      setDeleteTarget(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No fue posible eliminar la ocasión");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ocasiones</h1>
          <p className="text-gray-500 text-sm mt-1">
            Administra las tarjetas visibles en la home. Activas: {activeCount} de {occasions.length}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          <RiAddLine size={16} /> Nueva ocasión
        </button>
      </div>

      {occasions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 text-center py-16">
          <RiCalendar2Line className="text-5xl text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Sin ocasiones registradas</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {occasions
            .slice()
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((occasion) => {
              const cover = occasion.images.slice().sort((a, b) => a.order - b.order).find((img) => img.isMain) || occasion.images[0];
              return (
                <div key={occasion.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="relative aspect-[4/5] bg-gray-100 overflow-hidden">
                    {cover?.url ? (
                      <img
                        src={cover.url}
                        alt={occasion.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <RiImageAddLine size={42} className="text-gray-200" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                    <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${occasion.isActive ? "bg-white/90 text-emerald-700" : "bg-white/80 text-gray-500"}`}>
                        {occasion.isActive ? "Activa" : "Oculta"}
                      </span>
                      {occasion.advanceOrderDays > 0 && (
                        <span className="rounded-full bg-amber-500/90 text-white px-2.5 py-1 text-[11px] font-semibold">
                          Anticipación {occasion.advanceOrderDays} d
                        </span>
                      )}
                    </div>
                    <div className="absolute inset-x-0 bottom-0 p-4 text-center">
                      <p className="text-white font-bold text-lg leading-tight">{occasion.name}</p>
                      {occasion.subtitle && <p className="text-white/70 text-sm mt-0.5">{occasion.subtitle}</p>}
                      <p className="text-white/55 text-[11px] mt-2 font-mono">{occasion.slug}</p>
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <p className="text-gray-500">
                        Orden: <span className="font-semibold text-gray-900">{occasion.sortOrder}</span>
                      </p>
                      <p className="text-gray-500">
                        Imágenes: <span className="font-semibold text-gray-900">{occasion.images.length}</span>
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(occasion)}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <RiEditLine size={15} /> Editar
                      </button>
                      <button
                        onClick={() => setDeleteTarget(occasion)}
                        className="inline-flex items-center justify-center rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-red-600 hover:bg-red-100 transition-colors"
                      >
                        <RiDeleteBinLine size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      <ResponsiveModal
        open={showForm}
        onClose={closeForm}
        title={editing ? "Editar ocasión" : "Nueva ocasión"}
        description="Define el nombre, las imágenes y si requiere pedido con anterioridad."
        panelClassName="md:max-w-4xl"
      >
        <div className="space-y-5">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre</label>
                <input
                  value={form.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setForm((prev) => ({
                      ...prev,
                      name,
                      slug: prev.slug ? prev.slug : slugify(name),
                    }));
                  }}
                  placeholder="Ej: Amor, Cumpleaños, Bodas"
                  className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Slug</label>
                <input
                  value={form.slug}
                  onChange={(e) => setForm((prev) => ({ ...prev, slug: slugify(e.target.value) }))}
                  placeholder="amor"
                  className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
                <p className="text-xs text-gray-400 mt-1">Se usará en el filtro público de la tienda.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Subtítulo</label>
                <input
                  value={form.subtitle}
                  onChange={(e) => setForm((prev) => ({ ...prev, subtitle: e.target.value }))}
                  placeholder="Ej: & Romance"
                  className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Orden</label>
                  <input
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) => setForm((prev) => ({ ...prev, sortOrder: e.target.value }))}
                    className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Días antes</label>
                  <input
                    type="number"
                    value={form.advanceOrderDays}
                    onChange={(e) => setForm((prev) => ({ ...prev, advanceOrderDays: e.target.value }))}
                    className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">Visible en la web</p>
                  <p className="text-xs text-gray-400">Oculta la tarjeta sin eliminarla</p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, isActive: !prev.isActive }))}
                  className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-semibold transition-colors ${
                    form.isActive ? "bg-emerald-500 text-white" : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {form.isActive ? <RiEyeLine size={14} /> : <RiEyeOffLine size={14} />}
                  {form.isActive ? "Visible" : "Oculta"}
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Imágenes</p>
                  <p className="text-xs text-gray-400">La primera marcada será la principal del carrusel</p>
                </div>
                <button
                  type="button"
                  onClick={addImageSlot}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  <RiAddLine size={14} /> Agregar
                </button>
              </div>

              <div className="space-y-3 max-h-[56vh] overflow-y-auto pr-1">
                {imageSlots.map((slot, idx) => {
                  const preview = slot.kind === "pending" ? slot.previewUrl : slot.url;
                  const isUploading = uploadingSlots.has(idx);
                  return (
                    <div key={idx} className="rounded-2xl border border-gray-200 bg-white p-3">
                      <div className="flex items-start gap-3">
                        <div className="w-20 h-24 rounded-xl bg-gray-50 overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {preview ? (
                            <img src={preview} alt={`Ocasión ${idx + 1}`} className="w-full h-full object-cover" />
                          ) : (
                            <RiImageAddLine size={24} className="text-gray-300" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-gray-900">Imagen {idx + 1}</p>
                            {slot.isMain && (
                              <span className="rounded-full bg-rose-100 text-rose-600 px-2 py-0.5 text-[11px] font-semibold">
                                Principal
                              </span>
                            )}
                          </div>
                          <label className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 cursor-pointer">
                            {isUploading ? <RiLoader4Line className="animate-spin" size={14} /> : <RiImageAddLine size={14} />}
                            {preview ? "Cambiar imagen" : "Subir imagen"}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleImageSelect(e, idx)}
                            />
                          </label>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => setMainImage(idx)}
                              className={`rounded-xl px-3 py-2 text-xs font-semibold border transition-colors ${
                                slot.isMain
                                  ? "border-rose-500 bg-rose-500 text-white"
                                  : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                              }`}
                            >
                              Marcar principal
                            </button>
                            <button
                              type="button"
                              onClick={() => removeImage(idx)}
                              className="rounded-xl px-3 py-2 text-xs font-semibold border border-red-100 bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                            >
                              Quitar
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={closeForm}
              className="px-4 py-3 rounded-2xl border border-gray-200 text-gray-700 font-semibold"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-primary-600 text-white font-semibold hover:bg-primary-700 disabled:opacity-50"
            >
              {saving ? <RiLoader4Line className="animate-spin" size={16} /> : <RiShieldCheckLine size={16} />}
              {saving ? "Guardando..." : "Guardar ocasión"}
            </button>
          </div>
        </div>
      </ResponsiveModal>
      <ConfirmDialog
        open={!!deleteTarget}
        title="Eliminar ocasión"
        message={`Vas a eliminar ${deleteTarget?.name || "esta ocasión"}. Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        loading={deleting}
        onClose={() => !deleting && setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />

    </>
  );
}
