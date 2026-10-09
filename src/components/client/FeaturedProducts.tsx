"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { RiArrowRightLine } from "react-icons/ri";
import ProductCard, { type ProductCardProduct } from "@/components/client/ProductCard";
import { useQuickAdd } from "@/components/client/useQuickAdd";

export default function FeaturedProducts({ products }: { products: ProductCardProduct[] }) {
  const quickAdd = useQuickAdd();

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
          {products.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{opacity:0,y:24}} whileInView={{opacity:1,y:0}}
              viewport={{once:true}} transition={{delay:i*0.06}}
            >
              <ProductCard product={p} onAdd={quickAdd} />
            </motion.div>
          ))}
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
