import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { Toaster } from "@/components/ui/sonner";
import { useCartStore } from "@/store/useCartStore";
import type { Producto } from "@/types/product";

const productoMock: Producto = {
  id: "prod_1",
  name: "Café Mocca Helado",
  description: "Espresso doble con chocolate",
  price: 4.5,
  category: "bebidas-frias",
  isAvailable: true,
  imageUrl: "",
  imageId: "",
  updatedAt: "",
};

const onOpenChange = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  useCartStore.setState({ items: [] });
  localStorage.clear();
});

describe("CartDrawer", () => {
  it("muestra el estado vacío cuando no hay items", () => {
    render(
      <CartDrawer abierto onOpenChange={onOpenChange} tasaBCV={764.35} />
    );

    expect(screen.getByText(/tu carrito está vacío/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /pedir por whatsapp/i })
    ).toBeDisabled();
  });

  it("muestra los items del carrito con sus totales en USD y Bs.", () => {
    useCartStore.getState().agregarProducto(productoMock, 2);

    render(
      <CartDrawer abierto onOpenChange={onOpenChange} tasaBCV={764.35} />
    );

    expect(screen.getByText("Café Mocca Helado")).toBeInTheDocument();
    expect(screen.getAllByText("$9.00")).toHaveLength(2);
    expect(screen.getByText("Bs. 6.879,15")).toBeInTheDocument();
  });

  it("permite aumentar la cantidad de un item", () => {
    useCartStore.getState().agregarProducto(productoMock, 1);

    render(
      <CartDrawer abierto onOpenChange={onOpenChange} tasaBCV={764.35} />
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: /aumentar cantidad de café mocca helado/i,
      })
    );

    expect(useCartStore.getState().items[0].cantidad).toBe(2);
  });

  it("permite eliminar un item del carrito", () => {
    useCartStore.getState().agregarProducto(productoMock, 1);

    render(
      <CartDrawer abierto onOpenChange={onOpenChange} tasaBCV={764.35} />
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: /eliminar café mocca helado del carrito/i,
      })
    );

    expect(useCartStore.getState().items).toHaveLength(0);
    expect(screen.getByText(/tu carrito está vacío/i)).toBeInTheDocument();
  });

  it("muestra un toast cuando no hay número de WhatsApp configurado", async () => {
    delete process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
    useCartStore.getState().agregarProducto(productoMock, 1);

    render(
      <>
        <Toaster />
        <CartDrawer abierto onOpenChange={onOpenChange} tasaBCV={764.35} />
      </>
    );

    fireEvent.click(
      screen.getByRole("button", { name: /pedir por whatsapp/i })
    );

    expect(
      await screen.findByText(/whatsapp aún no está configurado/i)
    ).toBeInTheDocument();
  });

  it("envía el pedido a WhatsApp y vacía el carrito cuando hay número", () => {
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER = "+584121234567";
    useCartStore.getState().agregarProducto(productoMock, 1);

    const abrir = vi.fn();
    vi.stubGlobal("open", abrir);

    render(
      <CartDrawer abierto onOpenChange={onOpenChange} tasaBCV={764.35} />
    );

    fireEvent.click(
      screen.getByRole("button", { name: /pedir por whatsapp/i })
    );

    expect(abrir).toHaveBeenCalledWith(
      expect.stringContaining("https://wa.me/584121234567"),
      "_blank",
      "noopener,noreferrer"
    );
    expect(useCartStore.getState().items).toHaveLength(0);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});