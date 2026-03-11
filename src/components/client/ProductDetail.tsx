"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  RiShoppingBagLine, RiTimeLine, RiArrowLeftLine, RiAddLine, RiSubtractLine,
  RiCheckLine, RiFlowerLine, RiGiftLine,
  RiGobletLine, RiGlassesLine, RiBearSmileLine, RiCakeLine, RiShoppingBasketLine,
} from "react-icons/ri";
import Link from "next/link";
import { formatPrice, formatPreparationTime } from "@/lib/utils";
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
  const { addItem, toggleCart }  = useCartStore();

  const toggleAddon = (a: any) =>
    setSel(p => p.find(x => x.id === a.id) ? p.filter(x => x.id !== a.id) : [...p, a]);

  const total = product.price * qty + selectedAddons.reduce((s: number, a: any) => s + a.price, 0);

  const handleAdd = () => {
    addItem({
      id: nanoid(), productId: product.id, name: product.name, price: product.price,
      image: mainImg, quantity: qty,
      preparationTimeValue: product.preparationTimeValue,
      preparationTimeUnit:  product.preparationTimeUnit,
      addons: selectedAddons.map(a => ({ id: a.id, name: a.name, price: a.price, type: a.type })),
    });
    toast.success(`${product.name} agregado al carrito`);
    toggleCart();
  };

  return (
    <div className="pt-20 max-w-6xl mx-auto px-4 py-10">
      <Link href="/flores" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-8 transition-colors">
        <RiArrowLeftLine size={16}/> Volver al catálogo
      </Link>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Images */}
        <div>
          <motion.div layoutId={product.id} className="rounded-3xl overflow-hidden aspect-square mb-4 shadow-xl">
            <img src={mainImg} alt={product.name} className="w-full h-full object-cover"/>
          </motion.div>
          {product.images.length > 1 && (
            <div className="flex gap-3 flex-wrap">
              {product.images.map((img: any) => (
                <button key={img.id} onClick={() => setMainImg(img.url)}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${mainImg === img.url ? "border-primary-500" : "border-transparent"}`}>
                  <img src={img.url} alt="" className="w-full h-full object-cover"/>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <p className="text-sm text-primary-500 uppercase tracking-wide font-medium mb-1">{product.category?.name}</p>
          <h1 className="text-4xl md:text-5xl font-display font-semibold text-gray-900 mb-4"
              style={{fontFamily:"var(--font-cormorant),Georgia,serif"}}>
            {product.name}
          </h1>
          <p className="text-gray-500 leading-relaxed mb-6">{product.description}</p>

          {product.flowers.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-5">
              <span className="text-xs text-gray-500 self-center">Flores:</span>
              {product.flowers.map((f: any) => (
                <span key={f.id} className="flex items-center gap-1 text-xs bg-primary-50 text-primary-700 px-2.5 py-1 rounded-full border border-primary-100">
                  <RiFlowerLine size={11}/> {f.flower.name} ({f.flower.type})
                </span>
              ))}
            </div>
          )}

          {product.preparationTimeValue > 0 && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5 text-amber-700">
              <RiTimeLine size={18}/>
              <div>
                <p className="font-medium text-sm">Tiempo de preparación</p>
                <p className="text-xs">{formatPreparationTime(product.preparationTimeValue, product.preparationTimeUnit)}</p>
              </div>
            </div>
          )}

          <p className="text-3xl font-bold text-gray-900 mb-6">{formatPrice(product.price)}</p>

          {/* Addons */}
          {addons.length > 0 && (
            <div className="mb-6">
              <h3 className="flex items-center gap-2 font-semibold text-gray-900 mb-3">
                <RiGiftLine className="text-primary-500" size={16}/> Agrega algo especial
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {addons.map((a: any) => {
                  const sel  = selectedAddons.find(x => x.id === a.id);
                  const Icon = ADDON_ICONS[a.type] || RiGiftLine;
                  return (
                    <button key={a.id} onClick={() => toggleAddon(a)}
                      className={`flex items-center gap-2 p-3 rounded-xl border-2 text-left transition-all ${sel ? "border-primary-500 bg-primary-50" : "border-gray-200 hover:border-gray-300"}`}>
                      <Icon size={18} className={sel ? "text-primary-600" : "text-gray-400"}/>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-xs truncate">{a.name}</p>
                        <p className="text-xs text-primary-600">+{formatPrice(a.price)}</p>
                      </div>
                      {sel && <RiCheckLine className="text-primary-600 flex-shrink-0" size={14}/>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-3 bg-gray-100 rounded-full p-1">
              <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center hover:bg-gray-50">
                <RiSubtractLine size={14}/>
              </button>
              <span className="w-6 text-center font-medium">{qty}</span>
              <button onClick={() => setQty(q => q + 1)} className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center hover:bg-gray-50">
                <RiAddLine size={14}/>
              </button>
            </div>
          </div>

          <button onClick={handleAdd}
            className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white py-4 rounded-full font-semibold hover:bg-primary-700 transition-all hover:shadow-lg hover:shadow-primary-200">
            <RiShoppingBagLine size={20}/> Agregar — {formatPrice(total)}
          </button>
        </div>
      </div>
    </div>
  );
}