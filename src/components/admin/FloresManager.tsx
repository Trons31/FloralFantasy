"use client";
import { useState } from "react";
import { RiAddLine, RiPencilLine, RiDeleteBinLine, RiFlowerLine, RiLoader4Line, RiUploadCloud2Line } from "react-icons/ri";
import { toast } from "sonner";

const FLOWER_TYPES = ["Rosa","Girasol","Lirio","Tulipán","Orquídea","Margarita","Clavel","Crisantemo","Gerbera","Gladiolo","Iris","Lavanda","Peonia","Protea","Otro"];

type Flower = { id: string; name: string; type: string; description?: string | null; imageUrl?: string | null };

export default function FloresManager({ flowers: initial }: { flowers: Flower[] }) {
  const [flowers, setFlowers]   = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState<Flower | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [form, setForm]         = useState({ name: "", type: "Rosa", description: "", imageUrl: "" });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    const fd = new FormData(); fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    setForm(p => ({ ...p, imageUrl: data.url }));
    toast.success("Imagen subida a Cloudinary ✓");
    setUploading(false);
  };

  const openCreate = () => { setEditing(null); setForm({ name:"", type:"Rosa", description:"", imageUrl:"" }); setShowForm(true); };
  const openEdit   = (f: Flower) => { setEditing(f); setForm({ name: f.name, type: f.type, description: f.description||"", imageUrl: f.imageUrl||"" }); setShowForm(true); };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("El nombre es obligatorio"); return; }
    setSaving(true);
    try {
      const url    = editing ? `/api/flowers/${editing.id}` : "/api/flowers";
      const method = editing ? "PUT" : "POST";
      const res    = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const saved  = await res.json();
      if (!res.ok) throw new Error(saved.error);
      if (editing) setFlowers(p => p.map(f => f.id === editing.id ? saved : f));
      else         setFlowers(p => [...p, saved]);
      toast.success(editing ? "Flor actualizada" : "Flor registrada ✓");
      setShowForm(false);
    } catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta flor?")) return;
    const res = await fetch(`/api/flowers/${id}`, { method: "DELETE" });
    if (res.ok) { setFlowers(p => p.filter(f => f.id !== id)); toast.success("Eliminada"); }
    else toast.error("No se puede eliminar, está en uso");
  };

  const groupedByType = flowers.reduce((acc, f) => {
    acc[f.type] = acc[f.type] || [];
    acc[f.type].push(f);
    return acc;
  }, {} as Record<string, Flower[]>);

  return (
    <>
      <div className="flex justify-end mb-4">
        <button onClick={openCreate}
          className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors">
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
          {Object.entries(groupedByType).map(([type, items]) => (
            <div key={type}>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">{type}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {items.map(f => (
                  <div key={f.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
                    <div className="aspect-square bg-gray-50 relative overflow-hidden">
                      {f.imageUrl
                        ? <img src={f.imageUrl} alt={f.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        : <div className="w-full h-full flex items-center justify-center text-4xl">🌸</div>
                      }
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

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="font-bold text-lg">{editing ? "Editar flor" : "Registrar flor"}</h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">✕</button>
            </div>
            <div className="p-6 space-y-4">
              {/* Image upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Imagen (Cloudinary)</label>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                    {form.imageUrl
                      ? <img src={form.imageUrl} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-2xl">🌸</div>
                    }
                  </div>
                  <label className="flex-1 flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl py-3 cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors text-sm text-gray-500">
                    {uploading ? <RiLoader4Line className="animate-spin text-primary-500" size={18} /> : <RiUploadCloud2Line size={18} />}
                    {uploading ? "Subiendo..." : "Subir imagen"}
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))}
                  placeholder="Ej: Rosa Roja" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
                <select value={form.type} onChange={e => setForm(p => ({...p, type: e.target.value}))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-primary-400">
                  {FLOWER_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))}
                  rows={2} placeholder="Descripción opcional..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary-400 resize-none" />
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">Cancelar</button>
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 bg-primary-600 text-white py-3 rounded-xl text-sm font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
                  {saving ? <><RiLoader4Line className="animate-spin" /> Guardando...</> : (editing ? "Actualizar" : "Registrar flor")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
