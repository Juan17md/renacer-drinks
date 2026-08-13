"use client";

import { useState } from "react";
import { ShoppingBag, Send, Loader2 } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CartItem } from "@/components/cart/CartItem";
import { CartSummary } from "@/components/cart/CartSummary";
import { useCartStore } from "@/store/useCartStore";
import { convertirUSDaBs } from "@/lib/utils";
import { crearOrden } from "@/services/orders";

interface CartDrawerProps {
  abierto: boolean;
  onOpenChange: (abierto: boolean) => void;
  tasaBCV: number;
}

export function CartDrawer({ abierto, onOpenChange, tasaBCV }: CartDrawerProps) {
  const items = useCartStore((estado) => estado.items);
  const actualizarCantidad = useCartStore((estado) => estado.actualizarCantidad);
  const eliminarProducto = useCartStore((estado) => estado.eliminarProducto);
  const vaciarCarrito = useCartStore((estado) => estado.vaciarCarrito);

  const [nombreCliente, setNombreCliente] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  const totalUSD = items.reduce(
    (total, item) => total + item.producto.price * item.cantidad,
    0
  );
  const totalBs = convertirUSDaBs(totalUSD, tasaBCV);

  const manejarEnvio = async (evento: React.FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    setError("");

    if (!nombreCliente.trim()) {
      setError("Escribe tu nombre para entregarte tu pedido.");
      return;
    }

    setEnviando(true);
    try {
      const orden = await crearOrden({
        nombreCliente: nombreCliente.trim(),
        items: items.map((item) => ({
          nombre: item.producto.name,
          precio: item.producto.price,
          cantidad: item.cantidad,
          subtotal: item.producto.price * item.cantidad,
        })),
        totalUSD,
        totalBs,
        tasaBCV,
      });

      vaciarCarrito();
      setNombreCliente("");
      onOpenChange(false);
      toast.success(
        `¡Pedido #${orden.numero} recibido! Espera tu aviso en la barra.`
      );
    } catch {
      setError("No se pudo enviar el pedido. Intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Drawer open={abierto} onOpenChange={onOpenChange}>
      <DrawerContent className="pb-[env(safe-area-inset-bottom)]">
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2 font-heading">
            <ShoppingBag className="h-5 w-5 text-brand-rose-deep" aria-hidden="true" />
            Tu carrito
          </DrawerTitle>
          <DrawerDescription>
            Revisa tu pedido y envíalo a la barra para prepararlo.
          </DrawerDescription>
        </DrawerHeader>

        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-4 px-6 py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-rose-light">
              <ShoppingBag className="h-8 w-8 text-brand-rose-deep" aria-hidden="true" />
            </div>
            <div>
              <p className="font-medium text-brand-coffee">
                Tu carrito está vacío
              </p>
              <p className="mt-1 text-sm font-small text-muted-foreground">
                Agrega tus bebidas favoritas desde el menú.
              </p>
            </div>
          </div>
        ) : (
          <form
            onSubmit={manejarEnvio}
            className="flex flex-col gap-5 overflow-y-auto px-6"
            noValidate
          >
            <ul className="space-y-4">
              {items.map((item) => (
                <CartItem
                  key={item.producto.id}
                  item={item}
                  onActualizarCantidad={actualizarCantidad}
                  onEliminar={eliminarProducto}
                />
              ))}
            </ul>
            <CartSummary totalUSD={totalUSD} totalBs={totalBs} tasaBCV={tasaBCV} />

            <div className="space-y-2">
              <Label htmlFor="carrito-nombre">Tu nombre *</Label>
              <Input
                id="carrito-nombre"
                value={nombreCliente}
                onChange={(evento) => setNombreCliente(evento.target.value)}
                placeholder="Ej. María"
                autoComplete="name"
                className="h-12 text-base"
                maxLength={40}
              />
              <p className="text-xs font-small text-muted-foreground">
                Lo usamos para avisarte cuando tu pedido esté listo.
              </p>
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-lg bg-destructive/10 px-3 py-2 text-sm font-small text-destructive"
              >
                {error}
              </p>
            )}

            <DrawerFooter className="px-0 pb-[env(safe-area-inset-bottom)]">
              <Button
                type="submit"
                className="h-14 w-full text-base"
                disabled={enviando}
              >
                {enviando ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
                ) : (
                  <Send className="mr-2 h-5 w-5" aria-hidden="true" />
                )}
                Enviar pedido a la barra
              </Button>
            </DrawerFooter>
          </form>
        )}
      </DrawerContent>
    </Drawer>
  );
}
