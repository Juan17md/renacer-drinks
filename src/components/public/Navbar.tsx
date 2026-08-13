"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Menu, X, ShoppingBag, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { useCartStore } from "@/store/useCartStore";

const ENLACES = [
  { href: "/", label: "Inicio" },
  { href: "/catalogo", label: "Menú" },
  { href: "/#ubicacion", label: "Ubicación" },
];

interface NavbarProps {
  tasaBCV: number;
}

export function Navbar({ tasaBCV }: NavbarProps) {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [carritoAbierto, setCarritoAbierto] = useState(false);
  const cantidadItems = useCartStore((estado) =>
    estado.items.reduce((total, item) => total + item.cantidad, 0)
  );

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur-md supports-[backdrop-filter]:bg-background/75">
      <nav
        aria-label="Navegación principal"
        className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8"
      >
        <Link
          href="/"
          className="flex min-h-12 items-center gap-2 rounded-lg"
          aria-label="Renacer Drinks & Coffe - Inicio"
        >
          <Image
            src="/logo_sin_fondo.png"
            alt="Logo de Renacer Drinks & Coffe"
            width={40}
            height={40}
            className="h-10 w-10 object-contain"
            priority
          />
          <span className="font-heading text-lg font-bold tracking-tight text-brand-coffee sm:text-xl">
            Renacer
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {ENLACES.map((enlace) => (
            <Link
              key={enlace.href}
              href={enlace.href}
              className="min-h-12 rounded-md px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              {enlace.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/login"
            className="hidden items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground lg:inline-flex"
          >
            <UserCog className="h-4 w-4" aria-hidden="true" />
            Panel
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="relative h-12 w-12"
            onClick={() => setCarritoAbierto(true)}
            aria-label={`Abrir carrito de compras (${cantidadItems} artículos)`}
          >
            <ShoppingBag className="h-5 w-5" />
            {cantidadItems > 0 && (
              <Badge
                className="absolute -right-0.5 -top-0.5 h-5 min-w-5 rounded-full px-1 text-xs"
                aria-hidden="true"
              >
                {cantidadItems}
              </Badge>
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-12 w-12 md:hidden"
            onClick={() => setMenuAbierto((abierto) => !abierto)}
            aria-expanded={menuAbierto}
            aria-controls="menu-movil"
            aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
          >
            {menuAbierto ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </nav>

      {menuAbierto && (
        <div
          id="menu-movil"
          className="border-t border-border/60 bg-background px-4 py-2 md:hidden"
        >
          <ul className="flex flex-col">
            {ENLACES.map((enlace) => (
              <li key={enlace.href}>
                <Link
                  href={enlace.href}
                  onClick={() => setMenuAbierto(false)}
                  className="flex min-h-12 items-center rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  {enlace.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/admin/login"
                onClick={() => setMenuAbierto(false)}
                className="flex min-h-12 items-center gap-2 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <UserCog className="h-4 w-4" aria-hidden="true" />
                Panel admin
              </Link>
            </li>
          </ul>
        </div>
      )}

      <CartDrawer
        abierto={carritoAbierto}
        onOpenChange={setCarritoAbierto}
        tasaBCV={tasaBCV}
      />
    </header>
  );
}