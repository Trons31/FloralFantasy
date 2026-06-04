"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { RiShoppingBagLine, RiFlowerLine, RiStarLine, RiArrowRightLine } from "react-icons/ri";
import { formatPrice } from "@/lib/utils";
import { useCartStore } from "@/store/cartStore";
import { nanoid } from "nanoid";
import { toast } from "sonner";

export default function FeaturedProducts({ products }: { products: any[] }) {
  const { addItem, toggleCart } = useCartStore();

  const handleAdd = (e: React.MouseEvent, p: any) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      id: nanoid(), productId: p.id, name: p.name, price: p.price,
      image: p.images?.find((i: any) => i.isMain)?.url || p.images?.[0]?.url || "",
      quantity: 1, preparationTimeValue: 0,
      preparationTimeUnit: "MINUTES", deliveryLeadDays: p.deliveryLeadDays || 0, addons: [],
    });
    toast.success(`${p.name} agregado al carrito`);
    toggleCart();
  };

  if (products.length === 0) return null;

  return (
    <section className="py-20 bg-[#fdfcf8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className="flex items-end justify-between mb-12">
          <motion.div initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}}>
            <p className="text-primary-600 text-xs font-bold tracking-[0.2em] uppercase mb-2">Nuestros arreglos</p>
            <h2 className="font-display font-semibold text-gray-900"
              style={{fontFamily:"var(--font-cormorant),Georgia,serif", fontSize:"clamp(2rem,4vw,3rem)", lineHeight:1.1}}>
              Flores más amadas
            </h2>
          </motion.div>
          <motion.div initial={{opacity:0}} whileInView={{opacity:1}} viewport={{once:true}}>
            <Link href="/flores"
              className="hidden sm:flex items-center gap-2 text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors group">
              Ver todo <RiArrowRightLine size={15} className="group-hover:translate-x-1 transition-transform"/>
            </Link>
          </motion.div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-10">
          {products.map((p, i) => {
            const img = p.images?.find((x: any) => x.isMain)?.url || p.images?.[0]?.url || "";
            return (
              <motion.div
                key={p.id}
                initial={{opacity:0,y:24}} whileInView={{opacity:1,y:0}}
                viewport={{once:true}} transition={{delay:i*0.06}}
                className="group"
              >
                {/* Image — hover shows cart button */}
                <Link href={`/flores/${p.id}`}
                  className="block relative overflow-hidden rounded-2xl aspect-square mb-4 bg-gray-50">
                  {img ? (
                    <img src={img} alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"/>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <RiFlowerLine className="text-gray-200" size={48}/>
                    </div>
                  )}

                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                    {p.featured && (
                      <span className="bg-primary-600 text-white text-[10px] px-2.5 py-1 rounded-full font-bold flex items-center gap-1 shadow-sm">
                        <RiStarLine size={8}/> Top
                      </span>
                    )}
                    {p.requiresSpecialOrder && (
                      <span className="bg-amber-500 text-white text-[10px] px-2.5 py-1 rounded-full font-bold shadow-sm">
                        Encargo
                      </span>
                    )}
                  </div>

                  {/* Hover overlay with cart button */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-all duration-300 flex items-end justify-center pb-4 opacity-0 group-hover:opacity-100">
                    <button
                      onClick={(e) => handleAdd(e, p)}
                      className="inline-flex w-auto max-w-[calc(100%-1.25rem)] items-center gap-2 whitespace-nowrap bg-white text-gray-900 text-[11px] font-semibold px-4 py-2.5 rounded-full shadow-lg hover:bg-primary-600 hover:text-white transition-all duration-200 translate-y-3 group-hover:translate-y-0"
                    >
                      <RiShoppingBagLine size={13}/> Añadir al carrito
                    </button>
                  </div>
                </Link>

                {/* Info below — centered, no button */}
                <div className="text-center">
                  <h3 className="font-medium text-gray-900 text-sm mb-1 line-clamp-1">{p.name}</h3>
                  
                  <span className="font-bold text-gray-900 text-base">{formatPrice(p.price)}</span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Mobile CTA */}
        <div className="sm:hidden text-center mt-8">
          <Link href="/flores"
            className="inline-flex items-center gap-2 border-2 border-primary-600 text-primary-600 px-8 py-3 rounded-full font-semibold text-sm hover:bg-primary-600 hover:text-white transition-all">
            Ver todo el catálogo <RiArrowRightLine size={14}/>
          </Link>
        </div>
      </div>
    </section>
  );
}
