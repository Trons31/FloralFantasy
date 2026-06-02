"use client";

import { useEffect, useState } from "react";
import {
  RiWhatsappLine,
  RiCustomerService2Line,
  RiTruckLine,
  RiScissorsCutLine,
} from "react-icons/ri";
import { useCartStore } from "@/store/cartStore";

const messages = [
  { text: "¿Te ayudamos?", icon: RiCustomerService2Line },
  { text: "Envíos el mismo día", icon: RiTruckLine },
  { text: "Arreglos personalizados", icon: RiScissorsCutLine },
];

export default function WhatsAppButton() {
  const [currentMsg, setCurrentMsg] = useState(0);
  const [visible, setVisible] = useState(true);
  const isCartOpen = useCartStore((state) => state.isOpen);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setCurrentMsg((prev) => (prev + 1) % messages.length);
        setVisible(true);
      }, 250);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  if (isCartOpen) return null;

  const CurrentIcon = messages[currentMsg].icon;

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2">
      {visible && (
        <div className="fade-in bg-white text-gray-800 text-[12px] px-3 py-2 rounded-xl shadow-md max-w-[180px] border flex items-center gap-2">
          <CurrentIcon size={14} className="text-[#25D366] flex-shrink-0" />

          <div>
            <p className="leading-tight">{messages[currentMsg].text}</p>
            <span className="block text-[10px] text-gray-400 text-right">Fantasía Floral</span>
          </div>
        </div>
      )}

      <a
        href="https://wa.me/573024128595?text=Hola!%20Quiero%20hacer%20un%20pedido"
        target="_blank"
        rel="noopener noreferrer"
        className="w-14 h-14 bg-[#25D366] hover:bg-[#1ebe5d] text-white rounded-full shadow-lg flex items-center justify-center"
      >
        <RiWhatsappLine size={26} />
      </a>
    </div>
  );
}
