"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FiChevronRight } from "react-icons/fi";

type ScrollArrowsProps = {
  children: React.ReactNode;
  /** Clases del contenedor con scroll horizontal (flex, gap, overflow…). */
  className?: string;
  /** Clases del envoltorio (p. ej. `-mx-4 sm:mx-0` para llegar al borde). */
  wrapperClassName?: string;
  /** Color del fondo de la página, para el degradado del borde. */
  fadeFrom?: string;
  /** Nombre de lo que se desliza, para el aria-label. */
  label: string;
};

/**
 * Carrusel con aviso de “hay más” (spec 011), igual que `ScrollableTabs` de
 * CliqCut: en el borde con contenido oculto, un degradado del color del fondo
 * con un chevron pequeño. No tapa el contenido como un botón flotante.
 */
export default function ScrollArrows({ children, className = "", wrapperClassName = "", fadeFrom = "#fffdfa", label }: ScrollArrowsProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const update = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    // 2px de margen absorben el redondeo a subpíxel (evita parpadeo al final).
    setCanLeft(el.scrollLeft > 2);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    update();
    el.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, [update]);

  const scrollByPage = (direction: 1 | -1) => {
    const el = scrollerRef.current;
    if (el) el.scrollBy({ left: direction * el.clientWidth * 0.7, behavior: "smooth" });
  };

  return (
    <div className={`relative ${wrapperClassName}`}>
      <div ref={scrollerRef} className={className}>
        {children}
      </div>
      {canLeft && (
        <button
          type="button"
          onClick={() => scrollByPage(-1)}
          aria-label={`Ver ${label} anteriores`}
          className="absolute inset-y-0 -left-px flex w-10 items-center justify-start"
          style={{ backgroundImage: `linear-gradient(to right, ${fadeFrom}, ${fadeFrom}e6 40%, transparent)` }}
        >
          <FiChevronRight className="h-4 w-4 rotate-180 text-primary-500" />
        </button>
      )}
      {canRight && (
        <button
          type="button"
          onClick={() => scrollByPage(1)}
          aria-label={`Ver más ${label}`}
          className="absolute inset-y-0 -right-px flex w-10 items-center justify-end"
          style={{ backgroundImage: `linear-gradient(to left, ${fadeFrom}, ${fadeFrom}e6 40%, transparent)` }}
        >
          <FiChevronRight className="h-4 w-4 animate-pulse text-primary-500" />
        </button>
      )}
    </div>
  );
}
