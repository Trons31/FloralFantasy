"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { RiCloseLine, RiMenuLine, RiShoppingBagLine } from "react-icons/ri";
import { cinzel } from "@/config/fonts";
import { useCartStore } from "@/store/cartStore";
import CartDrawer from "@/components/client/CartDrawer";
import { useBodyScrollLock } from "@/lib/scroll-lock";

export default function Header({ forceLight = false }: { forceLight?: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { getTotalItems, openCart } = useCartStore();
  const total = getTotalItems();

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Menú móvil (spec 010): bloquea el fondo y se cierra con Escape o al navegar.
  useBodyScrollLock(mobileOpen);
  useEffect(() => setMobileOpen(false), [pathname]);
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setMobileOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  const links = [
    { href: "/flores", label: "Catálogo" },
    { href: "/flores?ocasion=amor", label: "Amor" },
    { href: "/flores?ocasion=cumpleanos", label: "Cumpleaños" },
    { href: "/flores?ocasion=bodas", label: "Bodas" },
    { href: "/flores", label: "Ocasiones" },
    { href: "/seguimiento", label: "Mi Pedido" },
  ];
  // `compact` (alto) no depende del menú: si abrirlo cambiara el padding, la
  // cabecera y el menú saltarían a la vez. El menú solo cambia los colores.
  const compact = forceLight || scrolled || pathname !== "/";
  const isLight = compact || mobileOpen;

  return (
    <>
    <header
      style={{ right: "var(--scroll-lock-gap, 0px)" }}
      className={`fixed left-0 top-0 z-50 transition-[background-color,box-shadow,padding] duration-300 ${compact ? "py-3" : "py-5"} ${mobileOpen ? "bg-white" : isLight ? "bg-white/95 shadow-sm backdrop-blur-md" : "bg-transparent"}`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo/logo-mark-small.png" alt="Fantasía Floral" width={40} height={40} className="object-contain" />
          <div>
            <span className={`${cinzel.className} block text-xl font-semibold leading-none transition-colors ${isLight ? "text-gray-900" : "text-white"}`}>
              Fantasía Floral
            </span>
            <span className={`text-[10px] uppercase tracking-[0.2em] transition-colors ${isLight ? "text-primary-500" : "text-white/50"}`}>
              Florería
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {links.map((link, index) => {
            const active = pathname === "/flores" && index === 0;
            return (
              <Link
                key={`${link.href}-${link.label}`}
                href={link.href}
                className={`relative text-sm font-medium transition-colors ${active ? "text-primary-500" : isLight ? "text-gray-700 hover:text-primary-600" : "text-white/80 hover:text-white"}`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <button type="button" onClick={openCart} aria-label="Abrir carrito" className={`relative rounded-full p-3 transition hover:scale-105 ${isLight ? "bg-primary-500 text-white hover:bg-primary-600" : "border border-white/20 bg-white/15 text-white backdrop-blur-sm"}`}>
            <RiShoppingBagLine size={19} />
            {mounted && total > 0 && (
              <motion.span key={total} initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-primary-300 text-[10px] font-bold text-white shadow-sm">
                {total}
              </motion.span>
            )}
          </button>
          <button type="button" aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"} aria-expanded={mobileOpen} className={`p-2 md:hidden ${isLight ? "text-gray-700" : "text-white"}`} onClick={() => setMobileOpen(current => !current)}>
            {mobileOpen ? <RiCloseLine size={23} /> : <RiMenuLine size={23} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        // Fade-in corto en CSS, como CliqCut (spec 011): más barato que deslizar.
        <nav className="absolute inset-x-0 top-full animate-fade-in border-t border-gray-100 bg-white md:hidden">
          <div className="flex flex-col px-4 py-3">
            {links.map(link => (
              <Link key={`${link.href}-${link.label}`} href={link.href} onClick={() => setMobileOpen(false)} className="border-b border-gray-50 px-3 py-3.5 font-medium text-gray-700 last:border-0 active:text-primary-600">
                {link.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
    {mobileOpen && (
      <div
        onClick={() => setMobileOpen(false)}
        className="fixed inset-0 z-40 animate-fade-in bg-slate-950/40 md:hidden"
        aria-hidden
      />
    )}
    {/* Único punto de montaje del carrito (spec 005): toda página con cabecera
        tiene carrito. Fuera del <header>, porque su backdrop-blur convierte a
        la cabecera en contenedor de los elementos `fixed`. */}
    <CartDrawer />
    </>
  );
}
