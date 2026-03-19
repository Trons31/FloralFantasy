"use client";
import { motion } from "framer-motion";
import { RiStarFill, RiDoubleQuotesL } from "react-icons/ri";

const testimonials = [
  { name:"María García",   role:"Cliente frecuente", text:"Las flores llegaron frescas y hermosas. El ramo de rosas fue perfecto para el cumpleaños de mi mamá. ¡100% recomendado!", avatar:"MG", color:"bg-rose-400" },
  { name:"Carlos Ramírez", role:"Cliente nuevo",     text:"Compré un arreglo especial para el aniversario. La calidad es increíble y el servicio muy rápido. Mi esposa quedó encantada.", avatar:"CR", color:"bg-primary-500" },
  { name:"Laura Méndez",   role:"Cliente frecuente", text:"Siempre compro aquí. Los arreglos son únicos, las flores duran mucho y el sistema de seguimiento es muy práctico.", avatar:"LM", color:"bg-amber-400" },
];

export default function TestimonialsSection() {
  return (
    <section className="py-20 bg-[#fdfcf8] relative overflow-hidden">
      {/* Decorative large text */}
      <div className="absolute -top-4 -left-4 text-[12rem] font-serif text-gray-100 select-none leading-none pointer-events-none" aria-hidden>
        &ldquo;
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <motion.div initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}}
          className="text-center mb-14">
          <p className="text-primary-600 text-xs font-bold tracking-[0.2em] uppercase mb-2">Opiniones reales</p>
          <h2 className="font-display font-semibold text-gray-900"
            style={{fontFamily:"var(--font-cormorant),Georgia,serif", fontSize:"clamp(2rem,4vw,3rem)"}}>
            Lo que dicen nuestros clientes
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div key={t.name}
              initial={{opacity:0,y:30}} whileInView={{opacity:1,y:0}}
              viewport={{once:true}} transition={{delay:i*0.12}}
              className="bg-white rounded-2xl p-7 shadow-sm border border-gray-100 relative"
            >
              <RiDoubleQuotesL className="text-primary-100 absolute top-5 right-6" size={36}/>
              <div className="flex gap-1 mb-4">
                {[0,1,2,3,4].map(j => <RiStarFill key={j} className="text-amber-400" size={13}/>)}
              </div>
              <p className="text-gray-600 leading-relaxed text-sm mb-6">{t.text}</p>
              <div className="flex items-center gap-3 pt-4 border-t border-gray-50">
                <div className={`w-10 h-10 rounded-full ${t.color} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                  {t.avatar}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                  <p className="text-gray-400 text-xs">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}