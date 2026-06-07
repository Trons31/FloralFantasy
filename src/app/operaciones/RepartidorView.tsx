"use client";
import { useEffect, useRef, useState } from "react";
import {
  RiTruckLine, RiCheckLine, RiLoader4Line, RiLogoutBoxLine, RiMapPin2Line,
  RiCameraLine, RiRefreshLine, RiFlowerLine, RiAddLine, RiCloseLine,
  RiReceiptLine, RiArrowDownLine, RiErrorWarningLine, RiPhoneLine, RiWhatsappLine,
} from "react-icons/ri";
import { toast } from "sonner";
import ResponsiveModal from "@/components/ui/ResponsiveModal";

type Addon     = { id:string; addon:{ name:string } };
type OrderItem = { id:string; quantity:number; addons:Addon[]; product:{ name:string; images:{url:string;isMain:boolean}[] } };
type Order     = { id:string; trackingToken:string; customerName:string; address:string;
  customerPhone?:string; addressRef?:string; estimatedTime:string; total:number; status:string;
  deliveryPhotoUrl?:string; items:OrderItem[] };

const EXPENSE_CATS = ["Insumos","Flores","Transporte","Empaque","Otro"];
const MAX_DELIVERY_PHOTO_DIMENSION = 1600;
const DELIVERY_PHOTO_QUALITY = 0.82;

async function compressImageForUpload(file: File) {
  if (!file.type.startsWith("image/")) return file;

  const bitmap = await createImageBitmap(file);
  const { width, height } = bitmap;
  const scale = Math.min(
    1,
    MAX_DELIVERY_PHOTO_DIMENSION / Math.max(width, height)
  );
  const targetWidth = Math.max(1, Math.round(width * scale));
  const targetHeight = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }

  ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(
      (value) => resolve(value),
      "image/webp",
      DELIVERY_PHOTO_QUALITY
    );
  });

  if (!blob || blob.size >= file.size) return file;

  const baseName = file.name.replace(/\.[^.]+$/, "") || "delivery-photo";
  return new File([blob], `${baseName}.webp`, { type: "image/webp" });
}

export default function RepartidorView({ user, onLogout }: { user:any; onLogout:()=>void }) {
  const [orders,       setOrders]       = useState<Order[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [updating,     setUpdating]     = useState<string|null>(null);
  const [activeTab,    setActiveTab]    = useState<"READY"|"DELIVERED">("READY");
  const [photoOrder,   setPhotoOrder]   = useState<Order|null>(null);
  const [photoFile,    setPhotoFile]    = useState<File|null>(null);
  const [photoPreview, setPhotoPreview] = useState<string|null>(null);
  const [uploading,    setUploading]    = useState(false);
  const [photoError,   setPhotoError]   = useState(false);

  // Egreso state
  const [showEgreso,    setShowEgreso]    = useState(false);
  const [egresoForm,    setEgresoForm]    = useState({ description:"", amount:"", category:"Insumos" });
  const [egresoFile,    setEgresoFile]    = useState<File|null>(null);
  const [egresoPreview, setEgresoPreview] = useState<string|null>(null);
  const [savingEgreso,  setSavingEgreso]  = useState(false);

  const fileRef       = useRef<HTMLInputElement>(null);
  const egresoFileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    const res  = await fetch("/api/orders");
    const data = await res.json();
    setOrders(Array.isArray(data) ? data.filter((o:any) => ["READY","OUT_FOR_DELIVERY","DELIVERED"].includes(o.status)) : []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // ── Delivery actions ──────────────────────────────────────────
  const markOutForDelivery = async (orderId: string) => {
    setUpdating(orderId);
    const res = await fetch(`/api/orders/${orderId}/status`, {
      method:"PATCH", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ status:"OUT_FOR_DELIVERY", note:"Pedido recogido para entrega" }),
    });
    if (res.ok) {
      setOrders(p => p.map(o => o.id===orderId ? {...o, status:"OUT_FOR_DELIVERY"} : o));
      toast.success("En camino");
    }
    setUpdating(null);
  };

  const handleDeliveryPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    setPhotoFile(f);
    setPhotoPreview(URL.createObjectURL(f));
    setPhotoError(false);
  };

  const confirmDelivery = async () => {
    if (!photoFile) {
      setPhotoError(true);
      toast.error("Debes tomar una foto de la entrega");
      return;
    }
    if (!photoOrder) return;
    setUploading(true);
    const fd = new FormData();
    const optimizedPhoto = await compressImageForUpload(photoFile);
    fd.append("file", optimizedPhoto);
    fd.append("orderId", photoOrder.id);
    const res = await fetch("/api/orders/delivery-photo", { method:"POST", body: fd });
    if (res.ok) {
      await fetch(`/api/orders/${photoOrder.id}/status`, {
        method:"PATCH",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ status:"DELIVERED", note:"Entrega confirmada con foto" }),
      }).catch(() => {});
      setOrders(p => p.map(o => o.id === photoOrder.id ? { ...o, status:"DELIVERED" } : o));
      toast.success("Entrega confirmada con foto");
      setPhotoOrder(null);
      setPhotoError(false);
    } else toast.error("Error al subir la foto");
    setUploading(false);
  };

  // ── Egreso actions ────────────────────────────────────────────
  const handleEgresoPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    setEgresoFile(f); setEgresoPreview(URL.createObjectURL(f));
  };

  const handleSaveEgreso = async () => {
    if (!egresoForm.description.trim() || !egresoForm.amount) {
      toast.error("Descripción y monto son requeridos"); return;
    }
    if (!egresoFile) {
      toast.error("La foto de la factura es obligatoria"); return;
    }
    setSavingEgreso(true);
    const fd = new FormData();
    fd.append("description",  egresoForm.description);
    fd.append("amount",       egresoForm.amount);
    fd.append("category",     egresoForm.category);
    fd.append("registeredBy", user.name);
    if (egresoFile) fd.append("file", egresoFile);

    const res = await fetch("/api/expenses/with-photo", { method:"POST", body: fd });
    if (res.ok) {
      toast.success("Egreso registrado con éxito");
      setShowEgreso(false);
      setEgresoForm({ description:"", amount:"", category:"Insumos" });
      setEgresoFile(null); setEgresoPreview(null);
    } else toast.error("Error al registrar");
    setSavingEgreso(false);
  };

  const closeEgreso = () => {
    setShowEgreso(false);
    setEgresoForm({ description:"", amount:"", category:"Insumos" });
    setEgresoFile(null); setEgresoPreview(null);
  };

  const ready          = orders.filter(o => o.status === "READY");
  const delivered      = orders.filter(o => ["OUT_FOR_DELIVERY","DELIVERED"].includes(o.status));
  const activeOrders   = activeTab === "READY" ? ready : delivered;
  const activeConfig   = activeTab === "READY"
    ? { title:"Listos para recoger", count: ready.length, dot:"bg-green-500" }
    : { title:"Entregados", count: delivered.length, dot:"bg-purple-500" };

  return (
    <div className="min-h-screen bg-blue-50">
      {/* Header — mobile first: two rows */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        {/* Row 1: identity + actions */}
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <RiTruckLine className="text-blue-600" size={17}/>
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm leading-none">{user.name}</p>
              <p className="text-xs text-gray-400">Repartidor</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={load}
              className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 rounded-xl text-gray-400 transition-colors">
              <RiRefreshLine size={18}/>
            </button>
            <button onClick={onLogout}
              className="w-9 h-9 flex items-center justify-center hover:bg-red-50 rounded-xl text-gray-400 hover:text-red-500 transition-colors">
              <RiLogoutBoxLine size={18}/>
            </button>
          </div>
        </div>
        {/* Row 2: register expense — full width */}
        <div className="px-4 pb-3">
          <button onClick={() => setShowEgreso(true)}
            className="w-full flex items-center justify-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-amber-100 active:scale-95 transition-all">
            <RiReceiptLine size={16}/> Registrar gasto
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-28 space-y-6">
        {!loading && orders.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-gray-100 bg-white/95 px-2 py-2.5 backdrop-blur-md shadow-[0_-10px_30px_rgba(0,0,0,0.06)]">
            <div className="max-w-2xl mx-auto">
              <div className="grid grid-cols-2 gap-1.5 rounded-3xl bg-gray-50 p-1.5">
                <button
                  onClick={() => setActiveTab("READY")}
                  className={`flex min-w-0 items-center justify-between gap-1.5 rounded-2xl px-2.5 py-2.5 text-[11px] font-semibold transition-all ${
                    activeTab === "READY"
                      ? "bg-white text-blue-700 shadow-sm ring-1 ring-blue-100"
                      : "text-gray-500 hover:bg-white/70"
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${activeTab === "READY" ? "bg-green-500" : "bg-green-400/70"}`} />
                    <span className="truncate">Listos para recoger</span>
                  </span>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${activeTab === "READY" ? "bg-green-50 text-green-700" : "bg-white text-gray-500"}`}>
                    {ready.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab("DELIVERED")}
                  className={`flex min-w-0 items-center justify-between gap-1.5 rounded-2xl px-2.5 py-2.5 text-[11px] font-semibold transition-all ${
                    activeTab === "DELIVERED"
                      ? "bg-white text-purple-700 shadow-sm ring-1 ring-purple-100"
                      : "text-gray-500 hover:bg-white/70"
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${activeTab === "DELIVERED" ? "bg-purple-500" : "bg-purple-400/70"}`} />
                    <span className="truncate">Entregados</span>
                  </span>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${activeTab === "DELIVERED" ? "bg-purple-50 text-purple-700" : "bg-white text-gray-500"}`}>
                    {delivered.length}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20"><RiLoader4Line className="animate-spin text-blue-500" size={32}/></div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <RiTruckLine className="text-gray-200 mx-auto mb-3" size={56}/>
            <p className="text-gray-400 font-medium">Sin pedidos para entregar</p>
            <p className="text-gray-300 text-sm mt-1">Toca actualizar para revisar</p>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className={`w-2.5 h-2.5 rounded-full ${activeConfig.dot}`} />
              <h2 className="font-bold text-gray-700 text-sm uppercase tracking-wide">
                {activeConfig.title} ({activeConfig.count})
              </h2>
            </div>
            <div className="space-y-3">
              {activeOrders.length > 0 ? (
                activeOrders.map(order => (
                  <DeliveryCard
                    key={order.id}
                    order={order}
                    updating={updating}
                    action={
                      activeTab === "READY"
                        ? { label:"Recoger y salir", color:"bg-blue-500 hover:bg-blue-600" }
                        : { label: order.status === "DELIVERED" ? "Entregado" : "Subir foto de entrega", color:"bg-green-500 hover:bg-green-600" }
                    }
                    onAction={activeTab === "READY" ? () => markOutForDelivery(order.id) : null}
                    onDeliver={activeTab === "DELIVERED" && order.status !== "DELIVERED" ? () => { setPhotoOrder(order); setPhotoFile(null); setPhotoPreview(null); setPhotoError(false); } : null}
                  />
                ))
              ) : (
                <div className="text-center py-20">
                  <RiTruckLine className="text-gray-200 mx-auto mb-3" size={56}/>
                  <p className="text-gray-400 font-medium">Sin pedidos en esta sección</p>
                  <p className="text-gray-300 text-sm mt-1">Toca actualizar para revisar</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Delivery photo modal ── */}
      <ResponsiveModal
        open={!!photoOrder}
        onClose={() => { setPhotoOrder(null); setPhotoError(false); }}
        title="Confirmar entrega"
        description="La foto de evidencia es obligatoria para confirmar."
        panelClassName="sm:max-w-md"
      >
        {photoOrder && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-gray-50 p-3 text-sm">
              <p className="font-bold text-gray-900">
                {photoOrder.items.map(i => `${i.quantity>1?`x${i.quantity} `:""}${i.product.name}`).join(", ")}
              </p>
              <p className="text-gray-500 mt-1">{photoOrder.customerName}</p>
              <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                <RiMapPin2Line size={11}/> {photoOrder.address}
              </p>
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleDeliveryPhoto}
              className="hidden"
            />

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Foto de entrega <span className="text-red-500">*</span>
              </label>

              {photoPreview ? (
                <div className="relative">
                  <img src={photoPreview} alt="Evidencia" className="w-full h-52 object-cover rounded-2xl" />
                  <button
                    onClick={() => {
                      setPhotoFile(null);
                      setPhotoPreview(null);
                      setPhotoError(false);
                    }}
                    className="absolute top-2 right-2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center"
                  >
                    <RiCloseLine size={16} />
                  </button>
                  <div className="absolute bottom-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-lg flex items-center gap-1">
                    <RiCheckLine size={11} /> Foto lista
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    fileRef.current?.click();
                    setPhotoError(false);
                  }}
                  className={`w-full h-40 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 transition-colors ${
                    photoError
                      ? "border-red-400 bg-red-50 hover:border-red-500"
                      : "border-gray-200 hover:border-primary-400 hover:bg-primary-50"
                  }`}
                >
                  <RiCameraLine className={photoError ? "text-red-400" : "text-gray-300"} size={36} />
                  <span className={`text-sm font-medium ${photoError ? "text-red-500" : "text-gray-400"}`}>
                    Tomar foto de entrega
                  </span>
                  {photoError && <span className="text-xs text-red-400">Debes tomar la foto para continuar</span>}
                </button>
              )}

              {photoError && (
                <div className="flex items-center gap-1.5 text-red-500 text-xs mt-3 px-1">
                  <RiErrorWarningLine size={13} />
                  <span>La foto es obligatoria para confirmar la entrega</span>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => {
                  setPhotoOrder(null);
                  setPhotoError(false);
                }}
                className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600 text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelivery}
                disabled={uploading}
                className="flex-1 py-3 bg-green-500 text-white rounded-xl text-sm font-semibold hover:bg-green-600 disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {uploading ? <RiLoader4Line className="animate-spin" size={16} /> : <RiCheckLine size={16} />}
                {uploading ? "Subiendo..." : "Confirmar"}
              </button>
            </div>
          </div>
        )}
      </ResponsiveModal>

      {/* ── Egreso / gasto modal ── */}
      {showEgreso && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 backdrop-blur-sm">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-sm shadow-2xl p-6 pb-8 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-bold text-lg flex items-center gap-2">
                  <RiReceiptLine className="text-amber-500" size={20}/> Registrar gasto
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">El gasto quedará en contabilidad con tu nombre</p>
              </div>
              <button onClick={closeEgreso} className="p-2 hover:bg-gray-100 rounded-full text-gray-400">
                <RiCloseLine size={20}/>
              </button>
            </div>

            <div className="space-y-4">
              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">¿Qué compraste? *</label>
                <input value={egresoForm.description}
                  onChange={e => setEgresoForm(p=>({...p,description:e.target.value}))}
                  placeholder="Ej: Rosas rojas mercado central"
                  autoComplete="off"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-amber-400"/>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Monto pagado (COP) *</label>
                <input value={egresoForm.amount}
                  onChange={e => setEgresoForm(p=>({...p,amount:e.target.value}))}
                  type="number" placeholder="50000" inputMode="numeric"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-amber-400"/>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
                <div className="flex flex-wrap gap-2">
                  {EXPENSE_CATS.map(c => (
                    <button key={c} type="button" onClick={() => setEgresoForm(p=>({...p,category:c}))}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        egresoForm.category===c ? "bg-amber-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Receipt photo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Foto de la factura *
                </label>
                <input ref={egresoFileRef} type="file" accept="image/*" capture="environment"
                  onChange={handleEgresoPhoto} className="hidden"/>
                {egresoPreview ? (
                  <div className="relative">
                    <img src={egresoPreview} alt="Factura" className="w-full h-40 object-cover rounded-2xl"/>
                    <button onClick={() => { setEgresoFile(null); setEgresoPreview(null); }}
                      className="absolute top-2 right-2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center">
                      <RiCloseLine size={16}/>
                    </button>
                    <div className="absolute bottom-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-lg flex items-center gap-1">
                      <RiCheckLine size={11}/> Foto lista
                    </div>
                  </div>
                ) : (
                  <button onClick={() => egresoFileRef.current?.click()}
                    className="w-full h-32 border-2 border-dashed border-amber-200 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-amber-400 hover:bg-amber-50 transition-colors bg-amber-50/50">
                    <RiCameraLine className="text-amber-400" size={32}/>
                    <span className="text-sm text-amber-600 font-medium">Tomar foto de la factura</span>
                    <span className="text-xs text-gray-400">El admin podrá verla en egresos</span>
                  </button>
                )}
              </div>

              <div className="flex gap-3 pt-1">
                <button onClick={closeEgreso} className="flex-1 border border-gray-200 text-gray-600 py-3.5 rounded-xl text-sm font-medium">
                  Cancelar
                </button>
                <button onClick={handleSaveEgreso} disabled={savingEgreso || !egresoForm.description || !egresoForm.amount || !egresoFile}
                  className="flex-1 bg-amber-500 text-white py-3.5 rounded-xl text-sm font-semibold hover:bg-amber-600 disabled:opacity-40 flex items-center justify-center gap-2 active:scale-95">
                  {savingEgreso ? <RiLoader4Line className="animate-spin" size={15}/> : <RiArrowDownLine size={15}/>}
                  {savingEgreso ? "Guardando..." : "Registrar gasto"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DeliveryCard({ order, updating, action, onAction, onDeliver }: {
  order:Order; updating:string|null;
  action:{ label:string; color:string };
  onAction: (() => void) | null;
  onDeliver: (() => void) | null;
}) {
  const [activeInfoTab, setActiveInfoTab] = useState<"CLIENT"|"ADDRESS">("CLIENT");
  const mainImg  = order.items[0]?.product?.images?.find(i=>i.isMain)?.url || order.items[0]?.product?.images?.[0]?.url;
  const isUpdating = updating === order.id;
  const disabled = !onAction && !onDeliver;
  const phoneDigits = (order.customerPhone || "").replace(/\D/g, "");
  const whatsappPhone =
    phoneDigits.length === 10 && phoneDigits.startsWith("3")
      ? `57${phoneDigits}`
      : phoneDigits;
  const whatsappText = encodeURIComponent(`Hola ${order.customerName}, te escribo por tu pedido ${order.trackingToken}.`);
  const whatsappUrl = whatsappPhone ? `https://wa.me/${whatsappPhone}?text=${whatsappText}` : "";
  const telUrl = phoneDigits ? `tel:${phoneDigits}` : "";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
      <div className="flex gap-4 p-4">
        <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0">
          {mainImg
            ? <img src={mainImg} alt="" className="w-full h-full object-cover"/>
            : <div className="w-full h-full flex items-center justify-center"><RiFlowerLine className="text-gray-200" size={32}/></div>
          }
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              {order.items.map((item,i) => (
                <div key={i} className="mb-0.5 last:mb-0">
                  <p className="font-bold text-gray-900 text-base leading-tight">
                    {item.quantity > 1 && <span className="text-primary-600">x{item.quantity} </span>}
                    {item.product.name}
                  </p>
                  {item.addons?.length > 0 && (
                    <p className="text-xs text-gray-400">+ {item.addons.map((a:any) => a.addon?.name).filter(Boolean).join(", ")}</p>
                  )}
                </div>
              ))}
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[10px] uppercase tracking-[0.18em] text-gray-400 font-semibold">Guía</p>
              <p className="text-xs font-mono text-primary-600 font-bold mt-0.5">{order.trackingToken}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pb-3">
        <div className="grid grid-cols-2 gap-1.5 rounded-2xl bg-gray-50 p-1.5">
          <button
            type="button"
            onClick={() => setActiveInfoTab("CLIENT")}
            className={`rounded-xl px-3 py-2 text-sm font-semibold transition-all ${
              activeInfoTab === "CLIENT"
                ? "bg-white text-blue-700 shadow-sm ring-1 ring-blue-100"
                : "text-gray-500 hover:bg-white/70"
            }`}
          >
            Cliente
          </button>
          <button
            type="button"
            onClick={() => setActiveInfoTab("ADDRESS")}
            className={`rounded-xl px-3 py-2 text-sm font-semibold transition-all ${
              activeInfoTab === "ADDRESS"
                ? "bg-white text-blue-700 shadow-sm ring-1 ring-blue-100"
                : "text-gray-500 hover:bg-white/70"
            }`}
          >
            Dirección
          </button>
        </div>
      </div>

      <div className="px-4 pb-4">
        {activeInfoTab === "CLIENT" ? (
          <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
            <p className="text-sm font-bold text-gray-900">{order.customerName}</p>
            <p className="text-xs text-gray-500 mt-1">{order.customerPhone || "Sin número registrado"}</p>
            <div className="grid grid-cols-2 gap-2 mt-4">
              <a
                href={whatsappUrl || undefined}
                target={whatsappUrl ? "_blank" : undefined}
                rel={whatsappUrl ? "noreferrer" : undefined}
                aria-disabled={!whatsappUrl}
                className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-all ${
                  whatsappUrl
                    ? "bg-green-500 text-white hover:bg-green-600"
                    : "bg-gray-200 text-gray-400 pointer-events-none"
                }`}
              >
                <RiWhatsappLine size={16} />
                WhatsApp
              </a>
              <a
                href={telUrl || undefined}
                aria-disabled={!telUrl}
                className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-all ${
                  telUrl
                    ? "bg-blue-500 text-white hover:bg-blue-600"
                    : "bg-gray-200 text-gray-400 pointer-events-none"
                }`}
              >
                <RiPhoneLine size={16} />
                Llamar
              </a>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-gray-400 font-semibold">Dirección completa</p>
            <p className="text-sm font-bold text-gray-900 mt-1 leading-snug">{order.address}</p>
            <div className="mt-3 space-y-2">
              <div className="flex items-start gap-2 text-xs text-gray-500">
                <RiMapPin2Line className="mt-0.5 shrink-0 text-gray-400" size={12} />
                <span>{order.address}</span>
              </div>
              {order.addressRef ? (
                <div className="flex items-start gap-2 text-xs text-gray-500">
                  <RiAddLine className="mt-0.5 shrink-0 text-gray-400" size={12} />
                  <span>{order.addressRef}</span>
                </div>
              ) : (
                <div className="flex items-start gap-2 text-xs text-gray-400">
                  <RiAddLine className="mt-0.5 shrink-0 text-gray-300" size={12} />
                  <span>Sin referencia adicional</span>
                </div>
              )}
              <div className="flex items-start gap-2 text-xs text-gray-500">
                <RiTruckLine className="mt-0.5 shrink-0 text-gray-400" size={12} />
                <span>Entrega estimada: {order.estimatedTime}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="px-4 pb-4">
        <button
          onClick={onAction ?? onDeliver ?? undefined}
          disabled={isUpdating || disabled}
          className={`w-full py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all ${action.color} disabled:opacity-50`}>
          {isUpdating ? <RiLoader4Line className="animate-spin" size={16}/> :
           onDeliver  ? <RiCameraLine size={16}/> : <RiTruckLine size={16}/>}
          {isUpdating ? "Actualizando..." : action.label}
        </button>
        {order.deliveryPhotoUrl && (
          <p className="text-[11px] text-emerald-600 mt-2 text-center">Foto de entrega registrada</p>
        )}
      </div>
    </div>
  );
}
