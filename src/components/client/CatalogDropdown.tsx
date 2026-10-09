"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { RiArrowDownSLine, RiCheckLine } from "react-icons/ri";

export type DropdownOption = { value: string; label: string };

type CatalogDropdownProps = {
  /** Etiqueta corta sobre el valor: “Ordenar”, “Precio”. */
  label: string;
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  /** Lado al que se alinea el menú; “right” para el último de la fila. */
  align?: "left" | "right";
};

/**
 * Desplegable de la tienda (spec 008). Sustituye al <select> nativo, cuyo menú
 * no se puede estilizar. Patrón listbox: ↑ ↓ mueven, Enter elige, Escape /
 * clic fuera / Tab cierran.
 */
export default function CatalogDropdown({ label, value, options, onChange, align = "left" }: CatalogDropdownProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();
  const selected = options.find(option => option.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  useEffect(() => {
    if (open) listRef.current?.focus();
  }, [open]);

  const openMenu = () => {
    setActiveIndex(Math.max(0, options.findIndex(option => option.value === value)));
    setOpen(true);
  };

  const choose = (index: number) => {
    const option = options[index];
    if (option) onChange(option.value);
    setOpen(false);
    buttonRef.current?.focus();
  };

  const onListKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown") { event.preventDefault(); setActiveIndex(i => Math.min(options.length - 1, i + 1)); }
    else if (event.key === "ArrowUp") { event.preventDefault(); setActiveIndex(i => Math.max(0, i - 1)); }
    else if (event.key === "Home") { event.preventDefault(); setActiveIndex(0); }
    else if (event.key === "End") { event.preventDefault(); setActiveIndex(options.length - 1); }
    else if (event.key === "Enter" || event.key === " ") { event.preventDefault(); choose(activeIndex); }
    else if (event.key === "Escape") { event.preventDefault(); setOpen(false); buttonRef.current?.focus(); }
    else if (event.key === "Tab") setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative min-w-0">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={event => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); openMenu(); }
        }}
        className={`flex h-12 w-full items-center gap-3 rounded-2xl border bg-white pl-4 pr-3 text-left transition lg:min-w-[180px] ${
          open ? "border-primary-300 ring-4 ring-primary-50" : "border-slate-200 hover:border-primary-200"
        }`}
      >
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block text-[10px] font-medium uppercase tracking-wide text-slate-400">{label}</span>
          <span className="block truncate text-[13px] font-semibold text-slate-900">{selected?.label}</span>
        </span>
        <RiArrowDownSLine className={`shrink-0 text-slate-400 transition-transform duration-200 ${open ? "rotate-180 text-primary-500" : ""}`} size={18} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            ref={listRef}
            id={listId}
            role="listbox"
            aria-label={label}
            aria-activedescendant={`${listId}-${activeIndex}`}
            tabIndex={-1}
            onKeyDown={onListKeyDown}
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.14 }}
            className={`absolute top-full z-30 mt-2 w-max min-w-full max-w-[min(18rem,calc(100vw-2rem))] rounded-2xl border border-slate-100 bg-white p-1.5 shadow-[0_16px_40px_rgba(15,23,42,.12)] outline-none ${
              align === "right" ? "right-0 origin-top-right" : "left-0 origin-top-left"
            }`}
          >
            {options.map((option, index) => {
              const isSelected = option.value === value;
              const isActive = index === activeIndex;
              return (
                <li
                  key={option.value}
                  id={`${listId}-${index}`}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => choose(index)}
                  className={`flex cursor-pointer items-center justify-between gap-4 rounded-xl px-3 py-2.5 text-[13px] transition-colors ${
                    isActive ? "bg-primary-50 text-primary-700" : "text-slate-700"
                  } ${isSelected ? "font-semibold" : ""}`}
                >
                  {option.label}
                  <RiCheckLine className={`shrink-0 text-primary-500 ${isSelected ? "opacity-100" : "opacity-0"}`} size={16} />
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
