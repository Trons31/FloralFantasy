"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  RiArrowDownSLine,
  RiArrowLeftLine,
  RiArrowRightLine,
  RiCheckLine,
  RiCloseCircleLine,
  RiFileCopyLine,
  RiLoader4Line,
  RiMapPin2Line,
  RiSearchLine,
  RiTimeLine,
  RiWhatsappLine,
} from "react-icons/ri";
import { toast } from "sonner";
import Header from "@/components/client/Header";
import Footer from "@/components/client/Footer";
import PaymentProviderLogo from "@/components/ui/PaymentProviderLogo";
import { formatDateTime, formatPrice, STATUS_LABELS } from "@/lib/utils";
import { STORE_WHATSAPP_URL, TRACKING_STEPS, copyText, trackingStatus, trackingStepIndex } from "@/lib/order-tracking";

function getItemImage(item: any) {
  const images = item?.product?.images || [];
  return images.find((image: any) => image.isMain)?.url || images[0]?.url || "/flowers/ramo1.jpg";
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

  const runSearch = async (query: string) => {
    const cleanToken = query.trim().toUpperCase();
    if (!cleanToken) {
      setError("Escribe tu guía para continuar.");
      setOrder(null);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/seguimiento?token=${encodeURIComponent(cleanToken)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(response.status === 404 ? "No encontramos esa guía. Revisa que esté bien escrita." : data.error || "No fue posible cargar la guía");
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
  }, [tokenFromUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  const resetSearch = () => {
    setOrder(null);
    setError("");
    router.replace("/seguimiento", { scroll: false });
  };

  return (
    <main className="flex min-h-screen flex-col bg-[#fffdfa]">
      <Header forceLight />
      <div className="flex-1 pt-[65px] sm:pt-[70px]">
        {order ? (
          <TrackingResult key={order.id} order={order} resetSearch={resetSearch} />
        ) : (
          <SearchView token={token} setToken={setToken} loading={loading} error={error} runSearch={runSearch} />
        )}
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
}: {
  token: string;
  setToken: (value: string) => void;
  loading: boolean;
  error: string;
  runSearch: (token: string) => Promise<void>;
}) {
  return (
    <section className="mx-auto flex max-w-xl animate-fade-in flex-col px-5 py-12 text-center sm:min-h-[calc(100vh-70px)] sm:justify-center sm:py-16">
      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary-500">Seguimiento</p>
      <h1 className="mt-3 font-display text-[30px] font-semibold leading-tight text-slate-950 sm:text-[44px] lg:text-[52px]">Rastrea tu pedido</h1>
      <p className="mx-auto mt-3 max-w-sm text-[14px] leading-6 text-slate-500">Escribe tu guía y mira en qué va tu arreglo y cuándo llega.</p>

      <form
        onSubmit={event => {
          event.preventDefault();
          void runSearch(token);
        }}
        className={`mt-8 flex items-center gap-2 rounded-full border bg-white p-1.5 pl-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] transition focus-within:border-primary-300 focus-within:ring-4 focus-within:ring-primary-50 ${error ? "border-red-200" : "border-slate-200"}`}
      >
        <RiSearchLine className="shrink-0 text-slate-400" size={18} aria-hidden="true" />
        <input
          value={token}
          onChange={event => setToken(event.target.value.toUpperCase())}
          placeholder="FLR-XXXXXX"
          aria-label="Guía de seguimiento"
          autoComplete="off"
          className="h-11 min-w-0 flex-1 bg-transparent font-mono text-[15px] uppercase tracking-wider text-slate-900 outline-none placeholder:text-slate-300"
        />
        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-primary-600 px-5 text-[13px] font-semibold text-white transition hover:bg-primary-700 disabled:opacity-60"
        >
          {loading ? <RiLoader4Line className="animate-spin" size={16} /> : <RiArrowRightLine size={16} />}
          Rastrear
        </button>
      </form>
      {error && (
        <p className="mt-3 flex items-center justify-center gap-1.5 text-[12px] font-medium text-red-600">
          <RiCloseCircleLine size={14} /> {error}
        </p>
      )}

      <p className="mt-6 text-[12px] leading-5 text-slate-400">Tu guía tiene el formato FLR-XXXXXX y está en tu confirmación de compra.</p>
      <a href={STORE_WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="mx-auto mt-2 inline-flex items-center gap-1.5 text-[12px] font-semibold text-slate-600 transition hover:text-primary-600">
        <RiWhatsappLine className="text-emerald-500" size={15} /> ¿No la tienes? Escríbenos
      </a>
    </section>
  );
}

function TrackingProgress({ current }: { current: number }) {
  return (
    <div className="mt-6">
      <div className="flex gap-1.5" aria-hidden="true">
        {TRACKING_STEPS.map((step, index) => (
          <span key={step} className={`h-1.5 flex-1 rounded-full ${index <= current ? "bg-primary-500" : "bg-slate-100"}`} />
        ))}
      </div>
      {/* En móvil cinco etiquetas no caben: solo el paso actual. */}
      <p className="mt-2.5 text-[12px] text-slate-500 sm:hidden">
        <strong className="font-bold text-slate-900">{TRACKING_STEPS[current]}</strong> · paso {current + 1} de {TRACKING_STEPS.length}
      </p>
      <ol className="mt-2.5 hidden grid-cols-5 gap-1.5 sm:grid" aria-label="Avance del pedido">
        {TRACKING_STEPS.map((step, index) => (
          <li
            key={step}
            aria-current={index === current ? "step" : undefined}
            className={`text-[10px] leading-4 sm:text-[11px] ${index === current ? "font-bold text-slate-900" : index < current ? "text-slate-500" : "text-slate-400"}`}
          >
            {step}
          </li>
        ))}
      </ol>
    </div>
  );
}

function DetailRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 py-4">
      <span className="mt-0.5 shrink-0 text-slate-400">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-slate-400">{label}</p>
        <div className="mt-0.5 text-[13px] text-slate-800">{children}</div>
      </div>
    </div>
  );
}

function TrackingResult({ order, resetSearch }: { order: any; resetSearch: () => void }) {
  const [copied, setCopied] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const status = trackingStatus(order.status);
  const current = trackingStepIndex(order.status);
  const items: any[] = Array.isArray(order.items) ? order.items : [];
  const method = order.paymentMethod;
  const paid = current >= 1;
  const awaitingPayment = order.status === "PENDING" && !order.paymentProofUrl;
  const history = useMemo(
    () => (Array.isArray(order.statusHistory) ? [...order.statusHistory].sort((a: any, b: any) => Date.parse(b.createdAt) - Date.parse(a.createdAt)) : []),
    [order]
  );

  const handleCopy = async () => {
    if (await copyText(order.trackingToken)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error("No se pudo copiar");
    }
  };

  return (
    <div className="mx-auto max-w-2xl animate-fade-in px-4 py-8 sm:py-12">
      <div className="flex items-center justify-between gap-3">
        <button type="button" onClick={resetSearch} className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-500 transition hover:text-slate-900">
          <RiArrowLeftLine size={15} /> Buscar otra guía
        </button>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 font-mono text-[12px] font-semibold tracking-wider text-slate-700 transition hover:border-primary-200"
          aria-label="Copiar guía"
        >
          {order.trackingToken}
          {copied ? <RiCheckLine className="text-emerald-500" size={14} /> : <RiFileCopyLine className="text-slate-400" size={14} />}
        </button>
      </div>

      <section className="mt-5 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
        <h1 className={`font-display text-[24px] font-semibold leading-tight sm:text-[36px] ${status.tone === "problem" ? "text-red-600" : "text-slate-950"}`}>
          {status.title}
        </h1>
        {status.text && <p className="mt-2 text-[14px] leading-6 text-slate-500">{status.text}</p>}
        {order.estimatedTime && order.status !== "CANCELLED" && (
          <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1.5 text-[12px] font-semibold text-slate-700">
            <RiTimeLine size={14} className="text-primary-500" /> {order.estimatedTime}
          </p>
        )}

        {status.tone === "problem" ? (
          <a
            href={STORE_WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 flex items-center justify-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-[13px] font-semibold text-red-700 transition hover:bg-red-100"
          >
            <RiWhatsappLine size={17} /> Escríbenos por WhatsApp
          </a>
        ) : (
          current >= 0 && <TrackingProgress current={current} />
        )}

        {awaitingPayment && (
          <Link
            href={`/checkout?token=${encodeURIComponent(order.trackingToken)}`}
            className="mt-6 flex h-11 items-center justify-center gap-2 rounded-full bg-primary-600 text-[13px] font-semibold text-white transition hover:bg-primary-700"
          >
            Completar pago <RiArrowRightLine size={15} />
          </Link>
        )}
      </section>

      <section className="mt-4 rounded-3xl border border-slate-100 bg-white px-6 shadow-sm sm:px-8">
        <div className="divide-y divide-slate-100">
          <div className="space-y-3 py-5">
            {items.map(item => (
              <div key={item.id} className="flex items-center gap-3">
                <img src={getItemImage(item)} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-semibold text-slate-900">{item.product?.name || "Arreglo floral"}</p>
                  <p className="text-[12px] text-slate-400">Cantidad: {item.quantity}</p>
                </div>
              </div>
            ))}
          </div>
          <DetailRow icon={<RiMapPin2Line size={17} />} label="Entrega">
            <p className="font-medium">{order.address || "Sin dirección registrada"}</p>
            {(order.city?.name || order.addressRef) && (
              <p className="text-[12px] text-slate-500">{[order.city?.name, order.addressRef].filter(Boolean).join(" · ")}</p>
            )}
          </DetailRow>
          {method && (
            <DetailRow icon={<PaymentProviderLogo provider={method.provider || method.title} size="sm" className="-mt-1 !h-7 !w-14" />} label="Pago">
              <p className="font-medium">
                {method.visibleLabel || method.provider || method.title}
                <span className={`ml-2 text-[12px] font-semibold ${order.status === "PAYMENT_INVALID" ? "text-red-600" : paid ? "text-emerald-600" : "text-amber-600"}`}>
                  {order.status === "PAYMENT_INVALID" ? "Rechazado" : paid ? "Confirmado" : "Por confirmar"}
                </span>
              </p>
            </DetailRow>
          )}
          <div className="flex items-center justify-between py-4">
            <span className="text-[13px] text-slate-500">Total</span>
            <span className="text-[16px] font-bold text-slate-950">{formatPrice(order.total)}</span>
          </div>
        </div>
      </section>

      {history.length > 0 && (
        <section className="mt-4 rounded-3xl border border-slate-100 bg-white shadow-sm">
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            aria-expanded={showHistory}
            className="flex w-full items-center justify-between px-6 py-4 text-left text-[13px] font-semibold text-slate-800 sm:px-8"
          >
            <span>Historial · {history.length}</span>
            <RiArrowDownSLine className={`text-slate-400 transition ${showHistory ? "rotate-180" : ""}`} size={18} />
          </button>
          {showHistory && (
            <ol className="animate-fade-in space-y-4 border-t border-slate-100 px-6 py-5 sm:px-8">
              {history.map((entry: any, index: number) => (
                <li key={entry.id} className="flex gap-3">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${index === 0 ? "bg-primary-500" : "bg-slate-300"}`} />
                  <div className="min-w-0">
                    <p className="text-[13px] text-slate-800">{entry.note || STATUS_LABELS[entry.status] || entry.status}</p>
                    <time className="text-[11px] text-slate-400">{formatDateTime(entry.createdAt)}</time>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}

      <p className="mt-8 text-center text-[12px] text-slate-400">
        ¿Necesitas ayuda?{" "}
        <a href={STORE_WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="font-semibold text-slate-600 underline-offset-4 hover:text-primary-600 hover:underline">
          Escríbenos
        </a>
      </p>
    </div>
  );
}
