"use client";
import { useState } from "react";
import { RiArrowUpLine, RiArrowDownLine, RiMoneyDollarCircleLine, RiAddLine, RiLoader4Line } from "react-icons/ri";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";

export default function ContabilidadClient({ totalIncome, totalExpenses, profit, expenses: init }: {
  totalIncome: number; totalExpenses: number; profit: number; expenses: any[];
}) {
  const [expenses, setExpenses] = useState(init);
  const [form, setForm] = useState({ description:"", amount:"", category:"Flores" });
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.description || !form.amount) { toast.error("Completa todos los campos"); return; }
    setSaving(true);
    const res  = await fetch("/api/expenses", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({...form, amount: parseFloat(form.amount)}) });
    const saved = await res.json();
    setExpenses(p => [{ ...saved, date: saved.date || new Date().toISOString(), createdAt: saved.createdAt || new Date().toISOString() }, ...p]);
    setForm({ description:"", amount:"", category:"Flores" }); setShow(false); setSaving(false);
    toast.success("Egreso registrado");
  };

  const cards = [
    { label:"Ingresos del mes",  value: totalIncome,   icon: RiArrowUpLine,                color:"text-green-600", bg:"bg-green-50",  border:"border-green-100" },
    { label:"Egresos del mes",   value: totalExpenses,  icon: RiArrowDownLine,              color:"text-red-500",   bg:"bg-red-50",    border:"border-red-100" },
    { label:"Ganancia neta",     value: profit,         icon: RiMoneyDollarCircleLine,      color: profit>=0?"text-primary-600":"text-red-600", bg: profit>=0?"bg-primary-50":"bg-red-50", border: profit>=0?"border-primary-100":"border-red-100" },
  ];

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {cards.map(c => (
          <div key={c.label} className={`bg-white rounded-2xl p-5 border ${c.border} shadow-sm`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${c.bg} ${c.color}`}>
              <c.icon className="text-xl"/>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatPrice(c.value)}</p>
            <p className="text-sm text-gray-500 mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
          <h2 className="font-semibold text-gray-900">Egresos del mes</h2>
          <button onClick={() => setShow(!show)} className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors">
            <RiAddLine size={14}/> Registrar egreso
          </button>
        </div>

        {show && (
          <div className="p-5 bg-gray-50 border-b flex flex-wrap gap-3">
            <input value={form.description} onChange={e => setForm(p=>({...p,description:e.target.value}))} placeholder="Descripción" className="flex-1 min-w-[160px] border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary-400"/>
            <input value={form.amount} onChange={e => setForm(p=>({...p,amount:e.target.value}))} type="number" placeholder="Monto (COP)" className="w-40 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary-400"/>
            <select value={form.category} onChange={e => setForm(p=>({...p,category:e.target.value}))} className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-primary-400">
              {["Flores","Transporte","Decoración","Empaque","Personal","Otro"].map(c=><option key={c}>{c}</option>)}
            </select>
            <button onClick={handleSave} disabled={saving} className="bg-primary-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 flex items-center gap-2 hover:bg-primary-700 transition-colors">
              {saving ? <RiLoader4Line className="animate-spin"/> : null} Guardar
            </button>
          </div>
        )}

        <div className="divide-y divide-gray-50">
          {expenses.length === 0 ? (
            <p className="text-center py-10 text-gray-400 text-sm">No hay egresos este mes</p>
          ) : expenses.map((e: any) => (
            <div key={e.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex-1">
                <p className="font-medium text-sm text-gray-900">{e.description}</p>
                <p className="text-xs text-gray-400">{e.category} · {new Date(e.date).toLocaleDateString("es-CO")}</p>
              </div>
              <span className="font-bold text-red-500">{formatPrice(e.amount)}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
