"use client";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { RiSearchLine, RiTimeLine, RiShoppingBagLine, RiFilterLine } from "react-icons/ri";
import Link from "next/link";
import { formatPrice, formatPreparationTime } from "@/lib/utils";
import { useCartStore } from "@/store/cartStore";
import { nanoid } from "nanoid";
import { toast } from "sonner";

export default function FloresClient({ products, categories, flowerTypes }: { products: any[]; categories: any[]; flowerTypes: string[] }) {
  const [search, setSearch]           = useState("");
  const [sortBy, setSortBy]           = useState("featured");
  const [filterFlowerType, setFilterFlowerType] = useState("");
  const { addItem, toggleCart } = useCartStore();

  const filtered = useMemo(() => {
    let r = [...products];
    if (search)          r = r.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
    if (filterFlowerType) r = r.filter(p => p.flowers.some((f: any) => f.flower.type === filterFlowerType));
    if (sortBy === "price-asc")  r.sort((a,b) => a.price - b.price);
    if (sortBy === "price-desc") r.sort((a,b) => b.price - a.price);
    if (sortBy === "featured")   r.sort((a,b) => (b.featured?1:0)-(a.featured?1:0));
    return r;
  }, [products, search, sortBy, filterFlowerType]);

  const handleAdd = (p: any) => {
    addItem({
      id: nanoid(), productId: p.id, name: p.name, price: p.price,
      image: p.images.find((i: any) => i.isMain)?.url || p.images[0]?.url || "",
      quantity: 1, preparationTimeValue: p.preparationTimeValue,
      preparationTimeUnit: p.preparationTimeUnit, addons: [],
    });
    toast.success(`${p.name} agregado 🌸`);
    toggleCart();
  };

  return (
    <div className="pt-20">
      <div className="bg-gradient-to-r from-primary-800 to-primary-600 text-white py-16 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-display font-semibold mb-2" style={{fontFamily:"var(--font-cormorant),Georgia,serif"}}>
          Nuestro catálogo
        </h1>
        <p className="text-primary-200">Flores frescas seleccionadas con amor</p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[180px]">
            <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
            <input type="text" placeholder="Buscar flores..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-primary-400"/>
          </div>
          {flowerTypes.length > 0 && (
            <select value={filterFlowerType} onChange={e => setFilterFlowerType(e.target.value)}
              className="border border-gray-200 rounded-full px-4 py-3 text-sm bg-white focus:outline-none focus:border-primary-400">
              <option value="">Todas las flores</option>
              {flowerTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          )}
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            className="border border-gray-200 rounded-full px-4 py-3 text-sm bg-white focus:outline-none focus:border-primary-400">
            <option value="featured">Destacados</option>
            <option value="price-asc">Menor precio</option>
            <option value="price-desc">Mayor precio</option>
          </select>
        </div>

        <p className="text-sm text-gray-400 mb-6">{filtered.length} productos</p>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {filtered.map((p, i) => {
            const img = p.images.find((x: any) => x.isMain)?.url || p.images[0]?.url || "";
            return (
              <motion.div key={p.id} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:i*0.04}}
                className="flower-card bg-white rounded-2xl overflow-hidden border border-gray-100 group">
                <Link href={`/flores/${p.id}`}>
                  <div className="relative overflow-hidden aspect-square">
                    <img src={img} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"/>
                    <div className="absolute top-3 left-3 flex flex-col gap-1">
                      {p.featured && <span className="bg-primary-600 text-white text-xs px-2.5 py-1 rounded-full">⭐ Top</span>}
                      {p.requiresSpecialOrder && <span className="bg-amber-500 text-white text-xs px-2.5 py-1 rounded-full">Encargo</span>}
                    </div>
                  </div>
                </Link>
                <div className="p-4">
                  <p className="text-xs text-primary-500 uppercase tracking-wide font-medium">{p.category?.name}</p>
                  <h3 className="font-semibold text-gray-900 line-clamp-1 mb-1">{p.name}</h3>
                  {p.flowers.length > 0 && (
                    <p className="text-xs text-gray-400 truncate mb-1">🌸 {p.flowers.map((f:any)=>f.flower.name).join(", ")}</p>
                  )}
                  {p.preparationTimeValue > 0 && (
                    <p className="flex items-center gap-1 text-xs text-amber-600 mb-2"><RiTimeLine size={11}/> {formatPreparationTime(p.preparationTimeValue, p.preparationTimeUnit)}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900">{formatPrice(p.price)}</span>
                    <button onClick={() => handleAdd(p)} className="p-2.5 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition-all hover:scale-110">
                      <RiShoppingBagLine size={14}/>
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
