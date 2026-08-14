"use client";

import { useState } from "react";
import { ShoppingBag, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/useCartStore";
import type { ProductoPublico } from "@/types/product";

interface BotonAgregarProductoProps {
  producto: ProductoPublico;
}

export function BotonAgregarProducto({ producto }: BotonAgregarProductoProps) {
  const agregarProducto = useCartStore((estado) => estado.agregarProducto);
  const [agregado, setAgregado] = useState(false);

  const manejarAgregar = () => {
    agregarProducto(producto);
    setAgregado(true);
    window.setTimeout(() => setAgregado(false), 1500);
  };

  return (
    <Button
      onClick={manejarAgregar}
      disabled={!producto.isAvailable}
      className="h-12 w-full text-sm font-small sm:text-base"
      aria-label={
        agregado
          ? `${producto.name} agregado al pedido`
          : `Agregar ${producto.name} al pedido`
      }
    >
      {agregado ? (
        <>
          <Check className="mr-2 h-4 w-4" aria-hidden="true" />
          Agregado
        </>
      ) : (
        <>
          <ShoppingBag className="mr-2 h-4 w-4" aria-hidden="true" />
          Agregar al pedido
        </>
      )}
    </Button>
  );
}