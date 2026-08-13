"use client";

import Image from "next/image";
import { useState } from "react";
import { ShoppingBag, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCartStore } from "@/store/useCartStore";
import { formatearUSD, formatearBs, convertirUSDaBs } from "@/lib/utils";
import type { Producto } from "@/types/product";

interface ProductCardProps {
  producto: Producto;
  tasaBCV: number;
}

export function ProductCard({ producto, tasaBCV }: ProductCardProps) {
  const agregarProducto = useCartStore((estado) => estado.agregarProducto);
  const [agregado, setAgregado] = useState(false);

  const precioBs = convertirUSDaBs(producto.price, tasaBCV);

  const manejarAgregar = () => {
    agregarProducto(producto);
    setAgregado(true);
    window.setTimeout(() => setAgregado(false), 1500);
  };

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-white transition-shadow hover:shadow-lg">
      <div className="relative aspect-[4/3] overflow-hidden bg-brand-rose-light">
        {producto.imageUrl ? (
          <Image
            src={producto.imageUrl}
            alt={producto.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-5xl" aria-hidden="true">
              ☕
            </span>
          </div>
        )}
        {!producto.isAvailable && (
          <Badge
            variant="secondary"
            className="absolute left-3 top-3 bg-background/90"
          >
            Agotado
          </Badge>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
        <h3 className="font-heading text-base font-semibold text-brand-coffee sm:text-lg">
          {producto.name}
        </h3>
        {producto.description && (
          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {producto.description}
          </p>
        )}

        <div className="mt-auto flex flex-wrap items-baseline gap-x-3 gap-y-1 pt-2">
          <span className="text-lg font-bold text-brand-rose-deep">
            {formatearUSD(producto.price)}
          </span>
          {tasaBCV > 0 && (
            <span className="text-sm text-muted-foreground">
              {formatearBs(precioBs)}
            </span>
          )}
        </div>

        <Button
          onClick={manejarAgregar}
          disabled={!producto.isAvailable}
          className="h-12 w-full text-sm sm:text-base"
          aria-label={
            agregado
              ? `${producto.name} agregado al carrito`
              : `Agregar ${producto.name} al carrito`
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
              Agregar al carrito
            </>
          )}
        </Button>
      </div>
    </article>
  );
}