"use client";
import { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { RiMapPin2Line, RiTimeLine, RiFlowerLine } from "react-icons/ri";
import { formatPrice, STATUS_LABELS } from "@/lib/utils";
import { toast } from "sonner";

function formatDate(iso: string) {
  const d = new Date(iso);
  const months = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2,"0");
  const ampm = h >= 12 ? "p. m." : "a. m.";
  const h12 = h % 12 || 12;
  return `${d.getDate()} ${months[d.getMonth()]}, ${h12}:${m} ${ampm}`;
}

const COLS = [
  { id: "PAID",             label: "Pagado",      dot: "bg-blue-500",   bg: "bg-blue-50/70   border-blue-200" },
  { id: "PROCESSING",       label: "Procesando",  dot: "bg-amber-500",  bg: "bg-amber-50/70  border-amber-200" },
  { id: "READY",            label: "Listo",       dot: "bg-green-500",  bg: "bg-green-50/70  border-green-200" },
  { id: "OUT_FOR_DELIVERY", label: "En camino",   dot: "bg-purple-500", bg: "bg-purple-50/70 border-purple-200" },
];

export default function KanbanBoard({ initialOrders }: { initialOrders: any[] }) {
  const [orders, setOrders] = useState(initialOrders);

  const byStatus = (s: string) => orders.filter(o => o.status === s);

  const handleDragEnd = async ({ destination, draggableId }: any) => {
    if (!destination) return;
    const newStatus = destination.droppableId;
    const order = orders.find(o => o.id === draggableId);
    if (!order || order.status === newStatus) return;
    setOrders(p => p.map(o => o.id === draggableId ? { ...o, status: newStatus } : o));
    try {
      const res = await fetch(`/api/orders/${draggableId}/status`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      toast.success(`→ ${STATUS_LABELS[newStatus]}`);
    } catch {
      setOrders(p => p.map(o => o.id === draggableId ? { ...o, status: order.status } : o));
      toast.error("Error al actualizar");
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {COLS.map(col => (
          <div key={col.id} className={`rounded-2xl border-2 ${col.bg} flex flex-col min-h-[300px]`}>
            <div className="px-4 py-3 border-b border-current border-opacity-10 flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
              <span className="font-semibold text-gray-800 text-sm">{col.label}</span>
              <span className="ml-auto bg-white text-gray-500 text-xs px-2 py-0.5 rounded-full font-medium">
                {byStatus(col.id).length}
              </span>
            </div>
            <Droppable droppableId={col.id}>
              {(provided, snapshot) => (
                <div ref={provided.innerRef} {...provided.droppableProps}
                  className={`flex-1 p-3 space-y-2.5 transition-colors ${snapshot.isDraggingOver ? "bg-white/50" : ""}`}>
                  {byStatus(col.id).map((order, i) => (
                    <Draggable key={order.id} draggableId={order.id} index={i}>
                      {(prov, snap) => (
                        <div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps}
                          className={`bg-white rounded-xl shadow-sm border border-gray-100 kanban-card overflow-hidden ${snap.isDragging ? "shadow-xl rotate-1 scale-105" : ""}`}>

                          {/* Productos — lo más importante, arriba y grande */}
                          <div className="px-4 pt-4 pb-3 border-b border-gray-50">
                            {order.items?.length > 0 ? order.items.map((item: any, idx: number) => (
                              <div key={idx} className="flex items-center gap-2 mb-1 last:mb-0">
                                <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0">
                                  {item.product?.images?.[0]?.url
                                    ? <img src={item.product.images.find((x:any)=>x.isMain)?.url || item.product.images[0].url} alt="" className="w-full h-full object-cover"/>
                                    : <div className="w-full h-full flex items-center justify-center"><RiFlowerLine className="text-gray-200" size={14}/></div>
                                  }
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-sm text-gray-900 leading-tight truncate">
                                    {item.quantity > 1 && <span className="text-primary-600 mr-1">x{item.quantity}</span>}
                                    {item.product?.name}
                                  </p>
                                  {/* Addons */}
                                  {item.addons?.length > 0 && (
                                    <p className="text-xs text-gray-400 truncate">
                                      + {item.addons.map((a:any) => a.addon?.name).filter(Boolean).join(", ")}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )) : (
                              <p className="text-xs text-gray-300">Sin productos</p>
                            )}
                          </div>

                          {/* Cliente + detalles */}
                          <div className="px-4 py-3">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="font-semibold text-xs text-gray-700 leading-tight">{order.customerName}</p>
                                <p className="text-xs font-mono text-primary-500">{order.trackingToken}</p>
                              </div>
                              <p className="font-bold text-sm text-gray-900">{formatPrice(order.total)}</p>
                            </div>
                            <div className="space-y-1 text-xs text-gray-400">
                              <div className="flex items-start gap-1.5">
                                <RiMapPin2Line className="mt-0.5 flex-shrink-0" size={11}/>
                                <span className="line-clamp-1">{order.address}</span>
                              </div>
                              {order.addressRef && (
                                <p className="text-xs text-gray-300 pl-4">{order.addressRef}</p>
                              )}
                              <div className="flex items-center gap-1.5">
                                <RiTimeLine className="flex-shrink-0" size={11}/>
                                <span>{formatDate(order.createdAt)} · {order.estimatedTime}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                  {byStatus(col.id).length === 0 && (
                    <p className="text-center py-6 text-xs text-gray-300">Sin pedidos</p>
                  )}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}