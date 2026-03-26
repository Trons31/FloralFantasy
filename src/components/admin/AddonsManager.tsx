"use client";
import { useState } from "react";
import { RiAddLine, RiDeleteBinLine, RiLoader4Line, RiUploadCloud2Line,
         RiGobletLine, RiGlassesLine, RiBearSmileLine, RiCakeLine, RiShoppingBasketLine, RiGiftLine } from "react-icons/ri";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";

const TYPES = ["BEBIDA","VINO","PELUCHE","DULCE","CANASTA","OTRO"];

const ADDON_ICONS: Record<string, any> = {
  BEBIDA:  RiGobletLine,
  VINO:    RiGlassesLine,
  PELUCHE: RiBearSmileLine,
  DULCE:   RiCakeLine,
  CANASTA: RiShoppingBasketLine,
  OTRO:    RiGiftLine,
};

export default function AddonsManager({ addons: init }: { addons: any[] }) {
  const [addons, setAddons] = useState(init);
  const [form,   setForm]   = useState({ name:"", price:"", type:"BEBIDA" });
  // ✅ Guardamos el archivo y preview localmente, NO se sube aún
  const [pendingFile,    setPendingFile]    = useState<File | null>(null);
  const [previewUrl,     setPreviewUrl]     = useState<string>("");
  const [show,           setShow]           = useState(false);
  const [saving,         setSaving]         = useState(false);

  const handleImg = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Solo generamos preview local, sin subir
    setPendingFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const resetForm = () => {
    setForm({ name:"", price:"", type:"BEBIDA" });
    setPendingFile(null);
    // Liberar memoria del object URL
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl("");
  };

  const handleSave = async () => {
    if (!form.name || !form.price) { toast.error("Nombre y precio son requeridos"); return; }

    setSaving(true);
    try {
      let imageUrl = "";

      // ✅ Solo subimos a Cloudinary si el usuario eligió una imagen Y presionó Guardar
      if (pendingFile) {
        const fd = new FormData();
        fd.append("file", pendingFile);
        const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
        if (!uploadRes.ok) throw new Error("Error subiendo imagen");
        const uploadData = await uploadRes.json();
        imageUrl = uploadData.url;
      }

      const res   = await fetch("/api/addons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, price: parseFloat(form.price), imageUrl }),
      });
      const saved = await res.json();
      setAddons(p => [...p, saved]);
      resetForm();
      setShow(false);
      toast.success("Adicional creado");
    } catch (err) {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    resetForm();
    setShow(false);
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/addons/${id}`, { method:"DELETE" });
    setAddons(p => p.filter(a => a.id !== id));
    toast.success("Eliminado");
  };

  const grouped = addons.reduce((acc: any, a: any) => {
    acc[a.type] = acc[a.type] || [];
    acc[a.type].push(a);
    return acc;
  }, {});

  return (
    <>
      <div className="flex justify-end mb-4">
        <button onClick={() => setShow(true)}
          className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors">
          <RiAddLine size={16}/> Nuevo adicional
        </button>
      </div>

      {/* Grid de adicionales — sin cambios */}
      <div className="space-y-6">
        {Object.entries(grouped).map(([type, items]: any) => {
          const TypeIcon = ADDON_ICONS[type] || RiGiftLine;
          return (
            <div key={type}>
              <h3 className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                <TypeIcon size={14} /> {type}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {items.map((a: any) => {
                  const Icon = ADDON_ICONS[a.type] || RiGiftLine;
                  return (
                    <div key={a.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                      <div className="aspect-square bg-gray-50 flex items-center justify-center">
                        {a.imageUrl
                          ? <img src={a.imageUrl} alt={a.name} className="w-full h-full object-cover" />
                          : <Icon size={36} className="text-gray-300" />
                        }
                      </div>
                      <div className="p-3 flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-sm text-gray-900">{a.name}</p>
                          <p className="text-xs text-primary-600 font-medium">{formatPrice(a.price)}</p>
                        </div>
                        <button onClick={() => handleDelete(a.id)} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <RiDeleteBinLine size={14}/>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        {addons.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 text-center py-12 text-gray-400 text-sm">
            Sin adicionales aún
          </div>
        )}
      </div>

      {show && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-lg">Nuevo adicional</h2>
              <button onClick={handleCancel} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                <RiAddLine size={16} className="rotate-45"/>
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {previewUrl
                    ? <img src={previewUrl} className="w-full h-full object-cover" alt=""/>
                    : (() => { const I = ADDON_ICONS[form.type] || RiGiftLine; return <I size={28} className="text-gray-300"/>; })()
                  }
                </div>
                <label className="flex-1 flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl py-2.5 cursor-pointer hover:border-primary-400 text-sm text-gray-400 transition-colors">
                  {saving ? <RiLoader4Line className="animate-spin text-primary-500"/> : <RiUploadCloud2Line size={16}/>}
                  {pendingFile ? pendingFile.name.slice(0, 20) : "Imagen"}
                  <input type="file" accept="image/*" onChange={handleImg} className="hidden" disabled={saving}/>
                </label>
              </div>
              <input value={form.name} onChange={e => setForm(p=>({...p,name:e.target.value}))} placeholder="Nombre"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary-400"/>
              <input value={form.price} onChange={e => setForm(p=>({...p,price:e.target.value}))} type="number" placeholder="Precio (COP)"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary-400"/>
              <select value={form.type} onChange={e => setForm(p=>({...p,type:e.target.value}))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-primary-400">
                {TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
              <div className="flex gap-3">
                <button onClick={handleCancel} disabled={saving}
                  className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl text-sm font-medium hover:bg-gray-50 disabled:opacity-50">
                  Cancelar
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 bg-primary-600 text-white py-3 rounded-xl text-sm font-medium hover:bg-primary-700 disabled:opacity-70 flex items-center justify-center gap-2">
                  {saving && <RiLoader4Line className="animate-spin" size={14}/>}
                  {saving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}