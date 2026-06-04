"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { RiCloseLine } from "react-icons/ri";

type ResponsiveModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  panelClassName?: string;
  contentClassName?: string;
};

export default function ResponsiveModal({
  open,
  onClose,
  title,
  description,
  children,
  panelClassName = "",
  contentClassName = "",
}: ResponsiveModalProps) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-black/55 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className={`w-full sm:w-[min(100%,calc(100vw-2rem))] sm:max-w-3xl md:max-w-4xl lg:max-w-5xl max-h-[92vh] bg-white shadow-2xl overflow-hidden flex flex-col rounded-t-[2rem] sm:rounded-[2rem] ${panelClassName}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="relative shrink-0 border-b border-gray-100 bg-white px-5 pt-4 pb-4 sm:px-6 sm:pt-6 sm:pb-5">
          <div className="mx-auto mb-3 h-1.5 w-24 rounded-full bg-gray-200 sm:hidden" />
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-[1.35rem] sm:text-2xl font-semibold tracking-tight text-gray-900">{title}</h2>
              {description && (
                <p className="mt-2 text-sm sm:text-base leading-6 text-gray-500">
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
              aria-label="Cerrar modal"
            >
              <RiCloseLine size={22} />
            </button>
          </div>
        </div>

        <div className={`flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-6 ${contentClassName}`}>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
