"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useState } from "react";
import {
  LayoutDashboard,
  Package,
  ReceiptText,
  Wallet,
  Users,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const ENLACES_ADMIN = [
  {
    href: "/admin/dashboard",
    label: "Dashboard",
    icono: LayoutDashboard,
  },
  {
    href: "/admin/ordenes",
    label: "Órdenes",
    icono: ReceiptText,
  },
  {
    href: "/admin/inventario",
    label: "Inventario",
    icono: Package,
  },
  {
    href: "/admin/finanzas",
    label: "Finanzas",
    icono: Wallet,
  },
];

const ENLACE_USUARIOS = {
  href: "/admin/usuarios",
  label: "Usuarios",
  icono: Users,
};

function ContenidoNavegacion({
  onNavegar,
}: {
  onNavegar?: () => void;
}) {
  const pathname = usePathname();
  const { usuario, datosUsuario, cerrarSesion } = useAuth();
  const esAdmin = datosUsuario?.rol === "admin";
  const enlaces = esAdmin
    ? [...ENLACES_ADMIN, ENLACE_USUARIOS]
    : ENLACES_ADMIN;

  const manejarCerrarSesion = async () => {
    try {
      await cerrarSesion();
      toast.success("Sesión cerrada");
    } catch {
      toast.error("No se pudo cerrar la sesión");
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-border/60 px-5 py-5">
        <Image
          src="/logo_sin_fondo.png"
          alt="Logo de Renacer Drinks & Coffe"
          width={36}
          height={36}
          className="h-9 w-9 object-contain"
        />
        <div className="min-w-0">
          <p className="truncate font-heading text-base font-bold text-brand-coffee">
            Renacer Admin
          </p>
          <p className="truncate text-base text-muted-foreground">
            {usuario?.email}
            {datosUsuario && (
              <span className="ml-1 rounded-full bg-brand-rose-light px-2 py-0.5 text-sm font-semibold uppercase tracking-wide text-brand-rose-deep">
                {datosUsuario.rol}
              </span>
            )}
          </p>
        </div>
      </div>

      <nav aria-label="Navegación del panel" className="flex-1 space-y-1 p-3">
        {enlaces.map((enlace) => {
          const activo =
            pathname === enlace.href ||
            (enlace.href !== "/admin/dashboard" &&
              pathname.startsWith(enlace.href));
          return (
            <Link
              key={enlace.href}
              href={enlace.href}
              onClick={onNavegar}
              aria-current={activo ? "page" : undefined}
              className={cn(
                "flex min-h-12 items-center gap-3 rounded-xl px-4 py-3 text-base font-medium transition-colors",
                activo
                  ? "bg-brand-rose-deep text-white"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <enlace.icono className="h-5 w-5 shrink-0" aria-hidden="true" />
              {enlace.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border/60 p-3">
        <Button
          variant="ghost"
          className="h-12 w-full justify-start text-muted-foreground hover:text-destructive"
          onClick={manejarCerrarSesion}
        >
          <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
          Cerrar sesión
        </Button>
      </div>
    </div>
  );
}

export function AdminSidebar() {
  const [movilAbierto, setMovilAbierto] = useState(false);

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-border/60 bg-white md:block">
        <ContenidoNavegacion />
      </aside>

      <div className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between border-b border-border/60 bg-white px-4 md:hidden">
        <Link
          href="/admin/dashboard"
          className="flex items-center gap-2"
          onClick={() => setMovilAbierto(false)}
        >
          <Image
            src="/logo_sin_fondo.png"
            alt="Logo de Renacer Drinks & Coffe"
            width={32}
            height={32}
            className="h-8 w-8 object-contain"
          />
          <span className="font-heading text-base font-bold text-brand-coffee">
            Renacer Admin
          </span>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="h-12 w-12"
          onClick={() => setMovilAbierto((abierto) => !abierto)}
          aria-expanded={movilAbierto}
          aria-controls="sidebar-movil"
          aria-label={movilAbierto ? "Cerrar navegación" : "Abrir navegación"}
        >
          {movilAbierto ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
      </div>

      {movilAbierto && (
        <div
          id="sidebar-movil"
          className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm md:hidden"
          onClick={() => setMovilAbierto(false)}
        >
          <aside
            className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-xl"
            onClick={(evento) => evento.stopPropagation()}
          >
            <ContenidoNavegacion onNavegar={() => setMovilAbierto(false)} />
          </aside>
        </div>
      )}
    </>
  );
}