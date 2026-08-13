"use client";

import Image from "next/image";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatearUSD } from "@/lib/utils";
import type { ItemCarrito } from "@/store/useCartStore";

interface CartItemProps {
  item: ItemCarrito;
  onActualizarCantidad: (productoId: string, cantidad: number) => void;
  onEliminar: (productoId: string) => void;
}

export function CartItem({
  item,
  onActualizarCantidad,
  onEliminar,
}: CartItemProps) {
  const subtotal = item.producto.price * item.cantidad;

  return (
    <li className="flex gap-4 border-b border-border/60 pb-4">
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-brand-rose-light">
        {item.producto.imageUrl ? (
          <Image
            src={item.producto.imageUrl}
            alt={item.producto.name}
            fill
            sizes="80px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-2xl" aria-hidden="true">
              ☕
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-brand-coffee">
              {item.producto.name}
            </h3>
            <p className="text-sm text-muted-foreground">
              {formatearUSD(item.producto.price)} c/u
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-muted-foreground hover:text-destructive"
            onClick={() => onEliminar(item.producto.id)}
            aria-label={`Eliminar ${item.producto.name} del carrito`}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <div
            className="flex items-center gap-1 rounded-full border border-border"
            role="group"
            aria-label={`Cantidad de ${item.producto.name}`}
          >
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full"
              onClick={() =>
                onActualizarCantidad(item.producto.id, item.cantidad - 1)
              }
              aria-label={`Disminuir cantidad de ${item.producto.name}`}
            >
              <Minus className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
            <span className="w-6 text-center text-sm font-medium" aria-live="polite">
              {item.cantidad}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full"
              onClick={() =>
                onActualizarCantidad(item.producto.id, item.cantidad + 1)
              }
              aria-label={`Aumentar cantidad de ${item.producto.name}`}
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          </div>
          <span className="text-sm font-bold text-brand-rose-deep">
            {formatearUSD(subtotal)}
          </span>
        </div>
      </div>
    </li>
  );
}