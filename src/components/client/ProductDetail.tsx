"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RiShoppingBagLine, RiTimeLine, RiArrowLeftLine, RiAddLine, RiSubtractLine,
  RiCheckLine, RiFlowerLine, RiGiftLine, RiCloseLine, RiZoomInLine,
  RiGobletLine, RiGlassesLine, RiBearSmileLine, RiCakeLine, RiShoppingBasketLine,
} from "react-icons/ri";
import Link from "next/link";
import { formatPrice, formatDeliveryLeadDays } from "@/lib/utils";
import { useCartStore } from "@/store/cartStore";
import { nanoid } from "nanoid";
import { toast } from "sonner";

const ADDON_ICONS: Record<string, any> = {
  BEBIDA:  RiGobletLine,
  VINO:    RiGlassesLine,
  PELUCHE: RiBearSmileLine,
  DULCE:   RiCakeLine,
  CANASTA: RiShoppingBasketLine,
  OTRO:    RiGiftLine,
};

export default function ProductDetail({ product, addons }: { product: any; addons: any[] }) {
  const [qty, setQty]            = useState(1);
  const [selectedAddons, setSel] = useState<any[]>([]);
  const [mainImg, setMainImg]    = useState(product.images[0]?.url || "");
  const [previewAddon, setPreviewAddon] = useState<any | null>(null);
  const { addItem, toggleCart }  = useCartStore();

  const toggleAddon = (a: any) =>
    setSel(p => p.find(x => x.id === a.id) ? p.filter(x => x.id !== a.id) : [...p, a]);

  const isSelected = (a: any) => !!selectedAddons.find(x => x.id === a.id);

  const total = product.price * qty + selectedAddons.reduce((s: number, a: any) => s + a.price, 0);

  const handleAdd = () => {
    addItem({
      id: nanoid(), productId: product.id, name: product.name, price: product.price,
      image: mainImg, quantity: qty,
      preparationTimeValue: 0,
      preparationTimeUnit: "MINUTES",
      deliveryLeadDays: product.deliveryLeadDays || 0,
      flowers: (product.flowers || []).map((f: any) => ({
        id: f.flower.id,
        name: f.flower.name,
        type: f.flower.type,
        quantity: f.quantity || 1,
      })),
      addons: selectedAddons.map(a => ({ id: a.id, name: a.name, price: a.price, type: a.type })),
    });
    toast.success(`${product.name} agregado al carrito`);
    toggleCart();
  };

  return (
    <>
      <div className="pt-20 max-w-6xl mx-auto px-4 py-10 pb-32 lg:pb-10">
        <Link href="/flores" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-8 transition-colors">
          <RiArrowLeftLine size={16}/> Volver al catálogo
        </Link>

        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">

          {/* ── Galería ── */}
          <div>
            <motion.div layoutId={product.id} className="rounded-3xl overflow-hidden aspect-square mb-4 shadow-xl">
              <img src={mainImg} alt={product.name} className="w-full h-full object-cover"/>
            </motion.div>
            {product.images.length > 1 && (
              <div className="flex gap-3 flex-wrap">
                {product.images.map((img: any) => (
                  <button key={img.id} onClick={() => setMainImg(img.url)}
                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${mainImg === img.url ? "border-primary-500" : "border-transparent opacity-60 hover:opacity-90"}`}>
                    <img src={img.url} alt="" className="w-full h-full object-cover"/>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Panel derecho ── */}
          <div className="flex flex-col gap-3 sm:gap-4">

            <div>
              <p className="text-xs font-semibold text-primary-500 uppercase tracking-widest mb-1">
                {product.category?.name}
              </p>
              <h1 className="text-4xl md:text-5xl font-semibold text-gray-900 leading-tight mb-1.5"
                  style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}>
                {product.name}
              </h1>
              {product.description && (
                <p className="text-gray-400 text-sm leading-snug">{product.description}</p>
              )}
            </div>

            <p className="text-3xl font-bold text-gray-900 leading-none">{formatPrice(product.price)}</p>

            {(product.flowers.length > 0 || product.deliveryLeadDays >= 0) && (
              <div className="flex flex-wrap gap-2 mt-[-2px]">
                {product.flowers.map((f: any) => (
                  <span key={f.id} className="flex items-center gap-1 text-xs bg-primary-50 text-primary-700 px-2.5 py-1.5 rounded-full border border-primary-100">
                    <RiFlowerLine size={11}/> {f.flower.name} x{f.quantity || 1}
                  </span>
                ))}
                <span className="flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1.5 rounded-full border border-emerald-100">
                  <RiTimeLine size={11}/>
                  {formatDeliveryLeadDays(product.deliveryLeadDays || 0)}
                </span>
              </div>
            )}

            {/* ── Addons con foto grande ── */}
            {addons.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <RiGiftLine size={12} className="text-primary-400"/> Agrega algo especial
                </p>

                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                  {addons.map((a: any) => {
                    const sel  = isSelected(a);
                    const Icon = ADDON_ICONS[a.type] || RiGiftLine;
                    return (
                      <div key={a.id} className="flex flex-col">
                        {/* Foto — toca para ver grande */}
                        <div className="relative group/thumb mb-1.5">
                          <div
                            className={`aspect-square rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                              sel ? "border-primary-400" : "border-transparent"
                            }`}
                            onClick={() => setPreviewAddon(a)}
                          >
                            {a.imageUrl ? (
                              <img
                                src={a.imageUrl}
                                alt={a.name}
                                className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className={`w-full h-full flex items-center justify-center ${sel ? "bg-primary-50" : "bg-gray-100"}`}>
                                <Icon size={24} className={sel ? "text-primary-400" : "text-gray-300"}/>
                              </div>
                            )}

                            {/* Overlay zoom hint */}
                            {a.imageUrl && (
                              <div className="absolute inset-0 bg-black/0 group-hover/thumb:bg-black/20 transition-all flex items-center justify-center">
                                <RiZoomInLine size={20} className="text-white opacity-0 group-hover/thumb:opacity-100 transition-opacity drop-shadow"/>
                              </div>
                            )}

                            {/* Check badge */}
                            {sel && (
                              <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center shadow">
                                <RiCheckLine size={11} className="text-white"/>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Info + botón agregar */}
                        <p className="text-xs font-medium text-gray-700 truncate leading-tight">{a.name}</p>
                        <p className="text-xs text-primary-500 mb-1.5">+{formatPrice(a.price)}</p>
                        <button
                          onClick={() => toggleAddon(a)}
                          className={`w-full text-xs py-1.5 rounded-lg font-medium transition-all ${
                            sel
                              ? "bg-primary-100 text-primary-700 hover:bg-primary-200"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {sel ? "Quitar" : "Agregar"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Cantidad + botón desktop */}
            <div className="hidden lg:block space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Cantidad</span>
                <div className="flex items-center gap-3 bg-gray-100 rounded-full p-1">
                  <button onClick={() => setQty(q => Math.max(1, q - 1))}
                    className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors">
                    <RiSubtractLine size={14}/>
                  </button>
                  <span className="w-6 text-center font-semibold text-sm">{qty}</span>
                  <button onClick={() => setQty(q => q + 1)}
                    className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors">
                    <RiAddLine size={14}/>
                  </button>
                </div>
              </div>
              <button onClick={handleAdd}
                className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white py-4 rounded-2xl font-semibold text-sm hover:bg-primary-700 transition-all hover:shadow-lg hover:shadow-primary-200">
                <RiShoppingBagLine size={18}/> Agregar — {formatPrice(total)}
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* ── Barra fija mobile ── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-100 rounded-full p-1">
            <button onClick={() => setQty(q => Math.max(1, q - 1))}
              className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center active:scale-95 transition-all">
              <RiSubtractLine size={14}/>
            </button>
            <span className="w-6 text-center font-semibold text-sm">{qty}</span>
            <button onClick={() => setQty(q => q + 1)}
              className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center active:scale-95 transition-all">
              <RiAddLine size={14}/>
            </button>
          </div>
          <button onClick={handleAdd}
            className="flex-1 flex items-center justify-center gap-2 bg-primary-600 text-white py-3.5 rounded-2xl font-semibold text-sm hover:bg-primary-700 active:scale-[0.98] transition-all">
            <RiShoppingBagLine size={18}/> Agregar — {formatPrice(total)}
          </button>
        </div>
      </div>

      {/* ── Lightbox addon ── */}
      <AnimatePresence>
        {previewAddon && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewAddon(null)}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"/>

            {/* Panel — bottom sheet en mobile, modal en desktop */}
            <motion.div
              className="relative bg-white w-full sm:max-w-sm sm:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl"
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
            >
              {/* Foto grande */}
              <div className="aspect-square w-full bg-gray-100">
                {previewAddon.imageUrl ? (
                  <img
                    src={previewAddon.imageUrl}
                    alt={previewAddon.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    {(() => { const I = ADDON_ICONS[previewAddon.type] || RiGiftLine; return <I size={64} className="text-gray-200"/>; })()}
                  </div>
                )}
              </div>

              {/* Info + acción */}
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg leading-tight">{previewAddon.name}</h3>
                    <p className="text-primary-600 font-bold text-xl mt-0.5">+{formatPrice(previewAddon.price)}</p>
                  </div>
                  <button
                    onClick={() => setPreviewAddon(null)}
                    className="p-2 rounded-full hover:bg-gray-100 text-gray-400 transition-colors"
                  >
                    <RiCloseLine size={20}/>
                  </button>
                </div>

                {product.flowers.length > 0 && (
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Composición del ramo</p>
                    <div className="flex flex-wrap gap-2">
                      {product.flowers.map((f: any) => (
                        <span key={f.id} className="inline-flex items-center gap-1 rounded-full border border-primary-100 bg-white px-3 py-1.5 text-xs font-medium text-primary-700">
                          <RiFlowerLine size={11} />
                          {f.flower.name} x{f.quantity || 1}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => { toggleAddon(previewAddon); setPreviewAddon(null); }}
                  className={`w-full py-3.5 rounded-2xl font-semibold text-sm transition-all ${
                    isSelected(previewAddon)
                      ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      : "bg-primary-600 text-white hover:bg-primary-700"
                  }`}
                >
                  {isSelected(previewAddon) ? "Quitar del pedido" : "Agregar al pedido"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
