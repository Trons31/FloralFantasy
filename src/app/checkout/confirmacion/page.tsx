"use client";
import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { RiCheckboxCircleLine, RiArrowRightLine, RiFlowerLine, RiSearchLine, RiFileCopyLine, RiCheckLine, RiLoader4Line, RiAlertLine, RiBankCardLine, RiRadioButtonLine, RiFileListLine, RiTruckLine, RiGiftLine } from "react-icons/ri";
import { formatPrice, STATUS_LABELS } from "@/lib/utils";

const STEPS = [
  { status: "PENDING_PAYMENT_CONFIRMATION", label: "Pendiente de confirmación", Icon: RiFileListLine },
  { status: "PAYMENT_INVALID", label: "Pago inválido", Icon: RiAlertLine },
  { status: "PAID", label: "Pago confirmado", Icon: RiBankCardLine },
  { status: "PROCESSING", label: "Preparando", Icon: RiFlowerLine },
  { status: "READY", label: "Listo", Icon: RiCheckLine },
  { status: "OUT_FOR_DELIVERY", label: "En camino", Icon: RiTruckLine },
  { status: "DELIVERED", label: "Entregado", Icon: RiGiftLine },
];

function Content() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    fetch(`/api/seguimiento?token=${token}`)
      .then(r => r.json())
      .then(data => setOrder(data))
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [token]);

  const currentIdx = order ? STEPS.findIndex(step => step.status === order.status) : -1;
  const paymentMethodLabel = order?.paymentMethod?.visibleLabel || order?.paymentMethod?.provider || order?.paymentMethod?.title || "Método de pago";
  const paymentMethodTypeLabel = order?.paymentMethod?.type === "QR"
    ? "QR"
    : order?.paymentMethod?.type === "BANK_ACCOUNT"
      ? "Cuenta bancaria"
      : order?.paymentMethod?.type === "INSTRUCTIONS"
        ? "Instrucciones"
        : "";
  const guideText = useMemo(() => {
    if (!order) return "";
    return [
      `Guía de seguimiento: ${order.trackingToken}`,
      `Cliente: ${order.customerName}`,
      `Total: ${formatPrice(order.total)}`,
      `Estado: ${STATUS_LABELS[order.status] || order.status}`,
      order.paymentMethod ? `Método de pago: ${paymentMethodLabel}` : "",
      order.paymentMethod?.provider ? `Proveedor: ${order.paymentMethod.provider}` : "",
      order.paymentMethod?.accountNumber ? `Cuenta: ${order.paymentMethod.accountNumber}` : "",
      order.address ? `Dirección: ${order.address}` : "",
    ].filter(Boolean).join("\n");
  }, [order, paymentMethodLabel]);
  const message = useMemo(() => {
    if (!order) return "Estamos procesando tu pedido y validando tu pago. Apenas confirmemos el pago podrás ver la actualización de tu pedido en la guía.";
    if (order.status === "PAYMENT_INVALID") {
      return "Tu comprobante fue marcado como inválido. Revisa el detalle del pedido y sube uno nuevo para continuar.";
    }
    return "Estamos procesando tu pedido y validando tu pago. Apenas confirmemos el pago podrás ver la actualización de tu pedido en la guía.";
  }, [order]);

  const handleCopy = async () => {
    if (!guideText) return;
    await navigator.clipboard.writeText(guideText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#fdfcf8] flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-3xl p-8 max-w-xl w-full shadow-xl"
      >
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <RiCheckboxCircleLine className="text-green-500" size={40} />
        </div>

        <h1
          className="font-semibold mb-2 text-center"
          style={{ fontFamily: "var(--font-cormorant),Georgia,serif", fontSize: "clamp(1.6rem,4vw,2rem)" }}
        >
          ¡Gracias por tu pedido!
          <RiFlowerLine className="text-primary-500 inline-block ml-2" size={24} />
        </h1>
        <p className="text-gray-500 text-sm mb-6 text-center">{message}</p>

        {loading ? (
          <div className="bg-gray-50 rounded-2xl p-5 mb-6 animate-pulse h-32" />
        ) : order ? (
          <>
            <div className="bg-primary-50 border border-primary-100 rounded-2xl p-5 mb-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-primary-600 uppercase tracking-widest mb-2">Tu guía final</p>
                  <p className="font-mono font-bold text-2xl text-gray-900 tracking-widest">{order.trackingToken}</p>
                  <p className="text-xs text-gray-500 mt-3">
                    Estado actual: <strong>{STATUS_LABELS[order.status] || order.status}</strong>
                  </p>
                </div>
                <button
                  onClick={handleCopy}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${copied ? "bg-green-500 text-white" : "bg-white text-primary-700 border border-primary-200"}`}
                >
                  {copied ? <><RiCheckLine size={15} /> Copiado</> : <><RiFileCopyLine size={15} /> Copiar guía</>}
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-3">
                {order.customerName} · {formatPrice(order.total)}
              </p>
            </div>

            {order.paymentMethod && (
              <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-6 shadow-sm">
                <div className="flex flex-col gap-4">
                  <div className="w-full max-w-[300px] mx-auto aspect-square rounded-3xl bg-gray-50 border border-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {order.paymentMethod.type === "QR" && order.paymentMethod.imageUrl ? (
                      <img src={order.paymentMethod.imageUrl} alt={paymentMethodLabel} className="w-full h-full object-contain p-4" />
                    ) : (
                      <RiBankCardLine className="text-gray-300" size={28} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-gray-900">{paymentMethodLabel}</p>
                        <p className="text-xs uppercase tracking-widest text-gray-400">{paymentMethodTypeLabel}</p>
                      </div>
                    </div>
                    {order.paymentMethod.provider && <p className="text-sm text-gray-600 mt-1">{order.paymentMethod.provider}</p>}
                    {order.paymentMethod.accountNumber && (
                      <p className="font-mono text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 inline-block mt-2">
                        {order.paymentMethod.accountNumber}
                      </p>
                    )}
                    {order.paymentMethod.details && <p className="text-sm text-gray-500 mt-2 whitespace-pre-line">{order.paymentMethod.details}</p>}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-0 mb-6">
              {STEPS.map((step, idx) => {
                const done = idx < currentIdx;
                const active = idx === currentIdx;
                return (
                  <div key={step.status} className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center ${done ? "bg-green-100 text-green-600" : active ? "bg-primary-100 text-primary-600" : "bg-gray-100 text-gray-300"}`}>
                        {done ? <RiCheckboxCircleLine size={18} /> : active ? <step.Icon size={16} /> : <RiRadioButtonLine size={16} />}
                      </div>
                      {idx < STEPS.length - 1 && <div className={`w-0.5 h-7 mt-1 ${done ? "bg-green-300" : "bg-gray-100"}`} />}
                    </div>
                    <div className={`pt-1.5 pb-2 ${idx > currentIdx ? "opacity-40" : ""}`}>
                      <p className={`text-sm font-semibold ${active ? "text-primary-700" : done ? "text-green-700" : "text-gray-400"}`}>{step.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 text-sm text-amber-700">
            No pudimos cargar tu pedido. Si acabas de subir el comprobante, intenta abrir la guía de seguimiento con tu token.
          </div>
        )}

        <div className="flex flex-col gap-3">
          <Link
            href={order?.trackingToken ? `/seguimiento?token=${order.trackingToken}` : "/seguimiento"}
            className="flex items-center justify-center gap-2 bg-primary-600 text-white py-3.5 rounded-full font-semibold hover:bg-primary-700 transition-colors"
          >
            <RiSearchLine size={16} /> Ver seguimiento
          </Link>
          <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm py-2 transition-colors text-center">
            Volver al inicio
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default function ConfirmacionPage() {
  return (
    <Suspense fallback={null}>
      <Content />
    </Suspense>
  );
}
