"use client";
import { useEffect, useMemo, useState } from "react";
import {
  RiAddLine, RiSubtractLine, RiPencilLine, RiDeleteBinLine, RiLoader4Line, RiUploadCloud2Line,
  RiCloseLine, RiLeafLine, RiTimeLine, RiBellLine, RiCheckLine, RiStarLine,
  RiArrowLeftLine, RiArrowRightLine,
  RiFlowerLine, RiAlertLine, RiSearchLine, RiEqualizerLine, RiShoppingBag3Line, RiFileCopyLine, RiGridLine, RiFireLine,
} from "react-icons/ri";
import { FaStar } from "react-icons/fa6";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import ResponsiveModal from "@/components/ui/ResponsiveModal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
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
  sales: number; createdAt?: string;
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
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [showFilters, setShowFilters] = useState(false);
  const [sort, setSort] = useState("recent");
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
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
  const PER_PAGE = 12;

  const { register, handleSubmit, reset, watch, setValue } = useForm<any>({
    defaultValues: { preparationTimeValue: 0, preparationTimeUnit: "MINUTES", deliveryLeadDays: 0, inStock: true },
  });

  const deliveryDays = watch("deliveryLeadDays", 0);
  const medianPrice = useMemo(() => {
    if (!products.length) return 0;
    const values = products.map(product => product.price).sort((a, b) => a - b);
    return values[Math.floor(values.length / 2)];
  }, [products]);
  const filteredProducts = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("es");
    const result = products.filter(product => {
      const matchesSearch = !query || product.name.toLocaleLowerCase("es").includes(query) || product.category?.name.toLocaleLowerCase("es").includes(query);
      const matchesFilter = filter === "ALL"
        || (filter === "PREMIUM" && product.featured)
        || (filter === "ECONOMIC" && product.price <= medianPrice)
        || product.categoryId === filter
        || product.occasion === filter;
      return matchesSearch && matchesFilter;
    });
    return [...result].sort((a, b) => sort === "priceAsc" ? a.price - b.price : sort === "priceDesc" ? b.price - a.price : sort === "sales" ? b.sales - a.sales : new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }, [products, search, filter, medianPrice, sort]);
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PER_PAGE));
  const pageItems = filteredProducts.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);
  useEffect(() => { setPage(1); }, [search, filter, sort]);


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
      if (editing) setProducts(p => p.map(x => x.id === editing.id ? { ...saved, sales: x.sales, createdAt: x.createdAt } : x));
      else         setProducts(p => [{ ...saved, sales: 0, createdAt: saved.createdAt || new Date().toISOString() }, ...p]);
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

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/products/${deleteTarget.id}`, { method: "DELETE" });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || "No se pudo eliminar el producto");
      setProducts(current => current.filter(product => product.id !== deleteTarget.id));
      toast.success("Producto eliminado");
      setDeleteTarget(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo eliminar el producto");
    } finally {
      setDeleting(false);
    }
  };

  const duplicateProduct = async (product: Product) => {
    setDuplicatingId(product.id);
    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${product.name} (Copia)`,
          description: product.description,
          price: product.price,
          categoryId: product.categoryId,
          occasion: product.occasion,
          preparationTimeValue: product.preparationTimeValue,
          preparationTimeUnit: product.preparationTimeUnit,
          deliveryLeadDays: product.deliveryLeadDays,
          requiresSpecialOrder: product.requiresSpecialOrder,
          inStock: product.inStock,
          featured: false,
          images: product.images.map(image => ({ url: image.url, publicId: image.publicId })),
          flowerRelations: product.flowers.map(item => ({ flowerId: item.flower.id, quantity: item.quantity })),
        }),
      });
      const saved = await response.json();
      if (!response.ok) throw new Error(saved.error || "No se pudo duplicar el producto");
      setProducts(current => [{ ...saved, sales: 0, createdAt: saved.createdAt || new Date().toISOString() }, ...current]);
      toast.success("Producto duplicado");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo duplicar el producto");
    } finally {
      setDuplicatingId(null);
    }
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
      <div className="min-h-full bg-slate-50/70 p-3 sm:p-5 lg:p-7">
        <div className="mx-auto max-w-[1500px] space-y-5">
          <header className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-start gap-3">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary-50 text-primary-500">
                <RiShoppingBag3Line size={24} />
              </span>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Productos</h1>
                <p className="mt-1 text-sm text-slate-500">Ramos, arreglos y composiciones florales.</p>
              </div>
            </div>
            <div className="hidden gap-2 sm:flex">
              <label className="flex h-11 min-w-[280px] items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 shadow-sm">
                <RiSearchLine className="shrink-0 text-slate-400" size={18} />
                <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar producto..." className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400" />
              </label>
              <button type="button" onClick={() => setShowFilters(current => !current)} className={`grid h-11 w-12 place-items-center rounded-xl border bg-white text-slate-600 shadow-sm transition ${showFilters ? "border-primary-300 text-primary-500" : "border-slate-200"}`} aria-label="Mostrar filtros">
                <RiEqualizerLine size={18} />
              </button>
              <button type="button" onClick={openCreate} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary-500 px-5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(236,18,91,.2)] transition hover:bg-primary-600">
                <RiAddLine size={19} /> Nuevo producto
              </button>
            </div>
            <button type="button" onClick={openCreate} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary-500 px-5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(236,18,91,.2)] transition hover:bg-primary-600 sm:hidden">
              <RiAddLine size={19} /> Nuevo producto
            </button>
          </header>

          <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            {[
              { label: "Total productos", value: String(products.length), detail: "En catálogo", Icon: RiShoppingBag3Line, color: "bg-primary-50 text-primary-500" },
              { label: "Activos", value: String(products.filter(product => product.inStock).length), detail: "Disponibles", Icon: RiCheckLine, color: "bg-emerald-50 text-emerald-600" },
              { label: "Premium", value: String(products.filter(product => product.featured).length), detail: "Productos destacados", Icon: RiStarLine, color: "bg-violet-50 text-violet-600" },
              { label: "Más vendido", value: products.reduce((top, product) => product.sales > (top?.sales || -1) ? product : top, products[0])?.name || "Sin ventas", detail: `${Math.max(0, ...products.map(product => product.sales))} ventas`, Icon: RiFireLine, color: "bg-orange-50 text-orange-500" },
            ].map(card => (
              <article key={card.label} className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                  <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${card.color}`}><card.Icon size={21} /></span>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-500">{card.label}</p>
                    <strong className="mt-1 block truncate text-lg font-bold text-slate-950 sm:text-xl" title={card.value}>{card.value}</strong>
                    <p className="mt-1 truncate text-[11px] text-slate-500">{card.detail}</p>
                  </div>
                </div>
              </article>
            ))}
          </section>

          <section className="flex items-center gap-2 sm:hidden">
            <label className="flex h-11 min-w-0 flex-1 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 shadow-sm">
              <RiSearchLine className="shrink-0 text-slate-400" size={18} />
              <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar producto..." className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400" />
            </label>
            <button type="button" onClick={() => setShowFilters(current => !current)} className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl border bg-white text-slate-600 shadow-sm transition ${showFilters ? "border-primary-300 text-primary-500" : "border-slate-200"}`} aria-label="Mostrar filtros">
              <RiEqualizerLine size={18} />
            </button>
          </section>

          {showFilters && (
            <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm lg:flex-row lg:items-center lg:justify-between">
              <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <button type="button" onClick={() => setFilter("ALL")} className={`h-10 shrink-0 rounded-xl px-5 text-xs font-semibold ${filter === "ALL" ? "bg-primary-500 text-white" : "border border-slate-200 text-slate-600"}`}>Todos</button>
                <button type="button" onClick={() => setFilter("PREMIUM")} className={`h-10 shrink-0 rounded-xl px-5 text-xs font-semibold ${filter === "PREMIUM" ? "bg-primary-500 text-white" : "border border-slate-200 text-slate-600"}`}>Premium</button>
                <button type="button" onClick={() => setFilter("ECONOMIC")} className={`h-10 shrink-0 rounded-xl px-5 text-xs font-semibold ${filter === "ECONOMIC" ? "bg-primary-500 text-white" : "border border-slate-200 text-slate-600"}`}>Económicos</button>
                {localCats.slice(0, 4).map(category => (
                  <button key={category.id} type="button" onClick={() => setFilter(category.id)} className={`h-10 shrink-0 rounded-xl px-5 text-xs font-semibold ${filter === category.id ? "bg-primary-500 text-white" : "border border-slate-200 text-slate-600"}`}>{category.name}</button>
                ))}
                {(localCats.length > 4 || occasions.length > 0) && (
                  <label className="relative flex h-10 shrink-0 items-center rounded-xl border border-slate-200 px-4">
                    <select value={[...localCats.slice(4).map(item => item.id), ...occasions.map(item => item.slug)].includes(filter) ? filter : ""} onChange={event => setFilter(event.target.value || "ALL")} className="appearance-none bg-transparent pr-6 text-xs font-semibold text-slate-600 outline-none">
                      <option value="">Más filtros</option>
                      {localCats.slice(4).map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
                      {occasions.map(occasion => <option key={occasion.id} value={occasion.slug}>{occasion.name}</option>)}
                    </select>
                    <RiArrowRightLine className="pointer-events-none absolute right-3 rotate-90 text-slate-400" />
                  </label>
                )}
              </div>
              <select value={sort} onChange={event => setSort(event.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 outline-none">
                <option value="recent">Más recientes</option>
                <option value="sales">Más vendidos</option>
                <option value="priceAsc">Precio menor</option>
                <option value="priceDesc">Precio mayor</option>
              </select>
            </section>
          )}

          {pageItems.length ? (
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {pageItems.map(product => {
                const flowerCount = product.flowers.reduce((sum, item) => sum + item.quantity, 0);
                return (
                  <article key={product.id} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                    <div className="relative aspect-[16/8] overflow-hidden bg-slate-50">
                      {product.images[0] ? <img src={product.images[0].url} alt={product.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <div className="grid h-full place-items-center"><RiFlowerLine className="text-slate-200" size={48} /></div>}
                      <span className={`absolute left-3 top-3 rounded-lg bg-white/95 px-2.5 py-1 text-[9px] font-bold ${product.featured ? "text-primary-500" : "text-emerald-600"}`}>{product.featured ? "PREMIUM" : product.inStock ? "ACTIVO" : "AGOTADO"}</span>
                      <button type="button" onClick={() => openEdit(product)} className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-lg bg-white/95 text-slate-700 shadow-sm"><RiGridLine /></button>
                    </div>
                    <div className="p-4">
                      <h2 className="truncate text-sm font-bold text-slate-950">{product.name}</h2>
                      <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-slate-500"><RiFlowerLine className="text-primary-500" />{product.flowers.map(item => item.flower.name).join(", ") || product.category?.name}</p>
                      <strong className="mt-3 block text-lg font-bold text-slate-950">{formatPrice(product.price)}</strong>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px] text-slate-500">
                        <span className="inline-flex items-center gap-1"><RiFlowerLine />{flowerCount} flores</span>
                        <span className="inline-flex items-center gap-1 text-emerald-600"><RiTimeLine />{formatDeliveryLeadDays(product.deliveryLeadDays)}</span>
                        {product.sales > 0 && <span className="inline-flex items-center gap-1"><RiFireLine />{product.sales}</span>}
                      </div>
                      <div className="mt-4 grid grid-cols-[1fr_1fr_42px] gap-2">
                        <button type="button" onClick={() => openEdit(product)} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:border-primary-200 hover:text-primary-500"><RiPencilLine />Editar</button>
                        <button type="button" onClick={() => duplicateProduct(product)} disabled={duplicatingId === product.id} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 disabled:opacity-50">{duplicatingId === product.id ? <RiLoader4Line className="animate-spin" /> : <RiFileCopyLine />}Duplicar</button>
                        <button type="button" onClick={() => setDeleteTarget(product)} className="grid h-10 place-items-center rounded-xl border border-red-100 text-red-500 hover:bg-red-50" aria-label={`Eliminar ${product.name}`}><RiDeleteBinLine /></button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>
          ) : (
            <section className="grid min-h-64 place-items-center rounded-2xl border border-slate-200 bg-white px-5 py-10 text-center shadow-sm">
              <div><RiShoppingBag3Line className="mx-auto text-slate-200" size={48} /><h2 className="mt-4 font-semibold text-slate-800">No encontramos productos</h2><p className="mt-1 text-sm text-slate-500">Cambia la búsqueda o los filtros seleccionados.</p></div>
            </section>
          )}

          <footer className="flex flex-col gap-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <p>Mostrando {filteredProducts.length ? (page - 1) * PER_PAGE + 1 : 0} - {Math.min(page * PER_PAGE, filteredProducts.length)} de {filteredProducts.length} productos</p>
            <div className="flex items-center gap-2">
              <button type="button" disabled={page <= 1} onClick={() => setPage(current => current - 1)} className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white disabled:opacity-35"><RiArrowLeftLine /></button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, index) => { const startPage = Math.max(1, Math.min(page - 2, totalPages - 4)); const number = startPage + index; return number <= totalPages ? <button key={number} type="button" onClick={() => setPage(number)} className={`grid h-9 min-w-9 place-items-center rounded-lg px-2 font-semibold ${page === number ? "bg-primary-500 text-white" : "border border-slate-200 bg-white text-slate-600"}`}>{number}</button> : null; })}
              <button type="button" disabled={page >= totalPages} onClick={() => setPage(current => current + 1)} className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white disabled:opacity-35"><RiArrowRightLine /></button>
            </div>
          </footer>
        </div>
      </div>

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
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                    <div className="mb-2 flex flex-col gap-2 sm:flex-row">
                      <input value={newCatName} onChange={e => setNewCatName(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && (e.preventDefault(), handleCreateCat())}
                        placeholder="Nombre..." className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-primary-400" />
                      <button type="button" onClick={handleCreateCat} className="w-full rounded-lg bg-primary-600 px-3 py-2 text-xs text-white sm:w-auto">Crear</button>
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
      <ConfirmDialog
        open={!!deleteTarget}
        title="Eliminar producto"
        message={`Vas a eliminar ${deleteTarget?.name || "este producto"}. Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        loading={deleting}
        onClose={() => !deleting && setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />

    </>
  );
}
