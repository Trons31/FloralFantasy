"use client";

import { FiAlertTriangle } from "react-icons/fi";
import Modal from "./Modal";
import LoadingButton from "./LoadingButton";

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

/** Confirmacion del panel, port del ConfirmModal de CliqCut. */
export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  loading = false,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  danger = false,
}: ConfirmModalProps) {
  return (
    <Modal open={open} onClose={loading ? () => {} : onClose} size="sm">
      <div className="text-center">
        <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${danger ? "bg-red-100" : "bg-amber-100"}`}>
          <FiAlertTriangle className={`h-6 w-6 ${danger ? "text-red-500" : "text-amber-500"}`} />
        </div>
        <h3 className="mb-2 text-lg font-bold text-gray-900">{title}</h3>
        <p className="mb-6 text-sm text-gray-500">{message}</p>
        <div className="flex gap-3">
          <LoadingButton variant="secondary" className="flex-1" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </LoadingButton>
          <LoadingButton variant={danger ? "danger" : "primary"} className="flex-1" onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </LoadingButton>
        </div>
      </div>
    </Modal>
  );
}
