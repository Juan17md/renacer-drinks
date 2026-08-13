import { describe, it, expect } from "vitest";
import {
  generarMensajeWhatsApp,
  construirURLWhatsApp,
} from "@/lib/whatsapp";

const itemsMock = [
  {
    producto: {
      id: "prod_1",
      name: "Café Mocca Helado",
      description: "",
      price: 4.5,
      category: "bebidas-frias",
      isAvailable: true,
      imageUrl: "",
      imageId: "",
      updatedAt: "",
    },
    cantidad: 2,
  },
  {
    producto: {
      id: "prod_2",
      name: "Capuchino",
      description: "",
      price: 3.0,
      category: "bebidas-calientes",
      isAvailable: true,
      imageUrl: "",
      imageId: "",
      updatedAt: "",
    },
    cantidad: 1,
  },
];

describe("generarMensajeWhatsApp", () => {
  it("genera un mensaje estructurado con items, cantidades y totales", () => {
    const mensaje = generarMensajeWhatsApp({
      items: itemsMock,
      totalUSD: 12,
      totalBs: 9172.2,
      tasaBCV: 764.35,
    });

    expect(mensaje).toContain("¡Hola, Renacer Drinks & Coffe!");
    expect(mensaje).toContain("• Café Mocca Helado x2 — $9.00");
    expect(mensaje).toContain("• Capuchino x1 — $3.00");
    expect(mensaje).toContain("Total: $12.00 (Bs. 9172.20)");
    expect(mensaje).toContain("Tasa BCV aplicada: Bs. 764.35");
  });

  it("genera un mensaje válido con carrito vacío", () => {
    const mensaje = generarMensajeWhatsApp({
      items: [],
      totalUSD: 0,
      totalBs: 0,
      tasaBCV: 764.35,
    });

    expect(mensaje).toContain("Total: $0.00 (Bs. 0.00)");
  });
});

describe("construirURLWhatsApp", () => {
  it("construye la URL con el número limpio y el mensaje codificado", () => {
    const url = construirURLWhatsApp("Hola mundo", "+58 412-1234567");

    expect(url).toBe(
      "https://wa.me/584121234567?text=Hola%20mundo"
    );
  });

  it("codifica caracteres especiales del mensaje", () => {
    const url = construirURLWhatsApp("¿Precio? ¡Ok!", "584121234567");

    expect(url).toContain("text=%C2%BFPrecio%3F");
  });
});