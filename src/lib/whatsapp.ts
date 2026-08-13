import type { ItemCarrito } from "@/store/useCartStore";

export interface DatosResumen {
  items: ItemCarrito[];
  totalUSD: number;
  totalBs: number;
  tasaBCV: number;
}

export function generarMensajeWhatsApp({
  items,
  totalUSD,
  totalBs,
  tasaBCV,
}: DatosResumen): string {
  const lineasProductos = items.map((item) => {
    const subtotalUSD = item.producto.price * item.cantidad;
    return `• ${item.producto.name} x${item.cantidad} — $${subtotalUSD.toFixed(
      2
    )}`;
  });

  const lineas = [
    "¡Hola, Renacer Drinks & Coffe! 🌱 Quiero hacer el siguiente pedido:",
    "",
    ...lineasProductos,
    "",
    `Total: $${totalUSD.toFixed(2)} (Bs. ${totalBs.toFixed(2)})`,
    `Tasa BCV aplicada: Bs. ${tasaBCV.toFixed(2)}`,
    "",
    "Gracias 😊",
  ];

  return lineas.join("\n");
}

export function construirURLWhatsApp(
  mensaje: string,
  numeroTelefono: string
): string {
  const numeroLimpio = numeroTelefono.replace(/[^0-9]/g, "");
  return `https://wa.me/${numeroLimpio}?text=${encodeURIComponent(mensaje)}`;
}