"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  RiAddLine,
  RiArrowRightLine,
  RiCloseLine,
  RiDeleteBinLine,
  RiGiftLine,
  RiShoppingBagLine,
  RiShieldCheckLine,
  RiSubtractLine,
  RiTimeLine,
} from "react-icons/ri";
import Link from "next/link";
import { useCartStore } from "@/store/cartStore";
import { formatPrice, formatDeliveryLeadDays } from "@/lib/utils";
import { DEFAULT_DELIVERY_FEE } from "@/lib/site-settings";

export default function CartDrawer() {
  const { items, isOpen, toggleCart, removeItem, updateQuantity, getTotalPrice, getEstimatedTime, getDeliveryLeadDays } = useCartStore();
  const [deliveryFee, setDeliveryFee] = useState(DEFAULT_DELIVERY_FEE);

  const subtotal = getTotalPrice();
  const total = subtotal + deliveryFee;
  const est = getEstimatedTime();
  const delivery = getDeliveryLeadDays();
  const itemCount = items.reduce((count, item) => count + item.quantity, 0);
  const heroItem = items[0];
  const deliveryStatusLabel = delivery.days > 0 ? `${delivery.label} disponible` : "Entrega hoy disponible";

  useEffect(() => {
    fetch("/api/settings")
      .then(r => r.json())
      .then(data => {
        if (typeof data?.deliveryFee === "number") setDeliveryFee(data.deliveryFee);
      })
      .catch(() => {});
  }, []);

  const removeHeroItem = () => {
    if (!heroItem) return;
    removeItem(heroItem.id);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleCart}
            className="fixed inset-0 z-50 bg-black/45 backdrop-blur-md"
          />

          <motion.aside
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 240, damping: 26 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full flex-col overflow-hidden bg-white shadow-[0_30px_80px_rgba(15,23,42,.25)] sm:max-w-[420px] md:max-w-[460px] xl:max-w-[500px] sm:rounded-l-[1.5rem]"
          >
            <div className="border-b border-slate-100 px-3 py-3.5 sm:px-4 sm:py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-500 shadow-sm">
                    <RiShoppingBagLine size={17} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold tracking-tight text-slate-950 sm:text-base">Mi carrito</h2>
                      <span className="grid h-6 min-w-6 place-items-center rounded-full bg-primary-50 px-1.5 text-[10px] font-bold text-primary-500">
                        {itemCount}
                      </span>
                    </div>
                    <p className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-600 sm:text-[11px]">
                      <RiShieldCheckLine className="text-emerald-500" size={13} />
                      <span>
                        Entrega <strong className="text-emerald-600">{delivery.days > 0 ? "programada" : "hoy"}</strong> disponible
                      </span>
                    </p>
                    <p className="mt-0.5 text-[9px] text-slate-400">{deliveryStatusLabel}</p>
                  </div>
                </div>

                <button
                  onClick={toggleCart}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-100 bg-white text-slate-600 transition hover:border-primary-200 hover:text-primary-500"
                  aria-label="Cerrar carrito"
                >
                  <RiCloseLine size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-3 sm:px-4 sm:py-4">
              {items.length === 0 ? (
                <div className="grid min-h-[46vh] place-items-center text-center">
                  <div className="max-w-sm">
                    <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-50 text-slate-300">
                      <RiShoppingBagLine size={28} />
                    </div>
                    <p className="text-sm font-semibold text-slate-900">Tu carrito está vacío</p>
                    <p className="mt-1 text-[11px] leading-5 text-slate-500">Agrega flores para comenzar tu compra.</p>
                    <button
                      onClick={toggleCart}
                      className="mt-4 inline-flex h-9 items-center justify-center rounded-full bg-primary-600 px-4 text-xs font-semibold text-white transition hover:bg-primary-700"
                    >
                      Ver catálogo
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <article className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,.08)]">
                    <div className="grid gap-2.5 p-2.5 sm:grid-cols-[96px_1fr] sm:p-3">
                      <div className="relative">
                        <img
                          src={heroItem?.image || "https://images.unsplash.com/photo-1487530811015-780a34f1e98d?w=1000"}
                          alt={heroItem?.name || "Producto"}
                          className="aspect-square w-full rounded-[0.9rem] object-cover"
                        />
                      </div>

                      <div className="flex min-w-0 flex-col">
                        <div className="flex items-start justify-between gap-1.5">
                          <div className="min-w-0">
                            <h3 className="truncate text-xs font-bold tracking-tight text-slate-900 sm:text-sm">
                              {heroItem?.name || "Tu pedido"}
                            </h3>
                            <p className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                              <RiTimeLine size={11} />
                              {heroItem ? formatDeliveryLeadDays(heroItem.deliveryLeadDays || 0) : "Mismo día"}
                            </p>
                          </div>

                          <button
                            onClick={removeHeroItem}
                            className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-primary-100 text-primary-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-500"
                            aria-label="Eliminar producto"
                          >
                            <RiDeleteBinLine size={14} />
                          </button>
                        </div>

                        <p className="mt-2 text-base font-bold tracking-tight text-primary-500 sm:text-lg">
                          {heroItem ? formatPrice(heroItem.subtotal) : ""}
                        </p>

                        <div className="mt-2.5 flex flex-wrap items-center gap-2">
                          <div className="inline-flex items-center rounded-full border border-slate-200 bg-white p-0.5 shadow-sm">
                            <button
                              onClick={() => heroItem && updateQuantity(heroItem.id, heroItem.quantity - 1)}
                              className="grid h-7 w-7 place-items-center rounded-full text-slate-400 transition hover:bg-slate-50 hover:text-primary-500"
                              aria-label="Disminuir cantidad"
                            >
                              <RiSubtractLine size={12} />
                            </button>
                            <span className="min-w-8 px-1.5 text-center text-[11px] font-semibold text-slate-900">
                              {heroItem?.quantity || 0}
                            </span>
                            <button
                              onClick={() => heroItem && updateQuantity(heroItem.id, heroItem.quantity + 1)}
                              className="grid h-7 w-7 place-items-center rounded-full text-primary-500 transition hover:bg-primary-50"
                              aria-label="Aumentar cantidad"
                            >
                              <RiAddLine size={12} />
                            </button>
                          </div>
                        </div>

                        {items.length > 1 && (
                          <p className="mt-1.5 text-[10px] font-medium text-slate-500">
                            Tienes {items.length - 1} producto{items.length - 1 === 1 ? "" : "s"} más en el carrito.
                          </p>
                        )}
                      </div>
                    </div>
                  </article>

                  <div className="overflow-hidden rounded-[1.25rem] border border-rose-100 bg-gradient-to-r from-rose-50 to-pink-50 px-3 py-2.5 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-primary-500 shadow-sm">
                        <RiGiftLine size={17} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-slate-900">Haz feliz a alguien especial</p>
                        <p className="mt-0.5 text-[11px] text-slate-600">Dedicatoria gratis en todos los pedidos.</p>
                      </div>
                      <div className="hidden text-primary-300 sm:block">
                        <RiGiftLine size={34} />
                      </div>
                    </div>
                  </div>

                  <section className="space-y-4">
                    <h3 className="text-sm font-bold tracking-tight text-slate-900">Resumen de tu pedido</h3>
                    <div className="rounded-[1.25rem] border border-slate-200 bg-white p-3 shadow-[0_12px_30px_rgba(15,23,42,.05)]">
                      <div className="space-y-2.5 text-[11px] text-slate-600 sm:text-xs">
                        <div className="flex items-center justify-between gap-4">
                          <span>Subtotal</span>
                          <span className="font-medium text-slate-700">{formatPrice(subtotal)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span>Domicilio</span>
                          <span className="font-medium text-slate-700">{formatPrice(deliveryFee)}</span>
                        </div>
                      </div>
                      <div className="my-3 border-t border-slate-200" />
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-sm font-bold text-slate-900">Total</span>
                        <span className="text-lg font-extrabold tracking-tight text-primary-500">{formatPrice(total)}</span>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 px-3 py-2 text-[11px] text-slate-600 sm:text-xs">
                      <RiShieldCheckLine className="inline-flex -translate-y-0.5 text-emerald-500" size={14} />
                      <span className="ml-2">
                        Compra <strong className="text-emerald-600">segura</strong> y protegida
                      </span>
                    </div>

                    {est.value > 0 && (
                      <div className="flex items-center gap-2 rounded-2xl border border-amber-100 bg-amber-50 px-3 py-2 text-[11px] text-amber-700 sm:text-xs">
                        <RiTimeLine size={14} />
                        <span>Entrega estimada: <strong>{est.label}</strong></span>
                      </div>
                    )}

                    {delivery.days > 0 && (
                      <div className="flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-700 sm:text-xs">
                        <RiTimeLine size={14} />
                        <span>{delivery.label} · <strong>{delivery.dateLabel}</strong></span>
                      </div>
                    )}

                    <Link
                      href="/checkout"
                      onClick={toggleCart}
                      className="group inline-flex h-11 w-full items-center justify-center gap-2 rounded-[1.25rem] bg-gradient-to-r from-primary-500 to-[#ff0f60] px-4 text-xs font-bold text-white shadow-[0_18px_40px_rgba(236,18,91,.28)] transition hover:brightness-105 hover:shadow-[0_22px_50px_rgba(236,18,91,.34)]"
                    >
                      Continuar al pago
                      <RiArrowRightLine size={14} className="transition-transform group-hover:translate-x-0.5" />
                    </Link>

                    <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-slate-500">
                      <RiShieldCheckLine size={12} />
                      Tus datos están 100% protegidos
                    </p>
                  </section>
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
