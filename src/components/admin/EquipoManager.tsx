"use client";
import { useState } from "react";
import { RiAddLine, RiDeleteBinLine, RiFlowerLine, RiTruckLine, RiShieldKeyholeLine,
         RiCloseLine, RiLoader4Line, RiExternalLinkLine, RiPencilLine, RiCheckLine } from "react-icons/ri";
import { toast } from "sonner";

const ROLES = [
  { value:"PREPARADOR", label:"Preparador", Icon:RiFlowerLine, color:"text-amber-600 bg-amber-50 border-amber-200" },
  { value:"REPARTIDOR", label:"Repartidor", Icon:RiTruckLine,  color:"text-blue-600 bg-blue-50 border-blue-200"  },
];

type Member = { id:string; name:string; role:string; pin:string | null; email:string };

export default function EquipoManager({ members: init }: { members: Member[] }) {
  const [members,   setMembers]   = useState(init);
  const [showForm,  setShowForm]  = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [editing,   setEditing]   = useState<Member | null>(null);
  const [editForm,  setEditForm]  = useState({ name:"", pin:"", pinDigits:["","","",""] });
  const [form,      setForm]      = useState({ name:"", role:"PREPARADOR", pin:"" });
  const [pinDigits, setPinDigits] = useState(["","","",""]);

  /* ── PIN input helpers ── */
  const handlePinDigit = (i: number, v: string, digits: string[], setDigits: (d:string[])=>void, setPinVal: (p:string)=>void) => {
    if (!/^\d?$/.test(v)) return;
    const next = [...digits]; next[i] = v;
    setDigits(next);
    setPinVal(next.join(""));
    if (v && i < 3) document.getElementById(`pin-${i+1}`)?.focus();
  };
  const handlePinKey = (e: React.KeyboardEvent, i: number, digits: string[], prefix = "pin") => {
    if (e.key === "Backspace" && !digits[i] && i > 0) document.getElementById(`${prefix}-${i-1}`)?.focus();
  };

  /* ── Create ── */
  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Nombre requerido"); return; }
    if (form.pin.length !== 4) { toast.error("PIN de 4 dígitos requerido"); return; }
    setSaving(true);
    const res  = await fetch("/api/equipo", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(form) });
    const data = await res.json();
    if (!res.ok) { toast.error(data.error); setSaving(false); return; }
    setMembers(p => [data, ...p]);
    setShowForm(false);
    setForm({ name:"", role:"PREPARADOR", pin:"" });
    setPinDigits(["","","",""]);
    toast.success(`${data.name} agregado`);
    setSaving(false);
  };

  /* ── Edit ── */
  const openEdit = (m: Member) => {
    setEditing(m);
    setEditForm({ name: m.name, pin:"", pinDigits:["","","",""] });
  };

  const handleEdit = async () => {
    if (!editing) return;
    if (!editForm.name.trim()) { toast.error("Nombre requerido"); return; }
    if (editForm.pin && editForm.pin.length !== 4) { toast.error("PIN debe tener 4 dígitos"); return; }
    setSaving(true);
    const body: any = { name: editForm.name };
    if (editForm.pin.length === 4) body.pin = editForm.pin;
    const res  = await fetch(`/api/equipo/${editing.id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) { toast.error(data.error); setSaving(false); return; }
    setMembers(p => p.map(m => m.id === editing.id ? data : m));
    setEditing(null);
    toast.success("Actualizado");
    setSaving(false);
  };

  /* ── Delete ── */
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar a ${name}?`)) return;
    await fetch(`/api/equipo/${id}`, { method:"DELETE" });
    setMembers(p => p.filter(m => m.id !== id));
    toast.success("Eliminado");
  };

  return (
    <>
      {/* Operations link */}
      <div className="bg-primary-50 border border-primary-100 rounded-2xl p-4 mb-5 block space-y-2 md:space-y-0  md:flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-primary-800 text-sm">Vista de operaciones</p>
          <p className="text-xs text-primary-600 mt-0.5 truncate">Comparte este enlace con tu equipo</p>
        </div>
        <a href="/operaciones" target="_blank"
          className="flex-shrink-0 flex items-center gap-1.5 bg-primary-600 text-white px-3 py-2 rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors">
          <RiExternalLinkLine size={14}/> operaciones
        </a>
      </div>

      <button onClick={() => setShowForm(true)}
        className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white py-3.5 rounded-2xl text-sm font-semibold hover:bg-primary-700 transition-colors mb-5 active:scale-95">
        <RiAddLine size={18}/> Agregar miembro
      </button>

      {members.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 text-center py-16">
          <RiShieldKeyholeLine className="text-gray-200 mx-auto mb-3" size={48}/>
          <p className="text-gray-400 text-sm">Sin miembros de equipo aún</p>
        </div>
      ) : (
        <div className="space-y-3 md:space-y-0 gap-0 md:gap-3 md:grid md:grid-cols-3">
          {members.map(m => {
            const roleInfo = ROLES.find(r => r.value === m.role) || ROLES[0];
            return (
              <div key={m.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${roleInfo.color}`}>
                    <roleInfo.Icon size={11}/> {roleInfo.label}
                  </span>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(m)}
                      className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-colors">
                      <RiPencilLine size={15}/>
                    </button>
                    <button onClick={() => handleDelete(m.id, m.name)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                      <RiDeleteBinLine size={15}/>
                    </button>
                  </div>
                </div>
                <p className="font-bold text-gray-900 text-base">{m.name}</p>
                <div className="flex items-center gap-2 mt-2.5">
                  <div className="flex gap-1.5">
                    {(m.pin ?? "????" ).split("").map((d, i) => (
                      <span key={i} className="w-9 h-9 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-center font-mono font-bold text-gray-700 text-base">
                        {d}
                      </span>
                    ))}
                  </div>
                  <span className="text-xs text-gray-400">PIN</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── CREATE modal ── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-sm shadow-2xl p-6 pb-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-lg">Nuevo miembro</h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400">
                <RiCloseLine size={20}/>
              </button>
            </div>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre *</label>
                <input value={form.name} onChange={e => setForm(p=>({...p,name:e.target.value}))}
                  placeholder="Ej: Carlos" autoComplete="off"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-primary-400"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rol *</label>
                <div className="grid grid-cols-2 gap-3">
                  {ROLES.map(r => (
                    <button key={r.value} type="button" onClick={() => setForm(p=>({...p,role:r.value}))}
                      className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-semibold transition-all active:scale-95 ${
                        form.role === r.value ? "border-primary-500 bg-primary-50 text-primary-700" : "border-gray-200 text-gray-500"
                      }`}>
                      <r.Icon size={16}/> {r.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">PIN de 4 dígitos *</label>
                <div className="flex gap-3 justify-center">
                  {[0,1,2,3].map(i => (
                    <input key={i} id={`pin-${i}`} type="tel" inputMode="numeric" maxLength={1}
                      value={pinDigits[i]}
                      onChange={e => handlePinDigit(i, e.target.value, pinDigits, setPinDigits, v => setForm(p=>({...p,pin:v})))}
                      onKeyDown={e => handlePinKey(e, i, pinDigits)}
                      className="w-14 h-14 text-center text-2xl font-bold border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none transition-colors"/>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-200 text-gray-600 py-3.5 rounded-xl text-sm font-medium">Cancelar</button>
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 bg-primary-600 text-white py-3.5 rounded-xl text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95">
                  {saving ? <RiLoader4Line className="animate-spin" size={16}/> : <RiCheckLine size={16}/>}
                  {saving ? "Guardando..." : "Agregar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT modal ── */}
      {editing && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-sm shadow-2xl p-6 pb-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-lg">Editar miembro</h2>
              <button onClick={() => setEditing(null)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400">
                <RiCloseLine size={20}/>
              </button>
            </div>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre *</label>
                <input value={editForm.name} onChange={e => setEditForm(p=>({...p,name:e.target.value}))}
                  autoComplete="off"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-primary-400"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nuevo PIN <span className="text-gray-400 font-normal">(opcional)</span></label>
                <p className="text-xs text-gray-400 mb-3">Deja vacío para mantener el PIN actual</p>
                <div className="flex gap-3 justify-center">
                  {[0,1,2,3].map(i => (
                    <input key={i} id={`epin-${i}`} type="tel" inputMode="numeric" maxLength={1}
                      value={editForm.pinDigits[i]}
                      onChange={e => {
                        if (!/^\d?$/.test(e.target.value)) return;
                        const next = [...editForm.pinDigits]; next[i] = e.target.value;
                        setEditForm(p => ({...p, pinDigits: next, pin: next.join("")}));
                        if (e.target.value && i < 3) document.getElementById(`epin-${i+1}`)?.focus();
                      }}
                      onKeyDown={e => { if (e.key==="Backspace" && !editForm.pinDigits[i] && i>0) document.getElementById(`epin-${i-1}`)?.focus(); }}
                      className="w-14 h-14 text-center text-2xl font-bold border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none transition-colors"/>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => setEditing(null)} className="flex-1 border border-gray-200 text-gray-600 py-3.5 rounded-xl text-sm font-medium">Cancelar</button>
                <button onClick={handleEdit} disabled={saving}
                  className="flex-1 bg-primary-600 text-white py-3.5 rounded-xl text-sm font-semibold hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95">
                  {saving ? <RiLoader4Line className="animate-spin" size={16}/> : <RiCheckLine size={16}/>}
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