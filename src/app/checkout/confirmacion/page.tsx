"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { RiCheckLine, RiFileCopyLine, RiSearchLine, RiShareLine, RiBookmarkLine } from "react-icons/ri";
import { toast } from "sonner";
import { formatPrice } from "@/lib/utils";
import { copyText, trackingStatus } from "@/lib/order-tracking";
import PaymentProviderLogo from "@/components/ui/PaymentProviderLogo";

/** Fila corta del resumen (spec 015). */
function SummaryRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <span className="shrink-0 text-[12px] text-slate-500">{label}</span>
      <span className="min-w-0 text-right text-[13px] font-semibold text-slate-900">{children}</span>
    </div>
  );
}

function Content() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
    if (!token) {
      setLoading(false);
      return;
    }
    fetch(`/api/seguimiento?token=${token}`)
      .then(r => (r.ok ? r.json() : null))
      .then(data => setOrder(data?.id ? data : null))
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [token]);

  const guide = order?.trackingToken || token || "";
  const trackingUrl = guide ? `/seguimiento?token=${encodeURIComponent(guide)}` : "/seguimiento";
  const status = order ? trackingStatus(order.status) : null;
  const method = order?.paymentMethod;
  const methodLabel = method?.visibleLabel || method?.provider || method?.title;

  const handleCopy = async () => {
    if (!guide) return;
    if (await copyText(guide)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error("No se pudo copiar, toma una captura de pantalla");
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: "Mi pedido en Fantasía Floral",
        text: `Mi guía de seguimiento es ${guide}`,
        url: `${window.location.origin}${trackingUrl}`,
      });
    } catch {
      // El cliente cerró el menú de compartir: nada que hacer.
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fdfcf8] px-4 py-10">
      <div className="w-full max-w-md animate-fade-in rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_12px_32px_rgba(15,23,42,0.08)] sm:p-7">
        <div className="text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <RiCheckLine size={28} />
          </span>
          <h1 className="mt-4 font-display text-[28px] font-semibold leading-tight text-slate-950">¡Pedido recibido!</h1>
          <p className="mt-1.5 text-[13px] leading-5 text-slate-500">
            {order?.status === "PAYMENT_INVALID"
              ? "Hay un problema con tu comprobante. Escríbenos para resolverlo."
              : "Estamos validando tu pago. Con tu guía puedes ver cómo avanza."}
          </p>
        </div>

        {guide && (
          <section className="mt-6 rounded-2xl border border-primary-100 bg-primary-50/60 p-4 text-center">
            <p className="flex items-center justify-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-primary-600">
              <RiBookmarkLine size={13} /> Guarda tu guía
            </p>
            <p className="mt-2 font-mono text-[26px] font-bold tracking-[0.12em] text-slate-950">{guide}</p>
            <div className="mt-3 flex justify-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className={`inline-flex h-10 items-center gap-1.5 whitespace-nowrap rounded-xl px-4 text-[13px] font-semibold transition ${copied ? "bg-emerald-500 text-white" : "border border-primary-200 bg-white text-primary-700 hover:bg-primary-50"}`}
              >
                {copied ? <RiCheckLine size={15} /> : <RiFileCopyLine size={15} />}
                {copied ? "Copiada" : "Copiar guía"}
              </button>
              {canShare && (
                <button
                  type="button"
                  onClick={handleShare}
                  className="inline-flex h-10 items-center gap-1.5 whitespace-nowrap rounded-xl border border-primary-200 bg-white px-4 text-[13px] font-semibold text-primary-700 transition hover:bg-primary-50"
                >
                  <RiShareLine size={15} /> Compartir
                </button>
              )}
            </div>
            <p className="mt-3 text-[11px] leading-4 text-slate-500">La necesitas para consultar tu pedido. Cópiala o toma una captura.</p>
          </section>
        )}

        {loading ? (
          <div className="mt-5 h-40 animate-pulse rounded-2xl bg-slate-50" />
        ) : order ? (
          <div className="mt-4 divide-y divide-slate-100">
            <SummaryRow label="Estado">
              <span className={status?.tone === "problem" ? "text-red-600" : "text-amber-600"}>{status?.title}</span>
            </SummaryRow>
            {order.estimatedTime && <SummaryRow label="Entrega">{order.estimatedTime}</SummaryRow>}
            {method && (
              <SummaryRow label="Pago">
                <span className="inline-flex items-center gap-2">
                  <PaymentProviderLogo provider={method.provider || method.title} size="sm" />
                  <span className="truncate">{methodLabel}</span>
                </span>
              </SummaryRow>
            )}
            <SummaryRow label="Total">
              <span className="text-[15px] text-primary-600">{formatPrice(order.total)}</span>
            </SummaryRow>
          </div>
        ) : (
          <p className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-[13px] text-amber-700">
            No pudimos cargar el detalle ahora. Tu pedido está guardado: consúltalo con tu guía.
          </p>
        )}

        <div className="mt-6 flex flex-col gap-2">
          <Link
            href={trackingUrl}
            className="flex h-12 items-center justify-center gap-2 rounded-full bg-primary-600 text-[14px] font-semibold text-white transition hover:bg-primary-700"
          >
            <RiSearchLine size={16} /> Ver seguimiento
          </Link>
          <Link href="/" className="py-2 text-center text-[13px] text-slate-500 transition hover:text-slate-800">
            Volver a la tienda
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function ConfirmacionPage() {
  return (
    <Suspense fallback={null}>
      <Content />
    </Suspense>
  );
}
