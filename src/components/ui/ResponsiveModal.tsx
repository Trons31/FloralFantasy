"use client";

import Modal, { type ModalProps } from "@/components/ui/Modal";

type ResponsiveModalProps = Omit<ModalProps, "title"> & { title: string };

/**
 * Nombre historico del modal del panel. Hoy es solo un alias de `Modal` (el
 * port de CliqCut) para que los consumidores existentes adopten el diseño
 * nuevo sin reescribirse. En codigo nuevo, importar `Modal` directamente.
 */
export default function ResponsiveModal({ size = "xl", ...props }: ResponsiveModalProps) {
  return <Modal size={size} {...props} />;
}
