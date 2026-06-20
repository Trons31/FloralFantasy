"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  RiAddLine,
  RiArrowDownSLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiBearSmileLine,
  RiCakeLine,
  RiCheckLine,
  RiCloseLine,
  RiDeleteBinLine,
  RiEditLine,
  RiEyeLine,
  RiFilter3Line,
  RiFireLine,
  RiGiftLine,
  RiGlassesLine,
  RiGobletLine,
  RiGridLine,
  RiLoader4Line,
  RiSearchLine,
  RiShoppingBasketLine,
  RiUploadCloud2Line,
} from "react-icons/ri";
import { formatPrice } from "@/lib/utils";
import ResponsiveModal from "@/components/ui/ResponsiveModal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Pagination from "@/components/ui/Pagination";

type AddonType = "BEBIDA" | "VINO" | "PELUCHE" | "DULCE" | "CANASTA" | "OTRO";
type Addon = {
  id: string;
  name: string;
  price: number;
  type: AddonType;
  imageUrl?: string | null;
  inStock: boolean;
  sales?: number;
};

const TYPE_CONFIG: Array<{ value: AddonType | "ALL"; label: string; Icon: React.ElementType }> = [
  { value: "ALL", label: "Todos", Icon: RiGridLine },
  { value: "BEBIDA", label: "Bebidas", Icon: RiGobletLine },
  { value: "VINO", label: "Vinos", Icon: RiGlassesLine },
  { value: "PELUCHE", label: "Peluches", Icon: RiBearSmileLine },
  { value: "DULCE", label: "Dulces", Icon: RiCakeLine },
  { value: "CANASTA", label: "Canastas", Icon: RiShoppingBasketLine },
  { value: "OTRO", label: "Otros", Icon: RiGiftLine },
];
const ICONS: Record<AddonType, React.ElementType> = {
  BEBIDA: RiGobletLine,
  VINO: RiGlassesLine,
  PELUCHE: RiBearSmileLine,
  DULCE: RiCakeLine,
  CANASTA: RiShoppingBasketLine,
  OTRO: RiGiftLine,
};
const EMPTY_FORM = { name: "", price: "", type: "BEBIDA" as AddonType, inStock: true };

export default function AddonsManager({ initialAddons }: { initialAddons: Addon[] }) {
  const [addons, setAddons] = useState(initialAddons);
  const [search, setSearch] = useState("");
  const [type, setType] = useState<AddonType | "ALL">("ALL");
  const [stockFilter, setStockFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [showFilters, setShowFilters] = useState(true);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(8);
  const [editor, setEditor] = useState<Addon | "new" | null>(null);
  const [viewer, setViewer] = useState<Addon | null>(null);
  const [deleting, setDeleting] = useState<Addon | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => setPage(1), [search, type, stockFilter, perPage]);

  const filtered = useMemo(() => addons.filter(addon => {
    if (search && !addon.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (type !== "ALL" && addon.type !== type) return false;
    if (stockFilter === "ACTIVE" && !addon.inStock) return false;
    if (stockFilter === "INACTIVE" && addon.inStock) return false;
    return true;
  }), [addons, search, type, stockFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const visible = filtered.slice((page - 1) * perPage, page * perPage);
  const categoryCount = new Set(addons.map(addon => addon.type)).size;
  const bestSeller = [...addons].sort((a, b) => (b.sales || 0) - (a.sales || 0))[0];

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

  const openEdit = (addon: Addon) => {
    clearPreview();
    setForm({ name: addon.name, price: String(addon.price), type: addon.type, inStock: addon.inStock });
    setPreviewUrl(addon.imageUrl || "");
    setEditor(addon);
  };

  const handleImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    setPendingFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const saveAddon = async () => {
    if (!form.name.trim() || !form.price || Number(form.price) < 0) {
      toast.error("Nombre y precio son requeridos");
      return;
    }
    setSaving(true);
    try {
      let imageUrl = editor !== "new" && editor ? editor.imageUrl || "" : "";
      if (pendingFile) {
        const upload = new FormData();
        upload.append("file", pendingFile);
        upload.append("folder", "gardentech/addons");
        const uploadResponse = await fetch("/api/upload", { method: "POST", body: upload });
        const uploadData = await uploadResponse.json();
        if (!uploadResponse.ok) throw new Error(uploadData.error || "No fue posible subir la imagen");
        imageUrl = uploadData.url;
      }

      const editing = editor !== "new" && editor;
      const response = await fetch(editing ? `/api/addons/${editing.id}` : "/api/addons", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          price: Number(form.price),
          type: form.type,
          inStock: form.inStock,
          imageUrl,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No fue posible guardar");
      setAddons(current => editing ? current.map(addon => addon.id === data.id ? { ...data, sales: addon.sales || 0 } : addon) : [...current, { ...data, sales: 0 }]);
      toast.success(editing ? "Adicional actualizado" : "Adicional creado");
      closeEditor();
    } catch (error: any) {
      toast.error(error.message || "No fue posible guardar");
    } finally {
      setSaving(false);
    }
  };

  const toggleStock = async (addon: Addon) => {
    try {
      const response = await fetch(`/api/addons/${addon.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inStock: !addon.inStock }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No fue posible actualizar");
      setAddons(current => current.map(item => item.id === data.id ? { ...data, sales: item.sales || 0 } : item));
      toast.success(data.inStock ? "Adicional activado" : "Adicional desactivado");
    } catch (error: any) {
      toast.error(error.message || "No fue posible actualizar");
    }
  };

  const deleteAddon = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      const response = await fetch(`/api/addons/${deleting.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No fue posible eliminar");
      setAddons(current => current.filter(addon => addon.id !== deleting.id));
      setDeleting(null);
      toast.success("Adicional eliminado");
    } catch (error: any) {
      toast.error(error.message || "No fue posible eliminar");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f9fc] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        <header className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#11182c] sm:text-3xl">Productos adicionales</h1>
            <p className="mt-1 text-sm text-slate-500">Bebidas, vinos, peluches, dulces y canastas</p>
          </div>
          <button type="button" onClick={openCreate} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary-500 px-5 text-sm font-semibold text-white shadow-[0_9px_22px_rgba(236,18,91,.22)] transition hover:bg-primary-600">
            <RiAddLine /> Nuevo adicional
          </button>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[1fr_280px_230px]">
            <label className="relative">
              <RiSearchLine className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar adicional por nombre..." className="h-11 w-full rounded-xl border border-slate-200 pl-11 pr-4 text-sm outline-none focus:border-primary-300" />
            </label>
            <label className="relative">
              <select value={type} onChange={event => setType(event.target.value as AddonType | "ALL")} className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-4 pr-10 text-sm outline-none">
                <option value="ALL">Todas las categorías</option>
                {TYPE_CONFIG.slice(1).map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
              <RiArrowDownSLine className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
            </label>
            <button type="button" onClick={() => setShowFilters(current => !current)} className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-medium ${showFilters ? "border-primary-300 bg-primary-50 text-primary-600" : "border-slate-200 text-slate-700"}`}>
              <RiFilter3Line /> Filtros
            </button>
          </div>
          {showFilters && (
            <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
              {(["ALL", "ACTIVE", "INACTIVE"] as const).map(value => (
                <button key={value} type="button" onClick={() => setStockFilter(value)} className={`rounded-full px-4 py-2 text-xs font-semibold ${stockFilter === value ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"}`}>
                  {value === "ALL" ? "Todos los estados" : value === "ACTIVE" ? "Activos" : "Inactivos"}
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
          {[
            { label: "Total adicionales", value: addons.length, detail: "Registrados", Icon: RiGiftLine, color: "bg-rose-50 text-primary-500" },
            { label: "Activos", value: addons.filter(addon => addon.inStock).length, detail: "Disponibles", Icon: RiCheckLine, color: "bg-emerald-50 text-emerald-600" },
            { label: "Categorías", value: categoryCount, detail: "Organizadas", Icon: RiGridLine, color: "bg-violet-50 text-violet-600" },
            { label: "Más vendido", value: bestSeller?.name || "Sin datos", detail: `${bestSeller?.sales || 0} ventas`, Icon: RiFireLine, color: "bg-orange-50 text-orange-500" },
          ].map(card => (
            <article key={card.label} className="flex min-h-[115px] items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-full ${card.color}`}><card.Icon size={22} /></span>
              <div className="min-w-0"><p className="truncate text-lg font-extrabold text-[#11182c]">{card.value}</p><p className="mt-1 text-xs font-semibold">{card.label}</p><p className="mt-1 text-[10px] text-slate-400">{card.detail}</p></div>
            </article>
          ))}
        </section>

        <section className="mt-5 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex min-w-max gap-2">
            {TYPE_CONFIG.map(item => {
              const active = type === item.value;
              return (
                <button key={item.value} type="button" onClick={() => setType(item.value)} className={`inline-flex h-10 min-w-[115px] items-center justify-center gap-2 rounded-xl px-4 text-xs font-semibold transition ${active ? "bg-primary-500 text-white shadow-sm" : "border border-slate-200 bg-white text-slate-700"}`}>
                  <item.Icon /> {item.label}
                </button>
              );
            })}
          </div>
        </section>

        {visible.length ? (
          <section className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {visible.map(addon => {
              const Icon = ICONS[addon.type] || RiGiftLine;
              return (
                <article key={addon.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className="relative flex aspect-[1.35] items-center justify-center bg-white p-4">
                    {addon.imageUrl ? <img src={addon.imageUrl} alt={addon.name} className="h-full w-full object-contain" /> : <Icon size={70} className="text-slate-200" />}
                    <button type="button" onClick={() => toggleStock(addon)} className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[9px] font-semibold ${addon.inStock ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>
                      {addon.inStock ? "Activo" : "Inactivo"}
                    </button>
                  </div>
                  <div className="px-4 pb-3">
                    <h2 className="truncate text-sm font-bold text-[#11182c]">{addon.name}</h2>
                    <p className="mt-1 text-sm font-bold text-primary-500">{formatPrice(addon.price)}</p>
                  </div>
                  <div className="grid grid-cols-3 border-t border-slate-100">
                    <button type="button" onClick={() => setViewer(addon)} className="inline-flex h-11 items-center justify-center gap-1.5 border-r border-slate-100 text-[10px] font-medium text-slate-600 hover:bg-slate-50"><RiEyeLine /> Ver</button>
                    <button type="button" onClick={() => openEdit(addon)} className="inline-flex h-11 items-center justify-center gap-1.5 border-r border-slate-100 text-[10px] font-medium text-slate-600 hover:bg-slate-50"><RiEditLine /> Editar</button>
                    <button type="button" onClick={() => setDeleting(addon)} className="inline-flex h-11 items-center justify-center gap-1.5 text-[10px] font-medium text-red-500 hover:bg-red-50"><RiDeleteBinLine /> Eliminar</button>
                  </div>
                </article>
              );
            })}
          </section>
        ) : (
          <section className="mt-3 rounded-2xl border border-slate-200 bg-white py-20 text-center">
            <RiGiftLine className="mx-auto text-slate-200" size={48} />
            <p className="mt-4 text-sm font-semibold text-slate-600">No hay adicionales con estos filtros</p>
          </section>
        )}

          <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={filtered.length}
          perPage={perPage}
          itemLabel="adicionales"
          onPageChange={setPage}
          onPerPageChange={setPerPage}
          perPageOptions={[8, 12, 16]}
          className="mt-5 rounded-2xl border border-slate-200 shadow-sm"
        />
      </div>

      <ResponsiveModal
        open={Boolean(editor)}
        onClose={closeEditor}
        title={editor === "new" ? "Nuevo adicional" : "Editar adicional"}
        description="Configura la información que verá el cliente al seleccionar este producto."
        panelClassName="md:max-w-xl"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-2xl bg-slate-50">
              {previewUrl ? <img src={previewUrl} alt="" className="h-full w-full object-contain" /> : (() => { const Icon = ICONS[form.type]; return <Icon size={38} className="text-slate-300" />; })()}
            </div>
            <label className="flex min-h-16 flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 px-3 text-xs text-slate-500 hover:border-primary-300">
              <RiUploadCloud2Line /> {pendingFile ? pendingFile.name : "Seleccionar imagen"}
              <input type="file" accept="image/*" onChange={handleImage} className="hidden" />
            </label>
          </div>
          <FormField label="Nombre"><input value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-primary-300" placeholder="Ej: Oso de peluche" /></FormField>
          <FormField label="Precio (COP)"><input type="number" min="0" value={form.price} onChange={event => setForm({ ...form, price: event.target.value })} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-primary-300" placeholder="0" /></FormField>
          <FormField label="Categoría">
            <select value={form.type} onChange={event => setForm({ ...form, type: event.target.value as AddonType })} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-primary-300">
              {TYPE_CONFIG.slice(1).map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </FormField>
          <label className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">
            <span><strong className="block text-sm">Disponible</strong><small className="text-slate-400">Puede agregarse a nuevos pedidos</small></span>
            <button type="button" onClick={() => setForm({ ...form, inStock: !form.inStock })} className={`relative h-7 w-12 rounded-full transition ${form.inStock ? "bg-emerald-500" : "bg-slate-300"}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${form.inStock ? "left-6" : "left-1"}`} /></button>
          </label>
          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={closeEditor} disabled={saving} className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-600">Cancelar</button>
            <button type="button" onClick={saveAddon} disabled={saving} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary-500 px-5 text-sm font-semibold text-white disabled:opacity-60">
              {saving ? <RiLoader4Line className="animate-spin" /> : <RiCheckLine />} {saving ? "Guardando..." : "Guardar adicional"}
            </button>
          </div>
        </div>
      </ResponsiveModal>

      <ResponsiveModal open={Boolean(viewer)} onClose={() => setViewer(null)} title={viewer?.name || "Adicional"} panelClassName="md:max-w-md">
        {viewer && (
          <div className="text-center">
            <div className="mx-auto grid aspect-square max-w-xs place-items-center overflow-hidden rounded-3xl bg-slate-50">
              {viewer.imageUrl ? <img src={viewer.imageUrl} alt={viewer.name} className="h-full w-full object-contain" /> : (() => { const Icon = ICONS[viewer.type]; return <Icon size={90} className="text-slate-200" />; })()}
            </div>
            <h3 className="mt-5 text-xl font-bold">{viewer.name}</h3>
            <p className="mt-2 text-lg font-bold text-primary-500">{formatPrice(viewer.price)}</p>
            <div className="mt-3 flex justify-center gap-2"><span className="rounded-full bg-violet-50 px-3 py-1 text-xs text-violet-600">{TYPE_CONFIG.find(item => item.value === viewer.type)?.label}</span><span className={`rounded-full px-3 py-1 text-xs ${viewer.inStock ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>{viewer.inStock ? "Activo" : "Inactivo"}</span></div>
          </div>
        )}
      </ResponsiveModal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Eliminar adicional"
        message={`Vas a eliminar ${deleting?.name || "este adicional"}. Si está asociado a pedidos existentes, la operación puede no completarse.`}
        confirmText="Eliminar"
        loading={deleteLoading}
        onClose={() => !deleteLoading && setDeleting(null)}
        onConfirm={deleteAddon}
      />
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-600">{label}</span>{children}</label>;
}
