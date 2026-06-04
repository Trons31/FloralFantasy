"use client";
import { useEffect, useState } from "react";
import { RiFlowerLine, RiCheckLine, RiLoader4Line, RiLogoutBoxLine, RiTimeLine, RiRefreshLine } from "react-icons/ri";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";

type Addon = { id:string; addon:{ name:string } };
type OrderItem = { id:string; quantity:number; price:number; addons:Addon[]; product:{ name:string; images:{url:string;isMain:boolean}[] } };
type Order = { id:string; trackingToken:string; customerName:string; address:string; estimatedTime:string; total:number; status:string; items:OrderItem[] };

export default function PreparadorView({ user, onLogout }: { user:any; onLogout:()=>void }) {
  const [orders,  setOrders]  = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string|null>(null);
  const [activeTab, setActiveTab] = useState<"PAID" | "PROCESSING">("PAID");

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/orders?status=PAID,PROCESSING");
    const data = await res.json();
    setOrders(Array.isArray(data) ? data.filter((o:any) => ["PAID","PROCESSING"].includes(o.status)) : []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (orderId: string, status: "PROCESSING"|"READY") => {
    setUpdating(orderId);
    const res = await fetch(`/api/orders/${orderId}/status`, {
      method: "PATCH", headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ status, note: status === "PROCESSING" ? "Preparando pedido" : "Pedido listo para entrega" }),
    });
    if (res.ok) {
      setOrders(p => status === "READY"
        ? p.filter(o => o.id !== orderId)
        : p.map(o => o.id === orderId ? {...o, status} : o)
      );
      toast.success(status === "PROCESSING" ? "En preparación" : "Marcado como listo");
    }
    setUpdating(null);
  };

  const paid       = orders.filter(o => o.status === "PAID");
  const processing = orders.filter(o => o.status === "PROCESSING");
  const activeOrders = activeTab === "PAID" ? paid : processing;
  const activeConfig = activeTab === "PAID"
    ? { title: "Por preparar", count: paid.length, dot: "bg-blue-500" }
    : { title: "En preparación", count: processing.length, dot: "bg-amber-500 animate-pulse" };

  return (
    <div className="min-h-screen bg-amber-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center">
            <RiFlowerLine className="text-amber-600" size={20}/>
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm leading-none">Preparador</p>
            <p className="text-xs text-gray-400">{user.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400">
            <RiRefreshLine size={18}/>
          </button>
          <button onClick={onLogout} className="p-2 hover:bg-red-50 rounded-xl transition-colors text-gray-400 hover:text-red-500">
            <RiLogoutBoxLine size={18}/>
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-6">

        {loading ? (
          <div className="flex justify-center py-20"><RiLoader4Line className="animate-spin text-amber-500" size={32}/></div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <RiFlowerLine className="text-gray-200 mx-auto mb-3" size={56}/>
            <p className="text-gray-400 font-medium">Sin pedidos pendientes</p>
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
                  <OrderCard
                    key={order.id}
                    order={order}
                    updating={updating}
                    action={
                      activeTab === "PAID"
                        ? { label:"Empezar a preparar", status:"PROCESSING", color:"bg-amber-500 hover:bg-amber-600" }
                        : { label:"Marcar como listo", status:"READY", color:"bg-green-500 hover:bg-green-600" }
                    }
                    onAction={updateStatus}
                  />
                ))
              ) : (
                <div className="bg-white rounded-2xl border border-gray-100 text-center py-16">
                  <RiFlowerLine className="text-gray-200 mx-auto mb-3" size={48} />
                  <p className="text-gray-400 text-sm">Sin pedidos en esta sección</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {!loading && orders.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-gray-100 bg-white/95 px-2 py-2.5 backdrop-blur-md shadow-[0_-10px_30px_rgba(0,0,0,0.06)]">
          <div className="max-w-2xl mx-auto">
            <div className="grid grid-cols-2 gap-1.5 rounded-3xl bg-gray-50 p-1.5">
              <button
                onClick={() => setActiveTab("PAID")}
                className={`flex min-w-0 items-center justify-between gap-1.5 rounded-2xl px-2.5 py-2.5 text-[11px] font-semibold transition-all ${
                  activeTab === "PAID"
                    ? "bg-white text-blue-700 shadow-sm ring-1 ring-blue-100"
                    : "text-gray-500 hover:bg-white/70"
                }`}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${activeTab === "PAID" ? "bg-blue-500" : "bg-blue-400/70"}`} />
                  <span className="truncate">Por preparar</span>
                </span>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${activeTab === "PAID" ? "bg-blue-50 text-blue-700" : "bg-white text-gray-500"}`}>
                  {paid.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("PROCESSING")}
                className={`flex min-w-0 items-center justify-between gap-1.5 rounded-2xl px-2.5 py-2.5 text-[11px] font-semibold transition-all ${
                  activeTab === "PROCESSING"
                    ? "bg-white text-amber-700 shadow-sm ring-1 ring-amber-100"
                    : "text-gray-500 hover:bg-white/70"
                }`}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${activeTab === "PROCESSING" ? "bg-amber-500" : "bg-amber-400/70"}`} />
                  <span className="truncate">En preparación</span>
                </span>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${activeTab === "PROCESSING" ? "bg-amber-50 text-amber-700" : "bg-white text-gray-500"}`}>
                  {processing.length}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function OrderCard({ order, updating, action, onAction }: {
  order: Order; updating: string|null;
  action: { label:string; status:any; color:string };
  onAction: (id:string, status:any) => void;
}) {
  const mainImg = order.items[0]?.product?.images?.find(i=>i.isMain)?.url || order.items[0]?.product?.images?.[0]?.url;
  const isUpdating = updating === order.id;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
      <div className="flex gap-4 p-4">
        {/* Product image */}
        <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0">
          {mainImg
            ? <img src={mainImg} alt="" className="w-full h-full object-cover"/>
            : <div className="w-full h-full flex items-center justify-center"><RiFlowerLine className="text-gray-200" size={32}/></div>
          }
        </div>
        <div className="flex-1 min-w-0">
          {/* Product names — lo más importante */}
          <div className="mb-2">
            {order.items.map((item,i) => (
              <div key={i} className="mb-1 last:mb-0">
                <p className="font-bold text-gray-900 text-base leading-tight">
                  {item.quantity > 1 && <span className="text-primary-600">x{item.quantity} </span>}
                  {item.product.name}
                </p>
                {item.addons?.length > 0 && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    + {item.addons.map((a:any) => a.addon?.name).filter(Boolean).join(", ")}
                  </p>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mb-0.5">{order.customerName}</p>
          <div className="flex items-center gap-1 text-xs text-amber-600">
            <RiTimeLine size={11}/> {order.estimatedTime}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="font-bold text-sm text-gray-900">{formatPrice(order.total)}</p>
          <p className="text-xs font-mono text-primary-500 mt-0.5">{order.trackingToken}</p>
        </div>
      </div>
      <div className="px-4 pb-4">
        <button onClick={() => onAction(order.id, action.status)} disabled={isUpdating}
          className={`w-full py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all ${action.color} disabled:opacity-50`}>
          {isUpdating ? <RiLoader4Line className="animate-spin" size={16}/> : <RiCheckLine size={16}/>}
          {isUpdating ? "Actualizando..." : action.label}
        </button>
      </div>
    </div>
  );
}
