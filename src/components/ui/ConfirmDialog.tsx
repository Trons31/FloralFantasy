"use client";

import ConfirmModal from "@/components/ui/ConfirmModal";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
};

/**
 * API historica de confirmacion. Delega en `ConfirmModal` (diseño CliqCut).
 * En codigo nuevo, usar `ConfirmModal` directamente.
 */
export default function ConfirmDialog({
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  danger = true,
  ...props
}: ConfirmDialogProps) {
  return <ConfirmModal {...props} danger={danger} confirmLabel={confirmText} cancelLabel={cancelText} />;
}
