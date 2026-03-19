import Link from "next/link";
import { RiPhoneLine, RiMailLine, RiMapPin2Line, RiInstagramLine, RiFacebookBoxLine, RiFlowerLine, RiWhatsappLine } from "react-icons/ri";

export default function Footer() {
  return (
    <footer className="bg-[#120508] text-white">
      {/* Top band */}
      <div className="border-b border-white/10 py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <p className="font-display text-2xl font-semibold" style={{fontFamily:"var(--font-cormorant),Georgia,serif"}}>
              <RiFlowerLine className="inline text-primary-400 mr-2" size={22}/>
              Fantasía Floral
            </p>
            <p className="text-white/40 text-xs mt-1 tracking-widest uppercase">Floristería artesanal</p>
          </div>
          <a href="https://wa.me/573000000000" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 bg-[#25D366] hover:bg-[#1ebe5d] text-white px-6 py-3 rounded-full font-semibold text-sm transition-colors">
            <RiWhatsappLine size={18}/> Pide por WhatsApp
          </a>
        </div>
      </div>

      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-6 py-14">
        <div className="grid md:grid-cols-4 gap-10 mb-12">
          <div className="md:col-span-1">
            <p className="text-white/40 text-xs uppercase tracking-widest font-semibold mb-4">Sobre nosotros</p>
            <p className="text-white/60 text-sm leading-relaxed">
              Creamos arreglos florales únicos para los momentos más especiales de tu vida. Flores frescas, diseño artesanal.
            </p>
            <div className="flex gap-3 mt-5">
              <a href="#" className="w-9 h-9 bg-white/10 hover:bg-primary-600 rounded-full flex items-center justify-center transition-colors">
                <RiInstagramLine size={15}/>
              </a>
              <a href="#" className="w-9 h-9 bg-white/10 hover:bg-primary-600 rounded-full flex items-center justify-center transition-colors">
                <RiFacebookBoxLine size={15}/>
              </a>
              <a href="https://wa.me/573000000000" className="w-9 h-9 bg-white/10 hover:bg-[#25D366] rounded-full flex items-center justify-center transition-colors">
                <RiWhatsappLine size={15}/>
              </a>
            </div>
          </div>

          <div>
            <p className="text-white/40 text-xs uppercase tracking-widest font-semibold mb-4">Catálogo</p>
            <ul className="space-y-2.5 text-sm text-white/60">
              {["Ramos","Bouquets","Arreglos","Premium","Orquídeas"].map(i => (
                <li key={i}>
                  <Link href="/flores" className="hover:text-white transition-colors">{i}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-white/40 text-xs uppercase tracking-widest font-semibold mb-4">Ayuda</p>
            <ul className="space-y-2.5 text-sm text-white/60">
              {[
                { l:"Seguir pedido",        h:"/seguimiento" },
                { l:"Preguntas frecuentes", h:"#" },
                { l:"Política de entregas", h:"#" },
              ].map(i => (
                <li key={i.l}>
                  <Link href={i.h} className="hover:text-white transition-colors">{i.l}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-white/40 text-xs uppercase tracking-widest font-semibold mb-4">Contacto</p>
            <ul className="space-y-3 text-sm text-white/60">
              <li className="flex items-center gap-2.5"><RiPhoneLine size={14} className="text-primary-400 flex-shrink-0"/> 300 000 0000</li>
              <li className="flex items-center gap-2.5"><RiMailLine size={14} className="text-primary-400 flex-shrink-0"/> hola@fantasiafloral.com</li>
              <li className="flex items-center gap-2.5"><RiMapPin2Line size={14} className="text-primary-400 flex-shrink-0"/> Sincelejo, Sucre</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/30">
          <span>© 2025 Fantasía Floral. Todos los derechos reservados.</span>
          <span>Hecho con amor en Colombia 🇨🇴</span>
        </div>
      </div>
    </footer>
  );
}