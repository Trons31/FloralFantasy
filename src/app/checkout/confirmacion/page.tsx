"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  RiCheckboxCircleLine, RiArrowRightLine, RiFlowerLine,
  RiFileCopyLine, RiCheckLine, RiSearchLine,
} from "react-icons/ri";
import { Suspense } from "react";

function Content() {
  const searchParams  = useSearchParams();
  const reference     = searchParams.get("reference"); // orderId from Wompi
  const [token,    setToken]    = useState<string | null>(null);
  const [copied,   setCopied]   = useState(false);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (!reference) { setLoading(false); return; }
    fetch(`/api/orders/${reference}/token`)
      .then(r => r.json())
      .then(d => { if (d.trackingToken) setToken(d.trackingToken); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [reference]);

  const handleCopy = () => {
    if (!token) return;
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="min-h-screen bg-[#fdfcf8] flex items-center justify-center p-4">
      <motion.div
        initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}}
        className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-xl"
      >
        {/* Success icon */}
        <motion.div initial={{scale:0}} animate={{scale:1}} transition={{delay:0.3, type:"spring"}}
          className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <RiCheckboxCircleLine className="text-green-500" size={40}/>
        </motion.div>

        <h1 className="font-semibold mb-2 flex items-center justify-center gap-2"
          style={{fontFamily:"var(--font-cormorant),Georgia,serif", fontSize:"clamp(1.6rem,4vw,2rem)"}}>
          ¡Gracias por tu compra!
          <RiFlowerLine className="text-primary-500" size={24}/>
        </h1>
        <p className="text-gray-400 text-sm mb-8">Tu pedido ha sido recibido y está siendo procesado.</p>

        {/* Token section */}
        {loading ? (
          <div className="bg-gray-50 rounded-2xl p-5 mb-6 animate-pulse h-24"/>
        ) : token ? (
          <motion.div
            initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{delay:0.5}}
            className="bg-primary-50 border-2 border-primary-100 rounded-2xl p-5 mb-6"
          >
            <p className="text-xs font-bold text-primary-600 uppercase tracking-widest mb-2">
              Tu token de seguimiento
            </p>
            <p className="font-mono font-bold text-2xl text-gray-900 tracking-widest mb-3">
              {token}
            </p>
            <p className="text-xs text-gray-400 mb-4">
              Guarda este código — lo necesitarás para rastrear tu pedido
            </p>
            <button
              onClick={handleCopy}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all ${
                copied
                  ? "bg-green-500 text-white"
                  : "bg-primary-600 hover:bg-primary-700 text-white"
              }`}
            >
              {copied
                ? <><RiCheckLine size={16}/> ¡Copiado!</>
                : <><RiFileCopyLine size={16}/> Copiar token</>
              }
            </button>
          </motion.div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 text-sm text-amber-700">
            Recibirás tu token de seguimiento por email en unos minutos.
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Link href={token ? `/seguimiento?token=${token}` : "/seguimiento"}
            className="flex items-center justify-center gap-2 bg-primary-600 text-white py-3.5 rounded-full font-semibold hover:bg-primary-700 transition-colors">
            <RiSearchLine size={16}/> Rastrear mi pedido
          </Link>
          <Link href="/"
            className="text-gray-400 hover:text-gray-600 text-sm py-2 transition-colors">
            Volver al inicio
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default function ConfirmacionPage() {
  return <Suspense><Content/></Suspense>;
}