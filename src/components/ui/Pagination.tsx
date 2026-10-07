"use client";

import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

type PaginationProps = {
  page: number;
  totalPages: number;
  totalItems: number;
  perPage: number;
  itemLabel?: string;
  onPageChange: (page: number) => void;
  onPerPageChange?: (perPage: number) => void;
  perPageOptions?: number[];
  /** Atenua los controles mientras llega la siguiente pagina. */
  pending?: boolean;
  className?: string;
};

const navButton =
  "inline-flex h-10 min-w-0 flex-1 items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-600 transition-colors hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700 disabled:cursor-not-allowed disabled:text-slate-300 disabled:opacity-70 sm:px-3 lg:flex-none";

/**
 * Paginacion de tablas del panel. Mismo diseño que `ServerPagination` de
 * CliqCut: "Mostrando X a Y de Z", Anterior / Pagina N de M / Siguiente y
 * selector "N por pagina". Va dentro del card de la tabla, al final.
 */
export default function Pagination({
  page,
  totalPages,
  totalItems,
  perPage,
  itemLabel = "registros",
  onPageChange,
  onPerPageChange,
  perPageOptions = [5, 10, 20, 50],
  pending = false,
  className = "",
}: PaginationProps) {
  const safeTotalPages = Math.max(1, totalPages);
  const safePage = Math.min(Math.max(1, page), safeTotalPages);
  const firstItem = totalItems === 0 ? 0 : (safePage - 1) * perPage + 1;
  const lastItem = Math.min(safePage * perPage, totalItems);
  const options = Array.from(new Set([...perPageOptions, perPage])).sort((a, b) => a - b);

  return (
    <div className={`flex flex-col gap-3 border-t border-gray-100 bg-white px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between ${className}`}>
      <p className="text-center text-xs font-semibold text-slate-500 lg:text-left">
        {totalItems === 0
          ? `Mostrando 0 de 0 ${itemLabel}`
          : `Mostrando ${firstItem} a ${lastItem} de ${totalItems} ${itemLabel}`}
      </p>

      <div className={`flex flex-col gap-2 transition-opacity lg:flex-row lg:items-center ${pending ? "opacity-50" : ""}`}>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPageChange(safePage - 1)}
            disabled={safePage <= 1 || pending}
            className={navButton}
            aria-label="Página anterior"
          >
            <FiChevronLeft className="h-4 w-4" />
            Anterior
          </button>

          <span className="flex h-10 shrink-0 items-center justify-center px-1 text-xs font-bold tabular-nums text-slate-700">
            Página {safePage} de {safeTotalPages}
          </span>

          <button
            type="button"
            onClick={() => onPageChange(safePage + 1)}
            disabled={safePage >= safeTotalPages || pending}
            className={navButton}
            aria-label="Página siguiente"
          >
            Siguiente
            <FiChevronRight className="h-4 w-4" />
          </button>
        </div>

        {onPerPageChange && (
          <label className="relative w-full lg:w-auto">
            <span className="sr-only">Cantidad de {itemLabel} por página</span>
            <select
              value={perPage}
              onChange={(event) => onPerPageChange(Number(event.target.value))}
              disabled={pending}
              className="h-10 w-full min-w-0 rounded-xl border border-slate-200 bg-white pl-3 pr-8 text-xs font-semibold text-slate-700 outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100 disabled:opacity-50 lg:w-auto"
            >
              {options.map((option) => (
                <option key={option} value={option}>{option} por página</option>
              ))}
            </select>
          </label>
        )}
      </div>
    </div>
  );
}
