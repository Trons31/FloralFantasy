"use client";
import { motion } from "framer-motion";
import { RiStarFill, RiFlowerLine } from "react-icons/ri";

const testimonials = [
  { name:"María García",   role:"Cliente frecuente", text:"Las flores llegaron frescas y hermosas. El ramo de rosas fue perfecto para el cumpleaños de mi mamá. ¡100% recomendado!", avatar:"MG" },
  { name:"Carlos Ramírez", role:"Cliente nuevo",     text:"Compré un arreglo especial para el aniversario. La calidad es increíble y el servicio muy rápido. Mi esposa quedó encantada.", avatar:"CR" },
  { name:"Laura Méndez",   role:"Cliente frecuente", text:"Siempre compro aquí. Los arreglos son únicos, las flores duran mucho y el sistema de seguimiento es muy práctico.", avatar:"LM" },
];

export default function TestimonialsSection() {
  return (
    <section className="py-24 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-950 relative overflow-hidden">
      {/* Decorative background icons — not emoji */}
      <div className="absolute inset-0 flex items-center justify-around pointer-events-none select-none opacity-5">
        <RiFlowerLine size={200} className="text-white"/>
        <RiFlowerLine size={200} className="text-white"/>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center mb-16">
          <motion.h2 initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}}
            className="text-4xl md:text-5xl font-display font-semibold text-white"
            style={{fontFamily:"var(--font-cormorant),Georgia,serif"}}>
            Lo que dicen nuestros clientes
          </motion.h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div key={t.name} initial={{opacity:0,y:30}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*0.15}}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <div className="flex gap-1 mb-4">
                {[0,1,2,3,4].map(j => <RiStarFill key={j} className="text-yellow-400" size={14}/>)}
              </div>
              <p className="text-white/90 mb-6 leading-relaxed italic">&ldquo;{t.text}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-400 flex items-center justify-center text-white font-bold text-sm">{t.avatar}</div>
                <div>
                  <p className="text-white font-semibold text-sm">{t.name}</p>
                  <p className="text-white/60 text-xs">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}