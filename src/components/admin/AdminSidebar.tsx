"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { IconType } from "react-icons";
import {
  RiBarChartLine,
  RiCalendarEventLine,
  RiCloseLine,
  RiDashboardLine,
  RiFlowerLine,
  RiGiftLine,
  RiLayoutGridLine,
  RiLeafLine,
  RiListCheck,
  RiLogoutBoxLine,
  RiMenuLine,
  RiSettings4Line,
  RiShieldLine,
  RiTeamLine,
  RiUser3Fill,
  RiWalletLine,
  RiCalculatorLine,
} from "react-icons/ri";

type NavItem = {
  href: string;
  icon: IconType;
  label: string;
  exact?: boolean;
};

type NavSection = {
  label: string;
  items: NavItem[];
};

const NAV_SECTIONS: NavSection[] = [
  {
    label: "Dashboard",
    items: [
      {
        href: "/dashboard",
        icon: RiDashboardLine,
        label: "Dashboard",
        exact: true,
      },
    ],
  },
  {
    label: "Servicios",
    items: [
      { href: "/dashboard/pedidos", icon: RiLayoutGridLine, label: "Tablero" },
      { href: "/dashboard/todos-pedidos", icon: RiListCheck, label: "Pedidos" },
      { href: "/dashboard/flores", icon: RiFlowerLine, label: "Flores" },
      { href: "/dashboard/productos", icon: RiLeafLine, label: "Productos" },
      { href: "/dashboard/ocasiones", icon: RiCalendarEventLine, label: "Ocasiones" },
      { href: "/dashboard/addons", icon: RiGiftLine, label: "Adicionales" },
    ],
  },
  {
    label: "Administración",
    items: [
      { href: "/dashboard/contabilidad", icon: RiCalculatorLine, label: "Contabilidad" },
      { href: "/dashboard/egresos", icon: RiWalletLine, label: "Egresos" },
      { href: "/dashboard/reportes", icon: RiBarChartLine, label: "Reportes" },
      { href: "/dashboard/equipo", icon: RiTeamLine, label: "Equipo" },
    ],
  },
];

const SIDEBAR_SURFACE =
  "bg-[radial-gradient(circle_at_0%_0%,rgba(235,21,80,0.08),transparent_28%),linear-gradient(180deg,#0d1a2d_0%,#091426_100%)]";

export default function AdminSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes((session?.user as any)?.role || "");

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);

  const SidebarContent = () => (
    <div className={`flex h-full flex-col overflow-hidden text-white ${SIDEBAR_SURFACE}`}>
      <div className="px-5 pb-4 pt-5">
        <div className="flex items-center gap-2.5">
          <RiShieldLine className="shrink-0 text-primary-500" size={27} />
          <div className="text-[13px] font-extrabold leading-none tracking-[0.02em]">
            <span>SUPER </span>
            <span className="text-primary-500">ADMIN</span>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-[0_8px_22px_rgba(232,24,90,0.28)]">
            <RiUser3Fill size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold leading-tight text-white">
              {session?.user?.name || "Super Admin"}
            </p>
            <p className="mt-0.5 truncate text-[11px] leading-tight text-slate-400">
              {session?.user?.email || ""}
            </p>
          </div>
        </div>
      </div>

      <div className="mx-5 h-px bg-white/10" />

      <nav className="sidebar-scroll flex-1 overflow-y-auto px-3 py-3">
        <div className="space-y-4">
          {NAV_SECTIONS.map((section) => (
            <section key={section.label}>
              {section.label !== "Dashboard" && (
                <p className="mb-1.5 px-2 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                  {section.label}
                </p>
              )}

              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const active = isActive(item);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={[
                        "group flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-200",
                        active
                          ? "bg-gradient-to-r from-primary-500 to-[#f20f5e] text-white shadow-[0_8px_24px_rgba(232,24,90,0.24)]"
                          : "text-slate-300 hover:bg-white/[0.055] hover:text-white",
                      ].join(" ")}
                    >
                      <item.icon
                        size={17}
                        className={[
                          "shrink-0 transition-colors",
                          active ? "text-white" : "text-slate-400 group-hover:text-white",
                        ].join(" ")}
                      />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>

              {section.label !== "Dashboard" && (
                <div className="mt-3 h-px bg-white/[0.07]" />
              )}
            </section>
          ))}

          {isAdmin && (
            <section>
              <p className="mb-1.5 px-2 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                Configuración
              </p>
              <Link
                href="/dashboard/ajustes"
                aria-current={pathname.startsWith("/dashboard/ajustes") ? "page" : undefined}
                className={[
                  "group flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-200",
                  pathname.startsWith("/dashboard/ajustes")
                    ? "bg-gradient-to-r from-primary-500 to-[#f20f5e] text-white shadow-[0_8px_24px_rgba(232,24,90,0.24)]"
                    : "text-slate-300 hover:bg-white/[0.055] hover:text-white",
                ].join(" ")}
              >
                <RiSettings4Line
                  size={17}
                  className={pathname.startsWith("/dashboard/ajustes") ? "text-white" : "text-slate-400 group-hover:text-white"}
                />
                <span>Ajustes</span>
              </Link>
            </section>
          )}
        </div>
      </nav>

      <div className="border-t border-white/[0.08] px-3 py-3">
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/auth/login" })}
          className="flex min-h-10 w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium text-primary-400 transition-colors hover:bg-primary-500/10 hover:text-primary-300"
        >
          <RiLogoutBoxLine size={17} className="shrink-0" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <header className={`fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-white/10 px-4 text-white shadow-lg lg:hidden ${SIDEBAR_SURFACE}`}>
        <div className="flex items-center gap-2">
          <RiShieldLine className="text-primary-500" size={24} />
          <p className="text-xs font-extrabold">
            SUPER <span className="text-primary-500">ADMIN</span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-200 transition-colors hover:bg-white/10"
          aria-label="Abrir menú"
        >
          <RiMenuLine size={21} />
        </button>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.button
              type="button"
              aria-label="Cerrar menú"
              className="absolute inset-0 bg-slate-950/55"
              onClick={() => setOpen(false)}
            />
            <motion.aside
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              className="absolute inset-y-0 left-0 w-[min(82vw,16rem)] overflow-hidden shadow-2xl"
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Cerrar menú"
              >
                <RiCloseLine size={20} />
              </button>
              <SidebarContent />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 overflow-hidden border-r border-white/10 shadow-[8px_0_30px_rgba(15,23,42,0.08)] lg:block">
        <SidebarContent />
      </aside>
    </>
  );
}
