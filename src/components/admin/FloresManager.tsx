"use client";

import { useEffect, useMemo, useState } from "react";
import {
  RiAddLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiCheckLine,
  RiDeleteBinLine,
  RiEditLine,
  RiEqualizerLine,
  RiFlowerLine,
  RiImageAddLine,
  RiLoader4Line,
  RiMore2Line,
  RiLeafLine,
  RiPlantLine,
  RiSearchLine,
  RiSeedlingLine,
  RiSparklingLine,
  RiStackLine,
  RiSunLine,
  RiTimeLine,
} from "react-icons/ri";
import { toast } from "sonner";
import ResponsiveModal from "@/components/ui/ResponsiveModal";
import Pagination from "@/components/ui/Pagination";
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

const TYPE_ICONS: Record<string, typeof RiFlowerLine> = {
  Rosa: RiFlowerLine,
  Girasol: RiSunLine,
  Lirio: RiPlantLine,
  Tulipán: RiSeedlingLine,
  Orquídea: RiSparklingLine,
  Margarita: RiFlowerLine,
  Lavanda: RiLeafLine,
};

type Flower = {
  id: string;
  name: string;
  type: string;
  description?: string | null;
  imageUrl?: string | null;
  createdAt: string;
};

const PER_PAGE = 12;

export default function FloresManager({ flowers: initial }: { flowers: Flower[] }) {
  const [flowers, setFlowers] = useState(initial);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("ALL");
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Flower | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [form, setForm] = useState({ name: "", type: "Rosa", description: "", imageUrl: "" });
  const [deleteTarget, setDeleteTarget] = useState<Flower | null>(null);
  const [lastUpdated, setLastUpdated] = useState(() => {
    const newest = initial.reduce<Date | null>((latest, flower) => {
      const date = new Date(flower.createdAt);
      return !latest || date > latest ? date : latest;
    }, null);
    return newest;
  });

  useEffect(() => {
    return () => {
      if (previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const types = useMemo(
    () => Array.from(new Set(flowers.map(flower => flower.type))).sort((a, b) => a.localeCompare(b, "es")),
    [flowers]
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("es");
    return flowers.filter(flower => {
      const matchesType = selectedType === "ALL" || flower.type === selectedType;
      const matchesSearch =
        !query ||
        flower.name.toLocaleLowerCase("es").includes(query) ||
        flower.type.toLocaleLowerCase("es").includes(query) ||
        flower.description?.toLocaleLowerCase("es").includes(query);
      return matchesType && matchesSearch;
    });
  }, [flowers, search, selectedType]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const pageItems = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  useEffect(() => {
    setPage(1);
  }, [search, selectedType]);

  useEffect(() => {
    setPage(current => Math.min(current, totalPages));
  }, [totalPages]);

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

  const openEdit = (flower: Flower) => {
    setEditing(flower);
    setForm({
      name: flower.name,
      type: flower.type,
      description: flower.description || "",
      imageUrl: flower.imageUrl || "",
    });
    setPendingFile(null);
    if (previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(flower.imageUrl || "");
    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) return;
    setShowForm(false);
    setEditing(null);
    clearDraft();
  };

  const selectImage = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Selecciona una imagen válida");
      return;
    }
    if (previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    setPendingFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const saveFlower = async () => {
    if (!form.name.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }

    setSaving(true);
    try {
      let imageUrl = form.imageUrl;
      if (pendingFile) {
        const uploadBody = new FormData();
        uploadBody.set("file", pendingFile);
        uploadBody.set("folder", "gardentech/flowers");
        const uploadResponse = await fetch("/api/upload", { method: "POST", body: uploadBody });
        const uploadData = await uploadResponse.json();
        if (!uploadResponse.ok) throw new Error(uploadData.error || "No se pudo subir la imagen");
        imageUrl = uploadData.url;
      }

      const response = await fetch(editing ? `/api/flowers/${editing.id}` : "/api/flowers", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          type: form.type,
          description: form.description.trim() || null,
          imageUrl: imageUrl || null,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo guardar la flor");

      const saved: Flower = {
        ...data,
        createdAt: data.createdAt || editing?.createdAt || new Date().toISOString(),
      };
      setFlowers(current =>
        editing
          ? current.map(flower => flower.id === editing.id ? saved : flower)
          : [...current, saved].sort((a, b) => a.name.localeCompare(b.name, "es"))
      );
      setLastUpdated(new Date());
      toast.success(editing ? "Flor actualizada" : "Flor registrada");
      setShowForm(false);
      setEditing(null);
      clearDraft();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar la flor");
    } finally {
      setSaving(false);
    }
  };

  const deleteFlower = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/flowers/${deleteTarget.id}`, { method: "DELETE" });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || "No se puede eliminar porque está en uso");
      setFlowers(current => current.filter(flower => flower.id !== deleteTarget.id));
      setLastUpdated(new Date());
      setDeleteTarget(null);
      toast.success("Flor eliminada");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo eliminar la flor");
    } finally {
      setDeleting(false);
    }
  };

  const formatLastUpdated = () => {
    if (!lastUpdated) return "Sin registros";
    const today = new Date();
    const sameDay =
      today.getFullYear() === lastUpdated.getFullYear() &&
      today.getMonth() === lastUpdated.getMonth() &&
      today.getDate() === lastUpdated.getDate();
    const time = new Intl.DateTimeFormat("es-CO", { hour: "numeric", minute: "2-digit" }).format(lastUpdated);
    return sameDay ? `Hoy, ${time}` : new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short", year: "numeric" }).format(lastUpdated);
  };

  const visibleTypes = types.slice(0, 6);

  return (
    <div className="min-h-full bg-slate-50/70 p-3 sm:p-5 lg:p-7">
      <div className="mx-auto max-w-[1500px] space-y-5">
        <header className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary-50 text-primary-500">
              <RiFlowerLine size={25} />
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Gestión de Flores</h1>
              <p className="mt-1 text-sm text-slate-500">Administra todas las flores disponibles para tus arreglos.</p>
            </div>
          </div>
          <div className="hidden gap-2 sm:flex">
            <label className="flex h-11 min-w-[280px] items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 shadow-sm">
              <RiSearchLine className="shrink-0 text-slate-400" size={18} />
              <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar flor..." className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400" />
            </label>
            <button type="button" onClick={() => setShowFilters(current => !current)} className={`grid h-11 w-12 place-items-center rounded-xl border bg-white text-slate-600 shadow-sm transition ${showFilters ? "border-primary-300 text-primary-500" : "border-slate-200"}`} aria-label="Mostrar filtros">
              <RiEqualizerLine size={18} />
            </button>
            <button type="button" onClick={openCreate} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary-500 px-5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(236,18,91,.2)] transition hover:bg-primary-600">
              <RiAddLine size={19} />
              Registrar flor
            </button>
          </div>
          <button type="button" onClick={openCreate} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary-500 px-5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(236,18,91,.2)] transition hover:bg-primary-600 sm:hidden">
            <RiAddLine size={19} />
            Registrar flor
          </button>
        </header>

        <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {[
            { label: "Total de flores", value: String(flowers.length), detail: "En inventario", Icon: RiFlowerLine, color: "bg-primary-50 text-primary-500" },
            { label: "Categorías", value: String(types.length), detail: "Tipos diferentes", Icon: RiStackLine, color: "bg-violet-50 text-violet-600" },
            { label: "Flores disponibles", value: String(flowers.length), detail: "Disponibles", Icon: RiCheckLine, color: "bg-emerald-50 text-emerald-600" },
            { label: "Última actualización", value: formatLastUpdated(), detail: "Inventario de flores", Icon: RiTimeLine, color: "bg-amber-50 text-amber-500" },
          ].map(card => (
            <article key={card.label} className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${card.color}`}><card.Icon size={21} /></span>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-500">{card.label}</p>
                  <strong className="mt-1 block truncate text-lg font-bold text-slate-950 sm:text-xl" title={card.value}>{card.value}</strong>
                  <p className="mt-1 text-[11px] text-slate-500">{card.detail}</p>
                </div>
              </div>
            </article>
          ))}
        </section>

        <section className="flex items-center gap-2 sm:hidden">
          <label className="flex h-11 min-w-0 flex-1 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 shadow-sm">
            <RiSearchLine className="shrink-0 text-slate-400" size={18} />
            <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar flor..." className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400" />
          </label>
          <button type="button" onClick={() => setShowFilters(current => !current)} className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl border bg-white text-slate-600 shadow-sm transition ${showFilters ? "border-primary-300 text-primary-500" : "border-slate-200"}`} aria-label="Mostrar filtros">
            <RiEqualizerLine size={18} />
          </button>
        </section>

        {showFilters && (
          <section className="flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-3 pb-1 shadow-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button type="button" onClick={() => setSelectedType("ALL")} className={`h-10 shrink-0 rounded-xl px-5 text-xs font-semibold transition ${selectedType === "ALL" ? "bg-primary-500 text-white" : "border border-slate-200 bg-white text-slate-600"}`}>
            Todas
          </button>
          {visibleTypes.map(type => {
            const TypeIcon = TYPE_ICONS[type] || RiLeafLine;
            return (
              <button key={type} type="button" onClick={() => setSelectedType(type)} className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-xl px-5 text-xs font-semibold transition ${selectedType === type ? "bg-primary-500 text-white" : "border border-slate-200 bg-white text-slate-600"}`}>
                <TypeIcon size={15} />
                {type}
              </button>
            );
          })}
          {types.length > visibleTypes.length && (
            <label className="relative ml-auto flex h-10 shrink-0 items-center rounded-xl border border-slate-200 bg-white px-4">
              <select value={visibleTypes.includes(selectedType) || selectedType === "ALL" ? "" : selectedType} onChange={event => setSelectedType(event.target.value || "ALL")} className="appearance-none bg-transparent pr-6 text-xs font-semibold text-slate-600 outline-none">
                <option value="">Más categorías</option>
                {types.slice(6).map(type => <option key={type}>{type}</option>)}
              </select>
              <RiArrowRightSLine className="pointer-events-none absolute right-3 rotate-90 text-slate-400" />
            </label>
          )}
        </section>
        )}

        {pageItems.length ? (
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {pageItems.map(flower => (
              <article key={flower.id} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="relative aspect-[16/8] overflow-hidden bg-slate-50">
                  {flower.imageUrl ? (
                    <img src={flower.imageUrl} alt={flower.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="grid h-full place-items-center"><RiFlowerLine className="text-slate-200" size={48} /></div>
                  )}
                  <button type="button" onClick={() => openEdit(flower)} className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-lg bg-white/95 text-slate-700 shadow-sm" aria-label={`Editar ${flower.name}`}>
                    <RiMore2Line />
                  </button>
                </div>
                <div className="p-4">
                  <h2 className="truncate text-sm font-bold text-slate-950">{flower.name}</h2>
                  <p className="mt-1 text-xs text-slate-500">Categoría: {flower.type}</p>
                  {flower.description && <p className="mt-2 line-clamp-2 min-h-8 text-[11px] leading-4 text-slate-400">{flower.description}</p>}
                  <p className="mt-3 flex items-center gap-2 text-xs font-medium text-emerald-600"><span className="h-2 w-2 rounded-full bg-emerald-500" />Disponible</p>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => openEdit(flower)} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 transition hover:border-primary-200 hover:text-primary-500"><RiEditLine />Editar</button>
                    <button type="button" onClick={() => setDeleteTarget(flower)} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-red-100 text-xs font-semibold text-red-500 transition hover:bg-red-50"><RiDeleteBinLine />Eliminar</button>
                  </div>
                </div>
              </article>
            ))}
          </section>
        ) : (
          <section className="grid min-h-64 place-items-center rounded-2xl border border-slate-200 bg-white px-5 py-10 text-center shadow-sm">
            <div>
              <RiFlowerLine className="mx-auto text-slate-200" size={50} />
              <h2 className="mt-4 font-semibold text-slate-800">No encontramos flores</h2>
              <p className="mt-1 text-sm text-slate-500">Cambia la búsqueda o selecciona otra categoría.</p>
            </div>
          </section>
        )}

          <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={filtered.length}
          perPage={PER_PAGE}
          itemLabel="flores"
          onPageChange={setPage}
          className="rounded-2xl border border-slate-200 shadow-sm"
        />
      </div>

      <ResponsiveModal open={showForm} onClose={closeForm} title={editing ? "Editar flor" : "Registrar flor"} description="Completa la información que se usará al crear arreglos." panelClassName="sm:max-w-lg">
        <div className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-700">Imagen</span>
            <input id="flower-image" type="file" accept="image/*" onChange={event => selectImage(event.target.files?.[0])} className="hidden" disabled={saving} />
            <span onClick={() => document.getElementById("flower-image")?.click()} className="grid min-h-44 cursor-pointer place-items-center overflow-hidden rounded-xl border-2 border-dashed border-slate-200 bg-slate-50">
              {previewUrl ? <img src={previewUrl} alt="Vista previa" className="h-44 w-full object-cover" /> : <span className="text-center text-slate-400"><RiImageAddLine className="mx-auto mb-2" size={32} />Seleccionar imagen</span>}
            </span>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-700">Nombre</span>
            <input value={form.name} onChange={event => setForm(current => ({ ...current, name: event.target.value }))} placeholder="Ej. Rosa Premium Roja" className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-50" autoFocus />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-700">Categoría</span>
            <select value={form.type} onChange={event => setForm(current => ({ ...current, type: event.target.value }))} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-primary-300">
              {Array.from(new Set([...FLOWER_TYPES, ...types])).map(type => <option key={type}>{type}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-700">Descripción</span>
            <textarea value={form.description} onChange={event => setForm(current => ({ ...current, description: event.target.value }))} rows={3} placeholder="Descripción opcional..." className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-primary-300" />
          </label>
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={closeForm} disabled={saving} className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-600">Cancelar</button>
            <button type="button" onClick={saveFlower} disabled={saving} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary-500 px-5 text-sm font-semibold text-white disabled:opacity-60">
              {saving ? <RiLoader4Line className="animate-spin" /> : <RiCheckLine />}
              {saving ? "Guardando..." : editing ? "Guardar cambios" : "Registrar flor"}
            </button>
          </div>
        </div>
      </ResponsiveModal>

      <ConfirmDialog open={!!deleteTarget} title="Eliminar flor" message={`Vas a eliminar ${deleteTarget?.name || "esta flor"}. Si está en uso en algún producto, no podrá eliminarse.`} confirmText="Eliminar" loading={deleting} onClose={() => !deleting && setDeleteTarget(null)} onConfirm={deleteFlower} />
    </div>
  );
}
