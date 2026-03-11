"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RiSearchLine, RiLoader4Line, RiCheckboxCircleLine, RiRadioButtonLine } from "react-icons/ri";
import Header from "@/components/client/Header";
import Footer from "@/components/client/Footer";
import { formatPrice } from "@/lib/utils";

const STEPS = [
  { status:"PENDING",          label:"Pedido recibido",   icon:"📋", desc:"Tu pedido fue registrado" },
  { status:"PAID",             label:"Pago confirmado",   icon:"💳", desc:"Tu pago fue procesado" },
  { status:"PROCESSING",       label:"Preparando flores", icon:"🌸", desc:"Nuestros floristas están trabajando" },
  { status:"READY",            label:"Pedido listo",      icon:"✅", desc:"Tu arreglo está listo" },
  { status:"OUT_FOR_DELIVERY", label:"En camino",         icon:"🚚", desc:"Tu pedido está en ruta" },
  { status:"DELIVERED",        label:"Entregado",         icon:"🎁", desc:"¡Tu pedido llegó!" },
];

export default function SeguimientoPage() {
  const [token,   setToken]   = useState("");
  const [loading, setLoading] = useState(false);
  const [order,   setOrder]   = useState<any>(null);
  const [error,   setError]   = useState("");

  const handleSearch = async () => {
    if (!token.trim()) return;
    setLoading(true); setError(""); setOrder(null);
    try {
      const res  = await fetch(`/api/seguimiento?token=${token.trim()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOrder(data);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const currentIdx = order ? STEPS.findIndex(s => s.status === order.status) : -1;

  return (
    <main className="min-h-screen bg-[#fdfcf8]">
      <Header/>
      <div className="pt-20">
        <div className="bg-gradient-to-r from-primary-800 to-primary-600 text-white py-16 px-4 text-center">
          <h1 className="text-4xl font-display font-semibold mb-2" style={{fontFamily:"var(--font-cormorant),Georgia,serif"}}>
            Seguimiento de pedido
          </h1>
          <p className="text-primary-200">Ingresa tu token para ver el estado en tiempo real</p>
        </div>

        <div className="max-w-xl mx-auto px-4 py-12">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">Token de seguimiento</label>
            <div className="flex gap-3">
              <input value={token} onChange={e => setToken(e.target.value.toUpperCase())}
                onKeyDown={e => e.key==="Enter" && handleSearch()}
                placeholder="FLR-XXXXXX"
                className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-base font-mono tracking-widest focus:outline-none focus:border-primary-400 uppercase"/>
              <button onClick={handleSearch} disabled={loading}
                className="bg-primary-600 text-white px-6 py-3 rounded-xl hover:bg-primary-700 transition-colors flex items-center gap-2 disabled:opacity-50">
                {loading ? <RiLoader4Line className="animate-spin" size={18}/> : <RiSearchLine size={18}/>}
              </button>
            </div>
            {error && <p className="text-red-500 text-sm mt-3">❌ {error}</p>}
          </div>

          <AnimatePresence>
            {order && (
              <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}
                className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Token</p>
                    <p className="text-2xl font-mono font-bold text-primary-600 tracking-widest">{order.trackingToken}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Total</p>
                    <p className="font-bold text-lg">{formatPrice(order.total)}</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-2xl p-4 mb-6 text-sm space-y-1.5">
                  <p><span className="text-gray-400">Cliente:</span> <strong className="text-gray-800">{order.customerName}</strong></p>
                  <p><span className="text-gray-400">Dirección:</span> {order.address}</p>
                  <p><span className="text-gray-400">Entrega est.:</span> <span className="text-amber-600 font-medium">{order.estimatedTime}</span></p>
                  <p><span className="text-gray-400">Pedido el:</span> {new Date(order.createdAt).toLocaleDateString("es-CO",{dateStyle:"long"})}</p>
                </div>

                {/* Timeline */}
                <div className="space-y-0">
                  {STEPS.map((step, idx) => {
                    const done   = idx < currentIdx;
                    const active = idx === currentIdx;
                    const pend   = idx > currentIdx;
                    return (
                      <motion.div key={step.status} initial={{opacity:0,x:-20}} animate={{opacity:1,x:0}} transition={{delay:idx*0.08}}
                        className="flex items-start gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 transition-all ${
                            done ? "bg-green-100" : active ? "bg-primary-100 ring-4 ring-primary-50" : "bg-gray-100"}`}>
                            {done ? <RiCheckboxCircleLine className="text-green-500 text-xl"/> : active ? <span>{step.icon}</span> : <RiRadioButtonLine className="text-gray-300 text-xl"/>}
                          </div>
                          {idx < STEPS.length-1 && (
                            <div className={`w-0.5 h-8 mt-1 ${done ? "bg-green-300" : "bg-gray-100"}`}/>
                          )}
                        </div>
                        <div className={`pt-2 pb-2 ${pend ? "opacity-40" : ""}`}>
                          <p className={`font-semibold text-sm ${active?"text-primary-700":done?"text-green-700":"text-gray-400"}`}>{step.label}</p>
                          {(done || active) && <p className="text-xs text-gray-400 mt-0.5">{step.desc}</p>}
                          {active && (
                            <span className="inline-flex items-center gap-1 bg-primary-100 text-primary-700 text-xs px-2 py-0.5 rounded-full mt-1">
                              <span className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-pulse"/>
                              Estado actual
                            </span>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <Footer/>
    </main>
  );
}
