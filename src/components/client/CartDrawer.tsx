"use client";

import { useEffect, useState } from "react";
import {
  RiAddLine,
  RiArrowRightLine,
  RiCloseLine,
  RiDeleteBinLine,
  RiShoppingBagLine,
  RiShieldCheckLine,
  RiSubtractLine,
  RiTimeLine,
  RiTruckLine,
} from "react-icons/ri";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCartStore } from "@/store/cartStore";
import { toast } from "sonner";
import { formatDeliveryDay, formatPrice, formatTime, getEffectiveDeliveryLeadDays } from "@/lib/utils";
import { isPendingOrderExpired, pendingOrderExpiresAt } from "@/lib/pending-order";
import { DEFAULT_DELIVERY_FEE, DEFAULT_SAME_DAY_CUTOFF_TIME } from "@/lib/site-settings";
import { useBodyScrollLock } from "@/lib/scroll-lock";
import { useMinuteTick } from "@/lib/use-minute-tick";
import CartItemCardNote from "@/components/client/CartItemCardNote";

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, getTotalPrice, getDeliveryLeadDays, pendingOrder, clearPendingOrder } = useCartStore();
  const [deliveryFee, setDeliveryFee] = useState(DEFAULT_DELIVERY_FEE);
  const [sameDayCutoffTime, setSameDayCutoffTime] = useState(DEFAULT_SAME_DAY_CUTOFF_TIME);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const pathname = usePathname();
  // Recalcula “hoy / mañana” y el vencimiento del pedido cada minuto.
  const now = useMinuteTick();
  useBodyScrollLock(isOpen);

  // Spec 017: el pedido sin pagar vence a la hora. El carrito vive en toda
  // página con cabecera, así que aquí se olvida (y con él “Mi pedido”).
  const pendingExpired = Boolean(pendingOrder && isPendingOrderExpired(pendingOrder.createdAt, now));
  useEffect(() => {
    if (pendingExpired) clearPendingOrder();
  }, [pendingExpired, clearPendingOrder]);
  const activePending = pendingOrder && !pendingExpired ? pendingOrder : null;
  useEffect(() => {
    if (!isOpen) setConfirmCancel(false);
  }, [isOpen]);

  const cancelPending = async () => {
    if (!activePending) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/orders/${activePending.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackingToken: activePending.trackingToken }),
      });
      const data = await res.json().catch(() => ({}));
      // 404: el pedido ya no existe para este navegador; igual se olvida.
      if (!res.ok && res.status !== 404) throw new Error(data.error || "No fue posible cancelar el pedido");
      clearPendingOrder();
      setConfirmCancel(false);
      toast.success("Pedido cancelado");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No fue posible cancelar el pedido");
    } finally {
      setCancelling(false);
    }
  };

  // Al navegar (p. ej. “Continuar al pago”), el carrito se cierra.
  useEffect(() => {
    closeCart();
  }, [pathname, closeCart]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") closeCart(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, closeCart]);

  const subtotal = getTotalPrice();
  const total = subtotal + deliveryFee;
  const delivery = getDeliveryLeadDays(sameDayCutoffTime);
  const itemCount = items.reduce((count, item) => count + item.quantity, 0);
  const pendingHref = activePending ? `/checkout?token=${activePending.trackingToken}` : "";
  const pendingExpiresLabel = activePending ? formatTime(pendingOrderExpiresAt(activePending.createdAt)) : "";

  const cancelControls = confirmCancel ? (
    <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-left">
      <p className="text-xs font-semibold text-red-800">¿Seguro que quieres cancelar este pedido?</p>
      <div className="mt-2.5 grid grid-cols-2 gap-2">
        <button type="button" onClick={() => setConfirmCancel(false)} disabled={cancelling} className="h-10 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60">
          No, seguir
        </button>
        <button type="button" onClick={cancelPending} disabled={cancelling} className="h-10 rounded-xl bg-red-600 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-60">
          {cancelling ? "Cancelando…" : "Sí, cancelar"}
        </button>
      </div>
    </div>
  ) : (
    <button type="button" onClick={() => setConfirmCancel(true)} className="flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-white text-xs font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-50">
      <RiCloseLine size={15} /> Cancelar pedido
    </button>
  );

  useEffect(() => {
    fetch("/api/settings")
      .then(r => r.json())
      .then(data => {
        if (typeof data?.deliveryFee === "number") setDeliveryFee(data.deliveryFee);
        if (typeof data?.sameDayCutoffTime === "string") setSameDayCutoffTime(data.sameDayCutoffTime);
      })
      .catch(() => {});
  }, []);

  return (
    <>
      {isOpen && (
        <>
          {/* Fade-in corto en CSS, como CliqCut (spec 011). Sin backdrop-blur. */}
          <div
            onClick={closeCart}
            className="fixed inset-0 z-50 animate-fade-in bg-slate-950/45"
            aria-hidden
          />

          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Mi carrito"
            className="fixed right-0 top-0 z-50 flex h-full w-full animate-fade-in flex-col overflow-hidden overscroll-contain bg-white shadow-[0_30px_80px_rgba(15,23,42,.25)] sm:max-w-[420px] md:max-w-[460px] xl:max-w-[500px] sm:rounded-l-[1.5rem]"
          >
            <div className="shrink-0 border-b border-slate-100 px-3 py-3.5 sm:px-4 sm:py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-500">
                    <RiShoppingBagLine size={17} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold tracking-tight text-slate-950 sm:text-base">Mi carrito</h2>
                      <span className="grid h-6 min-w-6 place-items-center rounded-full bg-primary-50 px-1.5 text-[10px] font-bold text-primary-500">
                        {itemCount}
                      </span>
                    </div>
                    {items.length > 0 && (
                      <p className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-600 sm:text-[11px]">
                        <RiTruckLine className="text-emerald-500" size={13} />
                        <span>
                          Entrega <strong className="text-emerald-600">{formatDeliveryDay(delivery.days)}</strong>
                        </span>
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={closeCart}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-100 bg-white text-slate-600 transition hover:border-primary-200 hover:text-primary-500"
                  aria-label="Cerrar carrito"
                >
                  <RiCloseLine size={18} />
                </button>
              </div>
            </div>

            {/* Lista: única zona con scroll (spec 007). */}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 sm:px-4 sm:py-4">
              {activePending && items.length === 0 ? (
                // Spec 017: sin productos, el pedido en proceso es lo único que se ve.
                <div className="grid min-h-full place-items-center py-6 text-center">
                  <div className="w-full max-w-sm">
                    <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                      <RiTimeLine size={26} />
                    </span>
                    <h3 className="mt-4 text-base font-bold tracking-tight text-slate-950">Tienes un pedido en proceso</h3>
                    <p className="mx-auto mt-1 max-w-[18rem] text-[12px] leading-5 text-slate-500">
                      Sube el comprobante para que empecemos a prepararlo.
                    </p>
                    <div className="mt-5 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                      <div className="flex items-center justify-between gap-3 text-[12px]">
                        <span className="text-slate-500">Guía</span>
                        <span className="font-mono font-semibold tracking-wider text-slate-900">{activePending.trackingToken}</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-3 border-t border-slate-100 pt-2 text-[12px]">
                        <span className="text-slate-500">Total</span>
                        <span className="text-sm font-bold text-primary-500">{formatPrice(activePending.total)}</span>
                      </div>
                    </div>
                    <p className="mt-3 text-[11px] leading-4 text-amber-700">
                      Si no subes el comprobante, se cancela a las <strong>{pendingExpiresLabel}</strong>.
                    </p>
                    <Link
                      href={pendingHref}
                      className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary-500 text-xs font-bold text-white transition hover:bg-primary-600"
                    >
                      Completar pago <RiArrowRightLine size={14} />
                    </Link>
                    <div className="mt-3">{cancelControls}</div>
                  </div>
                </div>
              ) : null}
              {activePending && items.length > 0 && (
                <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-3">
                  <div className="flex items-start gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-amber-600">
                      <RiTimeLine size={16} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-amber-900">Tienes un pedido pendiente de pago</p>
                      <p className="mt-0.5 text-[11px] leading-4 text-amber-800">
                        #{activePending.trackingToken} · {formatPrice(activePending.total)}. Se cancela a las {pendingExpiresLabel} si no subes el comprobante.
                      </p>
                    </div>
                  </div>
                  <Link
                    href={pendingHref}
                    className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-amber-500 text-xs font-bold text-white transition hover:bg-amber-600"
                  >
                    Completar pago <RiArrowRightLine size={14} />
                  </Link>
                  <div className="mt-2 text-center">{cancelControls}</div>
                </div>
              )}
              {activePending && items.length === 0 ? null : items.length === 0 ? (
                <div className="grid min-h-[46vh] place-items-center text-center">
                  <div className="max-w-sm">
                    <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-50 text-slate-300">
                      <RiShoppingBagLine size={28} />
                    </div>
                    <p className="text-sm font-semibold text-slate-900">Tu carrito está vacío</p>
                    <p className="mt-1 text-[11px] leading-5 text-slate-500">Agrega flores para comenzar tu compra.</p>
                    <button
                      onClick={closeCart}
                      className="mt-4 inline-flex h-9 items-center justify-center rounded-full bg-primary-600 px-4 text-xs font-semibold text-white transition hover:bg-primary-700"
                    >
                      Ver catálogo
                    </button>
                  </div>
                </div>
              ) : (
                <ul className="space-y-3">
                  {items.map(item => (
                    <li key={item.id} className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-2.5">
                      {item.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.image} alt={item.name} className="h-20 w-20 shrink-0 rounded-xl object-cover" />
                      ) : (
                        <span className="grid h-20 w-20 shrink-0 place-items-center rounded-xl bg-slate-50 text-slate-300">
                          <RiShoppingBagLine size={22} />
                        </span>
                      )}
                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="truncate text-xs font-bold tracking-tight text-slate-900 sm:text-sm">{item.name}</h3>
                            <p className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                              <RiTimeLine size={11} />
                              Entrega {formatDeliveryDay(getEffectiveDeliveryLeadDays(item.deliveryLeadDays || 0, sameDayCutoffTime))}
                            </p>
                            <CartItemCardNote item={item} />
                          </div>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-primary-100 text-primary-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-500"
                            aria-label={`Eliminar ${item.name}`}
                          >
                            <RiDeleteBinLine size={14} />
                          </button>
                        </div>
                        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                          <div className="inline-flex items-center rounded-full border border-slate-200 bg-white p-0.5">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="grid h-7 w-7 place-items-center rounded-full text-slate-400 transition hover:bg-slate-50 hover:text-primary-500"
                              aria-label={`Disminuir cantidad de ${item.name}`}
                            >
                              <RiSubtractLine size={12} />
                            </button>
                            <span className="min-w-8 px-1.5 text-center text-[11px] font-semibold text-slate-900">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="grid h-7 w-7 place-items-center rounded-full text-primary-500 transition hover:bg-primary-50"
                              aria-label={`Aumentar cantidad de ${item.name}`}
                            >
                              <RiAddLine size={12} />
                            </button>
                          </div>
                          <p className="text-sm font-bold tracking-tight text-primary-500 sm:text-base">{formatPrice(item.subtotal)}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Resumen fijo: el botón de pago siempre a la vista. */}
            {items.length > 0 && (
              <div className="shrink-0 border-t border-slate-100 bg-white px-3 pb-[max(.75rem,env(safe-area-inset-bottom))] pt-3 sm:px-4 sm:pt-4">
                <div className="space-y-1.5 text-[11px] text-slate-600 sm:text-xs">
                  <div className="flex items-center justify-between gap-4">
                    <span>Subtotal</span>
                    <span className="font-medium text-slate-700">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span>Domicilio</span>
                    <span className="font-medium text-slate-700">{formatPrice(deliveryFee)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-2">
                    <span className="text-sm font-bold text-slate-900">Total</span>
                    <span className="text-lg font-extrabold tracking-tight text-primary-500">{formatPrice(total)}</span>
                  </div>
                </div>

                <Link
                  href="/checkout"
                  onClick={closeCart}
                  className="group mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary-500 px-4 text-xs font-bold text-white transition hover:bg-primary-600"
                >
                  Continuar al pago
                  <RiArrowRightLine size={14} className="transition-transform group-hover:translate-x-0.5" />
                </Link>

                <div className="mt-2.5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
                  <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700">
                    <RiTruckLine size={13} /> {capitalize(`entrega ${formatDeliveryDay(delivery.days)}`)}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <RiShieldCheckLine size={13} className="text-emerald-500" /> Compra segura y protegida
                  </span>
                </div>
              </div>
            )}
          </aside>
        </>
      )}
    </>
  );
}
