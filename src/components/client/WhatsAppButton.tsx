"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RiWhatsappLine, RiCloseLine, RiCustomerService2Line, RiTruckLine, RiScissorsCutLine, RiGiftLine, RiMapPinLine, RiChat3Line } from "react-icons/ri";

const messages = [
  { id: 1, icon: RiCustomerService2Line, text: "¡Hola! ¿En qué te ayudamos?" },
  { id: 2, icon: RiTruckLine,            text: "Hacemos envíos el mismo día" },
  { id: 3, icon: RiScissorsCutLine,      text: "Pide tu arreglo personalizado" },
  { id: 4, icon: RiGiftLine,             text: "Ramos, coronas y centros de mesa" },
  { id: 5, icon: RiMapPinLine,           text: "Entregamos en toda la ciudad" },
  { id: 6, icon: RiChat3Line,            text: "¡Escríbenos, respondemos al instante!" },
];

export default function WhatsAppButton() {
  const [open, setOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const [currentMsg, setCurrentMsg] = useState(0);
  const [visible, setVisible] = useState(true);

  // Auto-rotate messages when chat is closed
  useEffect(() => {
    if (open) return;

    const cycle = setInterval(() => {
      // Fade out
      setVisible(false);
      setTimeout(() => {
        setCurrentMsg((prev) => (prev + 1) % messages.length);
        setVisible(true);
      }, 400);
    }, 3500);

    return () => clearInterval(cycle);
  }, [open]);

  const handleOpen = () => {
    setOpen(true);
    setHasOpened(true);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Expanded chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.85 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            className="flex flex-col gap-2 mb-1 items-end"
          >
            {/* Header card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-[#075E54] text-white rounded-2xl rounded-br-sm px-4 py-3 shadow-xl max-w-[240px] flex items-center gap-2"
            >
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <RiWhatsappLine size={18} />
              </div>
              <div>
                <p className="text-xs font-bold leading-none">Fantasía Floral</p>
                <p className="text-[10px] text-white/60 mt-0.5">Normalmente responde al instante</p>
              </div>
            </motion.div>

            {/* All message bubbles */}
            {messages.slice(0, 3).map((b, i) => (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, x: 30, scale: 0.8 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{
                  delay: 0.15 + i * 0.12,
                  type: "spring",
                  stiffness: 260,
                  damping: 22,
                }}
                className="bg-white text-gray-800 text-sm px-4 py-2.5 rounded-2xl rounded-br-sm shadow-md max-w-[220px] border border-gray-100 flex items-center gap-2"
              >
                <b.icon size={16} className="text-[#25D366] flex-shrink-0" />
                {b.text}
              </motion.div>
            ))}

            {/* CTA button */}
            <motion.a
              href="https://wa.me/573024128595?text=Hola!%20Me%20interesa%20hacer%20un%20pedido%20de%20flores%20%F0%9F%8C%B8"
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-semibold text-sm px-5 py-3 rounded-full shadow-lg transition-colors"
            >
              <RiWhatsappLine size={18} />
              Pedir por WhatsApp
            </motion.a>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating auto-message bubble (visible when chat is closed) */}
      <AnimatePresence>
        {!open && visible && (
          <motion.div
            key={messages[currentMsg].id}
            initial={{ opacity: 0, x: 20, scale: 0.88 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 10, scale: 0.92 }}
            transition={{ type: "spring", stiffness: 280, damping: 22 }}
            className="bg-white text-gray-800 text-sm px-4 py-2.5 rounded-2xl rounded-br-sm shadow-lg max-w-[220px] border border-gray-100 cursor-pointer"
            onClick={handleOpen}
          >
            <div className="flex items-center gap-2">
              {(() => { const Icon = messages[currentMsg].icon; return <Icon size={15} className="text-[#25D366] flex-shrink-0" />; })()}
              <span className="text-[12px]" >{messages[currentMsg].text}</span>
            </div>
            {/* Tiny tail */}
            <span className="block text-[10px] text-gray-400 mt-0.5 text-right">
              Fantasía Floral · ahora
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <div className="relative">
        <motion.button
          onClick={() => (open ? setOpen(false) : handleOpen())}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.92 }}
          animate={!open ? { scale: [1, 1.07, 1] } : {}}
          transition={!open ? { repeat: Infinity, repeatDelay: 5, duration: 0.5 } : {}}
          className="relative w-14 h-14 bg-[#25D366] hover:bg-[#1ebe5d] text-white rounded-full shadow-xl flex items-center justify-center transition-colors"
          aria-label="Contactar por WhatsApp"
        >
          <AnimatePresence mode="wait">
            {open ? (
              <motion.span
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <RiCloseLine size={24} />
              </motion.span>
            ) : (
              <motion.span
                key="whatsapp"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <RiWhatsappLine size={26} />
              </motion.span>
            )}
          </AnimatePresence>

          {/* Unread dot */}
          {!hasOpened && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
              <span className="text-[8px] font-bold text-white">1</span>
            </span>
          )}
        </motion.button>
      </div>
    </div>
  );
}   