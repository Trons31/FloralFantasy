"use client";

import { FiLogOut, FiRefreshCw } from "react-icons/fi";
import BrandLogo from "@/components/ui/BrandLogo";

type OpsHeaderProps = {
  /** Rol visible: "Preparador", "Repartidor", "Corredor". */
  role: string;
  userName: string;
  onRefresh: () => void;
  onLogout: () => void;
  /** Ancho del contenido de la vista, para alinear la cabecera con él. */
  maxWidth?: "max-w-xl" | "max-w-2xl";
  /** Segunda fila opcional (pestañas, acción principal). */
  children?: React.ReactNode;
};

/**
 * Cabecera común de las vistas de operaciones, con el lenguaje del topbar de
 * CliqCut: blanca, borde `gray-100`, logo de marca y acciones icónicas.
 */
export default function OpsHeader({
  role,
  userName,
  onRefresh,
  onLogout,
  maxWidth = "max-w-2xl",
  children,
}: OpsHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-gray-100 bg-white/95 backdrop-blur">
      <div className={`mx-auto flex h-16 items-center justify-between gap-3 px-4 ${maxWidth}`}>
        <div className="flex min-w-0 items-center gap-3">
          <BrandLogo size={40} />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold leading-tight text-gray-900">{userName}</p>
            <p className="truncate text-xs font-medium text-gray-400">{role}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onRefresh}
            className="grid h-10 w-10 place-items-center rounded-xl text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
            aria-label="Actualizar"
          >
            <FiRefreshCw className="h-[18px] w-[18px]" />
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="grid h-10 w-10 place-items-center rounded-xl text-gray-400 transition hover:bg-red-50 hover:text-red-500"
            aria-label="Cerrar sesión"
          >
            <FiLogOut className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>
      {children && <div className={`mx-auto px-4 pb-3 ${maxWidth}`}>{children}</div>}
    </header>
  );
}
