"use client";
import { useState } from "react";
import {
  RiAddLine, RiPencilLine, RiDeleteBinLine, RiLoader4Line, RiUploadCloud2Line,
  RiCloseLine, RiLeafLine, RiTimeLine, RiBellLine, RiCheckLine, RiStarLine,
  RiFlowerLine, RiAlertLine,
} from "react-icons/ri";
import { FaStar } from "react-icons/fa6";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { formatPrice, formatPreparationTime } from "@/lib/utils";

const OCCASIONS = ["amor","cumpleanos","bodas","condolencias","graduacion","recuperacion"];
const TIME_UNITS = [
  { value: "MINUTES", label: "Minutos" },
  { value: "HOURS",   label: "Horas"   },
  { value: "DAYS",    label: "Días"    },
];

type Product = {
  id: string; name: string; description: string; price: number;
  categoryId: string; occasion?: string | null;
  preparationTimeValue: number; preparationTimeUnit: string;
  requiresSpecialOrder: boolean; inStock: boolean; featured: boolean;
  images: { id: string; url: string; publicId: string; isMain: boolean; order: number }[];
  category: { id: string; name: string };
  flowers: { id: string; flower: { id: string; name: string; type: string }; quantity: number }[];
};

type Category = { id: string; name: string; slug: string };
type Flower   = { id: string; name: string; type: string };

export default function ProductosManager({
  products: init, categories, flowers,
}: { products: any[]; categories: Category[]; flowers: Flower[] }) {
  const [products, setProducts] = useState<Product[]>(init);
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState<Product | null>(null);
  const [saving,   setSaving]   = useState(false);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const [uploadedImages, setUploadedImages] = useState<{ url: string; publicId: string }[]>([]);
  const [selectedFlowers, setSelectedFlowers] = useState<string[]>([]);

  const [showCatForm, setShowCatForm] = useState(false);
  const [newCatName,  setNewCatName]  = useState("");
  const [localCats,   setLocalCats]   = useState(categories);

  const { register, handleSubmit, reset, watch } = useForm<any>({
    defaultValues: { preparationTimeValue: 0, preparationTimeUnit: "MINUTES", inStock: true },
  });

  const prepValue = watch("preparationTimeValue", 0);
  const prepUnit  = watch("preparationTimeUnit", "MINUTES");

  const slugify = (s: string) =>
    s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/\s+/g,"-").replace(/[^a-z0-9-]/g,"");

  const handleCreateCat = async () => {
    if (!newCatName.trim()) return;
    const res   = await fetch("/api/categories", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ name: newCatName.trim(), slug: slugify(newCatName.trim()) }) });
    const saved = await res.json();
    if (res.ok) { setLocalCats(p => [...p, saved]); setNewCatName(""); toast.success(`Categoría "${saved.name}" creada`); }
    else toast.error(saved.error);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploadingIdx(idx);
    const fd = new FormData(); fd.append("file", file);
    const res  = await fetch("/api/upload", { method:"POST", body: fd });
    const data = await res.json();
    setUploadedImages(p => { const n = [...p]; n[idx] = data; return n; });
    toast.success("Imagen subida a Cloudinary");
    setUploadingIdx(null);
  };

  const addImageSlot = () => setUploadedImages(p => [...p, { url: "", publicId: "" }]);
  const removeImage  = (i: number) => setUploadedImages(p => p.filter((_,j) => j !== i));

  const onSubmit = async (data: any) => {
    if (uploadedImages.filter(i => i.url).length === 0) { toast.error("Agrega al menos una imagen"); return; }
    if (!data.categoryId) { toast.error("Selecciona una categoría"); return; }
    setSaving(true);
    try {
      const payload = {
        ...data,
        price: parseFloat(data.price),
        preparationTimeValue: parseInt(data.preparationTimeValue || "0"),
        requiresSpecialOrder: data.requiresSpecialOrder === true || data.requiresSpecialOrder === "true",
        inStock:  data.inStock  === true || data.inStock  === "true",
        featured: data.featured === true || data.featured === "true",
        images: uploadedImages.filter(i => i.url),
        flowerIds: selectedFlowers,
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
    reset({ preparationTimeValue:0, preparationTimeUnit:"MINUTES", inStock:true, featured:false, requiresSpecialOrder:false });
    setUploadedImages([]); setSelectedFlowers([]); setShowForm(true);
  };
  const openEdit = (p: Product) => {
    setEditing(p);
    reset({ name:p.name, description:p.description, price:p.price, categoryId:p.categoryId,
            occasion:p.occasion, preparationTimeValue:p.preparationTimeValue, preparationTimeUnit:p.preparationTimeUnit,
            requiresSpecialOrder:p.requiresSpecialOrder, inStock:p.inStock, featured:p.featured });
    setUploadedImages(p.images.map(i => ({ url:i.url, publicId:i.publicId })));
    setSelectedFlowers(p.flowers.map(f => f.flower.id));
    setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditing(null); reset(); setUploadedImages([]); setSelectedFlowers([]); };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este producto?")) return;
    const res = await fetch(`/api/products/${id}`, { method:"DELETE" });
    if (res.ok) { setProducts(p => p.filter(x => x.id !== id)); toast.success("Eliminado"); }
    else toast.error("Error al eliminar");
  };

  const toggleFlower = (id: string) =>
    setSelectedFlowers(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

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
          {products.map(p => (
            <div key={p.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
              <div className="aspect-video relative overflow-hidden bg-gray-50">
                {p.images[0]
                  ? <img src={p.images[0].url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  : <div className="w-full h-full flex items-center justify-center text-gray-200"><RiFlowerLine size={48} /></div>
                }
                <div className="absolute top-2 right-2 flex gap-1">
                  {p.featured && (
                    <span className="bg-white text-yellow-600 text-xs px-2 py-2 rounded-full flex items-center gap-1">
                      <FaStar   className="h-4 w-4" />
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
                    {p.preparationTimeValue > 0 && (
                      <p className="text-xs text-amber-600 flex items-center gap-1 mt-0.5">
                        <RiTimeLine size={11} />
                        {formatPreparationTime(p.preparationTimeValue, p.preparationTimeUnit)}
                      </p>
                    )}
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

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10 rounded-t-3xl">
              <h2 className="font-bold text-lg">{editing ? "Editar producto" : "Nuevo producto"}</h2>
              <button onClick={closeForm} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"><RiCloseLine size={20} /></button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">

              {/* Images */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Imágenes <span className="text-gray-400 font-normal text-xs">(Cloudinary / fantasiaFloral)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {uploadedImages.map((img, i) => (
                    <div key={i} className="relative group/img">
                      <div className="w-20 h-20 rounded-xl border-2 border-gray-200 overflow-hidden bg-gray-50">
                        {img.url ? (
                          <img src={img.url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-primary-50 transition-colors">
                            {uploadingIdx === i
                              ? <RiLoader4Line className="animate-spin text-primary-500 text-xl" />
                              : <><RiUploadCloud2Line className="text-gray-300 text-xl" /><span className="text-xs text-gray-300 mt-1">Subir</span></>
                            }
                            <input type="file" accept="image/*" onChange={e => handleImageUpload(e, i)} className="hidden" disabled={uploadingIdx !== null} />
                          </label>
                        )}
                      </div>
                      {i === 0 && img.url && <span className="absolute -bottom-1 left-0 right-0 text-center text-xs bg-primary-600 text-white rounded-b-xl py-0.5">Principal</span>}
                      <button type="button" onClick={() => removeImage(i)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full items-center justify-center hidden group-hover/img:flex">
                        <RiCloseLine size={10} />
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={addImageSlot}
                    className="w-20 h-20 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center hover:border-primary-400 hover:bg-primary-50 transition-colors text-gray-400">
                    <RiAddLine size={20} />
                    <span className="text-xs mt-1">Añadir</span>
                  </button>
                </div>
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
                  {OCCASIONS.map(o => <option key={o} value={o}>{o.charAt(0).toUpperCase()+o.slice(1)}</option>)}
                </select>
              </div>

              {/* Preparation time */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <RiTimeLine className="text-amber-500" size={15} />
                  Tiempo de preparación
                </label>
                <div className="flex gap-2 items-center">
                  <input {...register("preparationTimeValue")} type="number" min="0" defaultValue={0}
                    className="w-24 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary-400 text-center font-mono" />
                  <select {...register("preparationTimeUnit")}
                    className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-primary-400">
                    {TIME_UNITS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                  </select>
                </div>
                {prepValue > 0 && (
                  <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                    <RiTimeLine size={12} />
                    Entrega estimada: <strong>{formatPreparationTime(Number(prepValue), prepUnit)}</strong>
                    <span className="text-gray-400 ml-1">El cliente verá esto al pedir</span>
                  </p>
                )}
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
                  <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100 max-h-36 overflow-y-auto">
                    {flowers.map(f => {
                      const selected = selectedFlowers.includes(f.id);
                      return (
                        <button key={f.id} type="button" onClick={() => toggleFlower(f.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-all ${
                            selected ? "bg-primary-600 text-white border-primary-600" : "bg-white text-gray-600 border-gray-200 hover:border-primary-300"
                          }`}>
                          <RiFlowerLine size={11} />
                          {f.name}
                          <span className="opacity-60">({f.type})</span>
                        </button>
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

              {/* Toggles — all with react-icons */}
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
                <button type="button" onClick={closeForm} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">Cancelar</button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-primary-600 text-white py-3 rounded-xl text-sm font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
                  {saving ? <><RiLoader4Line className="animate-spin" /> Guardando...</> : (editing ? "Actualizar" : "Crear producto")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}