"use client";
import Image from "next/image"
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { RiShoppingBagLine, RiMenuLine, RiCloseLine } from "react-icons/ri";
import { useCartStore } from "@/store/cartStore";
import { motion, AnimatePresence } from "framer-motion";
import { cinzel } from "@/config/fonts";

export default function Header({ forceLight = false }: { forceLight?: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { getTotalItems, toggleCart } = useCartStore();
  const total = getTotalItems();

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  const links = [
    { href: "/flores", label: "Catálogo" },
    { href: "/flores?ocasion=amor", label: "Amor" },
    { href: "/flores?ocasion=cumpleanos", label: "Cumpleaños" },
    { href: "/flores?ocasion=bodas", label: "Bodas" },
    { href: "/seguimiento", label: "Mi Pedido" },
  ];

  const isLight = forceLight || scrolled || mobileOpen || pathname !== "/";

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isLight ? "bg-white/95 backdrop-blur-md shadow-sm py-3" : "bg-transparent py-5"}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/flowers/logo.png"
            alt="Fantasía Floral Logo"
            width={40}
            height={40}
            className="object-contain"
          />
          <div>
            <span className={`${cinzel.className} font-display text-xl font-semibold block leading-none transition-colors ${isLight ? "text-gray-900" : "text-white"}`}>
              Fantasía Floral
            </span>
            <span className={`text-[10px] tracking-[0.2em] uppercase transition-colors ${isLight ? "text-primary-500" : "text-white/50"}`}>
              Floreria
            </span>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-7">
          {links.map(l => (
            <Link key={l.href} href={l.href}
              className={`text-sm font-medium transition-colors relative group ${isLight ? "text-gray-600 hover:text-primary-600" : "text-white/80 hover:text-white"}`}>
              {l.label}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-500 group-hover:w-full transition-all duration-300" />
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button onClick={toggleCart}
            className={`relative p-2.5 rounded-full transition-all hover:scale-105 ${isLight ? "bg-primary-600 text-white hover:bg-primary-700" : "bg-white/15 text-white hover:bg-white/25 backdrop-blur-sm border border-white/20"}`}>
            <RiShoppingBagLine size={18} />
            {mounted && total > 0 && (
              <motion.span key={total} initial={{ scale: 0 }} animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 bg-primary-600 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold shadow-sm">
                {total}
              </motion.span>
            )}
          </button>
          <button className={`md:hidden p-2 transition-colors ${isLight ? "text-gray-700" : "text-white"}`}
            onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <RiCloseLine size={22} /> : <RiMenuLine size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-gray-100">
            <div className="px-4 py-4 flex flex-col gap-1">
              {links.map(l => (
                <Link key={l.href} href={l.href} onClick={() => setMobileOpen(false)}
                  className="text-gray-700 font-medium py-3 px-3 rounded-xl hover:bg-gray-50 border-b border-gray-50 last:border-0 transition-colors">
                  {l.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}