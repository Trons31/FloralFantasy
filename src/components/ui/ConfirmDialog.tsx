"use client";

import ResponsiveModal from "@/components/ui/ResponsiveModal";

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

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  danger = true,
  loading = false,
  onClose,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <ResponsiveModal open={open} onClose={onClose} title={title} panelClassName="md:max-w-md">
      <div className="space-y-5">
        <div className={`rounded-2xl border px-4 py-3 text-sm ${danger ? "border-red-100 bg-red-50 text-red-700" : "border-gray-200 bg-gray-50 text-gray-700"}`}>
          {message}
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`rounded-2xl px-4 py-3 text-sm font-semibold text-white transition-colors disabled:opacity-60 ${danger ? "bg-red-600 hover:bg-red-700" : "bg-primary-600 hover:bg-primary-700"}`}
          >
            {loading ? "Procesando..." : confirmText}
          </button>
        </div>
      </div>
    </ResponsiveModal>
  );
}
