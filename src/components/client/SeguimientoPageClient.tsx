"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  RiArrowDownSLine,
  RiArrowLeftLine,
  RiBankCardLine,
  RiCalendarCheckLine,
  RiCheckLine,
  RiCheckboxCircleFill,
  RiCloseCircleLine,
  RiCustomerService2Line,
  RiFileList3Line,
  RiFlowerLine,
  RiLoader4Line,
  RiMapPin2Line,
  RiSearchLine,
  RiShieldCheckLine,
  RiTimeLine,
  RiTruckLine,
  RiWallet3Line,
  RiWhatsappLine,
} from "react-icons/ri";
import Header from "@/components/client/Header";
import Footer from "@/components/client/Footer";
import { formatPrice, STATUS_LABELS } from "@/lib/utils";

const STATUS_ORDER = [
  "PENDING",
  "PENDING_PAYMENT_CONFIRMATION",
  "PAID",
  "PROCESSING",
  "READY",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

const TRACKING_STEPS = [
  { status: "PENDING_PAYMENT_CONFIRMATION", label: "Pedido recibido" },
  { status: "PAID", label: "Pago confirmado" },
  { status: "PROCESSING", label: "Preparando flores" },
  { status: "READY", label: "Pedido listo" },
  { status: "OUT_FOR_DELIVERY", label: "En camino" },
  { status: "DELIVERED", label: "Entregado" },
];

const STATUS_MESSAGES: Record<string, { title: string; text: string; color: string }> = {
  PENDING: {
    title: "PEDIDO PENDIENTE",
    text: "Completa los datos y el pago para que podamos iniciar tu pedido.",
    color: "text-amber-600",
  },
  PENDING_PAYMENT_CONFIRMATION: {
    title: "VALIDANDO PAGO",
    text: "Recibimos tu pedido y estamos verificando el comprobante de pago.",
    color: "text-amber-600",
  },
  PAYMENT_INVALID: {
    title: "PAGO POR CORREGIR",
    text: "El comprobante no pudo validarse. Contacta con nosotros para continuar.",
    color: "text-red-600",
  },
  PAID: {
    title: "PAGO CONFIRMADO",
    text: "Tu pago fue validado y el pedido entrará pronto en preparación.",
    color: "text-emerald-600",
  },
  PROCESSING: {
    title: "PREPARANDO TU PEDIDO",
    text: "Nuestros floristas están preparando cuidadosamente tu arreglo.",
    color: "text-blue-600",
  },
  READY: {
    title: "PEDIDO LISTO",
    text: "Tu arreglo está terminado y listo para salir a entrega.",
    color: "text-violet-600",
  },
  OUT_FOR_DELIVERY: {
    title: "EN CAMINO",
    text: "Tu pedido está en ruta hacia la dirección de entrega.",
    color: "text-orange-600",
  },
  DELIVERED: {
    title: "ENTREGADO",
    text: "Tu pedido fue entregado exitosamente.",
    color: "text-emerald-600",
  },
  CANCELLED: {
    title: "PEDIDO CANCELADO",
    text: "Este pedido fue cancelado. Contáctanos si necesitas más información.",
    color: "text-red-600",
  },
};

const faqs = [
  {
    question: "¿Dónde encuentro mi guía de seguimiento?",
    answer: "La guía aparece en la confirmación de tu compra y tiene un formato similar a FLR-XXXXXX.",
  },
  {
    question: "¿Cuánto tarda en actualizarse el estado?",
    answer: "Los cambios aparecen en esta página tan pronto como nuestro equipo actualiza el pedido.",
  },
];

function formatDate(value: string | null | undefined, compact = false) {
  if (!value) return "Pendiente";
  return new Intl.DateTimeFormat("es-CO", compact
    ? { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }
    : { dateStyle: "long", timeStyle: "short" }).format(new Date(value));
}

function getMainImage(order: any) {
  const product = order?.items?.[0]?.product;
  return product?.images?.find((image: any) => image.isMain)?.url || product?.images?.[0]?.url || "/flowers/ramo1.jpg";
}

function getHistoryEntry(order: any, status: string) {
  return order?.statusHistory?.find((entry: any) => entry.status === status);
}

export default function SeguimientoPageClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tokenFromUrl = searchParams.get("token") || "";
  const lastAutoSearch = useRef("");
  const [token, setToken] = useState(tokenFromUrl.toUpperCase());
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showAllUpdates, setShowAllUpdates] = useState(false);

  const runSearch = async (query: string) => {
    const cleanToken = query.trim().toUpperCase();
    if (!cleanToken) {
      setError("Ingresa tu guía para continuar.");
      setOrder(null);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/seguimiento?token=${encodeURIComponent(cleanToken)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se encontró el pedido");
      setOrder(data);
      setToken(cleanToken);
      router.replace(`/seguimiento?token=${encodeURIComponent(cleanToken)}`, { scroll: false });
    } catch (searchError: any) {
      setOrder(null);
      setError(searchError.message || "No fue posible cargar la guía");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!tokenFromUrl || lastAutoSearch.current === tokenFromUrl) return;
    lastAutoSearch.current = tokenFromUrl;
    void runSearch(tokenFromUrl);
  }, [tokenFromUrl]);

  const resetSearch = () => {
    setOrder(null);
    setError("");
    setShowAllUpdates(false);
    router.replace("/seguimiento", { scroll: false });
  };

  const history = useMemo(
    () => Array.isArray(order?.statusHistory) ? [...order.statusHistory].sort((a: any, b: any) => Date.parse(b.createdAt) - Date.parse(a.createdAt)) : [],
    [order]
  );

  return (
    <main className="min-h-screen bg-[#fffdfa]">
      <Header forceLight />
      <div className="pt-[65px] sm:pt-[70px]">
        <AnimatePresence mode="wait">
          {order ? (
            <TrackingResult
              key={order.id}
              order={order}
              history={history}
              showAllUpdates={showAllUpdates}
              setShowAllUpdates={setShowAllUpdates}
              resetSearch={resetSearch}
            />
          ) : (
            <SearchView
              key="search"
              token={token}
              setToken={setToken}
              loading={loading}
              error={error}
              runSearch={runSearch}
              openFaq={openFaq}
              setOpenFaq={setOpenFaq}
            />
          )}
        </AnimatePresence>
      </div>
      <Footer />
    </main>
  );
}

function SearchView({
  token,
  setToken,
  loading,
  error,
  runSearch,
  openFaq,
  setOpenFaq,
}: {
  token: string;
  setToken: (value: string) => void;
  loading: boolean;
  error: string;
  runSearch: (token: string) => Promise<void>;
  openFaq: number | null;
  setOpenFaq: (index: number | null) => void;
}) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <section className="relative isolate overflow-hidden bg-[#fceff2]">
        <img src="/flowers/ramo2.jpg" alt="" className="absolute inset-0 h-full w-full object-cover object-[72%_50%]" />
        <div className="absolute inset-0 bg-[#080713]/50" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#090713]/90 via-[#160d1c]/68 to-[#090713]/25" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10" />
        <div className="relative mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20">
          <div className="max-w-[650px]">
            <span className="inline-flex rounded-md bg-white/15 px-2.5 py-1 text-[9px] font-bold uppercase text-primary-200 backdrop-blur-sm">Seguimiento</span>
            <h1 className="mt-4 font-display text-5xl font-semibold leading-[.98] text-white drop-shadow-[0_3px_18px_rgba(0,0,0,.38)] sm:text-6xl">
              Seguimiento<br />de pedido
            </h1>
            <p className="mt-5 max-w-sm text-sm leading-6 text-white/85 drop-shadow-sm">
              Consulta el estado actual de tu pedido en tiempo real con tu guía de seguimiento.
            </p>

            <div className="mt-8 max-w-[610px] rounded-2xl border border-white/80 bg-white/95 p-4 shadow-[0_16px_40px_rgba(120,54,69,.12)] backdrop-blur sm:p-5">
              <label className="mb-3 block text-xs font-bold text-slate-700">Guía de seguimiento</label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <label className="relative flex-1">
                  <RiSearchLine className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={token}
                    onChange={event => setToken(event.target.value.toUpperCase())}
                    onKeyDown={event => event.key === "Enter" && void runSearch(token)}
                    placeholder="Ej: FLR-TYVXH1"
                    className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 font-mono text-sm uppercase tracking-wide outline-none transition focus:border-primary-300"
                  />
                </label>
                <button type="button" onClick={() => void runSearch(token)} disabled={loading} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary-500 px-7 text-sm font-bold text-white transition hover:bg-primary-600 disabled:opacity-60">
                  {loading ? <RiLoader4Line className="animate-spin" /> : <RiSearchLine />} Buscar
                </button>
              </div>
              {error && <p className="mt-3 flex items-center gap-2 text-xs font-medium text-red-600"><RiCloseCircleLine />{error}</p>}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-7 px-5 py-9 sm:px-8 sm:py-12">
        <section>
          <h2 className="font-display text-xl font-semibold text-slate-950">¿Qué puedes consultar?</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { Icon: RiTimeLine, title: "Estado en tiempo real", text: "Conoce en qué etapa se encuentra tu pedido.", color: "bg-rose-50 text-primary-500" },
              { Icon: RiShieldCheckLine, title: "Pago asociado", text: "Verifica el estado del pago de tu pedido.", color: "bg-emerald-50 text-emerald-600" },
              { Icon: RiFlowerLine, title: "Preparación", text: "Sigue el proceso de preparación de tu arreglo.", color: "bg-violet-50 text-violet-600" },
              { Icon: RiTruckLine, title: "Entrega", text: "Consulta el avance y la hora estimada de entrega.", color: "bg-orange-50 text-orange-600" },
            ].map(({ Icon, title, text, color }) => (
              <article key={title} className="rounded-2xl border border-slate-100 bg-white p-5 text-center shadow-sm">
                <span className={`mx-auto grid h-11 w-11 place-items-center rounded-xl ${color}`}><Icon size={23} /></span>
                <h3 className="mt-4 text-xs font-bold">{title}</h3>
                <p className="mt-2 text-[11px] leading-5 text-slate-500">{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid overflow-hidden rounded-2xl bg-gradient-to-r from-rose-50 to-[#fff7f7] sm:grid-cols-[.9fr_1.1fr]">
          <div className="relative min-h-[150px] overflow-hidden">
            <img src="/flowers/ramo4.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-[#080713]/48" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#090713]/72 via-[#160d1c]/52 to-[#fff7f7]/15" />
            <RiTruckLine className="absolute bottom-7 left-1/2 -translate-x-1/2 text-primary-300 drop-shadow-[0_3px_14px_rgba(0,0,0,.45)]" size={72} />
          </div>
          <div className="flex flex-col justify-center p-7">
            <h2 className="font-display text-xl font-semibold">Flores que llegan con amor</h2>
            <p className="mt-3 max-w-md text-xs leading-5 text-slate-500">Nos aseguramos de que tu pedido llegue en perfectas condiciones y en el tiempo prometido.</p>
            <RiFlowerLine className="mt-3 text-primary-500" />
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold">Preguntas frecuentes</h2>
          <div className="mt-4 space-y-2">
            {faqs.map((faq, index) => {
              const open = openFaq === index;
              return (
                <div key={faq.question} className="overflow-hidden rounded-xl border border-slate-200">
                  <button type="button" onClick={() => setOpenFaq(open ? null : index)} className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left text-xs font-medium">
                    {faq.question}<RiArrowDownSLine className={`shrink-0 transition ${open ? "rotate-180" : ""}`} />
                  </button>
                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden px-4 text-xs leading-5 text-slate-500">
                        <span className="block pb-4">{faq.answer}</span>
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </motion.div>
  );
}

function TrackingResult({
  order,
  history,
  showAllUpdates,
  setShowAllUpdates,
  resetSearch,
}: {
  order: any;
  history: any[];
  showAllUpdates: boolean;
  setShowAllUpdates: (value: boolean) => void;
  resetSearch: () => void;
}) {
  const product = order.items?.[0]?.product;
  const productName = product?.name || "Arreglo floral";
  const statusMessage = STATUS_MESSAGES[order.status] || {
    title: STATUS_LABELS[order.status] || order.status,
    text: "Consulta aquí el estado actual de tu pedido.",
    color: "text-primary-500",
  };
  const paymentConfirmed = STATUS_ORDER.indexOf(order.status) >= STATUS_ORDER.indexOf("PAID") && order.status !== "PAYMENT_INVALID";
  const currentIndex = STATUS_ORDER.indexOf(order.status);
  const visibleUpdates = showAllUpdates ? history : history.slice(0, 3);
  const paymentLabel = order.paymentMethod?.visibleLabel || order.paymentMethod?.provider || order.paymentMethod?.title || "Por confirmar";

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-8">
      <button type="button" onClick={resetSearch} className="mb-5 inline-flex items-center gap-2 text-xs font-medium text-slate-600 transition hover:text-primary-500">
        <RiArrowLeftLine /> Volver al inicio
      </button>

      <section className="grid gap-5 rounded-2xl border border-primary-100 bg-white p-5 shadow-sm sm:grid-cols-[130px_1fr_auto] sm:items-center">
        <img src={getMainImage(order)} alt={productName} className="h-28 w-28 rounded-full bg-rose-50 object-cover" />
        <div>
          <span className="inline-flex rounded-md bg-emerald-50 px-2 py-1 text-[9px] font-semibold text-emerald-700">Guía activa</span>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-wide text-slate-950">{order.trackingToken}</h1>
          <p className="mt-1 text-sm font-semibold text-primary-500">{productName}</p>
          <div className="mt-5 flex flex-wrap gap-x-14 gap-y-3 text-xs">
            <div><span className="block text-[10px] text-slate-400">Cliente</span><strong>{order.customerName}</strong></div>
            <div><span className="block text-[10px] text-slate-400">Entrega estimada</span><strong>{order.estimatedTime}</strong></div>
            {order.items?.length > 1 && <div><span className="block text-[10px] text-slate-400">Productos</span><strong>{order.items.length}</strong></div>}
          </div>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-xs text-slate-500">Total</p>
          <p className="mt-1 text-2xl font-bold text-slate-950">{formatPrice(order.total)}</p>
        </div>
      </section>

      <section className="mt-6 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="grid items-center gap-6 border-b border-slate-100 p-6 sm:grid-cols-[1fr_240px]">
          <div className="flex items-center gap-5">
            <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-full ${order.status === "CANCELLED" || order.status === "PAYMENT_INVALID" ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"}`}>
              {order.status === "CANCELLED" || order.status === "PAYMENT_INVALID" ? <RiCloseCircleLine size={31} /> : <RiCheckLine size={32} />}
            </span>
            <div>
              <p className="text-[10px] text-slate-400">Estado actual</p>
              <h2 className={`mt-1 text-2xl font-extrabold ${statusMessage.color}`}>{statusMessage.title}</h2>
              <p className="mt-2 text-xs text-slate-600">{statusMessage.text}</p>
              {history[0]?.createdAt && <p className="mt-3 flex items-center gap-2 text-[11px] text-slate-500"><RiCalendarCheckLine className="text-primary-500" /> Actualizado el {formatDate(history[0].createdAt)}</p>}
            </div>
          </div>
          <div className="relative hidden h-28 sm:block">
            <img src={getMainImage(order)} alt="" className="absolute right-8 top-1/2 h-20 w-20 -translate-y-1/2 rounded-2xl object-cover opacity-90" />
            <RiFlowerLine className="absolute right-1 top-2 text-primary-300" />
            <RiFlowerLine className="absolute left-8 bottom-3 text-orange-300" size={13} />
            <RiFlowerLine className="absolute left-1/2 top-1 text-blue-300" size={11} />
          </div>
        </div>

        {order.status !== "CANCELLED" && (
          <div className="p-5 sm:p-7">
            <div className="hidden grid-cols-6 sm:grid">
              {TRACKING_STEPS.map((step, index) => {
                const stepIndex = STATUS_ORDER.indexOf(step.status);
                const entry = getHistoryEntry(order, step.status);
                const done = stepIndex <= currentIndex && order.status !== "PAYMENT_INVALID";
                return (
                  <div key={step.status} className="relative text-center">
                    {index > 0 && <span className={`absolute right-1/2 top-3 h-0.5 w-full ${done ? "bg-emerald-400" : "bg-slate-200"}`} />}
                    <span className={`relative z-10 mx-auto grid h-7 w-7 place-items-center rounded-full ${done ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-400"}`}>{done ? <RiCheckLine /> : <span className="h-2 w-2 rounded-full bg-current" />}</span>
                    <p className="mx-auto mt-3 max-w-[85px] text-[10px] font-semibold leading-4">{step.label}</p>
                    <p className="mt-2 text-[9px] leading-4 text-slate-400">{entry ? formatDate(entry.createdAt, true) : "Pendiente"}</p>
                  </div>
                );
              })}
            </div>
            <div className="space-y-0 sm:hidden">
              {TRACKING_STEPS.map((step, index) => {
                const stepIndex = STATUS_ORDER.indexOf(step.status);
                const entry = getHistoryEntry(order, step.status);
                const done = stepIndex <= currentIndex && order.status !== "PAYMENT_INVALID";
                return (
                  <div key={step.status} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span className={`grid h-8 w-8 place-items-center rounded-full ${done ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-400"}`}>{done ? <RiCheckLine /> : <span className="h-2 w-2 rounded-full bg-current" />}</span>
                      {index < TRACKING_STEPS.length - 1 && <span className={`h-9 w-0.5 ${done ? "bg-emerald-300" : "bg-slate-200"}`} />}
                    </div>
                    <div className="pt-1"><p className="text-xs font-semibold">{step.label}</p><p className="mt-1 text-[10px] text-slate-400">{entry ? formatDate(entry.createdAt, true) : "Pendiente"}</p></div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <InfoCard title="Detalles de entrega">
          <InfoRow Icon={RiMapPin2Line} label="Dirección" value={order.address} color="text-primary-500" />
          <InfoRow Icon={RiTimeLine} label="Entrega" value={order.estimatedTime} color="text-emerald-600" />
          <InfoRow Icon={RiFileList3Line} label="Notas" value={order.addressRef || order.adminNote || "Sin indicaciones adicionales"} color="text-violet-600" />
        </InfoCard>
        <InfoCard title="Pago asociado" badge={paymentConfirmed ? "Pago confirmado" : order.status === "PAYMENT_INVALID" ? "Pago inválido" : "Por confirmar"}>
          <InfoRow Icon={RiWallet3Line} label="Método de pago" value={paymentLabel} color="text-violet-600" />
          {order.paymentMethod?.title && order.paymentMethod.title !== paymentLabel && <InfoRow Icon={RiShieldCheckLine} label="Cuenta" value={order.paymentMethod.title} color="text-orange-500" />}
          <InfoRow Icon={RiBankCardLine} label="Número" value={order.paymentMethod?.accountNumber || "No aplica"} color="text-slate-400" />
        </InfoCard>
      </div>

      <section className="mt-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold">Actualizaciones del pedido</h2>
        <div className="mt-4 space-y-3">
          {visibleUpdates.length ? visibleUpdates.map(update => (
            <div key={update.id} className="grid gap-1 text-xs sm:grid-cols-[18px_1fr_auto] sm:items-start">
              <RiCheckLine className="mt-0.5 text-primary-500" />
              <p>{update.note || STATUS_LABELS[update.status] || update.status}</p>
              <time className="text-[10px] text-slate-400">{formatDate(update.createdAt)}</time>
            </div>
          )) : <p className="text-xs text-slate-500">Aún no hay actualizaciones registradas.</p>}
        </div>
        {history.length > 3 && (
          <button type="button" onClick={() => setShowAllUpdates(!showAllUpdates)} className="mt-4 text-xs font-semibold text-primary-500">
            {showAllUpdates ? "Ver menos actualizaciones" : "Ver todas las actualizaciones"}
          </button>
        )}
      </section>

      <section className="mt-5 flex flex-col gap-4 rounded-2xl bg-gradient-to-r from-rose-50 to-[#fff8f8] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-primary-100 text-primary-500"><RiCustomerService2Line /></span>
          <div><p className="text-xs font-bold">¿Necesitas ayuda?</p><p className="text-[10px] text-slate-500">Estamos para ayudarte</p></div>
        </div>
        <a href="https://wa.me/573000000000" target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-primary-100 bg-white px-5 text-xs font-semibold">
          <RiWhatsappLine className="text-emerald-500" size={18} /> Escríbenos
        </a>
      </section>
    </motion.div>
  );
}

function InfoCard({ title, badge, children }: { title: string; badge?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold">{title}</h2>
        {badge && <span className={`rounded-md px-2 py-1 text-[9px] font-semibold ${badge === "Pago confirmado" ? "bg-emerald-50 text-emerald-700" : badge === "Pago inválido" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-700"}`}>{badge}</span>}
      </div>
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

function InfoRow({ Icon, label, value, color }: { Icon: React.ElementType; label: string; value: string; color: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className={`mt-0.5 shrink-0 ${color}`} />
      <div><p className="text-[10px] text-slate-400">{label}</p><p className="mt-0.5 text-xs font-medium text-slate-700">{value}</p></div>
    </div>
  );
}
