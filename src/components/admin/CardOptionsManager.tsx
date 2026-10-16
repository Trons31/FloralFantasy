"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  RiAddLine,
  RiArrowDownLine,
  RiArrowUpLine,
  RiCheckLine,
  RiEditLine,
  RiEyeLine,
  RiFireLine,
  RiLoader4Line,
  RiMailLine,
  RiUploadCloud2Line,
} from "react-icons/ri";
import { formatPrice } from "@/lib/utils";
import { CARD_MAX_CHARS_LIMIT } from "@/lib/card-options";
import ResponsiveModal from "@/components/ui/ResponsiveModal";

// Tarjetas de dedicatoria (spec 012). Misma estructura visual que
// AddonsManager: cabecera, KPIs, tarjetas y modal de edición.

type CardOption = {
  id: string;
  name: string;
  description: string;
  price: number;
  maxChars: number;
  imageUrl?: string | null;
  isActive: boolean;
  sortOrder: number;
  sales?: number;
};

const EMPTY_FORM = { name: "", description: "", price: "0", maxChars: "200", isActive: true };

export default function CardOptionsManager({ initialOptions }: { initialOptions: CardOption[] }) {
  const [options, setOptions] = useState(initialOptions);
  const [editor, setEditor] = useState<CardOption | "new" | null>(null);
  const [viewer, setViewer] = useState<CardOption | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [reordering, setReordering] = useState(false);

  const sorted = [...options].sort((a, b) => a.sortOrder - b.sortOrder || a.price - b.price);
  const bestSeller = [...options].sort((a, b) => (b.sales || 0) - (a.sales || 0))[0];

  const clearPreview = () => {
    if (previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    setPreviewUrl("");
    setPendingFile(null);
  };

  const closeEditor = () => {
    clearPreview();
    setEditor(null);
    setForm(EMPTY_FORM);
  };

  const openCreate = () => {
    clearPreview();
    setForm(EMPTY_FORM);
    setEditor("new");
  };

  const openEdit = (option: CardOption) => {
    clearPreview();
    setForm({
      name: option.name,
      description: option.description,
      price: String(option.price),
      maxChars: String(option.maxChars),
      isActive: option.isActive,
    });
    setPreviewUrl(option.imageUrl || "");
    setEditor(option);
  };

  const handleImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    setPendingFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const mergeSaved = (data: CardOption) =>
    setOptions(current => current.some(option => option.id === data.id)
      ? current.map(option => option.id === data.id ? { ...data, sales: option.sales || 0 } : option)
      : [...current, { ...data, sales: 0 }]);

  const saveOption = async () => {
    const maxChars = Number(form.maxChars);
    if (!form.name.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    if (form.price === "" || Number(form.price) < 0) {
      toast.error("El precio debe ser 0 o mayor");
      return;
    }
    if (!Number.isInteger(maxChars) || maxChars < 1 || maxChars > CARD_MAX_CHARS_LIMIT) {
      toast.error(`Los caracteres deben estar entre 1 y ${CARD_MAX_CHARS_LIMIT}`);
      return;
    }
    setSaving(true);
    try {
      const editing = editor !== "new" && editor;
      let imageUrl = editing ? editing.imageUrl || "" : "";
      let imagePublicId: string | undefined;
      if (pendingFile) {
        const upload = new FormData();
        upload.append("file", pendingFile);
        upload.append("folder", "gardentech/tarjetas");
        const uploadResponse = await fetch("/api/upload", { method: "POST", body: upload });
        const uploadData = await uploadResponse.json();
        if (!uploadResponse.ok) throw new Error(uploadData.error || "No fue posible subir la imagen");
        imageUrl = uploadData.url;
        imagePublicId = uploadData.publicId;
      }

      const response = await fetch(editing ? `/api/card-options/${editing.id}` : "/api/card-options", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim(),
          price: Number(form.price),
          maxChars,
          isActive: form.isActive,
          imageUrl,
          ...(imagePublicId ? { imagePublicId } : {}),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No fue posible guardar");
      mergeSaved(data);
      toast.success(editing ? "Tarjeta actualizada" : "Tarjeta creada");
      closeEditor();
    } catch (error: any) {
      toast.error(error.message || "No fue posible guardar");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (option: CardOption) => {
    try {
      const response = await fetch(`/api/card-options/${option.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !option.isActive }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No fue posible actualizar");
      mergeSaved(data);
      toast.success(data.isActive ? "Tarjeta activada" : "Tarjeta desactivada");
    } catch (error: any) {
      toast.error(error.message || "No fue posible actualizar");
    }
  };

  // Intercambia el orden con la vecina y guarda ambas.
  const move = async (option: CardOption, direction: -1 | 1) => {
    const index = sorted.findIndex(item => item.id === option.id);
    const neighbor = sorted[index + direction];
    if (!neighbor || reordering) return;
    setReordering(true);
    try {
      const updates = sorted.map((item, position) => ({ id: item.id, sortOrder: position }));
      updates[index].sortOrder = index + direction;
      updates[index + direction].sortOrder = index;
      const changed = updates.filter(update => sorted.find(item => item.id === update.id)?.sortOrder !== update.sortOrder);
      const results = await Promise.all(changed.map(update =>
        fetch(`/api/card-options/${update.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sortOrder: update.sortOrder }),
        }).then(async response => {
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || "No fue posible reordenar");
          return data as CardOption;
        })
      ));
      results.forEach(mergeSaved);
    } catch (error: any) {
      toast.error(error.message || "No fue posible reordenar");
    } finally {
      setReordering(false);
    }
  };

  return (
    <div className="min-w-0">
      <div className="mx-auto max-w-[1500px]">
        <header className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tarjetas de dedicatoria</h1>
            <p className="mt-1 text-sm text-slate-500">Opciones que el cliente elige en cada arreglo, con su precio y límite de caracteres</p>
          </div>
          <button type="button" onClick={openCreate} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary-500 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-600">
            <RiAddLine /> Nueva tarjeta
          </button>
        </header>

        <section className="grid grid-cols-2 gap-3 xl:grid-cols-3">
          {[
            { label: "Total tarjetas", value: options.length, detail: "Registradas", Icon: RiMailLine, color: "bg-brand-50 text-primary-500" },
            { label: "Activas", value: options.filter(option => option.isActive).length, detail: "Visibles en la tienda", Icon: RiCheckLine, color: "bg-emerald-50 text-emerald-600" },
            { label: "Más elegida", value: bestSeller?.sales ? bestSeller.name : "Sin datos", detail: `${bestSeller?.sales || 0} pedidos`, Icon: RiFireLine, color: "bg-orange-50 text-orange-500" },
          ].map(card => (
            <article key={card.label} className="flex min-h-[115px] items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-full ${card.color}`}><card.Icon size={22} /></span>
              <div className="min-w-0"><p className="truncate text-lg font-extrabold text-gray-900">{card.value}</p><p className="mt-1 text-xs font-semibold">{card.label}</p><p className="mt-1 text-[10px] text-slate-400">{card.detail}</p></div>
            </article>
          ))}
        </section>

        {sorted.length ? (
          <section className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {sorted.map((option, index) => (
              <article key={option.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="relative flex aspect-[1.35] items-center justify-center bg-white p-4">
                  {option.imageUrl ? <img src={option.imageUrl} alt={option.name} className="h-full w-full object-contain" /> : <RiMailLine size={70} className="text-slate-200" />}
                  <button type="button" onClick={() => toggleActive(option)} className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[9px] font-semibold ${option.isActive ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>
                    {option.isActive ? "Activa" : "Inactiva"}
                  </button>
                  <div className="absolute left-3 top-3 flex gap-1">
                    <button type="button" disabled={index === 0 || reordering} onClick={() => move(option, -1)} aria-label={`Subir ${option.name}`} className="grid h-7 w-7 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 disabled:opacity-30"><RiArrowUpLine size={14} /></button>
                    <button type="button" disabled={index === sorted.length - 1 || reordering} onClick={() => move(option, 1)} aria-label={`Bajar ${option.name}`} className="grid h-7 w-7 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 disabled:opacity-30"><RiArrowDownLine size={14} /></button>
                  </div>
                </div>
                <div className="px-4 pb-3">
                  <h2 className="truncate text-sm font-bold text-gray-900">{option.name}</h2>
                  <p className="mt-0.5 truncate text-xs text-slate-500">{option.description || "Sin descripción"} · {option.maxChars} caracteres</p>
                  <p className="mt-1 text-sm font-bold text-primary-500">{option.price > 0 ? `+ ${formatPrice(option.price)}` : "Gratis"}</p>
                </div>
                <div className="grid grid-cols-3 border-t border-slate-100">
                  <button type="button" onClick={() => setViewer(option)} className="inline-flex h-11 items-center justify-center gap-1.5 border-r border-slate-100 text-[10px] font-medium text-slate-600 hover:bg-slate-50"><RiEyeLine /> Ver</button>
                  <button type="button" onClick={() => openEdit(option)} className="inline-flex h-11 items-center justify-center gap-1.5 border-r border-slate-100 text-[10px] font-medium text-slate-600 hover:bg-slate-50"><RiEditLine /> Editar</button>
                  <button type="button" onClick={() => toggleActive(option)} className={`inline-flex h-11 items-center justify-center gap-1.5 text-[10px] font-medium hover:bg-slate-50 ${option.isActive ? "text-red-500" : "text-emerald-600"}`}>{option.isActive ? "Desactivar" : "Activar"}</button>
                </div>
              </article>
            ))}
          </section>
        ) : (
          <section className="mt-5 rounded-2xl border border-slate-200 bg-white py-20 text-center">
            <RiMailLine className="mx-auto text-slate-200" size={48} />
            <p className="mt-4 text-sm font-semibold text-slate-600">Aún no hay tarjetas</p>
            <p className="mt-1 text-xs text-slate-400">Sin tarjetas activas, la tienda permite una dedicatoria de hasta 200 caracteres.</p>
          </section>
        )}
      </div>

      <ResponsiveModal
        open={Boolean(editor)}
        onClose={closeEditor}
        title={editor === "new" ? "Nueva tarjeta" : "Editar tarjeta"}
        description="Así la verá el cliente en la sección “Elige tu tarjeta” de cada arreglo."
        size="xl"
        footer={(
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={closeEditor} disabled={saving} className="h-11 rounded-xl border border-gray-200 bg-white px-5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50">Cancelar</button>
            <button type="button" onClick={saveOption} disabled={saving} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 disabled:opacity-50">
              {saving ? <RiLoader4Line className="animate-spin" /> : <RiCheckLine />} {saving ? "Guardando..." : "Guardar tarjeta"}
            </button>
          </div>
        )}
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-2xl bg-slate-50">
              {previewUrl ? <img src={previewUrl} alt="" className="h-full w-full object-contain" /> : <RiMailLine size={38} className="text-slate-300" />}
            </div>
            <label className="flex min-h-16 flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 px-3 text-xs text-slate-500 hover:border-primary-300">
              <RiUploadCloud2Line /> {pendingFile ? pendingFile.name : "Foto de la tarjeta (opcional)"}
              <input type="file" accept="image/*" onChange={handleImage} className="hidden" />
            </label>
          </div>
          <FormField label="Nombre"><input value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-primary-300" placeholder="Ej: Tarjeta mediana" /></FormField>
          <FormField label="Descripción"><input value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-primary-300" placeholder="Ej: Postal 10×15 en papel lino" /></FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Precio adicional (COP)"><input type="number" min="0" value={form.price} onChange={event => setForm({ ...form, price: event.target.value })} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-primary-300" placeholder="0 = gratis" /></FormField>
            <FormField label="Máximo de caracteres"><input type="number" min="1" max={CARD_MAX_CHARS_LIMIT} value={form.maxChars} onChange={event => setForm({ ...form, maxChars: event.target.value })} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-primary-300" /></FormField>
          </div>
          <label className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">
            <span><strong className="block text-sm">Activa</strong><small className="text-slate-400">Se muestra en la tienda</small></span>
            <button type="button" onClick={() => setForm({ ...form, isActive: !form.isActive })} className={`relative h-7 w-12 rounded-full transition ${form.isActive ? "bg-emerald-500" : "bg-slate-300"}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${form.isActive ? "left-6" : "left-1"}`} /></button>
          </label>
        </div>
      </ResponsiveModal>

      <ResponsiveModal open={Boolean(viewer)} onClose={() => setViewer(null)} title={viewer?.name || "Tarjeta"} size="md">
        {viewer && (
          <div className="text-center">
            <div className="mx-auto grid aspect-square max-w-xs place-items-center overflow-hidden rounded-2xl bg-slate-50">
              {viewer.imageUrl ? <img src={viewer.imageUrl} alt={viewer.name} className="h-full w-full object-contain" /> : <RiMailLine size={90} className="text-slate-200" />}
            </div>
            <h3 className="mt-5 text-xl font-bold">{viewer.name}</h3>
            <p className="mt-1 text-sm text-slate-500">{viewer.description}</p>
            <p className="mt-2 text-lg font-bold text-primary-500">{viewer.price > 0 ? `+ ${formatPrice(viewer.price)}` : "Gratis"}</p>
            <div className="mt-3 flex justify-center gap-2"><span className="rounded-full bg-violet-50 px-3 py-1 text-xs text-violet-600">{viewer.maxChars} caracteres</span><span className={`rounded-full px-3 py-1 text-xs ${viewer.isActive ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>{viewer.isActive ? "Activa" : "Inactiva"}</span></div>
          </div>
        )}
      </ResponsiveModal>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-600">{label}</span>{children}</label>;
}
