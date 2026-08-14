"use client";

import { useState } from "react";
import { ShoppingBag, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/useCartStore";
import { generarSlug, precioOfertaANumero } from "@/lib/utils";
import type { OfertaPromocion } from "@/types/promotion";
import type { ProductoPublico } from "@/types/product";

interface BotonAgregarOfertaProps {
  promoId: string;
  oferta: OfertaPromocion;
}

export function BotonAgregarOferta({
  promoId,
  oferta,
}: BotonAgregarOfertaProps) {
  const agregarProducto = useCartStore((estado) => estado.agregarProducto);
  const [agregado, setAgregado] = useState(false);

  const construirProductoOferta = (): ProductoPublico => ({
    id: `promo-${promoId}-${generarSlug(oferta.nombre)}`,
    name: oferta.nombre,
    description: "",
    price: precioOfertaANumero(oferta.precio),
    category: "Promociones",
    isAvailable: true,
    destacado: false,
    imageUrl: "",
    imageId: "",
    updatedAt: "",
  });

  const manejarAgregar = () => {
    agregarProducto(construirProductoOferta());
    setAgregado(true);
    window.setTimeout(() => setAgregado(false), 1500);
  };

  return (
    <Button
      onClick={manejarAgregar}
      className="h-11 w-full text-sm font-small sm:text-base"
      aria-label={
        agregado
          ? `${oferta.nombre} agregado al pedido`
          : `Agregar ${oferta.nombre} al pedido`
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