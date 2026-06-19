"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import {
  RiAddLine,
  RiBankCardLine,
  RiDeleteBinLine,
  RiEditLine,
  RiInformationLine,
  RiLockLine,
  RiLoader4Line,
  RiMailLine,
  RiMore2Line,
  RiQrCodeLine,
  RiSaveLine,
  RiSettings3Line,
  RiShieldCheckLine,
  RiTruckLine,
  RiUserLine,
} from "react-icons/ri";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import ResponsiveModal from "@/components/ui/ResponsiveModal";
import { formatPrice } from "@/lib/utils";

type PaymentMethod = {
  id: string;
  title: string;
  provider?: string | null;
  visibleLabel?: string | null;
  type: "QR" | "BANK_ACCOUNT" | "INSTRUCTIONS";
  details?: string | null;
  accountNumber?: string | null;
  imageUrl?: string | null;
  isActive: boolean;
  sortOrder: number;
};

type MethodDraft = {
  id?: string;
  provider: string;
  visibleLabel: string;
  type: PaymentMethod["type"];
  details: string;
  accountNumber: string;
  imageUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  file: File | null;
  preview: string | null;
};

const emptyMethod = (type: PaymentMethod["type"], sortOrder: number): MethodDraft => ({
  provider: "",
  visibleLabel: "",
  type,
  details: "",
  accountNumber: "",
  imageUrl: null,
  isActive: true,
  sortOrder,
  file: null,
  preview: null,
});

const methodToDraft = (method: PaymentMethod): MethodDraft => ({
  id: method.id,
  provider: method.provider || method.title,
  visibleLabel: method.visibleLabel || "",
  type: method.type,
  details: method.details || "",
  accountNumber: method.accountNumber || "",
  imageUrl: method.imageUrl || null,
  isActive: method.isActive,
  sortOrder: method.sortOrder,
  file: null,
  preview: method.imageUrl || null,
});

function providerStyle(provider: string) {
  const value = provider.toLowerCase();
  if (value.includes("nequi")) return "bg-[#26002f] text-white";
  if (value.includes("daviplata")) return "bg-red-500 text-white";
  if (value.includes("bancolombia")) return "bg-yellow-300 text-slate-950";
  return "bg-primary-500 text-white";
}

export default function AjustesClient({
  initialMethods,
  initialDeliveryFee,
  initialLoginEmail,
}: {
  initialMethods: PaymentMethod[];
  initialDeliveryFee: number;
  initialLoginEmail: string;
}) {
  const router = useRouter();
  const [methods, setMethods] = useState(initialMethods);
  const [deliveryFee, setDeliveryFee] = useState(initialDeliveryFee);
  const [savedDeliveryFee, setSavedDeliveryFee] = useState(initialDeliveryFee);
  const [savingDeliveryFee, setSavingDeliveryFee] = useState(false);
  const [savingCredentials, setSavingCredentials] = useState(false);
  const [savingMethod, setSavingMethod] = useState(false);
  const [methodModal, setMethodModal] = useState<MethodDraft | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PaymentMethod | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [newEmail, setNewEmail] = useState(initialLoginEmail);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const activeMethods = methods.filter(method => method.isActive).length;

  const saveDeliveryFee = async () => {
    setSavingDeliveryFee(true);
    try {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliveryFee }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo guardar el domicilio");
      const saved = Number(data.deliveryFee) || deliveryFee;
      setDeliveryFee(saved);
      setSavedDeliveryFee(saved);
      toast.success("Costo de domicilio actualizado");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar el domicilio");
    } finally {
      setSavingDeliveryFee(false);
    }
  };

  const saveCredentials = async () => {
    if (!newEmail || !currentPassword || !newPassword || !confirmPassword) {
      toast.error("Completa todos los campos de acceso");
      return;
    }
    setSavingCredentials(true);
    try {
      const response = await fetch("/api/settings/login-credentials", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newEmail, currentPassword, newPassword, confirmPassword }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo actualizar el acceso");
      toast.success("Credenciales actualizadas");
      await signOut({ callbackUrl: "/auth/login" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo actualizar el acceso");
    } finally {
      setSavingCredentials(false);
    }
  };

  const openNewMethod = (type: PaymentMethod["type"]) => {
    const nextOrder = Math.max(0, ...methods.map(method => method.sortOrder)) + 1;
    setMethodModal(emptyMethod(type, nextOrder));
  };

  const savePaymentMethod = async () => {
    if (!methodModal) return;
    if (!methodModal.provider.trim()) {
      toast.error("Indica el proveedor del método");
      return;
    }
    if (methodModal.type === "QR" && !methodModal.preview) {
      toast.error("Agrega una imagen QR");
      return;
    }
    if (methodModal.type === "BANK_ACCOUNT" && !methodModal.accountNumber.trim()) {
      toast.error("Indica el número o identificador de la cuenta");
      return;
    }

    setSavingMethod(true);
    try {
      const body = new FormData();
      body.set("title", methodModal.provider.trim());
      body.set("provider", methodModal.provider.trim());
      body.set("visibleLabel", methodModal.visibleLabel.trim());
      body.set("type", methodModal.type);
      body.set("details", methodModal.details.trim());
      body.set("accountNumber", methodModal.accountNumber.trim());
      body.set("isActive", String(methodModal.isActive));
      body.set("sortOrder", String(methodModal.sortOrder));
      if (methodModal.file) body.set("file", methodModal.file);

      const response = await fetch(
        methodModal.id ? `/api/payment-methods/${methodModal.id}` : "/api/payment-methods",
        { method: methodModal.id ? "PATCH" : "POST", body }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo guardar el método");

      setMethods(current => {
        const exists = current.some(method => method.id === data.id);
        const next = exists
          ? current.map(method => method.id === data.id ? data : method)
          : [...current, data];
        return next.sort((a, b) => a.sortOrder - b.sortOrder);
      });
      toast.success(methodModal.id ? "Método actualizado" : "Método agregado");
      setMethodModal(null);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar el método");
    } finally {
      setSavingMethod(false);
    }
  };

  const deleteMethod = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/payment-methods/${deleteTarget.id}`, { method: "DELETE" });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || "No se pudo eliminar el método");
      setMethods(current => current.filter(method => method.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.success("Método eliminado");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo eliminar el método");
    } finally {
      setDeleting(false);
    }
  };

  const handleQr = (file?: File) => {
    if (!file || !methodModal) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Selecciona una imagen válida");
      return;
    }
    setMethodModal({ ...methodModal, file, preview: URL.createObjectURL(file) });
  };

  const cards = [
    {
      label: "Métodos de pago",
      value: String(activeMethods),
      detail: "Activos",
      Icon: RiShieldCheckLine,
      color: "bg-primary-50 text-primary-500",
    },
    {
      label: "Costo de domicilio",
      value: formatPrice(savedDeliveryFee),
      detail: "COP",
      Icon: RiTruckLine,
      color: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Cuenta administradora",
      value: initialLoginEmail,
      detail: "Cuenta activa",
      Icon: RiUserLine,
      color: "bg-violet-50 text-violet-600",
    },
  ];

  return (
    <div className="min-h-full bg-slate-50/70 p-3 sm:p-5 lg:p-7">
      <div className="mx-auto max-w-[1500px] space-y-5">
        <header>
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary-50 text-primary-500">
              <RiSettings3Line size={23} />
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Ajustes</h1>
              <p className="mt-1 text-sm text-slate-500">Métodos de pago y configuración activa del checkout.</p>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {cards.map(card => (
            <article key={card.label} className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex items-center gap-4">
                <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-full ${card.color}`}>
                  <card.Icon size={22} />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-500">{card.label}</p>
                  <strong className="mt-1 block truncate text-lg font-bold text-slate-950 sm:text-xl" title={card.value}>
                    {card.value}
                  </strong>
                  <p className="mt-1 text-xs text-slate-500">{card.detail}</p>
                </div>
              </div>
            </article>
          ))}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div className="flex gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary-50 text-primary-500">
                <RiLockLine size={20} />
              </span>
              <div>
                <h2 className="font-bold text-slate-950">Credenciales de acceso</h2>
                <p className="mt-1 text-xs text-slate-500">Actualiza el correo y la contraseña que usas para entrar al panel.</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Correo actual" icon={<RiMailLine />} value={initialLoginEmail} readOnly />
            <Field label="Nuevo correo" icon={<RiMailLine />} value={newEmail} onChange={setNewEmail} type="email" />
            <Field label="Contraseña actual" icon={<RiLockLine />} value={currentPassword} onChange={setCurrentPassword} type="password" placeholder="Ingresa tu contraseña actual" />
            <Field label="Nueva contraseña" icon={<RiLockLine />} value={newPassword} onChange={setNewPassword} type="password" placeholder="Mínimo 6 caracteres" />
            <Field label="Confirmar contraseña" icon={<RiLockLine />} value={confirmPassword} onChange={setConfirmPassword} type="password" placeholder="Repite la nueva contraseña" />
          </div>

          <div className="mt-5 flex flex-col gap-4 rounded-xl bg-gradient-to-r from-primary-50 to-rose-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary-400 text-white">
                <RiLockLine />
              </span>
              <div>
                <p className="text-sm font-semibold text-primary-600">Tu información está segura</p>
                <p className="mt-0.5 text-xs text-primary-800/70">Usamos encriptación de nivel bancario para proteger tus datos.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={saveCredentials}
              disabled={savingCredentials}
              className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-primary-200 bg-white px-4 text-xs font-semibold text-primary-600 disabled:opacity-60"
            >
              {savingCredentials ? <RiLoader4Line className="animate-spin" /> : <RiEditLine />}
              {savingCredentials ? "Actualizando..." : "Actualizar acceso"}
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                <RiTruckLine size={20} />
              </span>
              <div>
                <h2 className="font-bold text-slate-950">Costo de domicilio</h2>
                <p className="mt-1 text-xs text-slate-500">Este valor se mostrará en checkout, carrito y pedidos creados manualmente.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={saveDeliveryFee}
              disabled={savingDeliveryFee}
              className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary-500 px-4 text-xs font-semibold text-white transition hover:bg-primary-600 disabled:opacity-60"
            >
              {savingDeliveryFee ? <RiLoader4Line className="animate-spin" /> : <RiSaveLine />}
              {savingDeliveryFee ? "Guardando..." : "Guardar domicilio"}
            </button>
          </div>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-slate-600">Valor del domicilio (COP)</span>
            <input
              type="number"
              min={0}
              value={deliveryFee}
              onChange={event => setDeliveryFee(Number(event.target.value) || 0)}
              className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm text-slate-900 outline-none transition focus:border-primary-300 focus:ring-2 focus:ring-primary-50"
            />
          </label>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-violet-50 text-violet-600">
                <RiBankCardLine size={20} />
              </span>
              <div>
                <h2 className="font-bold text-slate-950">Métodos de pago</h2>
                <p className="mt-1 text-xs text-slate-500">Cuentas o identificadores disponibles para transferencias.</p>
              </div>
            </div>
            <div className="flex flex-col gap-2 xs:flex-row sm:flex-row">
              <button
                type="button"
                onClick={() => openNewMethod("QR")}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-xs font-semibold text-slate-700 transition hover:border-primary-200 hover:text-primary-500"
              >
                <RiQrCodeLine size={16} />
                Agregar QR
              </button>
              <button
                type="button"
                onClick={() => openNewMethod("BANK_ACCOUNT")}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary-500 px-4 text-xs font-semibold text-white transition hover:bg-primary-600"
              >
                <RiAddLine size={16} />
                Agregar cuenta
              </button>
            </div>
          </div>

          {methods.length ? (
            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {methods.map(method => (
                <article key={method.id} className="flex min-h-64 flex-col rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <span className={`inline-flex min-h-8 items-center rounded-lg px-3 text-xs font-bold ${providerStyle(method.provider || method.title)}`}>
                      {method.provider || method.title}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-lg px-2.5 py-1 text-[10px] font-semibold ${method.isActive ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>
                        {method.isActive ? "Activo" : "Inactivo"}
                      </span>
                      <RiMore2Line className="text-slate-500" />
                    </div>
                  </div>

                  <h3 className="mt-4 text-sm font-bold text-slate-950">{method.visibleLabel || method.provider || method.title}</h3>
                  {method.details && <p className="mt-1 line-clamp-2 text-xs text-slate-500">{method.details}</p>}
                  {method.accountNumber && <p className="mt-1 text-sm text-slate-600">{method.accountNumber}</p>}
                  {method.imageUrl && (
                    <div className="mt-3 flex items-end gap-3">
                      <img src={method.imageUrl} alt={`QR ${method.provider || method.title}`} className="h-20 w-20 rounded-lg border border-slate-200 object-contain" />
                      <span className="pb-1 text-[10px] text-slate-500">QR para recibir pagos</span>
                    </div>
                  )}

                  <div className="mt-auto flex gap-2 pt-4">
                    <button
                      type="button"
                      onClick={() => setMethodModal(methodToDraft(method))}
                      className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 transition hover:border-primary-200 hover:text-primary-500"
                    >
                      <RiEditLine />
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(method)}
                      className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-red-100 text-xs font-semibold text-red-500 transition hover:bg-red-50"
                    >
                      <RiDeleteBinLine />
                      Eliminar
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-400">
              No hay métodos de pago configurados.
            </div>
          )}

          <button
            type="button"
            onClick={() => openNewMethod("QR")}
            className="mt-4 flex w-full items-center justify-center gap-3 rounded-2xl border border-dashed border-primary-300 bg-primary-50/40 px-4 py-5 text-left text-primary-500 transition hover:bg-primary-50"
          >
            <span className="grid h-8 w-8 place-items-center rounded-full border border-primary-400">
              <RiAddLine />
            </span>
            <span>
              <strong className="block text-xs">Agregar nuevo método de pago</strong>
              <span className="mt-0.5 block text-[10px] text-slate-500">QR o cuenta bancaria para transferencias</span>
            </span>
          </button>

          <div className="mt-5 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
            <RiInformationLine className="mt-0.5 shrink-0 text-blue-600" size={21} />
            <div>
              <p className="text-xs font-semibold text-blue-600">Información importante</p>
              <p className="mt-1 text-[11px] leading-5 text-slate-500">
                Los métodos de pago estarán disponibles en el checkout y para pedidos manuales. Mantén sus datos actualizados.
              </p>
            </div>
          </div>
        </section>
      </div>

      <ResponsiveModal
        open={!!methodModal}
        onClose={() => !savingMethod && setMethodModal(null)}
        title={methodModal?.id ? "Editar método de pago" : "Agregar método de pago"}
        description="Configura la información que verá el cliente al realizar una transferencia."
        panelClassName="sm:max-w-2xl"
      >
        {methodModal && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <SimpleInput label="Proveedor" value={methodModal.provider} onChange={provider => setMethodModal({ ...methodModal, provider })} placeholder="Nequi, Bancolombia..." />
              <SimpleInput label="Etiqueta visible" value={methodModal.visibleLabel} onChange={visibleLabel => setMethodModal({ ...methodModal, visibleLabel })} placeholder="Cuenta de ahorros, Daniel..." />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setMethodModal({ ...methodModal, type: "QR" })} className={`rounded-xl border-2 py-3 text-xs font-semibold ${methodModal.type === "QR" ? "border-primary-500 bg-primary-50 text-primary-600" : "border-slate-200 text-slate-500"}`}>
                Código QR
              </button>
              <button type="button" onClick={() => setMethodModal({ ...methodModal, type: "BANK_ACCOUNT" })} className={`rounded-xl border-2 py-3 text-xs font-semibold ${methodModal.type === "BANK_ACCOUNT" ? "border-primary-500 bg-primary-50 text-primary-600" : "border-slate-200 text-slate-500"}`}>
                Cuenta bancaria
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {methodModal.type === "QR" ? (
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-slate-700">Imagen QR</span>
                  <input id="payment-qr" type="file" accept="image/*" onChange={event => handleQr(event.target.files?.[0])} className="hidden" />
                  <span className="grid min-h-40 cursor-pointer place-items-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50" onClick={() => document.getElementById("payment-qr")?.click()}>
                    {methodModal.preview ? <img src={methodModal.preview} alt="Vista previa QR" className="max-h-36 object-contain" /> : <span className="text-center text-slate-400"><RiQrCodeLine className="mx-auto mb-2" size={32} />Subir QR</span>}
                  </span>
                </label>
              ) : (
                <SimpleInput label="Número o identificador" value={methodModal.accountNumber} onChange={accountNumber => setMethodModal({ ...methodModal, accountNumber })} placeholder="3001234567 o número de cuenta" />
              )}
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-slate-700">Notas o instrucciones</span>
                <textarea value={methodModal.details} onChange={event => setMethodModal({ ...methodModal, details: event.target.value })} className="min-h-40 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-primary-300" placeholder="Información visible para el cliente" />
              </label>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={methodModal.isActive} onChange={event => setMethodModal({ ...methodModal, isActive: event.target.checked })} className="rounded border-slate-300 text-primary-500" />
                Método activo
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-600">
                Orden
                <input type="number" min={1} value={methodModal.sortOrder} onChange={event => setMethodModal({ ...methodModal, sortOrder: Number(event.target.value) || 1 })} className="h-9 w-20 rounded-lg border border-slate-200 px-3" />
              </label>
            </div>

            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setMethodModal(null)} disabled={savingMethod} className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-600">Cancelar</button>
              <button type="button" onClick={savePaymentMethod} disabled={savingMethod} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary-500 px-5 text-sm font-semibold text-white disabled:opacity-60">
                {savingMethod ? <RiLoader4Line className="animate-spin" /> : <RiSaveLine />}
                {savingMethod ? "Guardando..." : "Guardar método"}
              </button>
            </div>
          </div>
        )}
      </ResponsiveModal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Eliminar método de pago"
        message={`Vas a eliminar ${deleteTarget?.provider || deleteTarget?.title || "este método"}. Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        loading={deleting}
        onClose={() => !deleting && setDeleteTarget(null)}
        onConfirm={deleteMethod}
      />
    </div>
  );
}

function Field({
  label,
  icon,
  value,
  onChange,
  type = "text",
  placeholder,
  readOnly,
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange?: (value: string) => void;
  type?: string;
  placeholder?: string;
  readOnly?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-slate-600">{label}</span>
      <span className="relative block">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>
        <input
          type={type}
          value={value}
          readOnly={readOnly}
          onChange={event => onChange?.(event.target.value)}
          placeholder={placeholder}
          className={`h-11 w-full rounded-xl border border-slate-200 pl-11 pr-4 text-sm text-slate-800 outline-none transition focus:border-primary-300 focus:ring-2 focus:ring-primary-50 ${readOnly ? "bg-slate-50" : "bg-white"}`}
        />
      </span>
    </label>
  );
}

function SimpleInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-slate-700">{label}</span>
      <input value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-50" />
    </label>
  );
}
