"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RiSearchLine,
  RiLoader4Line,
  RiCheckboxCircleLine,
  RiRadioButtonLine,
  RiFileListLine,
  RiBankCardLine,
  RiFlowerLine,
  RiCheckLine,
  RiTruckLine,
  RiGiftLine,
  RiCloseCircleLine,
  RiAlertLine,
  RiMapPin2Line,
  RiTimeLine,
  RiCustomerService2Line,
  RiShieldCheckLine,
} from "react-icons/ri";
import { useSearchParams } from "next/navigation";
import Header from "@/components/client/Header";
import Footer from "@/components/client/Footer";
import { formatPrice, STATUS_LABELS } from "@/lib/utils";

const STEPS = [
  { status: "PENDING_PAYMENT_CONFIRMATION", label: "Pendiente de confirmación", Icon: RiFileListLine, desc: "Estamos esperando validar tu comprobante" },
  { status: "PAYMENT_INVALID", label: "Pago inválido", Icon: RiAlertLine, desc: "Debes corregir o reenviar el comprobante" },
  { status: "PAID", label: "Pago confirmado", Icon: RiBankCardLine, desc: "Tu pago fue validado" },
  { status: "PROCESSING", label: "Preparando flores", Icon: RiFlowerLine, desc: "Nuestros floristas están trabajando" },
  { status: "READY", label: "Pedido listo", Icon: RiCheckLine, desc: "Tu arreglo está listo" },
  { status: "OUT_FOR_DELIVERY", label: "En camino", Icon: RiTruckLine, desc: "Tu pedido está en ruta" },
  { status: "DELIVERED", label: "Entregado", Icon: RiGiftLine, desc: "¡Tu pedido llegó!" },
];

export default function SeguimientoPage() {
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token") || "";
  const lastAutoSearch = useRef("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState("");
  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat("es-CO", { dateStyle: "long", timeStyle: "short" }),
    []
  );

  const currentIdx = order ? STEPS.findIndex((s) => s.status === order.status) : -1;
  const historyStatuses = new Set<string>(
    Array.isArray(order?.statusHistory)
      ? order.statusHistory.map((entry: any) => entry.status)
      : []
  );
  if (order?.status) historyStatuses.add(order.status);
  const statusLabel = order ? STATUS_LABELS[order.status] || order.status : "";
  const paymentMethodLabel = order?.paymentMethod?.visibleLabel || order?.paymentMethod?.provider || order?.paymentMethod?.title || "Método de pago";
  const visibleSteps = STEPS.filter((step) => {
    if (step.status === "PAYMENT_INVALID") {
      return historyStatuses.has(step.status);
    }
    return true;
  });
  const lastUpdatedAt = useMemo(() => {
    if (!order) return null;
    const history = Array.isArray(order.statusHistory) ? order.statusHistory : [];
    const lastEntry = history[history.length - 1];
    return lastEntry?.createdAt || order.updatedAt || order.createdAt || null;
  }, [order]);

  const alertText = useMemo(() => {
    if (!order) return "";
    if (order.status === "PENDING_PAYMENT_CONFIRMATION") {
      return "Estamos validando tu pago. Apenas confirmemos el comprobante, verás la actualización en esta guía.";
    }
    if (order.status === "PAYMENT_INVALID") {
      return "Tu comprobante fue marcado como inválido. Revisa el detalle y sube uno nuevo para continuar.";
    }
    return "";
  }, [order]);

  const runSearch = async (query: string) => {
    const cleanToken = query.trim().toUpperCase();
    if (!cleanToken) {
      setError("Ingresa tu guía para continuar.");
      setOrder(null);
      return;
    }

    setLoading(true);
    setError("");
    setOrder(null);
    try {
      const res = await fetch(`/api/seguimiento?token=${cleanToken}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se encontró el pedido");
      setOrder(data);
    } catch (e: any) {
      setError(e.message || "No fue posible cargar la guía");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!tokenFromUrl || lastAutoSearch.current === tokenFromUrl) return;
    lastAutoSearch.current = tokenFromUrl;
    setToken(tokenFromUrl.toUpperCase());
    void runSearch(tokenFromUrl);
  }, [tokenFromUrl]);

  const handleSearch = () => void runSearch(token);

  return (
    <main className="min-h-screen bg-[#fdfcf8]">
      <Header />
      <div className="pt-16">
        <section className="relative overflow-hidden bg-gradient-to-br from-primary-800 via-primary-700 to-primary-500 text-white">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.45),_transparent_35%),radial-gradient(circle_at_bottom_left,_rgba(255,255,255,0.18),_transparent_30%)]" />
          <div className="relative max-w-6xl mx-auto px-4 py-16 sm:py-20 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 border border-white/20 text-sm mb-6">
              <RiCustomerService2Line size={16} />
              Seguimiento en tiempo real
            </div>
            <h1 className="text-4xl sm:text-5xl font-display font-semibold mb-3" style={{ fontFamily: "var(--font-cormorant),Georgia,serif" }}>
              Seguimiento de pedido
            </h1>
            <p className="text-primary-100 text-base sm:text-lg max-w-2xl mx-auto">
              Ingresa tu guía para ver el estado actual, el pago asociado y el avance del pedido.
            </p>
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-4 py-10 sm:py-12">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 sm:p-6 mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-3">Guía de seguimiento</label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                value={token}
                onChange={(e) => setToken(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="FLR-XXXXXX"
                className="flex-1 border border-gray-200 rounded-2xl px-4 py-4 text-base font-mono tracking-widest focus:outline-none focus:border-primary-400 uppercase"
              />
              <button
                onClick={handleSearch}
                disabled={loading}
                className="bg-primary-600 text-white px-6 py-4 rounded-2xl hover:bg-primary-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 min-w-[120px]"
              >
                {loading ? <RiLoader4Line className="animate-spin" size={18} /> : <RiSearchLine size={18} />}
                Buscar
              </button>
            </div>
            {error && (
              <p className="text-red-500 text-sm mt-3 flex items-center gap-1.5">
                <RiCloseCircleLine size={15} /> {error}
              </p>
            )}
          </div>

          <AnimatePresence mode="wait">
            {order ? (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
                className="space-y-6"
              >
                <div className="grid lg:grid-cols-[1.2fr_.8fr] gap-6">
                  <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-7">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                      <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-semibold mb-3">
                          <RiShieldCheckLine size={14} />
                          Guía activa
                        </div>
                        <p className="text-xs text-gray-400 mb-1">Tu guía</p>
                        <p className="text-3xl font-mono font-bold text-primary-600 tracking-widest">{order.trackingToken}</p>
                      </div>

                      <div className="text-left sm:text-right">
                        <p className="text-xs text-gray-400">Estado actual</p>
                        <span className="inline-flex mt-1 items-center px-3 py-1.5 rounded-full bg-primary-50 text-primary-700 text-sm font-semibold">
                          {statusLabel}
                        </span>
                        <p className="text-xs text-gray-400 mt-3">Total</p>
                        <p className="font-bold text-2xl text-gray-900">{formatPrice(order.total)}</p>
                      </div>
                    </div>

                    {alertText && (
                      <div className={`rounded-2xl p-4 mb-6 text-sm border ${order.status === "PAYMENT_INVALID" ? "bg-red-50 border-red-200 text-red-700" : "bg-amber-50 border-amber-200 text-amber-700"}`}>
                        {alertText}
                      </div>
                    )}

                    <div className="grid sm:grid-cols-2 gap-4 mb-6">
                      <div className="rounded-2xl bg-gray-50 p-4">
                        <p className="text-xs text-gray-400 mb-1">Cliente</p>
                        <p className="font-semibold text-gray-900">{order.customerName}</p>
                      </div>
                      <div className="rounded-2xl bg-gray-50 p-4">
                        <p className="text-xs text-gray-400 mb-1">Entrega estimada</p>
                        <p className="font-semibold text-gray-900">{order.estimatedTime}</p>
                      </div>
                      <div className="rounded-2xl bg-gray-50 p-4 sm:col-span-2">
                        <div className="flex items-start gap-2">
                          <RiMapPin2Line className="text-primary-500 mt-0.5" size={16} />
                          <div>
                            <p className="text-xs text-gray-400 mb-1">Dirección</p>
                            <p className="font-medium text-gray-800">{order.address}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {visibleSteps.map((step, idx) => {
                        const originalIdx = STEPS.findIndex((s) => s.status === step.status);
                        const done = originalIdx < currentIdx && historyStatuses.has(step.status);
                        const active = step.status === order.status;
                        const nextVisibleStep = visibleSteps[idx + 1];
                        const showConnector = Boolean(nextVisibleStep);
                        const stepHistory = Array.isArray(order.statusHistory)
                          ? order.statusHistory.find((entry: any) => entry.status === step.status)
                          : null;
                        const stepDate = stepHistory?.createdAt || (active ? order.updatedAt : null);
                        return (
                          <div key={step.status} className="flex items-start gap-4">
                            <div className="flex flex-col items-center">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                                done ? "bg-green-100 text-green-600" : active ? "bg-primary-100 text-primary-600 ring-4 ring-primary-50" : "bg-gray-100 text-gray-300"
                              }`}>
                                {done ? <RiCheckboxCircleLine size={18} /> : active ? <step.Icon size={16} /> : <RiRadioButtonLine size={16} />}
                              </div>
                              {showConnector && <div className={`w-0.5 h-10 mt-1 ${done ? "bg-green-300" : "bg-gray-100"}`} />}
                            </div>
                            <div className={`pt-1.5 pb-2 ${!done && !active ? "opacity-40" : ""}`}>
                              <p className={`text-sm font-semibold ${active ? "text-primary-700" : done ? "text-green-700" : "text-gray-400"}`}>
                                {step.label}
                              </p>
                              {(done || active) && <p className="text-xs text-gray-400 mt-0.5">{step.desc}</p>}
                              {stepDate && (
                                <p className="text-[11px] text-gray-400 mt-1">
                                  Actualizado: {dateFormatter.format(new Date(stepDate))}
                                </p>
                              )}
                              {active && (
                                <span className="inline-flex items-center gap-1 bg-primary-100 text-primary-700 text-xs px-2 py-0.5 rounded-full mt-1">
                                  <span className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-pulse" />
                                  Estado actual
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                      <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                        <RiBankCardLine className="text-primary-500" /> Pago asociado
                      </h2>
                      <div className="rounded-2xl bg-gray-50 p-4">
                        <p className="text-xs text-gray-400 mb-1">Método</p>
                        <p className="font-semibold text-gray-900">{paymentMethodLabel}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          {order.paymentMethod?.type === "QR"
                            ? "Escanea el código QR con tu app bancaria."
                            : order.paymentMethod?.type === "BANK_ACCOUNT"
                              ? "Usa los datos de la cuenta para hacer la transferencia."
                              : "Sigue las instrucciones configuradas por el administrador."}
                        </p>
                      </div>
                      {order.paymentMethod?.provider && (
                        <p className="text-sm text-gray-600 mt-4">
                          <span className="text-gray-400">Proveedor:</span> {order.paymentMethod.provider}
                        </p>
                      )}
                      {order.paymentMethod?.accountNumber && (
                        <p className="font-mono text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 inline-block mt-3">
                          {order.paymentMethod.accountNumber}
                        </p>
                      )}
                      {order.paymentMethod?.details && (
                        <p className="text-sm text-gray-500 mt-3 whitespace-pre-line">{order.paymentMethod.details}</p>
                      )}
                    </div>

                    <div className="bg-primary-50 border border-primary-100 rounded-3xl p-6">
                      <h2 className="font-semibold text-lg mb-3 flex items-center gap-2 text-primary-900">
                        <RiTimeLine className="text-primary-500" /> Resumen rápido
                      </h2>
                      <div className="space-y-3 text-sm">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-gray-500">Pedido</span>
                          <span className="font-semibold text-gray-900">{order.customerName}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-gray-500">Estado</span>
                          <span className="font-semibold text-primary-700">{statusLabel}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-gray-500">Actualización</span>
                          <span className="font-semibold text-gray-900">
                            {lastUpdatedAt ? dateFormatter.format(new Date(lastUpdatedAt)) : "—"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8 text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center mx-auto mb-4">
                  <RiSearchLine size={30} />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Busca tu pedido</h2>
                <p className="text-gray-500 text-sm max-w-lg mx-auto">
                  Escribe tu guía para ver el estado en tiempo real, el método de pago asociado y el progreso del pedido.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <Footer />
    </main>
  );
}
