import Link from "next/link";
import { RiPhoneLine, RiMailLine, RiMapPin2Line, RiInstagramLine, RiFacebookBoxLine, RiFlowerLine } from "react-icons/ri";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <RiFlowerLine className="text-primary-400" size={24}/>
              <span className="font-display text-2xl font-semibold" style={{fontFamily:"var(--font-cormorant),Georgia,serif"}}>
                Fantasía Floral
              </span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Flores frescas y arreglos únicos para cada momento especial de tu vida.
            </p>
            <div className="flex gap-3 mt-4">
              <a href="#" className="w-9 h-9 bg-gray-700 rounded-full flex items-center justify-center hover:bg-primary-600 transition-colors">
                <RiInstagramLine size={16}/>
              </a>
              <a href="#" className="w-9 h-9 bg-gray-700 rounded-full flex items-center justify-center hover:bg-primary-600 transition-colors">
                <RiFacebookBoxLine size={16}/>
              </a>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Catálogo</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              {["Ramos","Bouquets","Arreglos","Premium","Orquídeas"].map(i => (
                <li key={i}><Link href="/flores" className="hover:text-white transition-colors">{i}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Ayuda</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              {[
                { l: "Seguir pedido",        h: "/seguimiento" },
                { l: "Preguntas frecuentes", h: "#"            },
                { l: "Política de entregas", h: "#"            },
              ].map(i => (
                <li key={i.l}><Link href={i.h} className="hover:text-white transition-colors">{i.l}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Contacto</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex items-center gap-2"><RiPhoneLine size={14}/> 300 000 0000</li>
              <li className="flex items-center gap-2"><RiMailLine size={14}/> hola@fantasiafloral.com</li>
              <li className="flex items-center gap-2"><RiMapPin2Line size={14}/> Bogotá, Colombia</li>
            </ul>
          </div>
        </div>
        {/* Año estático — evita hydration mismatch con new Date() */}
        <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-500">
          © 2025 Fantasía Floral. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}