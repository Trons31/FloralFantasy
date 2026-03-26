"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { RiArrowRightLine, RiStarFill, RiTruckLine, RiShieldCheckLine, RiFlowerLine } from "react-icons/ri";

const TICKER_ITEMS = [
  "Ramos Artesanales","Entrega a Domicilio","Flores Frescas","Bodas & Eventos","Rosas Importadas","Girasoles","Arreglos Únicos","Servicio Express",
];

export default function HeroSection() {
  return (
    <>
      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-end overflow-hidden bg-[#1a0a0f]">

        {/* Full-bleed background image */}
        <div className="absolute inset-0">
          <img
            src="/flowers/ramo1.jpg"
            alt="Hero"
            className="w-full h-full object-cover opacity-60"
            style={{ objectPosition:"center 30%" }}
          />
          {/* Gradient overlay — dark at bottom for text legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#1a0a0f] via-[#1a0a0f]/40 to-transparent"/>
        </div>

        {/* Content */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 pb-20 pt-32">
          <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.2, duration:0.7}}>
            <span className="inline-flex items-center gap-2 bg-primary-600/20 border border-primary-400/40 text-primary-300 text-xs font-semibold tracking-[0.15em] uppercase px-4 py-2 rounded-full mb-6 backdrop-blur-sm">
              <RiFlowerLine size={12}/> Diseño floral
            </span>
          </motion.div>

          <motion.h1
            initial={{opacity:0,y:30}} animate={{opacity:1,y:0}} transition={{delay:0.35, duration:0.8}}
            className="text-white mb-6"
            style={{
              fontFamily:"var(--font-cormorant),Georgia,serif",
              fontSize:"clamp(3rem,9vw,7rem)",
              lineHeight:1.05,
              fontWeight:600,
              letterSpacing:"-0.02em",
            }}
          >
            Flores que<br/>
            <em style={{color:"#f9a8c9", fontStyle:"italic"}}>enamoran</em>
          </motion.h1>

          <motion.p
            initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.5, duration:0.7}}
            className="text-white/70 text-lg max-w-md mb-10 leading-relaxed font-light"
          >
            Arreglos florales únicos, diseñados con amor y entregados con el cuidado que cada momento merece.
          </motion.p>

          <motion.div
            initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.65}}
            className="flex flex-wrap gap-4"
          >
            <Link href="/flores"
              className="flex items-center gap-2.5 bg-primary-600 hover:bg-primary-500 text-white px-8 py-4 rounded-full font-semibold text-sm transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary-900/40">
              Ver catálogo <RiArrowRightLine size={16}/>
            </Link>
            <Link href="/seguimiento"
              className="flex items-center gap-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 px-8 py-4 rounded-full font-semibold text-sm transition-all backdrop-blur-sm">
              Rastrear pedido
            </Link>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.9}}
            className="flex flex-wrap gap-6 mt-12"
          >
            {[
              { icon: RiStarFill,        label: "+500 clientes", color:"text-yellow-400" },
              { icon: RiTruckLine,       label: "Entrega express", color:"text-primary-400" },
              { icon: RiShieldCheckLine, label: "Pago seguro",    color:"text-emerald-400" },
            ].map(b => (
              <div key={b.label} className="flex items-center gap-2 text-white/60 text-sm">
                <b.icon className={b.color} size={14}/> {b.label}
              </div>
            ))}
          </motion.div>
        </div>

        {/* Bottom ticker teaser */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-primary-600/90 backdrop-blur-sm overflow-hidden flex items-center z-20">
          <motion.div
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="flex gap-0 whitespace-nowrap"
          >
            {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
              <span key={i} className="flex items-center gap-4 text-white text-xs font-semibold tracking-widest uppercase px-8">
                {item} <span className="text-primary-300 text-base">✦</span>
              </span>
            ))}
          </motion.div>
        </div>
      </section>
    </>
  );
}