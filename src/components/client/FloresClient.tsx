"use client";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { RiSearchLine, RiTimeLine, RiShoppingBagLine, RiStarLine, RiFlowerLine, RiArrowDownSLine } from "react-icons/ri";
import Link from "next/link";
import { formatPrice, formatPreparationTime } from "@/lib/utils";
import { useCartStore } from "@/store/cartStore";
import { nanoid } from "nanoid";
import { toast } from "sonner";

export default function FloresClient({ products, categories, flowerTypes }: {
  products: any[]; categories: any[]; flowerTypes: string[];
}) {
  const [search,           setSearch]           = useState("");
  const [sortBy,           setSortBy]           = useState("featured");
  const [filterFlowerType, setFilterFlowerType] = useState("");
  const { addItem, toggleCart } = useCartStore();

  const filtered = useMemo(() => {
    let r = [...products];
    if (search)           r = r.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
    if (filterFlowerType) r = r.filter(p => p.flowers.some((f: any) => f.flower.type === filterFlowerType));
    if (sortBy === "price-asc")  r.sort((a, b) => a.price - b.price);
    if (sortBy === "price-desc") r.sort((a, b) => b.price - a.price);
    if (sortBy === "featured")   r.sort((a, b) => (b.featured?1:0) - (a.featured?1:0));
    return r;
  }, [products, search, sortBy, filterFlowerType]);

  const handleAdd = (p: any) => {
    addItem({
      id: nanoid(), productId: p.id, name: p.name, price: p.price,
      image: p.images.find((i: any) => i.isMain)?.url || p.images[0]?.url || "",
      quantity: 1, preparationTimeValue: p.preparationTimeValue,
      preparationTimeUnit: p.preparationTimeUnit, deliveryLeadDays: p.deliveryLeadDays || 0, addons: [],
    });
    toast.success(`${p.name} agregado al carrito`);
    toggleCart();
  };

  return (
    <div className="min-h-screen bg-[#fdfcf8]">

      {/* ── Hero banner ── */}
      <div className="relative pt-20 pb-14 bg-[#1a0a0f] overflow-hidden">
        <div className="absolute inset-0 opacity-30"
          style={{backgroundImage:"radial-gradient(circle at 70% 50%, #e8185a44 0%, transparent 60%)"}}/>
        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <p className="text-primary-300 text-xs font-bold tracking-[0.2em] uppercase mb-3">Fantasía Floral</p>
          <h1 className="text-white font-semibold mb-3"
            style={{fontFamily:"var(--font-cormorant),Georgia,serif", fontSize:"clamp(2.5rem,6vw,4.5rem)", lineHeight:1.05}}>
            Nuestro catálogo
          </h1>
          <p className="text-white/50 text-base">Flores frescas seleccionadas con amor</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">

        {/* ── Filters bar ── */}
        <div className="flex flex-wrap gap-3 mb-8">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <RiSearchLine className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={15}/>
            <input
              type="text" placeholder="Buscar arreglos..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-full text-sm focus:outline-none focus:border-primary-400 shadow-sm"
            />
          </div>

          {/* Flower type */}
          {flowerTypes.length > 0 && (
            <div className="relative">
              <select value={filterFlowerType} onChange={e => setFilterFlowerType(e.target.value)}
                className="appearance-none bg-white border border-gray-200 rounded-full pl-4 pr-9 py-3 text-sm focus:outline-none focus:border-primary-400 shadow-sm cursor-pointer">
                <option value="">Todas las flores</option>
                {flowerTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <RiArrowDownSLine className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16}/>
            </div>
          )}

          {/* Sort */}
          <div className="relative">
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
              className="appearance-none bg-white border border-gray-200 rounded-full pl-4 pr-9 py-3 text-sm focus:outline-none focus:border-primary-400 shadow-sm cursor-pointer">
              <option value="featured">Destacados</option>
              <option value="price-asc">Menor precio</option>
              <option value="price-desc">Mayor precio</option>
            </select>
            <RiArrowDownSLine className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16}/>
          </div>
        </div>

        <p className="text-xs text-gray-400 mb-8 font-medium">{filtered.length} {filtered.length === 1 ? "producto" : "productos"}</p>

        {/* ── Product grid — clean style like reference ── */}
        {filtered.length === 0 ? (
          <div className="text-center py-24">
            <RiFlowerLine className="text-gray-200 mx-auto mb-4" size={56}/>
            <p className="text-gray-400 font-medium">Sin resultados</p>
            <p className="text-gray-300 text-sm mt-1">Intenta con otra búsqueda</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-10">
            {filtered.map((p, i) => {
              const img = p.images.find((x: any) => x.isMain)?.url || p.images[0]?.url || "";
              return (
                <motion.div
                  key={p.id}
                  initial={{opacity:0, y:20}} animate={{opacity:1, y:0}}
                  transition={{delay: i * 0.04}}
                  className="group"
                >
                  {/* Image — no border, full radius, hover cart */}
                  <Link href={`/flores/${p.id}`} className="block relative overflow-hidden rounded-2xl aspect-square mb-4 bg-gray-50">
                    {img ? (
                      <img src={img} alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"/>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <RiFlowerLine className="text-gray-200" size={48}/>
                      </div>
                    )}

                    {/* Badges */}
                    {(p.featured || p.requiresSpecialOrder) && (
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
                    )}

                    {/* Add to cart on hover — overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-end justify-center pb-4 opacity-0 group-hover:opacity-100">
                      <button
                        onClick={e => { e.preventDefault(); handleAdd(p); }}
                        className="flex items-center gap-2 bg-white text-gray-900 text-xs font-semibold px-5 py-2.5 rounded-full shadow-lg hover:bg-primary-600 hover:text-white transition-colors translate-y-2 group-hover:translate-y-0 duration-300"
                      >
                        <RiShoppingBagLine size={13}/> Añadir al carrito
                      </button>
                    </div>
                  </Link>

                  {/* Text info — minimal, like reference */}
                  <div className="text-center">
                    <h3 className="font-medium text-gray-900 text-sm mb-1 line-clamp-1">{p.name}</h3>
                    <p className="font-bold text-gray-900 text-base">{formatPrice(p.price)}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
