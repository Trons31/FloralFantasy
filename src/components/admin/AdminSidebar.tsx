"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import {
  RiDashboardLine, RiShoppingBagLine, RiFlowerLine, RiLeafLine,
  RiCalculatorLine, RiBarChartLine, RiMenuLine, RiCloseLine,
  RiLogoutBoxLine, RiShieldLine, RiGiftLine,
} from "react-icons/ri";
import { motion, AnimatePresence } from "framer-motion";

const NAV = [
  { href: "/dashboard", icon: RiDashboardLine, label: "Dashboard" },
  { href: "/dashboard/pedidos", icon: RiShoppingBagLine, label: "Pedidos" },
  { href: "/dashboard/flores", icon: RiFlowerLine, label: "Flores" },
  { href: "/dashboard/productos", icon: RiLeafLine, label: "Productos" },
  { href: "/dashboard/addons", icon: RiGiftLine, label: "Adicionales" },
  { href: "/dashboard/contabilidad", icon: RiCalculatorLine, label: "Contabilidad" },
  { href: "/dashboard/reportes", icon: RiBarChartLine, label: "Reportes" },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);


  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white border-r border-gray-100">

      {/* Logo */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shadow-sm">
            <RiShieldLine className="text-white" size={20} />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm leading-tight">
              {session?.user?.name || "Admin"}
            </p>
            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[140px]">
              {session?.user?.email || ""}
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV.map(item => {
          const active = isActive(item.href);
          return (
            <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${active
                ? "bg-primary-600 text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}>
              <item.icon size={16} className="flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-gray-100">
        <button
          onClick={() => signOut({ callbackUrl: "/auth/login" })}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-500 transition-all w-full">
          <RiLogoutBoxLine size={16} /> Cerrar sesión
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile topbar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <RiShieldLine className="text-white" size={16} />
          </div>
          <span className="font-bold text-gray-900 text-sm">Fantasía Floral</span>
        </div>
        <button onClick={() => setOpen(!open)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
          {open ? <RiCloseLine size={20} /> : <RiMenuLine size={20} />}
        </button>
      </div>

      {/* Mobile drawer */}

      {open && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute fade-in inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)} />
          <div
            className="absolute left-0 top-0 bottom-0 w-64 shadow-xl">
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 h-screen fixed left-0 top-0 z-40">
        <SidebarContent />
      </aside>
    </>
  );
}