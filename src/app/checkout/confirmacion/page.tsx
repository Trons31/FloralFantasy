"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { RiCheckboxCircleLine, RiArrowRightLine } from "react-icons/ri";
import { Suspense } from "react";

function Content() {
  return (
    <div className="min-h-screen bg-[#fdfcf8] flex items-center justify-center p-4">
      <motion.div initial={{scale:0.8,opacity:0}} animate={{scale:1,opacity:1}}
        className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-xl">
        <motion.div initial={{scale:0}} animate={{scale:1}} transition={{delay:0.3,type:"spring"}}
          className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <RiCheckboxCircleLine className="text-green-500 text-5xl"/>
        </motion.div>
        <h1 className="text-3xl font-display font-semibold mb-2" style={{fontFamily:"var(--font-cormorant),Georgia,serif"}}>
          ¡Gracias por tu compra! 🌸
        </h1>
        <p className="text-gray-500 mb-6">Recibirás un email con tu token de seguimiento para rastrear tu pedido.</p>
        <div className="flex flex-col gap-3">
          <Link href="/seguimiento" className="flex items-center justify-center gap-2 bg-primary-600 text-white py-3 rounded-full font-medium hover:bg-primary-700 transition-colors">
            Ver mi pedido <RiArrowRightLine size={16}/>
          </Link>
          <Link href="/" className="text-gray-500 hover:text-gray-700 text-sm py-2 transition-colors">Volver al inicio</Link>
        </div>
      </motion.div>
    </div>
  );
}
export default function ConfirmacionPage() { return <Suspense><Content/></Suspense>; }
