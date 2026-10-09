"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  RiArrowDownSLine,
  RiCloseLine,
  RiArrowRightLine,
  RiCake2Line,
  RiFlowerLine,
  RiGift2Line,
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
import { formatDeliveryDay, formatTime12, hasSameDayCutoffPassed } from "@/lib/utils";
import { DEFAULT_SAME_DAY_CUTOFF_TIME } from "@/lib/site-settings";
import ProductCard from "@/components/client/ProductCard";
import HeroBackdrop from "@/components/client/HeroBackdrop";
import ScrollArrows from "@/components/client/ScrollArrows";
import CatalogDropdown from "@/components/client/CatalogDropdown";
import { useQuickAdd } from "@/components/client/useQuickAdd";

/** Productos que se pintan por tanda al hacer scroll (spec 004). */
const PAGE_SIZE = 12;
const GRID_SIZES = "(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw";

const SORT_OPTIONS = [
  { value: "recent", label: "Recientes" },
  { value: "popular", label: "Más vendidos" },
  { value: "price-asc", label: "Menor precio" },
  { value: "price-desc", label: "Mayor precio" },
];

const PRICE_OPTIONS = [
  // “Todos” y no “Todos los precios”: la etiqueta “Precio” ya va encima y en
  // 390px el texto largo se cortaba.
  { value: "all", label: "Todos" },
  { value: "low", label: "Hasta $70.000" },
  { value: "mid", label: "$70.000 – $100.000" },
  { value: "high", label: "Más de $100.000" },
];

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
  const [sameDayCutoffTime, setSameDayCutoffTime] = useState(DEFAULT_SAME_DAY_CUTOFF_TIME);
  const [activeFilter, setActiveFilter] = useState<{ type: FilterKey; value: string }>(() => {
    if (initialFilters.categoria) return { type: "category", value: initialFilters.categoria };
    if (initialFilters.ocasion) return { type: "occasion", value: initialFilters.ocasion };
    if (initialFilters.flor) return { type: "flower", value: initialFilters.flor };
    return { type: "all", value: "" };
  });
  const [favorites, setFavorites] = useState<string[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const productsRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const quickAdd = useQuickAdd();

  useEffect(() => setFavorites(readCookieArray("ff_favorite_products")), []);

  useEffect(() => {
    fetch("/api/settings")
      .then(response => response.json())
      .then(data => {
        if (typeof data?.sameDayCutoffTime === "string") setSameDayCutoffTime(data.sameDayCutoffTime);
      })
      .catch(() => {});
  }, []);

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

  const hasActiveFilters = Boolean(search.trim()) || activeFilter.type !== "all" || priceRange !== "all";
  const clearFilters = () => {
    setSearch("");
    setPriceRange("all");
    setActiveFilter({ type: "all", value: "" });
  };

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

  // Cada búsqueda, filtro u orden empieza otra vez por la primera tanda.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [search, activeFilter, priceRange, sortBy]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;
  const loadMore = () => setVisibleCount(count => count + PAGE_SIZE);

  // Pide la siguiente tanda cuando el final del grid está a 600px. El
  // observador se recrea tras cada tanda: si el centinela sigue a la vista
  // (pantallas altas), vuelve a disparar sin esperar más scroll.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!hasMore || !sentinel || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      entries => { if (entries[0]?.isIntersecting) loadMore(); },
      { rootMargin: "600px 0px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, visibleCount]);

  const cutoffPassed = hasSameDayCutoffPassed(sameDayCutoffTime);
  const hasSameDayProducts = filtered.some(product => !product.requiresSpecialOrder && (product.deliveryLeadDays || 0) === 0);

  return (
    <div className="min-h-screen bg-[#fffdfa] pt-[65px] text-[#101827] sm:pt-[70px]">
      <HeroBackdrop
        background={heroImage || "/flowers/ramo1.jpg"}
        photos={featured.slice(0, 3).map(product => ({ src: getImage(product), alt: product.name })).filter(photo => photo.src)}
        className="min-h-[300px] py-12 sm:min-h-[380px] sm:py-14"
      >
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.24em] text-primary-300">Colección floral</p>
        <h1 className="max-w-2xl font-display text-[2.55rem] font-semibold leading-[1.02] text-white drop-shadow-[0_3px_18px_rgba(0,0,0,.35)] sm:text-6xl">
          Arreglos que cuentan historias
        </h1>
        <p className="mt-5 max-w-lg text-sm leading-6 text-white/85 drop-shadow-sm sm:text-base sm:leading-7">
          Flores frescas seleccionadas con amor para cada ocasión especial, preparadas a mano y entregadas a domicilio.
        </p>
        <button type="button" onClick={() => productsRef.current?.scrollIntoView({ behavior: "smooth" })} className="mt-7 inline-flex h-12 items-center gap-3 rounded-2xl bg-primary-500 px-6 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-primary-600">
          Explorar colección <RiArrowRightLine />
        </button>
      </HeroBackdrop>

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Siempre visible: si se ocultara al filtrar, la barra de filtros saltaría hacia arriba. */}
        {featured.length > 0 && (
          <section className="pb-6 pt-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-base font-bold"><RiFlowerLine className="text-primary-500" /> Más vendidos</h2>
              <button type="button" onClick={() => setSortBy("popular")} className="flex items-center gap-1 text-xs font-bold text-primary-500">Ver todos <RiArrowRightLine /></button>
            </div>
            {/* Móvil: carrusel horizontal (5 tarjetas en 2 columnas dejarían una sola). */}
            <ScrollArrows
              label="productos"
              wrapperClassName="-mx-4 sm:mx-0"
              className="flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:grid sm:grid-cols-3 sm:gap-x-4 sm:gap-y-8 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-5 lg:gap-x-5 [&::-webkit-scrollbar]:hidden"
            >
              {featured.map((product, index) => (
                <div key={product.id} className="w-[44%] shrink-0 snap-start sm:w-auto">
                  <ProductCard
                    product={product}
                    onAdd={quickAdd}
                    favorite={favorites.includes(product.id)}
                    onFavorite={toggleFavorite}
                    priority={index < 2}
                    sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 44vw"
                  />
                </div>
              ))}
            </ScrollArrows>
          </section>
        )}

        {/* Barra de filtros (spec 008): buscador + orden + precio, y debajo las categorías. */}
        <section ref={productsRef} className="scroll-mt-24 space-y-4 border-t border-slate-100 pt-7 pb-2">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-[1fr_auto_auto]">
            <label className="relative col-span-2 block lg:col-span-1">
              <span className="sr-only">Buscar arreglo floral</span>
              <RiSearchLine className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="Buscar arreglo floral..."
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-11 text-sm outline-none transition placeholder:text-slate-400 hover:border-primary-200 focus:border-primary-300 focus:ring-4 focus:ring-primary-50"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Borrar búsqueda"
                  className="absolute right-3 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-primary-50 hover:text-primary-600"
                >
                  <RiCloseLine size={15} />
                </button>
              )}
            </label>
            <CatalogDropdown label="Ordenar" value={sortBy} onChange={setSortBy} options={SORT_OPTIONS} />
            <CatalogDropdown label="Precio" value={priceRange} onChange={setPriceRange} options={PRICE_OPTIONS} align="right" />
          </div>

          <ScrollArrows
            label="categorías"
            wrapperClassName="-mx-4 sm:mx-0"
            className="flex items-center gap-2 overflow-x-auto px-4 py-0.5 [scrollbar-width:none] sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden"
          >
              {filters.map(({ label, type, value, Icon }) => {
                const active = activeFilter.type === type && activeFilter.value === value;
                return (
                  <button
                    key={`${type}-${value}`}
                    type="button"
                    aria-pressed={active}
                    onClick={() => selectFilter(type, value)}
                    className={`inline-flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-4 text-[13px] font-semibold transition ${
                      active
                        ? "border-primary-500 bg-primary-500 text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:border-primary-200 hover:bg-primary-50/60 hover:text-primary-700"
                    }`}
                  >
                    <Icon className={active ? "text-white" : "text-primary-400"} size={17} />
                    {label}
                  </button>
                );
              })}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-[13px] font-semibold text-primary-600 transition hover:bg-primary-50"
                >
                  <RiCloseLine size={16} /> Limpiar filtros
                </button>
              )}
          </ScrollArrows>
        </section>

        <section className="py-7">
          <div className="mb-5">
            <h2 className="text-xl font-bold">Todos los arreglos</h2>
            <p className="mt-1 text-xs text-slate-500">
              {hasMore
                ? `Mostrando ${visible.length} de ${filtered.length} productos`
                : `${filtered.length} ${filtered.length === 1 ? "producto disponible" : "productos disponibles"}`}
            </p>
          </div>
          {cutoffPassed && hasSameDayProducts && (
            <div className="mb-6 inline-flex max-w-full items-center gap-2.5 rounded-full bg-primary-50 py-2 pl-2 pr-4 text-xs text-primary-800 sm:text-sm">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white text-primary-500 shadow-sm">
                <RiTruckLine size={15} />
              </span>
              <p>
                Los arreglos de entrega inmediata que pidas ahora llegan <strong>{formatDeliveryDay(1)}</strong>.
              </p>
            </div>
          )}
          {filtered.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white py-20 text-center">
              <RiFlowerLine className="mx-auto text-slate-200" size={52} />
              <p className="mt-4 font-semibold text-slate-700">No encontramos arreglos</p>
              <button type="button" onClick={clearFilters} className="mt-4 text-sm font-bold text-primary-500">Limpiar filtros</button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-5 lg:gap-y-10">
                {visible.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAdd={quickAdd}
                    favorite={favorites.includes(product.id)}
                    onFavorite={toggleFavorite}
                    priority={index < 4}
                    sizes={GRID_SIZES}
                  />
                ))}
              </div>
              <div ref={sentinelRef} className="mt-10 flex flex-col items-center gap-2 text-center">
                {hasMore ? (
                  <button type="button" onClick={loadMore} className="inline-flex h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-700 transition hover:border-primary-200 hover:text-primary-600">
                    Ver más arreglos <RiArrowDownSLine className="text-primary-500" />
                  </button>
                ) : filtered.length > PAGE_SIZE ? (
                  <p className="text-xs text-slate-400">Ya viste todos los arreglos</p>
                ) : null}
              </div>
            </>
          )}
        </section>

        <section className="mb-5 grid rounded-2xl border border-slate-200 bg-white sm:grid-cols-2 lg:grid-cols-4">
          {[
            { Icon: RiFlowerLine, title: "Flores frescas", text: "Seleccionadas cuidadosamente cada día." },
            { Icon: RiTruckLine, title: "Entrega el mismo día", text: `Haz tu pedido antes de las ${formatTime12(sameDayCutoffTime)}.` },
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
