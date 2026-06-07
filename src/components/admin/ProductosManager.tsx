"use client";
import { useEffect, useState } from "react";
import {
  RiAddLine, RiSubtractLine, RiPencilLine, RiDeleteBinLine, RiLoader4Line, RiUploadCloud2Line,
  RiCloseLine, RiLeafLine, RiTimeLine, RiBellLine, RiCheckLine, RiStarLine,
  RiArrowLeftLine, RiArrowRightLine,
  RiFlowerLine, RiAlertLine,
} from "react-icons/ri";
import { FaStar } from "react-icons/fa6";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import ResponsiveModal from "@/components/ui/ResponsiveModal";
import { formatPrice, formatDeliveryLeadDays, getDeliveryDateLabel } from "@/lib/utils";

const TIME_UNITS = [
  { value: "MINUTES", label: "Minutos" },
  { value: "HOURS",   label: "Horas"   },
  { value: "DAYS",    label: "Días"    },
];

type Product = {
  id: string; name: string; description: string; price: number;
  categoryId: string; occasion?: string | null;
  preparationTimeValue: number; preparationTimeUnit: string;
  deliveryLeadDays: number;
  requiresSpecialOrder: boolean; inStock: boolean; featured: boolean;
  images: { id: string; url: string; publicId: string; isMain: boolean; order: number }[];
  category: { id: string; name: string };
  flowers: { id: string; flower: { id: string; name: string; type: string }; quantity: number }[];
};

type Category = { id: string; name: string; slug: string };
type Occasion = { id: string; name: string; slug: string; subtitle?: string | null };
type Flower   = { id: string; name: string; type: string };
type SelectedFlower = { flowerId: string; quantity: number };

// Slot de imagen: puede tener un File pendiente (nueva) o una URL ya subida (edición)
type ImageSlot =
  | { kind: "pending"; file: File; previewUrl: string }   // aún no subida
  | { kind: "uploaded"; url: string; publicId: string };  // ya en Cloudinary

export default function ProductosManager({
  products: init, categories, flowers,
  occasions,
}: { products: any[]; categories: Category[]; flowers: Flower[]; occasions: Occasion[] }) {
  const [products, setProducts] = useState<Product[]>(init);
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState<Product | null>(null);
  const [saving,   setSaving]   = useState(false);
  // imageSlots reemplaza uploadedImages + uploadingIdx
  const [imageSlots,      setImageSlots]      = useState<ImageSlot[]>([]);
  const [uploadingSlots,  setUploadingSlots]  = useState<Set<number>>(new Set());
  const [selectedFlowers, setSelectedFlowers] = useState<SelectedFlower[]>([]);

  const [showCatForm, setShowCatForm] = useState(false);
  const [newCatName,  setNewCatName]  = useState("");
  const [localCats,   setLocalCats]   = useState(categories);
  const PER_PAGE = 10;

  const { register, handleSubmit, reset, watch, setValue } = useForm<any>({
    defaultValues: { preparationTimeValue: 0, preparationTimeUnit: "MINUTES", deliveryLeadDays: 0, inStock: true },
  });

  const deliveryDays = watch("deliveryLeadDays", 0);
  const totalPages = Math.max(1, Math.ceil(products.length / PER_PAGE));
  const pageItems = products.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  const slugify = (s: string) =>
    s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\s+/g,"-").replace(/[^a-z0-9-]/g,"");

  const handleCreateCat = async () => {
    if (!newCatName.trim()) return;
    const res   = await fetch("/api/categories", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ name: newCatName.trim(), slug: slugify(newCatName.trim()) }) });
    const saved = await res.json();
    if (res.ok) { setLocalCats(p => [...p, saved]); setNewCatName(""); toast.success(`Categoría "${saved.name}" creada`); }
    else toast.error(saved.error);
  };

  // Solo guarda el archivo localmente con preview, no sube a Cloudinary.
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setImageSlots(prev => {
      const next = [...prev];
      // Liberar preview anterior si existía
      if (next[idx]?.kind === "pending") URL.revokeObjectURL((next[idx] as any).previewUrl);
      next[idx] = { kind: "pending", file, previewUrl };
      return next;
    });
  };

  const addImageSlot = () =>
    // Añade un slot vacío — se llenará cuando el usuario seleccione un archivo
    setImageSlots(p => [...p, { kind: "uploaded", url: "", publicId: "" }]);

  const removeImage = (i: number) => {
    setImageSlots(prev => {
      const slot = prev[i];
      if (slot?.kind === "pending") URL.revokeObjectURL(slot.previewUrl);
      return prev.filter((_, j) => j !== i);
    });
  };

  // Sube un slot pendiente a Cloudinary y retorna { url, publicId }.
  const uploadSlot = async (slot: ImageSlot & { kind: "pending" }, idx: number) => {
    setUploadingSlots(p => new Set(p).add(idx));
    const fd = new FormData();
    fd.append("file", slot.file);
    fd.append("folder", "gardentech/products");
    const res  = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    URL.revokeObjectURL(slot.previewUrl); // liberar memoria
    setUploadingSlots(p => { const s = new Set(p); s.delete(idx); return s; });
    return { url: data.url as string, publicId: data.publicId as string };
  };

  const onSubmit = async (data: any) => {
    const filledSlots = imageSlots.filter(s => s.kind === "pending" || (s.kind === "uploaded" && s.url));
    if (filledSlots.length === 0) { toast.error("Agrega al menos una imagen"); return; }
    if (!data.categoryId) { toast.error("Selecciona una categoría"); return; }
    setSaving(true);
    try {
      // Subir solo los slots pendientes en paralelo, justo antes de guardar.
      const resolvedImages = await Promise.all(
        imageSlots.map(async (slot, idx) => {
          if (slot.kind === "pending") return uploadSlot(slot, idx);
          return { url: slot.url, publicId: slot.publicId };
        })
      );
      const validImages = resolvedImages.filter(img => img.url);

      const payload = {
        ...data,
        price: parseFloat(data.price),
        preparationTimeValue: 0,
        preparationTimeUnit: "MINUTES",
        deliveryLeadDays: parseInt(data.deliveryLeadDays || "0"),
        requiresSpecialOrder: data.requiresSpecialOrder === true || data.requiresSpecialOrder === "true",
        inStock:  data.inStock  === true || data.inStock  === "true",
        featured: data.featured === true || data.featured === "true",
        images: validImages,
        flowerRelations: selectedFlowers,
      };
      const url    = editing ? `/api/products/${editing.id}` : "/api/products";
      const method = editing ? "PUT" : "POST";
      const res    = await fetch(url, { method, headers: {"Content-Type":"application/json"}, body: JSON.stringify(payload) });
      const saved  = await res.json();
      if (!res.ok) throw new Error(saved.error);
      if (editing) setProducts(p => p.map(x => x.id === editing.id ? saved : x));
      else         setProducts(p => [saved, ...p]);
      toast.success(editing ? "Producto actualizado" : "Producto creado");
      closeForm();
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const openCreate = () => {
    setEditing(null);
    reset({ preparationTimeValue:0, preparationTimeUnit:"MINUTES", deliveryLeadDays:0, inStock:true, featured:false, requiresSpecialOrder:false });
    setImageSlots([]); setSelectedFlowers([]); setShowForm(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    reset({ name:p.name, description:p.description, price:p.price, categoryId:p.categoryId,
            occasion:p.occasion, preparationTimeValue:p.preparationTimeValue, preparationTimeUnit:p.preparationTimeUnit,
            deliveryLeadDays:p.deliveryLeadDays || 0,
            requiresSpecialOrder:p.requiresSpecialOrder, inStock:p.inStock, featured:p.featured });
    // Imágenes ya subidas se cargan como "uploaded", no como pending.
    setImageSlots(p.images.map(i => ({ kind: "uploaded", url: i.url, publicId: i.publicId })));
    setSelectedFlowers(p.flowers.map(f => ({ flowerId: f.flower.id, quantity: f.quantity || 1 })));
    setShowForm(true);
  };

  const closeForm = () => {
    // Liberar todos los object URLs pendientes
    imageSlots.forEach(s => { if (s.kind === "pending") URL.revokeObjectURL(s.previewUrl); });
    setShowForm(false); setEditing(null); reset(); setImageSlots([]); setSelectedFlowers([]);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este producto?")) return;
    const res = await fetch(`/api/products/${id}`, { method:"DELETE" });
    if (res.ok) { setProducts(p => p.filter(x => x.id !== id)); toast.success("Eliminado"); }
    else toast.error("Error al eliminar");
  };

  const toggleFlower = (id: string) =>
    setSelectedFlowers(prev => {
      const exists = prev.find(item => item.flowerId === id);
      return exists ? prev.filter(item => item.flowerId !== id) : [...prev, { flowerId: id, quantity: 1 }];
    });

  const updateFlowerQty = (id: string, quantity: number) =>
    setSelectedFlowers(prev =>
      prev
        .map(item =>
          item.flowerId === id ? { ...item, quantity: Math.max(1, quantity) } : item
        )
        .filter(item => item.quantity > 0)
    );

  const selectedFlowerQty = (id: string) => selectedFlowers.find(item => item.flowerId === id)?.quantity || 0;

  // Helper: obtener la URL de display de un slot (preview local o URL de Cloudinary)
  const slotDisplayUrl = (slot: ImageSlot): string => {
    if (slot.kind === "pending") return slot.previewUrl;
    return slot.url;
  };

  const TOGGLES = [
    { name: "requiresSpecialOrder", label: "Encargo previo", Icon: RiBellLine  },
    { name: "inStock",              label: "En stock",       Icon: RiCheckLine },
    { name: "featured",             label: "Destacado",      Icon: RiStarLine  },
  ];

  return (
    <>
      <div className="flex justify-end mb-4">
        <button onClick={openCreate}
          className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors">
          <RiAddLine size={16} /> Nuevo producto
        </button>
      </div>

      {products.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 text-center py-16">
          <RiLeafLine className="text-5xl text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Sin productos aún</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pageItems.map(p => (
            <div key={p.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
              <div className="aspect-video relative overflow-hidden bg-gray-50">
                {p.images[0]
                  ? <img src={p.images[0].url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  : <div className="w-full h-full flex items-center justify-center text-gray-200"><RiFlowerLine size={48} /></div>
                }
                <div className="absolute top-2 right-2 flex gap-1">
                  {p.featured && (
                    <span className="bg-white text-yellow-600 text-xs px-2 py-2 rounded-full flex items-center gap-1">
                      <FaStar className="h-4 w-4" />
                    </span>
                  )}
                  {!p.inStock && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">Agotado</span>}
                </div>
              </div>
              <div className="p-4">
                <p className="text-xs text-primary-500 uppercase tracking-wide font-medium">{p.category?.name}</p>
                <h3 className="font-semibold text-gray-900 mt-0.5">{p.name}</h3>
                {p.flowers.length > 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    <RiFlowerLine size={11} className="text-gray-400 flex-shrink-0" />
                    <p className="text-xs text-gray-400 truncate">{p.flowers.map(f => f.flower.name).join(", ")}</p>
                  </div>
                )}
                <div className="flex items-center justify-between mt-3">
                  <div>
                      <p className="font-bold text-gray-900">{formatPrice(p.price)}</p>
                      <p className="text-xs text-emerald-600 flex items-center gap-1 mt-0.5">
                        <RiTimeLine size={11} />
                        {formatDeliveryLeadDays(p.deliveryLeadDays)}
                      </p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(p)} className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"><RiPencilLine size={15} /></button>
                    <button onClick={() => handleDelete(p.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><RiDeleteBinLine size={15} /></button>
                  </div>
                </div>
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
            {products.length} registros · pág. {page} de {totalPages}
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

      {showForm && (
        <ResponsiveModal
          open={showForm}
          onClose={closeForm}
          title={editing ? "Editar producto" : "Nuevo producto"}
          description={editing ? "Actualiza la información del producto y su composición." : "Registra el producto y define su composición."}
          panelClassName="sm:max-w-3xl lg:max-w-4xl"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

              {/* Images */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Imágenes
                </label>
                <div className="flex flex-wrap gap-2">
                  {imageSlots.map((slot, i) => {
                    const displayUrl = slotDisplayUrl(slot);
                    const isUploading = uploadingSlots.has(i);
                    return (
                      <div key={i} className="relative group/img">
                        <div className="w-20 h-20 rounded-xl border-2 border-gray-200 overflow-hidden bg-gray-50">
                          {displayUrl ? (
                            <img src={displayUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            // Slot vacío: muestra selector de archivo
                            <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-primary-50 transition-colors">
                              {isUploading
                                ? <RiLoader4Line className="animate-spin text-primary-500 text-xl" />
                                : <><RiUploadCloud2Line className="text-gray-300 text-xl" /><span className="text-xs text-gray-300 mt-1">Subir</span></>
                              }
                              <input type="file" accept="image/*" onChange={e => handleImageSelect(e, i)} className="hidden" disabled={saving} />
                            </label>
                          )}
                        </div>
                        {/* Indicador: pending (local) vs uploaded (Cloudinary) */}
                        {i === 0 && displayUrl && (
                          <span className="absolute -bottom-1 left-0 right-0 text-center text-xs bg-primary-600 text-white rounded-b-xl py-0.5">
                            Principal
                          </span>
                        )}
                        {slot.kind === "pending" && (
                          <span className="absolute top-0 left-0 w-2 h-2 bg-amber-400 rounded-full m-1" title="Pendiente de subir" />
                        )}
                        <button type="button" onClick={() => removeImage(i)}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full items-center justify-center hidden group-hover/img:flex">
                          <RiCloseLine size={10} />
                        </button>
                      </div>
                    );
                  })}
                  <button type="button" onClick={addImageSlot}
                    className="w-20 h-20 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center hover:border-primary-400 hover:bg-primary-50 transition-colors text-gray-400">
                    <RiAddLine size={20} />
                    <span className="text-xs mt-1">Añadir</span>
                  </button>
                </div>
                {imageSlots.some(s => s.kind === "pending") && (
                  <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                    <RiUploadCloud2Line size={12} />
                    Las imágenes nuevas se subirán al guardar
                  </p>
                )}
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input {...register("name",{required:true})} placeholder="Ej: Ramo Romántico de Rosas"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary-400" />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea {...register("description")} rows={2} placeholder="Describe el arreglo..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary-400 resize-none" />
              </div>

              {/* Price & Category */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Precio (COP) *</label>
                  <input {...register("price",{required:true})} type="number" min="0" placeholder="85000"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary-400" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-medium text-gray-700">Categoría *</label>
                    <button type="button" onClick={() => setShowCatForm(!showCatForm)}
                      className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-0.5">
                      <RiAddLine size={12} /> Nueva
                    </button>
                  </div>
                  {showCatForm && (
                    <div className="flex gap-2 mb-2">
                      <input value={newCatName} onChange={e => setNewCatName(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && (e.preventDefault(), handleCreateCat())}
                        placeholder="Nombre..." className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-primary-400" />
                      <button type="button" onClick={handleCreateCat} className="bg-primary-600 text-white px-3 py-2 rounded-lg text-xs">Crear</button>
                    </div>
                  )}
                  <select {...register("categoryId",{required:true})}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-primary-400">
                    <option value="">Seleccionar...</option>
                    {localCats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Occasion */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ocasión</label>
                <select {...register("occasion")} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-primary-400">
                  <option value="">Sin ocasión específica</option>
                  {occasions.map((o) => (
                    <option key={o.id} value={o.slug}>
                      {o.name}
                      {o.subtitle ? ` · ${o.subtitle}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Delivery time */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <RiTimeLine className="text-emerald-500" size={15} />
                  Tiempo de entrega
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setValue("deliveryLeadDays", 0, { shouldDirty: true, shouldTouch: true })}
                    className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
                      Number(deliveryDays) <= 0
                        ? "border-primary-600 bg-primary-600 text-white"
                        : "border-gray-200 bg-white text-gray-700 hover:border-primary-300"
                    }`}
                  >
                    Mismo día
                  </button>
                  <button
                    type="button"
                    onClick={() => setValue("deliveryLeadDays", Math.max(1, Number(deliveryDays) || 1), { shouldDirty: true, shouldTouch: true })}
                    className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
                      Number(deliveryDays) > 0
                        ? "border-primary-600 bg-primary-600 text-white"
                        : "border-gray-200 bg-white text-gray-700 hover:border-primary-300"
                    }`}
                  >
                    Días después
                  </button>
                </div>
                {Number(deliveryDays) > 0 && (
                  <div className="flex gap-2 items-center mt-3">
                    <input {...register("deliveryLeadDays")} type="number" min="1" defaultValue={0}
                      className="w-24 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary-400 text-center font-mono" />
                    <div className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-500">
                      Días después del pedido
                    </div>
                  </div>
                )}
                <p className="text-xs text-emerald-600 mt-1.5 flex items-center gap-1">
                  <RiTimeLine size={12} />
                  {formatDeliveryLeadDays(Number(deliveryDays))} · <strong>{getDeliveryDateLabel(Number(deliveryDays))}</strong>
                </p>
              </div>

              {/* Flowers selector */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <RiFlowerLine size={15} className="text-primary-500" />
                  Flores que contiene
                  <span className="text-gray-400 font-normal text-xs">(filtrables por tipo)</span>
                </label>
                {flowers.length === 0 ? (
                  <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl p-3">
                    <RiAlertLine size={14} className="flex-shrink-0" />
                    No hay flores registradas. Ve a <strong>Gestión de Flores</strong> primero.
                  </div>
                ) : (
                  <div className="space-y-2 p-3 bg-gray-50 rounded-xl border border-gray-100 max-h-56 overflow-y-auto">
                    {flowers.map(f => {
                      const selected = selectedFlowerQty(f.id) > 0;
                      const qty = selectedFlowerQty(f.id) || 1;
                      return (
                        <div
                          key={f.id}
                          className={`rounded-2xl border p-3 transition-all ${selected ? "bg-primary-50 border-primary-200" : "bg-white border-gray-200"}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <button
                              type="button"
                              onClick={() => toggleFlower(f.id)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-all ${
                                selected ? "bg-primary-600 text-white border-primary-600" : "bg-white text-gray-600 border-gray-200 hover:border-primary-300"
                              }`}
                            >
                              <RiFlowerLine size={11} />
                              {f.name}
                              <span className="opacity-70">({f.type})</span>
                            </button>
                            {selected && (
                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => updateFlowerQty(f.id, qty - 1)}
                                  className="w-7 h-7 rounded-full bg-white border border-gray-200 text-gray-600 flex items-center justify-center hover:border-primary-300"
                                >
                                  <RiSubtractLine size={12} />
                                </button>
                                <span className="min-w-6 text-center text-sm font-semibold text-gray-900">{qty}</span>
                                <button
                                  type="button"
                                  onClick={() => updateFlowerQty(f.id, qty + 1)}
                                  className="w-7 h-7 rounded-full bg-white border border-gray-200 text-gray-600 flex items-center justify-center hover:border-primary-300"
                                >
                                  <RiAddLine size={12} />
                                </button>
                              </div>
                            )}
                          </div>
                          {selected && (
                            <p className="mt-2 text-[11px] text-gray-500 flex items-center gap-1">
                              <RiCheckLine size={11} className="text-primary-500" />
                              {qty} flor{qty === 1 ? "" : "es"} de {f.name}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                {selectedFlowers.length > 0 && (
                  <p className="text-xs text-primary-600 mt-1 flex items-center gap-1">
                    <RiCheckLine size={12} /> {selectedFlowers.length} flor(es) seleccionada(s)
                  </p>
                )}
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-3 gap-3">
                {TOGGLES.map(f => (
                  <label key={f.name} className="flex items-center gap-2 bg-gray-50 rounded-xl p-3 cursor-pointer hover:bg-gray-100 transition-colors">
                    <input {...register(f.name)} type="checkbox" className="w-4 h-4 accent-primary-600" />
                    <f.Icon size={14} className="text-gray-500 flex-shrink-0" />
                    <span className="text-xs font-medium text-gray-700">{f.label}</span>
                  </label>
                ))}
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeForm} disabled={saving}
                  className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50">
                  Cancelar
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-primary-600 text-white py-3 rounded-xl text-sm font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
                  {saving ? <><RiLoader4Line className="animate-spin" /> Guardando...</> : (editing ? "Actualizar" : "Crear producto")}
                </button>
              </div>
            </form>
        </ResponsiveModal>
      )}
    </>
  );
}
