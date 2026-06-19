"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { nanoid } from "nanoid";
import { toast } from "sonner";
import {
  RiAddLine,
  RiArrowDownSLine,
  RiArrowRightLine,
  RiCake2Line,
  RiFlowerLine,
  RiGift2Line,
  RiHeart3Fill,
  RiHeart3Line,
  RiLeafLine,
  RiLockLine,
  RiSearchLine,
  RiShieldCheckLine,
  RiShoppingBagLine,
  RiTruckLine,
  RiWhatsappLine,
} from "react-icons/ri";
import { GiDiamondRing, GiFlowerPot, GiRose, GiSunflower, GiTiara } from "react-icons/gi";
import { formatPrice } from "@/lib/utils";
import { useCartStore } from "@/store/cartStore";

type CatalogProduct = {
  id: string;
  name: string;
  description: string;
  price: number;
  occasion?: string | null;
  featured: boolean;
  requiresSpecialOrder: boolean;
  deliveryLeadDays: number;
  createdAt: string;
  category: { id: string; name: string; slug: string };
  images: Array<{ id: string; url: string; isMain: boolean; order: number }>;
  flowers: Array<{ flower: { id: string; name: string; type: string }; quantity: number }>;
};

type FilterKey = "all" | "occasion" | "category" | "flower" | "premium";

const normalize = (value: string) =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const getImage = (product: CatalogProduct) =>
  product.images.find(image => image.isMain)?.url || product.images[0]?.url || "";

const readCookieArray = (name: string) => {
  try {
    const raw = document.cookie.split("; ").find(item => item.startsWith(`${name}=`))?.split("=").slice(1).join("=");
    const parsed = raw ? JSON.parse(decodeURIComponent(raw)) : [];
    return Array.isArray(parsed) ? parsed.filter(item => typeof item === "string") : [];
  } catch {
    return [];
  }
};

const writeCookieArray = (name: string, values: string[]) => {
  document.cookie = `${name}=${encodeURIComponent(JSON.stringify(values))}; path=/; max-age=15552000; samesite=lax`;
};

export default function FloresClient({
  products,
  categories,
  flowerTypes,
  occasions,
  initialFilters,
}: {
  products: CatalogProduct[];
  categories: Array<{ id: string; name: string; slug: string }>;
  flowerTypes: string[];
  occasions: Array<{ id: string; name: string; slug: string }>;
  initialFilters: { categoria?: string; ocasion?: string; q?: string; flor?: string };
}) {
  const [search, setSearch] = useState(initialFilters.q || "");
  const [sortBy, setSortBy] = useState("recent");
  const [priceRange, setPriceRange] = useState("all");
  const [activeFilter, setActiveFilter] = useState<{ type: FilterKey; value: string }>(() => {
    if (initialFilters.categoria) return { type: "category", value: initialFilters.categoria };
    if (initialFilters.ocasion) return { type: "occasion", value: initialFilters.ocasion };
    if (initialFilters.flor) return { type: "flower", value: initialFilters.flor };
    return { type: "all", value: "" };
  });
  const [favorites, setFavorites] = useState<string[]>([]);
  const productsRef = useRef<HTMLDivElement>(null);
  const { addItem, toggleCart } = useCartStore();

  useEffect(() => setFavorites(readCookieArray("ff_favorite_products")), []);

  useEffect(() => {
    const term = search.trim();
    if (term.length < 2) return;
    const timer = window.setTimeout(() => {
      const current = readCookieArray("ff_catalog_searches");
      writeCookieArray("ff_catalog_searches", [term, ...current.filter(item => normalize(item) !== normalize(term))].slice(0, 8));
    }, 700);
    return () => window.clearTimeout(timer);
  }, [search]);

  const filters = useMemo(() => {
    const items: Array<{ label: string; type: FilterKey; value: string; Icon: React.ElementType }> = [
      { label: "Todos", type: "all", value: "", Icon: GiFlowerPot },
    ];
    const occasionIcons = [RiHeart3Line, RiCake2Line, GiDiamondRing, RiGift2Line];
    occasions.slice(0, 4).forEach((occasion, index) => {
      items.push({ label: occasion.name, type: "occasion", value: occasion.slug, Icon: occasionIcons[index] || RiGift2Line });
    });
    items.push({ label: "Premium", type: "premium", value: "premium", Icon: GiTiara });
    flowerTypes.slice(0, 2).forEach(type => {
      items.push({ label: type, type: "flower", value: type, Icon: normalize(type).includes("girasol") ? GiSunflower : GiRose });
    });
    categories.slice(0, Math.max(0, 8 - items.length)).forEach(category => {
      items.push({ label: category.name, type: "category", value: category.slug, Icon: RiLeafLine });
    });
    return items.slice(0, 8);
  }, [categories, flowerTypes, occasions]);

  const filtered = useMemo(() => {
    const result = products.filter(product => {
      const query = normalize(search.trim());
      const searchable = normalize([
        product.name,
        product.description,
        product.category?.name,
        product.occasion || "",
        ...product.flowers.map(item => `${item.flower.name} ${item.flower.type}`),
      ].join(" "));
      if (query && !searchable.includes(query)) return false;
      if (activeFilter.type === "category" && product.category?.slug !== activeFilter.value) return false;
      if (activeFilter.type === "occasion" && normalize(product.occasion || "") !== normalize(activeFilter.value)) return false;
      if (activeFilter.type === "flower" && !product.flowers.some(item => normalize(item.flower.type) === normalize(activeFilter.value))) return false;
      if (activeFilter.type === "premium" && !product.featured) return false;
      if (priceRange === "low" && product.price > 70000) return false;
      if (priceRange === "mid" && (product.price <= 70000 || product.price > 100000)) return false;
      if (priceRange === "high" && product.price <= 100000) return false;
      return true;
    });
    if (sortBy === "price-asc") result.sort((a, b) => a.price - b.price);
    if (sortBy === "price-desc") result.sort((a, b) => b.price - a.price);
    if (sortBy === "popular") result.sort((a, b) => Number(b.featured) - Number(a.featured));
    if (sortBy === "recent") result.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    return result;
  }, [products, search, activeFilter, priceRange, sortBy]);

  const featured = useMemo(() => {
    const selected = products.filter(product => product.featured);
    return (selected.length ? selected : products).slice(0, 5);
  }, [products]);
  const heroProduct = featured[0] || products[0];
  const heroImage = heroProduct ? getImage(heroProduct) : "";

  const selectFilter = (type: FilterKey, value: string) => {
    setActiveFilter({ type, value });
    productsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const toggleFavorite = (id: string) => {
    setFavorites(current => {
      const next = current.includes(id) ? current.filter(item => item !== id) : [id, ...current].slice(0, 32);
      writeCookieArray("ff_favorite_products", next);
      return next;
    });
  };

  const handleAdd = (product: CatalogProduct) => {
    addItem({
      id: nanoid(),
      productId: product.id,
      name: product.name,
      price: product.price,
      image: getImage(product),
      quantity: 1,
      preparationTimeValue: 0,
      preparationTimeUnit: "MINUTES",
      deliveryLeadDays: product.deliveryLeadDays || 0,
      addons: [],
    });
    toast.success(`${product.name} agregado al carrito`);
    toggleCart();
  };

  return (
    <div className="min-h-screen bg-[#fffdfa] pt-[65px] text-[#101827] sm:pt-[70px]">
      <section className="relative isolate min-h-[310px] overflow-hidden border-b border-rose-100 sm:min-h-[370px]">
        {heroImage ? (
          <img src={heroImage} alt="" className="absolute inset-0 h-full w-full object-cover object-center sm:object-[70%_45%]" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-[#f7eadc] via-[#f9e8e4] to-[#f4d8dd]" />
        )}
        <div className="absolute inset-0 bg-[#080713]/55" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#090713]/90 via-[#130c1c]/68 to-[#090713]/28" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/10" />
        <div className="relative mx-auto flex min-h-[310px] max-w-7xl items-center px-5 py-12 sm:min-h-[370px] sm:px-8">
          <div className="max-w-[490px]">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.24em] text-primary-300">Colección floral</p>
            <h1 className="font-display text-[2.55rem] font-semibold leading-[0.98] text-white drop-shadow-[0_3px_18px_rgba(0,0,0,.35)] sm:text-6xl">
              Arreglos que<br />cuentan historias
            </h1>
            <p className="mt-5 max-w-xs text-sm leading-6 text-white/85 drop-shadow-sm">Flores frescas seleccionadas con amor para cada ocasión especial.</p>
            <button type="button" onClick={() => productsRef.current?.scrollIntoView({ behavior: "smooth" })} className="mt-6 inline-flex h-12 items-center gap-3 rounded-2xl bg-primary-500 px-6 text-sm font-bold text-white shadow-[0_12px_30px_rgba(232,24,90,.22)] transition hover:-translate-y-0.5 hover:bg-primary-600">
              Explorar colección <RiArrowRightLine />
            </button>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <section className="py-5">
          <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {filters.map(({ label, type, value, Icon }) => {
              const active = activeFilter.type === type && activeFilter.value === value;
              return (
                <button key={`${type}-${value}`} type="button" onClick={() => selectFilter(type, value)} className={`flex h-[82px] min-w-[92px] shrink-0 flex-col items-center justify-center gap-2 rounded-2xl border bg-white px-3 text-xs font-semibold transition sm:h-[96px] sm:min-w-[108px] ${active ? "border-primary-500 text-slate-950 shadow-[0_8px_22px_rgba(232,24,90,.08)]" : "border-slate-200 text-slate-700 hover:border-primary-200"}`}>
                  <Icon className={active ? "text-primary-500" : "text-slate-500"} size={25} />
                  <span className="max-w-[90px] truncate">{label}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section ref={productsRef} className="scroll-mt-24 border-t border-slate-100 py-5">
          <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto_auto]">
            <label className="relative block">
              <RiSearchLine className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar arreglo floral..." className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-primary-300" />
            </label>
            <CatalogSelect value={sortBy} onChange={setSortBy} label="Ordenar">
              <option value="popular">Más vendidos</option>
              <option value="recent">Recientes</option>
              <option value="price-asc">Menor precio</option>
              <option value="price-desc">Mayor precio</option>
            </CatalogSelect>
            <CatalogSelect value={priceRange} onChange={setPriceRange} label="Precio">
              <option value="all">Todos los precios</option>
              <option value="low">Hasta $70.000</option>
              <option value="mid">$70.000 - $100.000</option>
              <option value="high">Más de $100.000</option>
            </CatalogSelect>
            <CatalogSelect value={sortBy} onChange={setSortBy} label="Recientes">
              <option value="recent">Recientes</option>
              <option value="popular">Destacados</option>
            </CatalogSelect>
          </div>
        </section>

        {featured.length > 0 && !search && activeFilter.type === "all" && priceRange === "all" && (
          <section className="py-3">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-base font-bold"><RiFlowerLine className="text-primary-500" /> Más vendidos</h2>
              <button type="button" onClick={() => setSortBy("popular")} className="flex items-center gap-1 text-xs font-bold text-primary-500">Ver todos <RiArrowRightLine /></button>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {featured.map(product => <CompactProductCard key={product.id} product={product} favorite={favorites.includes(product.id)} onFavorite={toggleFavorite} />)}
            </div>
          </section>
        )}

        <section className="py-7">
          <div className="mb-5">
            <h2 className="text-xl font-bold">Todos los arreglos</h2>
            <p className="mt-1 text-xs text-slate-500">{filtered.length} {filtered.length === 1 ? "producto disponible" : "productos disponibles"}</p>
          </div>
          {filtered.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white py-20 text-center">
              <RiFlowerLine className="mx-auto text-slate-200" size={52} />
              <p className="mt-4 font-semibold text-slate-700">No encontramos arreglos</p>
              <button type="button" onClick={() => { setSearch(""); setPriceRange("all"); setActiveFilter({ type: "all", value: "" }); }} className="mt-4 text-sm font-bold text-primary-500">Limpiar filtros</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5">
              {filtered.map((product, index) => (
                <motion.div key={product.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * 0.025, 0.25) }}>
                  <ProductCard product={product} favorite={favorites.includes(product.id)} onFavorite={toggleFavorite} onAdd={handleAdd} />
                </motion.div>
              ))}
            </div>
          )}
        </section>

        <section className="mb-5 grid rounded-2xl border border-slate-200 bg-white sm:grid-cols-2 lg:grid-cols-4">
          {[
            { Icon: RiFlowerLine, title: "Flores frescas", text: "Seleccionadas cuidadosamente cada día." },
            { Icon: RiTruckLine, title: "Entrega el mismo día", text: "Haz tu pedido antes de las 2:00 PM." },
            { Icon: RiGift2Line, title: "Presentación premium", text: "Cada arreglo se prepara con amor." },
            { Icon: RiShoppingBagLine, title: "Tarjeta personalizada", text: "Incluye tu mensaje sin costo adicional." },
          ].map(({ Icon, title, text }) => (
            <div key={title} className="flex items-center gap-4 border-b border-slate-100 p-5 last:border-0 sm:[&:nth-child(odd)]:border-r lg:border-b-0 lg:border-r">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary-50 text-primary-500"><Icon size={21} /></span>
              <div><p className="text-sm font-bold">{title}</p><p className="mt-1 text-[11px] leading-4 text-slate-500">{text}</p></div>
            </div>
          ))}
        </section>

        <section className="mb-10 grid gap-4 rounded-2xl bg-gradient-to-r from-rose-50 to-white p-5 sm:grid-cols-3 sm:items-center">
          <div className="flex items-center gap-3"><RiHeart3Line className="text-primary-500" size={28} /><div><p className="text-xs font-bold">¿Necesitas ayuda?</p><p className="text-[11px] text-slate-500">Estamos para asesorarte</p></div></div>
          <a href="https://wa.me/573000000000" target="_blank" rel="noopener noreferrer" className="inline-flex h-10 w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold"><RiWhatsappLine className="text-emerald-500" size={18} /> Escríbenos</a>
          <div className="flex flex-wrap gap-5 sm:justify-end">
            <div className="flex items-center gap-2"><RiLockLine className="text-primary-500" /><span className="text-[11px]"><strong className="block">Pago seguro</strong>Aceptamos varios medios</span></div>
            <div className="flex items-center gap-2"><RiShieldCheckLine className="text-primary-500" /><span className="text-[11px]"><strong className="block">Compra protegida</strong>Te acompañamos</span></div>
          </div>
        </section>
      </div>
    </div>
  );
}

function CatalogSelect({ value, onChange, label, children }: { value: string; onChange: (value: string) => void; label: string; children: React.ReactNode }) {
  return (
    <label className="relative min-w-0">
      <span className="sr-only">{label}</span>
      <select value={value} onChange={event => onChange(event.target.value)} className="h-12 w-full appearance-none rounded-2xl border border-slate-200 bg-white pl-4 pr-10 text-xs font-semibold outline-none focus:border-primary-300 lg:min-w-[140px]">
        {children}
      </select>
      <RiArrowDownSLine className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
    </label>
  );
}

function FavoriteButton({ active, name, onClick }: { active: boolean; name: string; onClick: () => void }) {
  return (
    <button type="button" onClick={event => { event.preventDefault(); onClick(); }} aria-label={`${active ? "Quitar" : "Agregar"} ${name} de favoritos`} className="grid h-8 w-8 place-items-center rounded-full border border-slate-200 bg-white/95 text-slate-600 shadow-sm transition hover:text-primary-500">
      {active ? <RiHeart3Fill className="text-primary-500" /> : <RiHeart3Line />}
    </button>
  );
}

function CompactProductCard({ product, favorite, onFavorite }: { product: CatalogProduct; favorite: boolean; onFavorite: (id: string) => void }) {
  const image = getImage(product);
  return (
    <Link href={`/flores/${product.id}`} className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative aspect-[1.35] overflow-hidden bg-slate-50">
        {image ? <img src={image} alt={product.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <div className="grid h-full place-items-center"><RiFlowerLine className="text-slate-200" size={35} /></div>}
        <div className="absolute right-2 top-2"><FavoriteButton active={favorite} name={product.name} onClick={() => onFavorite(product.id)} /></div>
      </div>
      <div className="p-3"><p className="truncate text-xs font-bold">{product.name}</p><p className="mt-1 text-xs font-bold">{formatPrice(product.price)}</p></div>
    </Link>
  );
}

function ProductCard({ product, favorite, onFavorite, onAdd }: { product: CatalogProduct; favorite: boolean; onFavorite: (id: string) => void; onAdd: (product: CatalogProduct) => void }) {
  const image = getImage(product);
  const flower = product.flowers[0]?.flower;
  return (
    <article className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <Link href={`/flores/${product.id}`} className="relative block aspect-[1.25] overflow-hidden bg-slate-50">
        {image ? <img src={image} alt={product.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" /> : <div className="grid h-full place-items-center"><RiFlowerLine className="text-slate-200" size={45} /></div>}
        <span className={`absolute left-2 top-2 rounded-md px-2 py-1 text-[8px] font-bold uppercase ${product.featured ? "bg-primary-500 text-white" : "bg-emerald-50 text-emerald-700"}`}>{product.featured ? "Premium" : "Disponible"}</span>
        <div className="absolute right-2 top-2"><FavoriteButton active={favorite} name={product.name} onClick={() => onFavorite(product.id)} /></div>
      </Link>
      <div className="p-3">
        <Link href={`/flores/${product.id}`} className="line-clamp-1 text-sm font-bold hover:text-primary-500">{product.name}</Link>
        <p className="mt-1 text-base font-extrabold">{formatPrice(product.price)}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className="rounded-md bg-rose-50 px-2 py-1 text-[9px] text-primary-500">{flower?.name || product.category?.name}</span>
          {!product.requiresSpecialOrder && product.deliveryLeadDays === 0 && <span className="rounded-md bg-emerald-50 px-2 py-1 text-[9px] text-emerald-600">Mismo día</span>}
        </div>
        <div className="mt-3 grid grid-cols-[1fr_38px] gap-2">
          <Link href={`/flores/${product.id}`} className="flex h-9 items-center justify-center rounded-lg border border-primary-300 text-[10px] font-bold text-primary-500 transition hover:bg-primary-500 hover:text-white">Ver producto</Link>
          <button type="button" onClick={() => onAdd(product)} aria-label={`Agregar ${product.name} al carrito`} className="grid h-9 place-items-center rounded-lg bg-primary-500 text-white transition hover:bg-primary-600"><RiAddLine /></button>
        </div>
      </div>
    </article>
  );
}
