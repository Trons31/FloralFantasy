"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { RiShoppingBagLine, RiTimeLine, RiSparklingLine, RiStarLine, RiFlowerLine } from "react-icons/ri";
import { formatPrice, formatPreparationTime } from "@/lib/utils";
import { useCartStore } from "@/store/cartStore";
import { nanoid } from "nanoid";
import { toast } from "sonner";

export default function FeaturedProducts({ products }: { products: any[] }) {
  const { addItem, toggleCart } = useCartStore();

  const handleAdd = (p: any) => {
    addItem({
      id: nanoid(), productId: p.id, name: p.name, price: p.price,
      image: p.images?.find((i: any) => i.isMain)?.url || p.images?.[0]?.url || "",
      quantity: 1, preparationTimeValue: p.preparationTimeValue,
      preparationTimeUnit: p.preparationTimeUnit, addons: [],
    });
    toast.success(`${p.name} agregado al carrito`);
    toggleCart();
  };

  if (products.length === 0) return null;

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <motion.div initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}}
            className="inline-flex items-center gap-2 bg-primary-50 border border-primary-100 rounded-full px-4 py-2 mb-4">
            <RiSparklingLine className="text-primary-600" size={14}/>
            <span className="text-sm text-primary-700 font-medium">Más vendidos</span>
          </motion.div>
          <motion.h2 initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:0.1}}
            className="text-3xl md:text-5xl font-display font-semibold text-gray-900"
            style={{fontFamily:"var(--font-cormorant),Georgia,serif"}}>
            Flores más amadas
          </motion.h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((p, i) => {
            const img = p.images?.find((x: any) => x.isMain)?.url || p.images?.[0]?.url || "";
            return (
              <motion.div key={p.id} initial={{opacity:0,y:30}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*0.07}}
                className="flower-card bg-white rounded-2xl overflow-hidden border border-gray-100 group">
                <Link href={`/flores/${p.id}`}>
                  <div className="relative overflow-hidden aspect-square">
                    {img ? (
                      <img src={img} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"/>
                    ) : (
                      <div className="w-full h-full bg-gray-50 flex items-center justify-center text-gray-200">
                        <RiFlowerLine size={48}/>
                      </div>
                    )}
                    <div className="absolute top-3 left-3 flex flex-col gap-1">
                      {p.featured && (
                        <span className="bg-primary-600 text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
                          <RiStarLine size={9}/> Top
                        </span>
                      )}
                      {p.requiresSpecialOrder && (
                        <span className="bg-amber-500 text-white text-xs px-2.5 py-1 rounded-full">Encargo</span>
                      )}
                    </div>
                  </div>
                </Link>
                <div className="p-4">
                  <p className="text-xs text-primary-500 uppercase tracking-wide font-medium mb-0.5">{p.category?.name}</p>
                  <h3 className="font-semibold text-gray-900 line-clamp-1">{p.name}</h3>
                  {p.preparationTimeValue > 0 && (
                    <div className="flex items-center gap-1 text-xs text-amber-600 mt-1">
                      <RiTimeLine size={11}/> <span>{formatPreparationTime(p.preparationTimeValue, p.preparationTimeUnit)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    <span className="font-bold text-gray-900">{formatPrice(p.price)}</span>
                    <button onClick={() => handleAdd(p)} className="p-2.5 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition-all hover:scale-110">
                      <RiShoppingBagLine size={15}/>
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <Link href="/flores" className="inline-flex items-center gap-2 border-2 border-primary-600 text-primary-600 px-8 py-3 rounded-full font-medium hover:bg-primary-600 hover:text-white transition-all">
            Ver todo el catálogo
          </Link>
        </div>
      </div>
    </section>
  );
}