"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";
import type { IconType } from "react-icons";
import {
  FiBarChart2,
  FiCalendar,
  FiExternalLink,
  FiGift,
  FiGrid,
  FiList,
  FiLogOut,
  FiMenu,
  FiPackage,
  FiSettings,
  FiTrello,
  FiUsers,
  FiX,
} from "react-icons/fi";
import { PiFlowerTulip } from "react-icons/pi";
import { VscGraph } from "react-icons/vsc";
import { TbCash } from "react-icons/tb";
import BrandLogo, { BRAND_NAME } from "@/components/ui/BrandLogo";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { useBodyScrollLock } from "@/lib/scroll-lock";

type NavItem = { href: string; label: string; icon: IconType; exact?: boolean };
type NavSection = { title: string; items: NavItem[] };

const NAV_SECTIONS: NavSection[] = [
  {
    title: "Principal",
    items: [
      { href: "/dashboard", label: "Inicio", icon: FiGrid, exact: true },
      { href: "/dashboard/pedidos", label: "Tablero", icon: FiTrello },
      { href: "/dashboard/todos-pedidos", label: "Pedidos", icon: FiList },
    ],
  },
  {
    title: "Catálogo",
    items: [
      { href: "/dashboard/flores", label: "Flores", icon: PiFlowerTulip },
      { href: "/dashboard/productos", label: "Productos", icon: FiPackage },
      { href: "/dashboard/ocasiones", label: "Ocasiones", icon: FiCalendar },
      { href: "/dashboard/addons", label: "Adicionales", icon: FiGift },
    ],
  },
  {
    title: "Finanzas",
    items: [
      { href: "/dashboard/contabilidad", label: "Contabilidad", icon: VscGraph },
      { href: "/dashboard/egresos", label: "Egresos", icon: TbCash },
      { href: "/dashboard/reportes", label: "Reportes", icon: FiBarChart2 },
    ],
  },
  {
    title: "Cuenta",
    items: [
      { href: "/dashboard/equipo", label: "Equipo", icon: FiUsers },
      { href: "/dashboard/ajustes", label: "Ajustes", icon: FiSettings },
    ],
  },
];

export type SidebarUser = {
  name: string | null;
  email: string | null;
  role: string | null;
};

function roleLabel(role: string | null) {
  return role === "SUPER_ADMIN" ? "Super admin" : "Admin";
}

function isActive(pathname: string, item: NavItem) {
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

/**
 * Contenido del sidebar. Vive a nivel de modulo a proposito: definido dentro
 * del render de `AdminSidebar` (como estaba antes) React lo trataba como un
 * componente nuevo en cada render y lo volvia a montar entero. Ese re-montaje
 * era el parpadeo que se veia al abrir el menu en el celular.
 */
function SidebarBody({
  pathname,
  user,
  onNavigate,
  onLogout,
}: {
  pathname: string;
  user: SidebarUser;
  onNavigate: () => void;
  onLogout: () => void;
}) {
  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-white text-gray-900">
      {/* Cabecera: el negocio y, bajo un divisor, quien esta conectado. */}
      <div className="relative px-2 pb-3 pt-2">
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center gap-2.5 p-3">
            <BrandLogo size={36} />
            <span className="line-clamp-2 min-w-0 flex-1 break-words text-sm font-black leading-snug text-gray-900">
              {BRAND_NAME}
            </span>
          </div>
          <div className="border-t border-gray-100 p-1.5">
            <div className="block px-1.5 py-1">
              <span className="flex items-center gap-1.5">
                <span className="min-w-0 flex-1 truncate text-xs font-semibold text-gray-700">
                  {user.name || roleLabel(user.role)}
                </span>
                <span className="shrink-0 rounded-full bg-gray-100 px-1.5 py-px text-[10px] font-bold text-gray-500">
                  {roleLabel(user.role)}
                </span>
              </span>
              {user.email && <span className="mt-0.5 block truncate text-[11px] font-medium text-gray-400">{user.email}</span>}
            </div>
          </div>
        </div>
      </div>

      <nav className="custom-scrollbar relative flex-1 overflow-y-auto px-2 pb-3">
        {NAV_SECTIONS.map((section, index) => (
          <div key={section.title} className={index === 0 ? "mt-1" : "mt-4 border-t border-gray-100 pt-4"}>
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wide text-gray-400">{section.title}</p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(pathname, item);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={`group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium leading-tight transition-colors ${
                      active ? "bg-brand-500 text-white shadow-sm" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    {active && <span className="absolute -left-2 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-brand-300" />}
                    <Icon
                      className={`h-4 w-4 shrink-0 ${active ? "text-white" : "text-gray-400 group-hover:text-brand-500"}`}
                    />
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="relative px-2 pb-3">
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-brand-600"
          >
            <FiExternalLink className="h-4 w-4 text-brand-500" />
            <span className="min-w-0 flex-1">Ver tienda</span>
          </a>
          <div className="mx-4 h-px bg-gray-100" />
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-gray-600 transition-colors hover:bg-red-50 hover:text-red-500"
          >
            <FiLogOut className="h-4 w-4 text-brand-500" />
            <span className="min-w-0 flex-1">Cerrar sesión</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminSidebar({ user }: { user: SidebarUser }) {
  const pathname = usePathname() ?? "";
  const [open, setOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Contador compartido con los modales: cerrar el menu no desbloquea el
  // fondo de un modal que siga abierto, ni al reves.
  useBodyScrollLock(open);

  const close = () => setOpen(false);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      // `redirect: false` + `location.replace`: con `callbackUrl` el router
      // repinta el panel ya sin sesion antes de navegar (parpadeo), y el
      // panel quedaria en el historial.
      await signOut({ redirect: false });
      window.location.replace("/auth/login");
    } catch (error) {
      console.error("No se pudo cerrar la sesión", error);
      setLoggingOut(false);
    }
  };

  const requestLogout = () => {
    setOpen(false);
    setConfirmLogout(true);
  };

  return (
    <>
      {/* Barra superior en movil */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between gap-3 border-b border-gray-100 bg-white px-4 text-gray-900 shadow-sm lg:hidden">
        <div className="flex min-w-0 items-center gap-2">
          <BrandLogo size={32} />
          <span className="truncate text-sm font-bold text-gray-900">{BRAND_NAME}</span>
        </div>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex-shrink-0 rounded-xl p-2 text-gray-700 hover:bg-gray-100"
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={open}
        >
          {open ? <FiX className="h-5 w-5" /> : <FiMenu className="h-5 w-5" />}
        </button>
      </header>

      {/* Menu lateral en movil: siempre montado y se desliza con `transform`.
          Montarlo y desmontarlo en cada apertura re-creaba todo el arbol y la
          pantalla parpadeaba. `invisible` lo saca del orden de tabulacion
          cuando esta cerrado. */}
      <div className={`fixed inset-0 z-50 lg:hidden ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
        <div
          className={`absolute inset-0 bg-black/45 transition-opacity duration-200 ${open ? "opacity-100" : "opacity-0"}`}
          onClick={close}
        />
        <aside
          className={`absolute inset-y-0 left-0 w-64 shadow-2xl transition-[transform,visibility] duration-200 ease-out ${
            open ? "visible translate-x-0" : "invisible -translate-x-full"
          }`}
        >
          <SidebarBody pathname={pathname} user={user} onNavigate={close} onLogout={requestLogout} />
        </aside>
      </div>

      {/* Sidebar de escritorio */}
      <aside className="fixed left-0 top-0 hidden h-screen w-64 flex-col border-r border-gray-100 bg-white lg:flex">
        <SidebarBody pathname={pathname} user={user} onNavigate={() => {}} onLogout={requestLogout} />
      </aside>

      <ConfirmModal
        open={confirmLogout}
        onClose={() => setConfirmLogout(false)}
        onConfirm={handleLogout}
        loading={loggingOut}
        title="Cerrar sesión"
        message="¿Estás seguro de que quieres salir?"
        confirmLabel="Salir"
      />
    </>
  );
}
