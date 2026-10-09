"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { RiFlowerLine, RiHeart3Fill, RiHeart3Line, RiShoppingBagLine, RiStarLine } from "react-icons/ri";
import { formatPrice } from "@/lib/utils";
import { canOptimizeImage } from "@/lib/image";
import { getMainImage, type QuickAddProduct } from "@/components/client/useQuickAdd";

export type ProductCardProduct = QuickAddProduct & {
  featured?: boolean;
  requiresSpecialOrder?: boolean;
};

type ProductCardProps = {
  product: ProductCardProduct;
  onAdd: (product: ProductCardProduct) => void;
  favorite?: boolean;
  /** Sin este callback no se muestra el corazón. */
  onFavorite?: (id: string) => void;
  /** Para las tarjetas visibles al cargar (primera fila). */
  priority?: boolean;
  /** Ancho real de la tarjeta en el grid, para que next/image pida el tamaño justo. */
  sizes?: string;
};


const badgeClass = "flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold shadow-sm";

/**
 * Tarjeta de producto de la tienda (spec 004). Es la del home: foto cuadrada,
 * nombre y precio centrados. La usan home, catálogo y recomendaciones.
 */
export default function ProductCard({
  product,
  onAdd,
  favorite = false,
  onFavorite,
  priority = false,
  sizes = "(min-width: 1024px) 25vw, 50vw",
}: ProductCardProps) {
  const [loaded, setLoaded] = useState(false);
  const image = getMainImage(product);
  const href = `/flores/${product.id}`;
  const leadDays = product.deliveryLeadDays || 0;

  return (
    <article className="group">
      <div className="relative mb-3 aspect-square overflow-hidden rounded-2xl bg-gray-100 sm:mb-4">
        <Link href={href} className="absolute inset-0" aria-label={product.name}>
          {image ? (
            canOptimizeImage(image) ? (
              <Image
                src={image}
                alt={product.name}
                fill
                sizes={sizes}
                priority={priority}
                onLoad={() => setLoaded(true)}
                className={`object-cover transition duration-700 group-hover:scale-105 ${loaded ? "opacity-100" : "opacity-0"}`}
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                ref={element => { if (element?.complete) setLoaded(true); }}
                src={image}
                alt={product.name}
                loading={priority ? "eager" : "lazy"}
                decoding="async"
                onLoad={() => setLoaded(true)}
                className={`h-full w-full object-cover transition duration-700 group-hover:scale-105 ${loaded ? "opacity-100" : "opacity-0"}`}
              />
            )
          ) : (
            <span className="grid h-full place-items-center">
              <RiFlowerLine className="text-gray-300" size={48} />
            </span>
          )}
          {image && !loaded && <span className="absolute inset-0 animate-pulse bg-gray-100" aria-hidden />}
          <span className="absolute inset-0 bg-black/0 transition duration-300 md:group-hover:bg-black/15" aria-hidden />
        </Link>

        <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {product.featured && <span className={`${badgeClass} bg-primary-600 text-white`}><RiStarLine size={9} /> Top</span>}
          {product.requiresSpecialOrder ? (
            <span className={`${badgeClass} bg-amber-500 text-white`}>Encargo</span>
          ) : leadDays > 0 ? (
            <span className={`${badgeClass} bg-white/95 text-gray-700`}>Entrega en {leadDays} {leadDays === 1 ? "día" : "días"}</span>
          ) : null}
        </div>

        {onFavorite && (
          <button
            type="button"
            onClick={() => onFavorite(product.id)}
            aria-label={`${favorite ? "Quitar" : "Agregar"} ${product.name} ${favorite ? "de" : "a"} favoritos`}
            aria-pressed={favorite}
            className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/95 text-gray-600 shadow-sm transition hover:text-primary-500"
          >
            {favorite ? <RiHeart3Fill className="text-primary-500" size={17} /> : <RiHeart3Line size={17} />}
          </button>
        )}

        {/* Escritorio: aparece al pasar el mouse. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 hidden justify-center pb-4 md:flex">
          <button
            type="button"
            onClick={() => onAdd(product)}
            className="pointer-events-auto inline-flex max-w-[calc(100%-1.25rem)] translate-y-3 items-center gap-2 whitespace-nowrap rounded-full bg-white px-4 py-2.5 text-[11px] font-semibold text-gray-900 opacity-0 shadow-lg transition-all duration-200 hover:bg-primary-600 hover:text-white focus-visible:translate-y-0 focus-visible:opacity-100 group-hover:translate-y-0 group-hover:opacity-100"
          >
            <RiShoppingBagLine size={13} /> Añadir al carrito
          </button>
        </div>

        {/* Táctil: sin hover, el botón queda siempre visible. */}
        <button
          type="button"
          onClick={() => onAdd(product)}
          aria-label={`Agregar ${product.name} al carrito`}
          className="absolute bottom-2.5 right-2.5 grid h-10 w-10 place-items-center rounded-full bg-white text-primary-600 shadow-md transition active:scale-95 md:hidden"
        >
          <RiShoppingBagLine size={18} />
        </button>
      </div>

      <div className="text-center">
        <h3 className="mb-1 line-clamp-1 text-sm font-medium text-gray-900">
          <Link href={href} className="hover:text-primary-600">{product.name}</Link>
        </h3>
        <span className="text-base font-bold text-gray-900">{formatPrice(product.price)}</span>
      </div>
    </article>
  );
}
