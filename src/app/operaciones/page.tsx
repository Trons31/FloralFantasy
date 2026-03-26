"use client";
import { useState } from "react";
import { RiFlowerLine, RiTruckLine, RiLockLine, RiDeleteBinLine, RiRunLine } from "react-icons/ri";
import PreparadorView from "./PreparadorView";
import RepartidorView from "./RepartidorView";
import CorredorView from "./CorredorView";

export default function OperacionesPage() {
  const [pin,     setPin]     = useState("");
  const [user,    setUser]    = useState<{ id: string; name: string; role: string } | null>(null);
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const handlePin    = (digit: string) => { if (pin.length < 4) setPin(p => p + digit); };
  const handleDelete = () => setPin(p => p.slice(0, -1));

  const handleSubmit = async () => {
    if (pin.length !== 4) return;
    setLoading(true); setError("");
    const res  = await fetch("/api/operaciones", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pin }) });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setPin(""); setLoading(false); return; }
    setUser(data);
    setLoading(false);
  };

  if (user?.role === "PREPARADOR") return <PreparadorView user={user} onLogout={() => { setUser(null); setPin(""); }}/>;
  if (user?.role === "REPARTIDOR") return <RepartidorView user={user} onLogout={() => { setUser(null); setPin(""); }}/>;
  if (user?.role === "CORREDOR")   return <CorredorView   user={user} onLogout={() => { setUser(null); setPin(""); }}/>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-rose-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm p-8">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <RiFlowerLine className="text-primary-600" size={32}/>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Fantasía Floral</h1>
          <p className="text-sm text-gray-400 mt-1">Acceso de operaciones</p>
        </div>

        {/* Role hints */}
        <div className="flex gap-2 mb-6">
          <div className="flex-1 flex items-center gap-1.5 bg-amber-50 border border-amber-100 rounded-xl p-2.5">
            <RiFlowerLine className="text-amber-500 flex-shrink-0" size={16}/>
            <span className="text-xs text-amber-700 font-medium">Preparador</span>
          </div>
          <div className="flex-1 flex items-center gap-1.5 bg-blue-50 border border-blue-100 rounded-xl p-2.5">
            <RiTruckLine className="text-blue-500 flex-shrink-0" size={16}/>
            <span className="text-xs text-blue-700 font-medium">Repartidor</span>
          </div>
          <div className="flex-1 flex items-center gap-1.5 bg-green-50 border border-green-100 rounded-xl p-2.5">
            <RiRunLine className="text-green-500 flex-shrink-0" size={16}/>
            <span className="text-xs text-green-700 font-medium">Corredor</span>
          </div>
        </div>

        {/* PIN dots */}
        <div className="flex justify-center gap-4 mb-6">
          {[0,1,2,3].map(i => (
            <div key={i} className={`w-4 h-4 rounded-full transition-all duration-200 ${
              i < pin.length ? "bg-primary-600 scale-110" : "bg-gray-200"
            }`}/>
          ))}
        </div>

        {error && <p className="text-center text-red-500 text-sm mb-4">{error}</p>}

        {/* Numeric keypad */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[1,2,3,4,5,6,7,8,9].map(n => (
            <button key={n} onClick={() => handlePin(String(n))}
              className="h-14 rounded-2xl bg-gray-50 hover:bg-primary-50 hover:text-primary-700 font-bold text-xl text-gray-700 transition-all active:scale-95">
              {n}
            </button>
          ))}
          <button className="h-14 rounded-2xl bg-gray-50 text-gray-300 cursor-default"/>
          <button onClick={() => handlePin("0")}
            className="h-14 rounded-2xl bg-gray-50 hover:bg-primary-50 hover:text-primary-700 font-bold text-xl text-gray-700 transition-all active:scale-95">
            0
          </button>
          <button onClick={handleDelete}
            className="h-14 rounded-2xl bg-gray-50 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-all active:scale-95">
            <RiDeleteBinLine size={20}/>
          </button>
        </div>

        <button onClick={handleSubmit} disabled={pin.length !== 4 || loading}
          className="w-full py-3.5 bg-primary-600 text-white rounded-2xl font-semibold text-base hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2">
          <RiLockLine size={18}/>
          {loading ? "Verificando..." : "Ingresar"}
        </button>
      </div>
    </div>
  );
}