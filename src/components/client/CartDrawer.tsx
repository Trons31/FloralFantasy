"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RiCloseLine, RiShoppingBagLine, RiAddLine, RiSubtractLine,
  RiDeleteBinLine, RiArrowRightLine, RiTimeLine,
} from "react-icons/ri";
import Link from "next/link";
import { useCartStore } from "@/store/cartStore";
import { formatPrice, formatDeliveryLeadDays } from "@/lib/utils";
import { DEFAULT_DELIVERY_FEE } from "@/lib/site-settings";

export default function CartDrawer() {
  const { items, isOpen, toggleCart, removeItem, updateQuantity, getTotalPrice, getEstimatedTime, getDeliveryLeadDays } = useCartStore();
  const [deliveryFee, setDeliveryFee] = useState(DEFAULT_DELIVERY_FEE);
  const subtotal = getTotalPrice();
  const total    = subtotal + deliveryFee;
  const est      = getEstimatedTime();
  const delivery = getDeliveryLeadDays();

  useEffect(() => {
    fetch("/api/settings")
      .then(r => r.json())
      .then(data => {
        if (typeof data?.deliveryFee === "number") setDeliveryFee(data.deliveryFee);
      })
      .catch(() => {});
  }, []);

  return (
    <>
    
      {isOpen && (
        <>
          <div
            onClick={toggleCart} className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm"/>

          <div 
            className="fixed fade-in right-0 top-0 bottom-0 w-full max-w-md bg-white z-50 flex flex-col shadow-2xl">

            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <RiShoppingBagLine className="text-primary-600" size={15}/>
                </div>
                <h2 className="font-semibold text-lg">Mi carrito ({items.length})</h2>
              </div>
              <button onClick={toggleCart} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <RiCloseLine size={20}/>
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {items.length === 0 ? (
                <div className="text-center py-16">
                  <div className="flex justify-center mb-4 text-gray-200">
                    <RiShoppingBagLine size={64}/>
                  </div>
                  <p className="text-gray-500 font-medium">Tu carrito está vacío</p>
                  <p className="text-gray-400 text-sm mt-1 mb-6">Agrega flores para comenzar</p>
                  <button onClick={toggleCart} className="bg-primary-600 text-white px-6 py-3 rounded-full font-medium hover:bg-primary-700 transition-colors">
                    Ver catálogo
                  </button>
                </div>
              ) : items.map(item => (
                <div key={item.id} className="flex gap-3 bg-gray-50 rounded-2xl p-3">
                  <img
                    src={item.image || "https://images.unsplash.com/photo-1487530811015-780a34f1e98d?w=100"}
                    alt={item.name} className="w-20 h-20 object-cover rounded-xl flex-shrink-0"/>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm leading-tight mb-0.5 truncate">{item.name}</h4>
                    {item.preparationTimeValue > 0 && (
                      <p className="text-xs text-amber-600 flex items-center gap-1 mb-1">
                        <RiTimeLine size={10}/>
                        {item.preparationTimeValue} {item.preparationTimeUnit === "MINUTES" ? "min" : item.preparationTimeUnit === "HOURS" ? "h" : "d"} prep.
                      </p>
                    )}
                    {item.deliveryLeadDays > 0 && (
                      <p className="text-xs text-emerald-600 flex items-center gap-1 mb-1">
                        <RiTimeLine size={10}/>
                        {formatDeliveryLeadDays(item.deliveryLeadDays)}
                      </p>
                    )}
                    {item.addons.length > 0 && (
                      <p className="text-xs text-gray-400 mb-1">+ {item.addons.map((a: any) => a.name).join(", ")}</p>
                    )}
                    <p className="text-primary-600 font-semibold text-sm">{formatPrice(item.subtotal)}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:border-primary-300 transition-colors">
                        <RiSubtractLine size={10}/>
                      </button>
                      <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:border-primary-300 transition-colors">
                        <RiAddLine size={10}/>
                      </button>
                      <button onClick={() => removeItem(item.id)} className="ml-auto text-gray-400 hover:text-red-500 transition-colors">
                        <RiDeleteBinLine size={14}/>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t p-5 space-y-4">
                {est.value > 0 && (
                  <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700">
                    <RiTimeLine size={16}/>
                    <span>Entrega estimada: <strong>{est.label}</strong></span>
                  </div>
                )}
                {delivery.days > 0 && (
                  <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-sm text-emerald-700">
                    <RiTimeLine size={16}/>
                    <span>{delivery.label} · <strong>{delivery.dateLabel}</strong></span>
                  </div>
                )}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
                  <div className="flex justify-between text-gray-600"><span>Domicilio</span><span>{formatPrice(deliveryFee)}</span></div>
                  <div className="flex justify-between font-bold text-base pt-2 border-t">
                    <span>Total</span><span className="text-primary-600">{formatPrice(total)}</span>
                  </div>
                </div>
                <Link href="/checkout" onClick={toggleCart}
                  className="flex items-center justify-center gap-2 w-full bg-primary-600 text-white py-4 rounded-full font-semibold hover:bg-primary-700 transition-all hover:shadow-lg hover:shadow-primary-200">
                  Proceder al pago <RiArrowRightLine size={18}/>
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
