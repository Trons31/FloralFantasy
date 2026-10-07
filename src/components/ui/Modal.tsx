"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FiX } from "react-icons/fi";
import { useBodyScrollLock } from "@/lib/scroll-lock";

export type ModalSize = "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  /** Linea secundaria bajo el titulo. */
  description?: string;
  /** Cabecera a medida; reemplaza a `title`/`description`. */
  header?: React.ReactNode;
  /**
   * Barra de acciones fija bajo el contenido. El contenido hace scroll y el
   * footer queda siempre visible, en movil y en escritorio. Antes cada modal
   * pegaba sus botones con `absolute` o `sticky` y en movil quedaban tapando
   * el ultimo campo.
   */
  footer?: React.ReactNode;
  children: React.ReactNode;
  size?: ModalSize;
  /** Clases extra del panel (p. ej. un ancho maximo propio). */
  panelClassName?: string;
  /** Reemplaza el padding/scroll por defecto del cuerpo. */
  contentClassName?: string;
}

const sizes: Record<ModalSize, string> = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
  xl: "sm:max-w-2xl",
  "2xl": "sm:max-w-4xl",
  "3xl": "sm:max-w-5xl",
};

/**
 * Ventana del panel, port directo del Modal de CliqCut.
 *
 * - En movil es una hoja pegada abajo con tirador; desde `sm` se centra.
 * - Escape y el fondo la cierran; el foco queda atrapado dentro.
 * - El scroll del body se bloquea con el contador compartido de
 *   `scroll-lock`, asi dos modales encimados no dejan la pagina trabada.
 */
export default function Modal({
  open,
  onClose,
  title,
  description,
  header,
  footer,
  children,
  size = "md",
  panelClassName = "",
  contentClassName,
}: ModalProps) {
  const [mounted, setMounted] = useState(false);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  // `onClose` suele llegar como funcion en linea, distinta en cada render del
  // padre. Con la ref, el efecto de abajo depende solo de `open`.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = dialogRef.current;
    const focusFrame = window.requestAnimationFrame(() => {
      const initialFocus = dialog?.querySelector<HTMLElement>(
        "[data-modal-initial-focus], button, [href], input, select, textarea, [tabindex]:not([tabindex=\"-1\"])"
      );
      (initialFocus ?? dialog)?.focus();
    });

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab" || !dialog) return;

      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          "button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex=\"-1\"])"
        )
      ).filter((element) => element.getClientRects().length > 0);
      if (focusable.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [open]);

  if (!mounted || !open) return null;

  const hasHeader = Boolean(title || header);

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/50 lg:backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      <div
        ref={dialogRef}
        className={`relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[90vh] sm:rounded-2xl ${panelClassName || sizes[size]}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={hasHeader ? titleId : undefined}
        aria-label={hasHeader ? undefined : "Ventana de diálogo"}
        tabIndex={-1}
      >
        <div className="flex shrink-0 justify-center pb-1 pt-2 sm:hidden" aria-hidden="true">
          <span className="h-1 w-10 rounded-full bg-gray-300" />
        </div>

        {hasHeader && (
          <div className="flex shrink-0 items-start justify-between gap-3 border-b border-gray-100 px-5 py-4 sm:p-5">
            {header ? (
              <div id={titleId} className="min-w-0 flex-1">{header}</div>
            ) : (
              <div className="min-w-0 flex-1">
                <h2 id={titleId} className="break-words text-lg font-bold text-gray-900">{title}</h2>
                {description && <p className="mt-0.5 break-words text-sm text-gray-500">{description}</p>}
              </div>
            )}
            <button
              type="button"
              onClick={onClose}
              data-modal-initial-focus
              className="-mr-2 -mt-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-200"
              aria-label="Cerrar"
            >
              <FiX className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        )}

        <div className={contentClassName ?? "custom-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain p-5"}>
          {children}
        </div>

        {footer && (
          <div className="shrink-0 border-t border-gray-100 bg-white px-5 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4 sm:pb-4">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
