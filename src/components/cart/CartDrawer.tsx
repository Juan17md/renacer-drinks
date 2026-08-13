"use client";

import { useState } from "react";
import { ShoppingBag, MessageCircle } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CartItem } from "@/components/cart/CartItem";
import { CartSummary } from "@/components/cart/CartSummary";
import { useCartStore } from "@/store/useCartStore";
import { convertirUSDaBs } from "@/lib/utils";
import {
  generarMensajeWhatsApp,
  construirURLWhatsApp,
} from "@/lib/whatsapp";

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

  const [enviando, setEnviando] = useState(false);

  const totalUSD = items.reduce(
    (total, item) => total + item.producto.price * item.cantidad,
    0
  );
  const totalBs = convertirUSDaBs(totalUSD, tasaBCV);

  const manejarPedido = () => {
    const numeroWhatsApp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;

    if (!numeroWhatsApp) {
      toast.error(
        "WhatsApp aún no está configurado. Pronto podrás pedir desde aquí."
      );
      return;
    }

    setEnviando(true);
    const mensaje = generarMensajeWhatsApp({
      items,
      totalUSD,
      totalBs,
      tasaBCV,
    });
    const url = construirURLWhatsApp(mensaje, numeroWhatsApp);

    window.open(url, "_blank", "noopener,noreferrer");
    vaciarCarrito();
    setEnviando(false);
    onOpenChange(false);
    toast.success("¡Pedido enviado a WhatsApp!");
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
            Revisa tu pedido antes de enviarlo por WhatsApp.
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
              <p className="mt-1 text-sm text-muted-foreground">
                Agrega tus bebidas favoritas desde el menú.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-5 overflow-y-auto px-6">
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
          </div>
        )}

        <DrawerFooter className="pb-[env(safe-area-inset-bottom)]">
          <Button
            className="h-14 w-full text-base"
            onClick={manejarPedido}
            disabled={items.length === 0 || enviando}
          >
            <MessageCircle className="mr-2 h-5 w-5" aria-hidden="true" />
            Pedir por WhatsApp
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}