"use client";
import { useEffect, useRef, useState } from "react";
import {
  RiTruckLine, RiCheckLine, RiLoader4Line, RiLogoutBoxLine, RiMapPin2Line,
  RiCameraLine, RiRefreshLine, RiFlowerLine, RiAddLine, RiCloseLine,
  RiReceiptLine, RiArrowDownLine, RiErrorWarningLine,
} from "react-icons/ri";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";

type Addon     = { id:string; addon:{ name:string } };
type OrderItem = { id:string; quantity:number; addons:Addon[]; product:{ name:string; images:{url:string;isMain:boolean}[] } };
type Order     = { id:string; trackingToken:string; customerName:string; address:string;
  addressRef?:string; estimatedTime:string; total:number; status:string;
  deliveryPhotoUrl?:string; items:OrderItem[] };

const EXPENSE_CATS = ["Insumos","Flores","Transporte","Empaque","Otro"];

export default function RepartidorView({ user, onLogout }: { user:any; onLogout:()=>void }) {
  const [orders,       setOrders]       = useState<Order[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [updating,     setUpdating]     = useState<string|null>(null);
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
    setOrders(Array.isArray(data) ? data.filter((o:any) => ["READY","OUT_FOR_DELIVERY"].includes(o.status)) : []);
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
    fd.append("file", photoFile);
    fd.append("orderId", photoOrder.id);
    const res = await fetch("/api/orders/delivery-photo", { method:"POST", body: fd });
    if (res.ok) {
      setOrders(p => p.filter(o => o.id !== photoOrder.id));
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
  const outForDelivery = orders.filter(o => o.status === "OUT_FOR_DELIVERY");

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

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {loading ? (
          <div className="flex justify-center py-20"><RiLoader4Line className="animate-spin text-blue-500" size={32}/></div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <RiTruckLine className="text-gray-200 mx-auto mb-3" size={56}/>
            <p className="text-gray-400 font-medium">Sin pedidos para entregar</p>
            <p className="text-gray-300 text-sm mt-1">Toca actualizar para revisar</p>
          </div>
        ) : (
          <>
            {ready.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500"/>
                  <h2 className="font-bold text-gray-700 text-sm uppercase tracking-wide">Listos para recoger ({ready.length})</h2>
                </div>
                <div className="space-y-3">
                  {ready.map(order => (
                    <DeliveryCard key={order.id} order={order} updating={updating}
                      action={{ label:"Recoger y salir", color:"bg-blue-500 hover:bg-blue-600" }}
                      onAction={() => markOutForDelivery(order.id)}
                      onDeliver={null}/>
                  ))}
                </div>
              </div>
            )}
            {outForDelivery.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse"/>
                  <h2 className="font-bold text-gray-700 text-sm uppercase tracking-wide">En camino ({outForDelivery.length})</h2>
                </div>
                <div className="space-y-3">
                  {outForDelivery.map(order => (
                    <DeliveryCard key={order.id} order={order} updating={updating}
                      action={{ label:"Confirmar entrega con foto", color:"bg-green-500 hover:bg-green-600" }}
                      onAction={null}
                      onDeliver={() => { setPhotoOrder(order); setPhotoFile(null); setPhotoPreview(null); setPhotoError(false); }}/>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Delivery photo modal ── */}
      {photoOrder && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6">
            <h2 className="font-bold text-lg mb-1">Confirmar entrega</h2>
            <p className="text-sm text-gray-500 mb-4">
              La foto de evidencia es <span className="font-semibold text-red-500">obligatoria</span> para confirmar
            </p>
            <div className="bg-gray-50 rounded-xl p-3 mb-4 text-sm">
              <p className="font-bold text-gray-900">
                {photoOrder.items.map(i => `${i.quantity>1?`x${i.quantity} `:""}${i.product.name}`).join(", ")}
              </p>
              <p className="text-gray-500 mt-1">{photoOrder.customerName}</p>
              <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                <RiMapPin2Line size={11}/> {photoOrder.address}
              </p>
            </div>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleDeliveryPhoto} className="hidden"/>

            {/* Label with required indicator */}
            <p className="text-sm font-medium text-gray-700 mb-2">
              Foto de entrega <span className="text-red-500">*</span>
            </p>

            {photoPreview ? (
              <div className="relative mb-4">
                <img src={photoPreview} alt="Evidencia" className="w-full h-48 object-cover rounded-2xl"/>
                <button onClick={() => { setPhotoFile(null); setPhotoPreview(null); setPhotoError(false); }}
                  className="absolute top-2 right-2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center">
                  <RiCloseLine size={16}/>
                </button>
                <div className="absolute bottom-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-lg flex items-center gap-1">
                  <RiCheckLine size={11}/> Foto lista
                </div>
              </div>
            ) : (
              <>
                <button onClick={() => { fileRef.current?.click(); setPhotoError(false); }}
                  className={`w-full h-36 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 transition-colors mb-1 ${
                    photoError
                      ? "border-red-400 bg-red-50 hover:border-red-500"
                      : "border-gray-200 hover:border-primary-400 hover:bg-primary-50"
                  }`}>
                  <RiCameraLine className={photoError ? "text-red-400" : "text-gray-300"} size={36}/>
                  <span className={`text-sm font-medium ${photoError ? "text-red-500" : "text-gray-400"}`}>
                    Tomar foto de entrega
                  </span>
                  {photoError && (
                    <span className="text-xs text-red-400">Debes tomar la foto para continuar</span>
                  )}
                </button>
                {photoError && (
                  <div className="flex items-center gap-1.5 text-red-500 text-xs mb-3 px-1">
                    <RiErrorWarningLine size={13}/>
                    <span>La foto es obligatoria para confirmar la entrega</span>
                  </div>
                )}
              </>
            )}

            <div className="flex gap-3 mt-4">
              <button onClick={() => { setPhotoOrder(null); setPhotoError(false); }}
                className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600 text-sm font-medium">
                Cancelar
              </button>
              <button onClick={confirmDelivery} disabled={uploading}
                className="flex-1 py-3 bg-green-500 text-white rounded-xl text-sm font-semibold hover:bg-green-600 disabled:opacity-40 flex items-center justify-center gap-2">
                {uploading ? <RiLoader4Line className="animate-spin" size={16}/> : <RiCheckLine size={16}/>}
                {uploading ? "Subiendo..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}

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
  const mainImg  = order.items[0]?.product?.images?.find(i=>i.isMain)?.url || order.items[0]?.product?.images?.[0]?.url;
  const isUpdating = updating === order.id;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
      <div className="flex gap-4 p-4">
        <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0">
          {mainImg
            ? <img src={mainImg} alt="" className="w-full h-full object-cover"/>
            : <div className="w-full h-full flex items-center justify-center"><RiFlowerLine className="text-gray-200" size={32}/></div>
          }
        </div>
        <div className="flex-1 min-w-0">
          <div className="mb-1.5">
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
          <p className="text-xs text-gray-500 font-medium">{order.customerName}</p>
          <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5 line-clamp-1">
            <RiMapPin2Line size={10}/> {order.address}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="font-bold text-sm text-gray-900">{formatPrice(order.total)}</p>
          <p className="text-xs font-mono text-primary-500 mt-0.5">{order.trackingToken}</p>
        </div>
      </div>
      <div className="px-4 pb-4">
        <button
          onClick={onAction ?? onDeliver ?? undefined}
          disabled={isUpdating}
          className={`w-full py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all ${action.color} disabled:opacity-50`}>
          {isUpdating ? <RiLoader4Line className="animate-spin" size={16}/> :
           onDeliver  ? <RiCameraLine size={16}/> : <RiTruckLine size={16}/>}
          {isUpdating ? "Actualizando..." : action.label}
        </button>
      </div>
    </div>
  );
}