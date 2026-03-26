"use client";

import { useState } from "react";
import { RiAddLine, RiWhatsappLine } from "react-icons/ri";
import { useRouter } from "next/navigation";
import CreateOrderModal from "./CreateOrderModal";

export default function PedidosHeader() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleCreated = () => {
    // Refresca el server component para mostrar el nuevo pedido en el kanban
    router.refresh();
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        {/* Title */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Tablero de pedidos</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Arrastra para cambiar estado — se notifica al cliente automáticamente
          </p>
        </div>

        {/* CTA */}
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-500 hover:bg-rose-600
                     active:scale-95 transition-all text-white font-semibold text-sm rounded-xl
                     shadow-sm shadow-rose-200 self-start sm:self-auto"
        >
          <RiAddLine size={18} />
          <span>Agregar pedido</span>
          <RiWhatsappLine size={16} className="opacity-70" />
        </button>
      </div>

      <CreateOrderModal
        open={open}
        onClose={() => setOpen(false)}
        onCreated={handleCreated}
      />
    </>
  );
}