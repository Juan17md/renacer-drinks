import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { Toaster } from "@/components/ui/sonner";
import { useCartStore } from "@/store/useCartStore";
import type { Producto } from "@/types/product";

const { crearOrdenMock } = vi.hoisted(() => ({
  crearOrdenMock: vi.fn(),
}));

vi.mock("@/services/orders", () => ({
  crearOrden: crearOrdenMock,
}));

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
      screen.queryByRole("button", { name: /enviar pedido a la barra/i })
    ).not.toBeInTheDocument();
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

  it("pide el nombre y envía el pedido a Firestore vaciando el carrito", async () => {
    crearOrdenMock.mockResolvedValue({ id: "orden_1", numero: 12 });
    useCartStore.getState().agregarProducto(productoMock, 1);

    render(
      <>
        <Toaster />
        <CartDrawer abierto onOpenChange={onOpenChange} tasaBCV={764.35} />
      </>
    );

    fireEvent.change(screen.getByLabelText(/tu nombre/i), {
      target: { value: "María" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /enviar pedido a la barra/i })
    );

    expect(await screen.findByText(/pedido #12 recibido/i)).toBeInTheDocument();
    expect(crearOrdenMock).toHaveBeenCalledWith(
      expect.objectContaining({
        nombreCliente: "María",
        totalUSD: 4.5,
        totalBs: expect.any(Number),
        items: [
          {
            nombre: "Café Mocca Helado",
            precio: 4.5,
            cantidad: 1,
            subtotal: 4.5,
          },
        ],
      })
    );
    expect(useCartStore.getState().items).toHaveLength(0);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("muestra error si falta el nombre", async () => {
    useCartStore.getState().agregarProducto(productoMock, 1);

    render(
      <>
        <Toaster />
        <CartDrawer abierto onOpenChange={onOpenChange} tasaBCV={764.35} />
      </>
    );

    fireEvent.click(
      screen.getByRole("button", { name: /enviar pedido a la barra/i })
    );

    expect(
      await screen.findByText(/escribe tu nombre para entregarte tu pedido/i)
    ).toBeInTheDocument();
    expect(crearOrdenMock).not.toHaveBeenCalled();
  });

  it("muestra error si Firestore falla y mantiene el carrito", async () => {
    crearOrdenMock.mockRejectedValue(new Error("firestore caído"));
    useCartStore.getState().agregarProducto(productoMock, 1);

    render(
      <>
        <Toaster />
        <CartDrawer abierto onOpenChange={onOpenChange} tasaBCV={764.35} />
      </>
    );

    fireEvent.change(screen.getByLabelText(/tu nombre/i), {
      target: { value: "María" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /enviar pedido a la barra/i })
    );

    expect(
      await screen.findByText(/no se pudo enviar el pedido/i)
    ).toBeInTheDocument();
    expect(useCartStore.getState().items).toHaveLength(1);
  });
});
