import Image from "next/image";
import Link from "next/link";
import {
  RiFacebookBoxLine,
  RiInstagramLine,
  RiMailLine,
  RiMapPin2Line,
  RiPhoneLine,
  RiWhatsappLine,
} from "react-icons/ri";
import { cinzel } from "@/config/fonts";

export default function Footer() {
  return (
    <footer className="bg-[#3E2723] text-white">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="mb-12 grid gap-10 md:grid-cols-4">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Image src="/flowers/logo.png" alt="Fantasía Floral" width={36} height={36} className="object-contain" />
              <div>
                <p className={`${cinzel.className} text-lg font-semibold leading-none`}>Fantasía Floral</p>
                <p className="text-[10px] uppercase tracking-widest text-white/40">Florería</p>
              </div>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-white/60">
              Creamos arreglos florales únicos para los momentos más especiales de tu vida. Flores frescas y diseño artesanal.
            </p>
            <div className="mt-5 flex gap-3">
              <a href="#" aria-label="Instagram" className="grid h-9 w-9 place-items-center rounded-full bg-white/10 transition-colors hover:bg-primary-600"><RiInstagramLine size={15} /></a>
              <a href="#" aria-label="Facebook" className="grid h-9 w-9 place-items-center rounded-full bg-white/10 transition-colors hover:bg-primary-600"><RiFacebookBoxLine size={15} /></a>
              <a href="https://wa.me/573000000000" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="grid h-9 w-9 place-items-center rounded-full bg-white/10 transition-colors hover:bg-[#25D366]"><RiWhatsappLine size={15} /></a>
            </div>
          </div>

          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-white/40">Catálogo</p>
            <ul className="space-y-2.5 text-sm text-white/60">
              {["Ramos", "Bouquets", "Arreglos", "Premium", "Orquídeas"].map(item => (
                <li key={item}><Link href="/flores" className="transition-colors hover:text-white">{item}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-white/40">Ayuda</p>
            <ul className="space-y-2.5 text-sm text-white/60">
              <li><Link href="/seguimiento" className="transition-colors hover:text-white">Seguir pedido</Link></li>
              <li><Link href="/seguimiento" className="transition-colors hover:text-white">Preguntas frecuentes</Link></li>
              <li><Link href="/flores" className="transition-colors hover:text-white">Política de entregas</Link></li>
            </ul>
          </div>

          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-white/40">Contacto</p>
            <ul className="space-y-3 text-sm text-white/60">
              <li className="flex items-center gap-2.5"><RiPhoneLine className="shrink-0 text-primary-400" size={14} />300 000 0000</li>
              <li className="flex items-center gap-2.5"><RiMailLine className="shrink-0 text-primary-400" size={14} />hola@fantasiafloral.com</li>
              <li className="flex items-center gap-2.5"><RiMapPin2Line className="shrink-0 text-primary-400" size={14} />Sincelejo, Sucre</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-xs text-white/30 sm:flex-row">
          <span>© 2026 Fantasía Floral. Todos los derechos reservados.</span>
          <span>Diseñado y desarrollado en Colombia</span>
        </div>
      </div>
    </footer>
  );
}
