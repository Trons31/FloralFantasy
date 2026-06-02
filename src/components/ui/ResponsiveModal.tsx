"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { RiCloseLine } from "react-icons/ri";
import type { ReactNode } from "react";

type ResponsiveModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  panelClassName?: string;
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
};

export default function ResponsiveModal({
  open,
  onClose,
  title,
  description,
  children,
  className = "",
  panelClassName = "",
  showCloseButton = true,
  closeOnBackdrop = true,
}: ResponsiveModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const overlay = useMemo(() => {
    if (!mounted) return null;
    if (!open) return null;

    return createPortal(
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm ${className}`}
          onClick={closeOnBackdrop ? onClose : undefined}
        >
          <div className="flex h-full w-full items-end justify-center md:items-center md:p-6" onClick={closeOnBackdrop ? onClose : undefined}>
            <motion.div
              initial={{ y: 48, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 48, opacity: 0, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
              className={`w-full overflow-hidden bg-white shadow-2xl rounded-t-3xl md:max-w-4xl md:rounded-3xl ${panelClassName}`}
              style={{ maxHeight: "92dvh" }}
              onClick={e => e.stopPropagation()}
            >
            {(title || showCloseButton) && (
              <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 pt-5 pb-4">
                <div className="min-w-0">
                  <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-gray-200 md:hidden" />
                  {title && <h2 className="text-lg font-bold text-gray-900">{title}</h2>}
                  {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
                </div>
                {showCloseButton && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex h-10 w-10 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                    aria-label="Cerrar modal"
                  >
                    <RiCloseLine size={20} />
                  </button>
                )}
              </div>
            )}

            <div className="max-h-[calc(92dvh-5rem)] overflow-y-auto overscroll-contain px-5 py-5">
              {children}
            </div>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>,
      document.body
    );
  }, [mounted, open, closeOnBackdrop, onClose, title, description, showCloseButton, children, className, panelClassName]);

  return overlay;
}
