"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { RiShoppingBagLine, RiMenuLine, RiCloseLine, RiPhoneLine, RiFlowerLine } from "react-icons/ri";
import { useCartStore } from "@/store/cartStore";
import { motion, AnimatePresence } from "framer-motion";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { getTotalItems, toggleCart } = useCartStore();
  const total = getTotalItems();

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  const links = [
    { href: "/flores",                      label: "Catálogo" },
    { href: "/flores?ocasion=amor",         label: "Amor" },
    { href: "/flores?ocasion=cumpleanos",   label: "Cumpleaños" },
    { href: "/flores?ocasion=bodas",        label: "Bodas" },
    { href: "/seguimiento",                 label: "Mi Pedido" },
  ];

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? "glass shadow-lg py-3" : "bg-transparent py-5"}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <RiFlowerLine className="text-primary-500" size={24}/>
          <div>
            <span className="font-display text-2xl font-semibold text-primary-800 block leading-none" style={{fontFamily:"var(--font-cormorant),Georgia,serif"}}>
              Fantasía Floral
            </span>
            <span className="text-xs text-primary-500 tracking-[0.2em] uppercase">Floristería</span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-7">
          {links.map(l => (
            <Link key={l.href} href={l.href} className="text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors relative group">
              {l.label}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-500 group-hover:w-full transition-all duration-300"/>
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <a href="tel:+573000000000" className="hidden md:flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 transition-colors">
            <RiPhoneLine size={15}/> 300 000 0000
          </a>
          <button onClick={toggleCart} className="relative p-2.5 rounded-full bg-primary-600 text-white hover:bg-primary-700 transition-all hover:scale-105">
            <RiShoppingBagLine size={19}/>
            {total > 0 && (
              <motion.span key={total} initial={{scale:0}} animate={{scale:1}}
                className="absolute -top-1 -right-1 bg-rose-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {total}
              </motion.span>
            )}
          </button>
          <button className="md:hidden p-2 text-gray-600" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <RiCloseLine size={24}/> : <RiMenuLine size={24}/>}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}} exit={{opacity:0,height:0}}
            className="md:hidden glass border-t border-white/20">
            <div className="px-4 py-4 flex flex-col gap-3">
              {links.map(l => (
                <Link key={l.href} href={l.href} onClick={() => setMobileOpen(false)}
                  className="text-gray-700 font-medium py-2 border-b border-gray-100 last:border-0">{l.label}</Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}