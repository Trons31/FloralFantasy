"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import type { IconType } from "react-icons";
import {
  FiArrowLeft,
  FiChevronRight,
  FiCreditCard,
  FiExternalLink,
  FiLock,
  FiMail,
  FiTruck,
} from "react-icons/fi";
import {
  RiAddLine,
  RiDeleteBinLine,
  RiEditLine,
  RiInformationLine,
  RiLockLine,
  RiLoader4Line,
  RiMailLine,
  RiQrCodeLine,
  RiSaveLine,
} from "react-icons/ri";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import ResponsiveModal from "@/components/ui/ResponsiveModal";
import BrandLogo, { BRAND_NAME } from "@/components/ui/BrandLogo";
import PaymentProviderLogo from "@/components/ui/PaymentProviderLogo";
import { formatPrice, formatTime12 } from "@/lib/utils";
import { PAYMENT_PROVIDERS, getPaymentProvider, uniqueProviders } from "@/lib/payment-providers";
import TimeInput12 from "@/components/ui/TimeInput12";

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
  /** Nombre canónico de `PAYMENT_PROVIDERS` o vacío. */
  provider: string;
  /** Proveedor escrito a mano antes de la spec 014 que no está en la lista. */
  legacyProvider: string;
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

const emptyMethod = (sortOrder: number): MethodDraft => ({
  provider: "",
  legacyProvider: "",
  visibleLabel: "",
  type: "BANK_ACCOUNT",
  details: "",
  accountNumber: "",
  imageUrl: null,
  isActive: true,
  sortOrder,
  file: null,
  preview: null,
});

const methodToDraft = (method: PaymentMethod): MethodDraft => {
  const original = method.provider || method.title;
  const match = getPaymentProvider(original);
  return {
    id: method.id,
    provider: match?.name || "",
    legacyProvider: match ? "" : original,
    visibleLabel: method.visibleLabel || "",
    type: method.type,
    details: method.details || "",
    accountNumber: method.accountNumber || "",
    imageUrl: method.imageUrl || null,
    isActive: method.isActive,
    sortOrder: method.sortOrder,
    file: null,
    preview: method.imageUrl || null,
  };
};

/** Las secciones de Ajustes: su fila en el índice y su cabecera al abrirla (como CliqCut). */
const SECTIONS = {
  entrega: {
    icon: FiTruck,
    title: "Entrega y domicilio",
    description: "Valor del domicilio y hasta qué hora se entrega el mismo día.",
  },
  pagos: {
    icon: FiCreditCard,
    title: "Métodos de pago",
    description: "Las cuentas y códigos QR que ve el cliente al pagar su pedido.",
  },
  acceso: {
    icon: FiLock,
    title: "Acceso al panel",
    description: "El correo y la contraseña con los que entras al panel.",
  },
} as const;

type SettingsSection = keyof typeof SECTIONS;

type HubRow = {
  key: string;
  icon: IconType;
  title: string;
  status: string;
  /** Apagada, la fila va en gris para ver de un vistazo qué está activo. */
  on?: boolean;
  /** Filas que llevan a otra página del panel en vez de abrir una sección. */
  href?: string;
};

const inputCls =
  "h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-brand-300 focus:bg-white focus:ring-4 focus:ring-brand-100";
const labelCls = "mb-1.5 block text-sm font-bold text-gray-700";

export default function AjustesClient({
  initialMethods,
  initialDeliveryFee,
  initialSameDayCutoffTime,
  initialLoginEmail,
  activeCardOptions,
}: {
  initialMethods: PaymentMethod[];
  initialDeliveryFee: number;
  initialSameDayCutoffTime: string;
  initialLoginEmail: string;
  activeCardOptions: number;
}) {
  const router = useRouter();
  const [methods, setMethods] = useState(initialMethods);
  const [deliveryFee, setDeliveryFee] = useState(initialDeliveryFee);
  const [savedDeliveryFee, setSavedDeliveryFee] = useState(initialDeliveryFee);
  const [sameDayCutoffTime, setSameDayCutoffTime] = useState(initialSameDayCutoffTime);
  const [savedSameDayCutoffTime, setSavedSameDayCutoffTime] = useState(initialSameDayCutoffTime);
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

  // La sección abierta vive en la URL (`?seccion=pagos`), como en CliqCut: se
  // puede enlazar, el “atrás” del navegador vuelve al índice y lo que se esté
  // editando no se pierde al ir y volver.
  const searchParams = useSearchParams();
  const requested = searchParams.get("seccion");
  const section: SettingsSection | null = requested && requested in SECTIONS ? (requested as SettingsSection) : null;

  const openSection = (key: SettingsSection | null) => {
    const url = new URL(window.location.href);
    if (key) url.searchParams.set("seccion", key);
    else url.searchParams.delete("seccion");
    window.history.pushState(null, "", url);
    window.scrollTo({ top: 0 });
  };

  const activeMethods = methods.filter(method => method.isActive);
  const activeProviderNames = uniqueProviders(activeMethods).map(provider => provider.name);

  const saveDeliverySettings = async () => {
    setSavingDeliveryFee(true);
    try {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliveryFee, sameDayCutoffTime }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo guardar la configuración de entrega");
      const saved = Number(data.deliveryFee) || deliveryFee;
      const savedCutoff = typeof data.sameDayCutoffTime === "string" ? data.sameDayCutoffTime : sameDayCutoffTime;
      setDeliveryFee(saved);
      setSavedDeliveryFee(saved);
      setSameDayCutoffTime(savedCutoff);
      setSavedSameDayCutoffTime(savedCutoff);
      toast.success("Configuración de entrega actualizada");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar la configuración de entrega");
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

  const openNewMethod = () => {
    const nextOrder = Math.max(0, ...methods.map(method => method.sortOrder)) + 1;
    setMethodModal(emptyMethod(nextOrder));
  };

  const savePaymentMethod = async () => {
    if (!methodModal) return;
    if (!getPaymentProvider(methodModal.provider)) {
      toast.error("Elige el proveedor del método");
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
      body.set("title", methodModal.provider);
      body.set("provider", methodModal.provider);
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

  const hubGroups: { label: string; rows: HubRow[] }[] = [
    {
      label: "Tienda",
      rows: [
        {
          key: "entrega",
          icon: SECTIONS.entrega.icon,
          title: SECTIONS.entrega.title,
          status: `${formatPrice(savedDeliveryFee)} · entrega hoy hasta ${formatTime12(savedSameDayCutoffTime)}`,
        },
        {
          key: "tarjetas",
          icon: FiMail,
          title: "Tarjetas de dedicatoria",
          status: activeCardOptions === 0
            ? "Sin tarjetas activas"
            : `${activeCardOptions} ${activeCardOptions === 1 ? "tarjeta activa" : "tarjetas activas"}`,
          on: activeCardOptions > 0,
          href: "/dashboard/tarjetas",
        },
      ],
    },
    {
      label: "Cobros",
      rows: [
        {
          key: "pagos",
          icon: SECTIONS.pagos.icon,
          title: SECTIONS.pagos.title,
          status: activeMethods.length === 0
            ? "Sin métodos activos: nadie puede pagar"
            : [`${activeMethods.length} ${activeMethods.length === 1 ? "activo" : "activos"}`, activeProviderNames.join(", ")].filter(Boolean).join(" · "),
          on: activeMethods.length > 0,
        },
      ],
    },
    {
      label: "Cuenta",
      rows: [
        { key: "acceso", icon: SECTIONS.acceso.icon, title: SECTIONS.acceso.title, status: initialLoginEmail || "Sin correo" },
      ],
    },
  ];

  const draftProvider = methodModal ? getPaymentProvider(methodModal.provider) : null;

  return (
    <div className="min-w-0">
      <div className="mx-auto max-w-[1100px] space-y-5 sm:space-y-6">
        {section === null ? (
          <>
            <div>
              <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Ajustes</h1>
              <p className="mt-1 text-sm text-gray-500">Configura tu tienda, los cobros y tu cuenta.</p>
            </div>

            {/* La tienda de un vistazo, como la cabecera del negocio en CliqCut. */}
            <div className="rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 p-4 text-white shadow-sm sm:p-5">
              <div className="flex items-center gap-3 sm:gap-4">
                <BrandLogo size={56} variant="dark" className="rounded-2xl" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-lg font-black leading-tight">{BRAND_NAME}</p>
                  <p className="mt-0.5 truncate text-xs text-white/80">
                    Domicilio {formatPrice(savedDeliveryFee)} · {activeMethods.length} {activeMethods.length === 1 ? "método de pago" : "métodos de pago"}
                  </p>
                </div>
                <Link
                  href="/"
                  target="_blank"
                  className="hidden shrink-0 items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-primary-600 transition-colors hover:bg-primary-50 sm:inline-flex"
                >
                  Ver tienda <FiExternalLink className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
              <Link
                href="/"
                target="_blank"
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-white py-2.5 text-sm font-bold text-primary-600 transition-colors hover:bg-primary-50 sm:hidden"
              >
                Ver tienda <FiExternalLink className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>

            <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
              {hubGroups.map(group => (
                <section key={group.label}>
                  <h2 className="mb-2 pl-1 text-[11px] font-extrabold uppercase tracking-wider text-gray-400">{group.label}</h2>
                  <div className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                    {group.rows.map(row => (
                      <SettingsHubRow key={row.key} row={row} onOpen={() => openSection(row.key as SettingsSection)} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </>
        ) : (
          <div>
            <button
              type="button"
              onClick={() => openSection(null)}
              className="mb-3 inline-flex items-center gap-1.5 rounded-lg px-1 py-1 text-sm font-semibold text-brand-600 transition-colors hover:text-brand-700"
            >
              <FiArrowLeft className="h-4 w-4" aria-hidden="true" />
              Ajustes
            </button>
            <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">{SECTIONS[section].title}</h1>
            <p className="mt-1 text-sm text-gray-500">{SECTIONS[section].description}</p>
          </div>
        )}

        {section === "entrega" && (
          <section className="space-y-5 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className={labelCls}>Valor del domicilio (COP)</span>
                <input
                  type="number"
                  min={0}
                  value={deliveryFee}
                  onChange={event => setDeliveryFee(Number(event.target.value) || 0)}
                  className={inputCls}
                />
              </label>
              <label className="block">
                <span className={labelCls}>Hora límite para entrega hoy</span>
                <TimeInput12
                  value={sameDayCutoffTime}
                  onChange={setSameDayCutoffTime}
                  minuteStep={15}
                  aria-label="Hora límite para entrega hoy"
                />
                <p className="mt-1.5 text-xs leading-5 text-gray-500">Después de esta hora, los productos configurados para entrega hoy se programan para el día siguiente.</p>
              </label>
            </div>
            <div className="flex justify-end border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={saveDeliverySettings}
                disabled={savingDeliveryFee}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 text-sm font-bold text-white transition hover:bg-brand-600 disabled:opacity-60 sm:w-auto"
              >
                {savingDeliveryFee ? <RiLoader4Line className="animate-spin" /> : <RiSaveLine />}
                {savingDeliveryFee ? "Guardando..." : "Guardar entrega"}
              </button>
            </div>
          </section>
        )}

        {section === "pagos" && (
          <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-500">
                {activeMethods.length === 0
                  ? "Sin métodos activos, el cliente no puede pagar."
                  : `${activeMethods.length} ${activeMethods.length === 1 ? "método activo" : "métodos activos"} en el checkout.`}
              </p>
              <button
                type="button"
                onClick={openNewMethod}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 text-sm font-bold text-white transition hover:bg-brand-600"
              >
                <RiAddLine size={16} />
                Agregar método
              </button>
            </div>

            {methods.length ? (
              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {methods.map(method => (
                  <article key={method.id} className="flex min-h-56 flex-col rounded-2xl border border-gray-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <PaymentProviderLogo provider={method.provider || method.title} />
                      <span className={`rounded-lg px-2.5 py-1 text-[10px] font-semibold ${method.isActive ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"}`}>
                        {method.isActive ? "Activo" : "Inactivo"}
                      </span>
                    </div>

                    <h3 className="mt-4 text-sm font-bold text-gray-900">{method.visibleLabel || method.provider || method.title}</h3>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {getPaymentProvider(method.provider || method.title)?.name || method.provider || method.title}
                      {" · "}
                      {method.type === "QR" ? "Código QR" : "Número o cuenta"}
                    </p>
                    {method.accountNumber && <p className="mt-2 break-all font-mono text-sm text-gray-700">{method.accountNumber}</p>}
                    {method.details && <p className="mt-1 line-clamp-2 text-xs text-gray-500">{method.details}</p>}
                    {method.imageUrl && (
                      <img src={method.imageUrl} alt={`QR ${method.provider || method.title}`} className="mt-3 h-20 w-20 rounded-lg border border-gray-200 object-contain" />
                    )}

                    <div className="mt-auto flex gap-2 pt-4">
                      <button
                        type="button"
                        onClick={() => setMethodModal(methodToDraft(method))}
                        className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 transition hover:border-brand-200 hover:text-brand-600"
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
              <button
                type="button"
                onClick={openNewMethod}
                className="mt-5 flex w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-brand-300 bg-brand-50/40 px-4 py-10 text-brand-600 transition hover:bg-brand-50"
              >
                <RiAddLine size={22} />
                <strong className="text-sm">Agrega tu primer método de pago</strong>
                <span className="text-xs text-gray-500">Bancolombia, Nequi, PayPal o PSE</span>
              </button>
            )}

            <div className="mt-5 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
              <RiInformationLine className="mt-0.5 shrink-0 text-blue-600" size={20} />
              <p className="text-xs leading-5 text-gray-600">
                Los métodos activos aparecen en el checkout, con el logo de su proveedor, y en los pedidos manuales. Mantén sus datos actualizados.
              </p>
            </div>
          </section>
        )}

        {section === "acceso" && (
          <section className="space-y-5 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Correo actual" icon={<RiMailLine />} value={initialLoginEmail} readOnly />
              <Field label="Nuevo correo" icon={<RiMailLine />} value={newEmail} onChange={setNewEmail} type="email" />
              <Field label="Contraseña actual" icon={<RiLockLine />} value={currentPassword} onChange={setCurrentPassword} type="password" placeholder="Ingresa tu contraseña actual" />
              <Field label="Nueva contraseña" icon={<RiLockLine />} value={newPassword} onChange={setNewPassword} type="password" placeholder="Mínimo 6 caracteres" />
              <Field label="Confirmar contraseña" icon={<RiLockLine />} value={confirmPassword} onChange={setConfirmPassword} type="password" placeholder="Repite la nueva contraseña" />
            </div>
            <div className="flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-gray-500">Al actualizar se cierra la sesión y entras de nuevo con los datos nuevos.</p>
              <button
                type="button"
                onClick={saveCredentials}
                disabled={savingCredentials}
                className="inline-flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 text-sm font-bold text-white transition hover:bg-brand-600 disabled:opacity-60 sm:w-auto"
              >
                {savingCredentials ? <RiLoader4Line className="animate-spin" /> : <RiSaveLine />}
                {savingCredentials ? "Actualizando..." : "Actualizar acceso"}
              </button>
            </div>
          </section>
        )}
      </div>

      <ResponsiveModal
        open={!!methodModal}
        onClose={() => !savingMethod && setMethodModal(null)}
        title={methodModal?.id ? "Editar método de pago" : "Agregar método de pago"}
        description="Configura la información que verá el cliente al realizar una transferencia."
        size="xl"
        footer={methodModal ? (
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setMethodModal(null)} disabled={savingMethod} className="h-11 rounded-xl border border-gray-200 bg-white px-5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50">Cancelar</button>
            <button type="button" onClick={savePaymentMethod} disabled={savingMethod} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600 disabled:opacity-50">
              {savingMethod ? <RiLoader4Line className="animate-spin" /> : <RiSaveLine />}
              {savingMethod ? "Guardando..." : "Guardar método"}
            </button>
          </div>
        ) : undefined}
      >
        {methodModal && (
          <div className="space-y-5">
            <div>
              <span className={labelCls}>Proveedor</span>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup" aria-label="Proveedor">
                {PAYMENT_PROVIDERS.map(provider => {
                  const active = methodModal.provider === provider.name;
                  return (
                    <button
                      key={provider.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setMethodModal({ ...methodModal, provider: provider.name })}
                      className={`flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition ${active ? "border-brand-500 bg-brand-50" : "border-gray-200 bg-white hover:border-gray-300"}`}
                    >
                      <span className="flex h-8 w-full items-center justify-center">
                        <img src={provider.logo} alt="" className="max-h-full max-w-[88px] object-contain" />
                      </span>
                      <span className={`text-xs font-semibold ${active ? "text-brand-700" : "text-gray-600"}`}>{provider.name}</span>
                    </button>
                  );
                })}
              </div>
              {methodModal.legacyProvider && !methodModal.provider && (
                <p className="mt-2 text-xs text-amber-700">
                  Este método tenía “{methodModal.legacyProvider}”. Elige su proveedor para mostrar el logo al cliente.
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className={labelCls}>Etiqueta visible</span>
                <input value={methodModal.visibleLabel} onChange={event => setMethodModal({ ...methodModal, visibleLabel: event.target.value })} placeholder="Cuenta de ahorros, Daniel..." className={inputCls} />
              </label>
              <div>
                <span className={labelCls}>Tipo</span>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setMethodModal({ ...methodModal, type: "BANK_ACCOUNT" })} className={`h-11 rounded-xl border-2 text-xs font-semibold ${methodModal.type === "BANK_ACCOUNT" ? "border-brand-500 bg-brand-50 text-brand-700" : "border-gray-200 text-gray-500"}`}>
                    Número o cuenta
                  </button>
                  <button type="button" onClick={() => setMethodModal({ ...methodModal, type: "QR" })} className={`h-11 rounded-xl border-2 text-xs font-semibold ${methodModal.type === "QR" ? "border-brand-500 bg-brand-50 text-brand-700" : "border-gray-200 text-gray-500"}`}>
                    Código QR
                  </button>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {methodModal.type === "QR" ? (
                <label className="block">
                  <span className={labelCls}>Imagen QR</span>
                  <input id="payment-qr" type="file" accept="image/*" onChange={event => handleQr(event.target.files?.[0])} className="hidden" />
                  <span className="grid min-h-40 cursor-pointer place-items-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50" onClick={() => document.getElementById("payment-qr")?.click()}>
                    {methodModal.preview ? <img src={methodModal.preview} alt="Vista previa QR" className="max-h-36 object-contain" /> : <span className="text-center text-sm text-gray-400"><RiQrCodeLine className="mx-auto mb-2" size={32} />Subir QR</span>}
                  </span>
                </label>
              ) : (
                <label className="block">
                  <span className={labelCls}>{draftProvider?.accountLabel || "Número o identificador"}</span>
                  <input value={methodModal.accountNumber} onChange={event => setMethodModal({ ...methodModal, accountNumber: event.target.value })} placeholder={draftProvider?.accountPlaceholder || "3001234567 o número de cuenta"} className={inputCls} />
                  <p className="mt-1.5 text-xs text-gray-500">El cliente podrá copiarlo con un toque.</p>
                </label>
              )}
              <label className="block">
                <span className={labelCls}>Notas o instrucciones</span>
                <textarea value={methodModal.details} onChange={event => setMethodModal({ ...methodModal, details: event.target.value })} className="min-h-40 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-brand-300 focus:bg-white focus:ring-4 focus:ring-brand-100" placeholder="Información visible para el cliente" />
              </label>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={methodModal.isActive} onChange={event => setMethodModal({ ...methodModal, isActive: event.target.checked })} className="rounded border-gray-300 text-brand-500" />
                Método activo
              </label>
              <label className="flex items-center gap-2 text-xs text-gray-600">
                Orden
                <input type="number" min={1} value={methodModal.sortOrder} onChange={event => setMethodModal({ ...methodModal, sortOrder: Number(event.target.value) || 1 })} className="h-9 w-20 rounded-lg border border-gray-200 px-3" />
              </label>
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

/** Fila del índice de Ajustes (port de `SettingsHub` de CliqCut). */
function SettingsHubRow({ row, onOpen }: { row: HubRow; onOpen: () => void }) {
  const on = row.on ?? true;
  const Icon = row.icon;
  const className = "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 focus:outline-none focus-visible:bg-gray-50";
  const content = (
    <>
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${on ? "bg-brand-50 text-brand-600" : "bg-gray-100 text-gray-400"}`}>
        <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-gray-900">{row.title}</span>
        <span className={`mt-0.5 block truncate text-xs font-medium ${on ? "text-gray-500" : "text-gray-400"}`}>{row.status}</span>
      </span>
      <FiChevronRight className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
    </>
  );
  return row.href ? (
    <Link href={row.href} className={className}>{content}</Link>
  ) : (
    <button type="button" onClick={onOpen} className={className}>{content}</button>
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
      <span className={labelCls}>{label}</span>
      <span className="relative block">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">{icon}</span>
        <input
          type={type}
          value={value}
          readOnly={readOnly}
          onChange={event => onChange?.(event.target.value)}
          placeholder={placeholder}
          className={`${inputCls} pl-11 ${readOnly ? "text-gray-500" : ""}`}
        />
      </span>
    </label>
  );
}
