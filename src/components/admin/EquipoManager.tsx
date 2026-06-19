"use client";

import { useMemo, useState } from "react";
import {
  RiAddLine,
  RiCalendarLine,
  RiCheckLine,
  RiDeleteBinLine,
  RiEditLine,
  RiExternalLinkLine,
  RiFileCopyLine,
  RiFilter3Line,
  RiFlowerLine,
  RiKeyLine,
  RiLink,
  RiLoader4Line,
  RiRunLine,
  RiSearchLine,
  RiShieldCheckLine,
  RiTeamLine,
  RiTimeLine,
  RiTruckLine,
  RiUserAddLine,
} from "react-icons/ri";
import { toast } from "sonner";
import ResponsiveModal from "@/components/ui/ResponsiveModal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

const ROLES = [
  {
    value: "PREPARADOR",
    label: "Preparador",
    Icon: RiFlowerLine,
    badge: "bg-amber-50 text-amber-600",
  },
  {
    value: "REPARTIDOR",
    label: "Repartidor",
    Icon: RiTruckLine,
    badge: "bg-blue-50 text-blue-600",
  },
  {
    value: "CORREDOR",
    label: "Corredor",
    Icon: RiRunLine,
    badge: "bg-emerald-50 text-emerald-600",
  },
] as const;

type Member = {
  id: string;
  name: string;
  role: string;
  pin: string | null;
  email: string;
  createdAt: string;
};

type LastAccess = {
  at: string;
  id?: string;
  name: string;
  role: string;
} | null;

type FormState = {
  name: string;
  role: string;
  pin: string;
};

const emptyForm: FormState = { name: "", role: "PREPARADOR", pin: "" };

function getRole(role: string) {
  return ROLES.find(item => item.value === role) || ROLES[0];
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatLastAccess(value: string) {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  const prefix = sameDay(date, today) ? "Hoy" : sameDay(date, yesterday) ? "Ayer" : new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "short",
  }).format(date);
  return `${prefix}, ${new Intl.DateTimeFormat("es-CO", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date)}`;
}

function PinInputs({
  value,
  onChange,
  prefix,
}: {
  value: string;
  onChange: (value: string) => void;
  prefix: string;
}) {
  const digits = Array.from({ length: 4 }, (_, index) => value[index] || "");

  const setDigit = (index: number, digit: string) => {
    if (!/^\d?$/.test(digit)) return;
    const next = [...digits];
    next[index] = digit;
    onChange(next.join(""));
    if (digit && index < 3) document.getElementById(`${prefix}-${index + 1}`)?.focus();
  };

  return (
    <div
      className="flex justify-center gap-2 sm:gap-3"
      onPaste={event => {
        const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
        if (!pasted) return;
        event.preventDefault();
        onChange(pasted);
        document.getElementById(`${prefix}-${Math.min(pasted.length, 4) - 1}`)?.focus();
      }}
    >
      {digits.map((digit, index) => (
        <input
          key={index}
          id={`${prefix}-${index}`}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={event => setDigit(index, event.target.value)}
          onKeyDown={event => {
            if (event.key === "Backspace" && !digit && index > 0) {
              document.getElementById(`${prefix}-${index - 1}`)?.focus();
            }
          }}
          className="h-12 w-12 rounded-xl border-2 border-slate-200 text-center text-xl font-bold text-slate-900 outline-none transition focus:border-primary-500 sm:h-14 sm:w-14"
          aria-label={`Digito ${index + 1} del PIN`}
        />
      ))}
    </div>
  );
}

export default function EquipoManager({
  members: initialMembers,
  lastAccess,
}: {
  members: Member[];
  lastAccess: LastAccess;
}) {
  const [members, setMembers] = useState(initialMembers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Member | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filteredMembers = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("es");
    return members.filter(member => {
      const matchesRole = !roleFilter || member.role === roleFilter;
      const matchesSearch = !query || member.name.toLocaleLowerCase("es").includes(query);
      return matchesRole && matchesSearch;
    });
  }, [members, roleFilter, search]);

  const activePins = members.filter(member => /^\d{4}$/.test(member.pin || "")).length;

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (member: Member) => {
    setEditing(member);
    setForm({ name: member.name, role: member.role, pin: "" });
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditing(null);
    setForm(emptyForm);
  };

  const saveMember = async () => {
    if (!form.name.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    if (!editing && form.pin.length !== 4) {
      toast.error("Ingresa un PIN de 4 dígitos");
      return;
    }
    if (editing && form.pin && form.pin.length !== 4) {
      toast.error("El nuevo PIN debe tener 4 dígitos");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(editing ? `/api/equipo/${editing.id}` : "/api/equipo", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          role: form.role,
          pin: form.pin || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No fue posible guardar el miembro");

      if (editing) {
        setMembers(current => current.map(member => member.id === editing.id ? data : member));
        toast.success("Miembro actualizado");
      } else {
        setMembers(current => [data, ...current]);
        toast.success(`${data.name} fue agregado al equipo`);
      }
      setModalOpen(false);
      setEditing(null);
      setForm(emptyForm);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No fue posible guardar el miembro");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/equipo/${deleteTarget.id}`, { method: "DELETE" });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "No fue posible eliminar el miembro");
      }
      setMembers(current => current.filter(member => member.id !== deleteTarget.id));
      toast.success("Miembro eliminado");
      setDeleteTarget(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No fue posible eliminar el miembro");
    } finally {
      setDeleting(false);
    }
  };

  const copyOperationsLink = async () => {
    const url = `${window.location.origin}/operaciones`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Enlace de operaciones copiado");
    } catch {
      toast.error("No fue posible copiar el enlace");
    }
  };

  const summaryCards = [
    {
      label: "Total miembros",
      value: String(members.length),
      detail: "Activos en el equipo",
      Icon: RiTeamLine,
      color: "bg-primary-50 text-primary-500",
    },
    {
      label: "Con acceso",
      value: String(activePins),
      detail: "Acceden a /operaciones",
      Icon: RiShieldCheckLine,
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "PIN activos",
      value: String(activePins),
      detail: "Credenciales asignadas",
      Icon: RiKeyLine,
      color: "bg-violet-50 text-violet-600",
    },
    {
      label: "Último acceso",
      value: lastAccess ? formatLastAccess(lastAccess.at) : "Sin registros",
      detail: lastAccess ? `Por ${lastAccess.name} (${getRole(lastAccess.role).label})` : "Aún no han ingresado",
      Icon: RiTimeLine,
      color: "bg-amber-50 text-amber-500",
    },
  ];

  return (
    <div className="min-h-full bg-slate-50/70 p-3 sm:p-5 lg:p-7">
      <div className="mx-auto max-w-[1500px] space-y-5">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary-50 text-primary-500">
              <RiTeamLine size={25} />
            </span>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Equipo</h1>
              <p className="mt-1 text-sm text-slate-500">
                Gestiona preparadores, repartidores y corredores. Acceden con PIN en{" "}
                <span className="font-semibold text-primary-500">/operaciones</span>
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <a
              href="/operaciones"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-primary-200 hover:text-primary-500"
            >
              <RiExternalLinkLine className="text-primary-500" size={18} />
              Operaciones
            </a>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary-500 px-5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(236,18,91,.2)] transition hover:bg-primary-600"
            >
              <RiAddLine size={19} />
              Agregar miembro
            </button>
          </div>
        </header>

        <section className="flex flex-col gap-4 rounded-2xl border border-primary-100 bg-gradient-to-r from-primary-50/90 to-rose-50/70 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex min-w-0 items-center gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-white text-primary-500 shadow-sm">
              <RiLink size={25} />
            </span>
            <div>
              <h2 className="font-bold text-primary-700">Vista de operaciones</h2>
              <p className="mt-1 text-sm text-primary-800/80">
                Comparte este enlace con tu equipo para que accedan al sistema con su PIN.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={copyOperationsLink}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-primary-400 bg-white px-5 text-sm font-semibold text-primary-600 transition hover:bg-primary-500 hover:text-white"
          >
            <RiFileCopyLine size={17} />
            Copiar enlace
          </button>
        </section>

        <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {summaryCards.map(card => (
            <article key={card.label} className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${card.color}`}>
                  <card.Icon size={21} />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-500">{card.label}</p>
                  <strong className="mt-1 block truncate text-lg font-bold text-slate-950 sm:text-xl" title={card.value}>
                    {card.value}
                  </strong>
                  <p className="mt-1 line-clamp-2 text-[11px] text-slate-500">{card.detail}</p>
                </div>
              </div>
            </article>
          ))}
        </section>

        <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm md:grid-cols-[minmax(0,1fr)_260px]">
          <label className="flex h-11 items-center gap-3 rounded-xl border border-slate-200 px-4 focus-within:border-primary-300 focus-within:ring-2 focus-within:ring-primary-50">
            <RiSearchLine className="shrink-0 text-slate-400" size={19} />
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
              placeholder="Buscar miembro..."
            />
          </label>
          <label className="relative flex h-11 items-center gap-3 rounded-xl border border-slate-200 px-4">
            <RiFilter3Line className="shrink-0 text-slate-500" size={18} />
            <select
              value={roleFilter}
              onChange={event => setRoleFilter(event.target.value)}
              className="min-w-0 flex-1 appearance-none bg-transparent pr-6 text-sm font-medium text-slate-700 outline-none"
            >
              <option value="">Todos los roles</option>
              {ROLES.map(role => <option key={role.value} value={role.value}>{role.label}</option>)}
            </select>
          </label>
        </section>

        {filteredMembers.length ? (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredMembers.map(member => {
              const role = getRole(member.role);
              return (
                <article key={member.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <span className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold ${role.badge}`}>
                      <role.Icon size={15} />
                      {role.label}
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(member)}
                        className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-primary-200 hover:text-primary-500"
                        aria-label={`Editar ${member.name}`}
                      >
                        <RiEditLine size={17} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(member)}
                        className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-primary-500 transition hover:border-red-200 hover:bg-red-50"
                        aria-label={`Eliminar ${member.name}`}
                      >
                        <RiDeleteBinLine size={17} />
                      </button>
                    </div>
                  </div>

                  <h3 className="mt-4 truncate text-xl font-bold text-slate-950">{member.name}</h3>
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex gap-1.5">
                      {(member.pin || "----").split("").map((digit, index) => (
                        <span
                          key={index}
                          className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-slate-50 font-mono text-base font-bold text-slate-800"
                        >
                          {digit}
                        </span>
                      ))}
                    </div>
                    <span className="text-xs font-medium text-slate-400">PIN</span>
                  </div>

                  <div className="mt-5 space-y-2.5 border-t border-slate-100 pt-4">
                    <p className="flex items-center gap-2 text-xs text-slate-500">
                      <RiCalendarLine size={16} />
                      Creado: {formatDate(member.createdAt)}
                    </p>
                    <p className="flex items-center gap-2 text-xs text-slate-500">
                      <RiTimeLine size={16} />
                      Último acceso: {lastAccess?.id === member.id ? formatLastAccess(lastAccess.at) : "Sin registro"}
                    </p>
                    <p className="flex items-center gap-2 text-xs font-semibold text-emerald-600">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                      Activo
                    </p>
                  </div>
                </article>
              );
            })}
          </section>
        ) : (
          <section className="grid min-h-56 place-items-center rounded-2xl border border-slate-200 bg-white px-5 py-10 text-center shadow-sm">
            <div>
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-slate-50 text-slate-400">
                <RiTeamLine size={25} />
              </span>
              <h2 className="mt-4 font-semibold text-slate-900">No encontramos miembros</h2>
              <p className="mt-1 text-sm text-slate-500">
                {members.length ? "Prueba con otra búsqueda o rol." : "Agrega el primer miembro de tu equipo."}
              </p>
            </div>
          </section>
        )}

        <section className="flex items-start gap-4 rounded-2xl border border-blue-100 bg-blue-50/60 p-4 sm:items-center sm:p-5">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-blue-100 bg-white text-blue-600">
            <RiShieldCheckLine size={22} />
          </span>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Seguridad del equipo</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
              Comparte los PIN únicamente con personas de confianza. Puedes editar o eliminar miembros cuando lo necesites.
            </p>
          </div>
        </section>
      </div>

      <ResponsiveModal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? "Editar miembro" : "Agregar miembro"}
        description={editing ? "Actualiza el nombre, rol o asigna un nuevo PIN." : "Crea las credenciales para acceder a operaciones."}
        panelClassName="sm:max-w-lg"
      >
        <div className="space-y-5">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-700">Nombre</span>
            <input
              value={form.name}
              onChange={event => setForm(current => ({ ...current, name: event.target.value }))}
              className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-primary-300 focus:ring-2 focus:ring-primary-50"
              placeholder="Ej. Carlos"
              autoFocus
            />
          </label>

          <div>
            <span className="mb-2 block text-xs font-semibold text-slate-700">Rol</span>
            <div className="grid grid-cols-3 gap-2">
              {ROLES.map(role => (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => setForm(current => ({ ...current, role: role.value }))}
                  className={`flex min-w-0 flex-col items-center justify-center gap-1.5 rounded-xl border-2 px-1 py-3 text-[10px] font-semibold transition sm:text-xs ${
                    form.role === role.value
                      ? "border-primary-500 bg-primary-50 text-primary-700"
                      : "border-slate-200 text-slate-500 hover:border-primary-200"
                  }`}
                >
                  <role.Icon size={18} />
                  {role.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="mb-1 block text-xs font-semibold text-slate-700">
              {editing ? "Nuevo PIN (opcional)" : "PIN de 4 dígitos"}
            </span>
            {editing && <p className="mb-3 text-xs text-slate-400">Déjalo vacío para conservar el PIN actual.</p>}
            <PinInputs
              value={form.pin}
              onChange={pin => setForm(current => ({ ...current, pin }))}
              prefix={editing ? "edit-team-pin" : "new-team-pin"}
            />
          </div>

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={closeModal}
              disabled={saving}
              className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-600 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={saveMember}
              disabled={saving}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary-500 px-5 text-sm font-semibold text-white transition hover:bg-primary-600 disabled:opacity-60"
            >
              {saving ? <RiLoader4Line className="animate-spin" /> : editing ? <RiCheckLine /> : <RiUserAddLine />}
              {saving ? "Guardando..." : editing ? "Guardar cambios" : "Agregar miembro"}
            </button>
          </div>
        </div>
      </ResponsiveModal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Eliminar miembro"
        message={`Vas a eliminar a ${deleteTarget?.name || "este miembro"}. Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        loading={deleting}
        onClose={() => !deleting && setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
