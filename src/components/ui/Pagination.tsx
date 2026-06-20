"use client";

import { RiArrowLeftSLine, RiArrowRightSLine } from "react-icons/ri";

type PaginationProps = {
  page: number;
  totalPages: number;
  totalItems: number;
  perPage: number;
  itemLabel?: string;
  onPageChange: (page: number) => void;
  onPerPageChange?: (perPage: number) => void;
  perPageOptions?: number[];
  className?: string;
};

function pageItems(page: number, totalPages: number): Array<number | "ellipsis"> {
  if (totalPages <= 5) return Array.from({ length: totalPages }, (_, index) => index + 1);
  if (page <= 3) return [1, 2, 3, 4, "ellipsis", totalPages];
  if (page >= totalPages - 2) return [1, "ellipsis", totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  return [1, "ellipsis", page - 1, page, page + 1, "ellipsis", totalPages];
}

export default function Pagination({
  page,
  totalPages,
  totalItems,
  perPage,
  itemLabel = "elementos",
  onPageChange,
  onPerPageChange,
  perPageOptions = [8, 10, 12, 16],
  className = "",
}: PaginationProps) {
  const safePages = Math.max(1, totalPages);
  const safePage = Math.min(Math.max(1, page), safePages);
  const first = totalItems ? (safePage - 1) * perPage + 1 : 0;
  const last = Math.min(safePage * perPage, totalItems);
  const items = pageItems(safePage, safePages);

  return (
    <footer className={`border-t border-slate-100 bg-white px-3 py-4 sm:px-5 ${className}`}>
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <p className="text-center text-[11px] text-slate-500 sm:text-left">
          Mostrando <strong className="font-semibold text-slate-700">{first}-{last}</strong> de{" "}
          <strong className="font-semibold text-slate-700">{totalItems}</strong> {itemLabel}
        </p>

        <div className="flex max-w-full items-center justify-center gap-1.5">
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => onPageChange(safePage - 1)}
            aria-label="Página anterior"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-primary-200 hover:text-primary-500 disabled:pointer-events-none disabled:opacity-30"
          >
            <RiArrowLeftSLine size={18} />
          </button>

          <div className="hidden items-center gap-1 sm:flex">
            {items.map((item, index) =>
              item === "ellipsis" ? (
                <span key={`ellipsis-${index}`} className="grid h-9 min-w-5 place-items-center text-xs text-slate-400">...</span>
              ) : (
                <button
                  key={item}
                  type="button"
                  onClick={() => onPageChange(item)}
                  aria-current={item === safePage ? "page" : undefined}
                  className={`grid h-9 min-w-9 place-items-center rounded-lg px-2 text-xs font-semibold transition ${
                    item === safePage
                      ? "bg-primary-500 text-white shadow-[0_5px_14px_rgba(236,18,91,.2)]"
                      : "border border-slate-200 bg-white text-slate-600 hover:border-primary-200 hover:text-primary-500"
                  }`}
                >
                  {item}
                </button>
              )
            )}
          </div>

          <span className="flex h-9 min-w-[72px] items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 sm:hidden">
            {safePage} de {safePages}
          </span>

          <button
            type="button"
            disabled={safePage >= safePages}
            onClick={() => onPageChange(safePage + 1)}
            aria-label="Página siguiente"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-primary-200 hover:text-primary-500 disabled:pointer-events-none disabled:opacity-30"
          >
            <RiArrowRightSLine size={18} />
          </button>
        </div>

        <label className="flex items-center gap-2 text-[11px] text-slate-500">
          <span>Mostrar</span>
          {onPerPageChange ? (
            <select
              value={perPage}
              onChange={event => onPerPageChange(Number(event.target.value))}
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none focus:border-primary-300"
            >
              {Array.from(new Set([...perPageOptions, perPage])).sort((a, b) => a - b).map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          ) : (
            <span className="grid h-9 min-w-12 place-items-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700">{perPage}</span>
          )}
        </label>
      </div>
    </footer>
  );
}
