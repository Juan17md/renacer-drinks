import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { Toaster } from "@/components/ui/sonner";
import { useCartStore } from "@/store/useCartStore";
import { formatearBs } from "@/lib/utils";
import type { ProductoPublico } from "@/types/product";
import type { MetodoPagoConfig } from "@/types/payment";

const { crearOrdenMock, metodosPagoMock } = vi.hoisted(() => ({
  crearOrdenMock: vi.fn(),
  metodosPagoMock: vi.fn(),
}));

vi.mock("@/services/orders", () => ({
  crearOrden: crearOrdenMock,
}));

vi.mock("@/services/metodosPago", () => ({
  escucharMetodosPago: (callback: (metodos: MetodoPagoConfig[]) => void) => {
    metodosPagoMock();
    callback([
      {
        id: "PAGO_MOVIL",
        label: "Pago Móvil",
        activo: true,
        requiereComprobante: true,
        datos: [
          { etiqueta: "Teléfono", valor: "0414-1234567" },
          { etiqueta: "Cédula", valor: "V-12.345.678" },
        ],
      },
      {
        id: "ZELLE",
        label: "Zelle",
        activo: true,
        requiereComprobante: true,
        datos: [{ etiqueta: "Correo", valor: "pagos@renacer.com" }],
      },
      {
        id: "EFECTIVO",
        label: "Efectivo",
        activo: true,
        requiereComprobante: false,
        datos: [],
      },
    ]);
    return () => {};
  },
}));

vi.mock("imagekitio-react", () => ({
  IKContext: ({ children }: { children: React.ReactNode }) => children,
  IKUpload: (props: {
    onSuccess?: (respuesta: { url?: string }) => void;
    onError?: () => void;
    id?: string;
  }) => (
    <input
      type="file"
      id={props.id}
      data-testid="ik-upload"
      onChange={() => props.onSuccess?.({ url: "https://ik.imagekit.io/renacer/comprobante.jpg" })}
    />
  ),
}));

const productoMock: ProductoPublico = {
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

    expect(screen.getByText(/tu pedido está vacío/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /enviar pedido/i })
    ).not.toBeInTheDocument();
  });

  it("muestra los items del pedido con sus totales en USD y Bs.", () => {
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

  it("permite eliminar un item del pedido", () => {
    useCartStore.getState().agregarProducto(productoMock, 1);

    render(
      <CartDrawer abierto onOpenChange={onOpenChange} tasaBCV={764.35} />
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: /eliminar café mocca helado del pedido/i,
      })
    );

    expect(useCartStore.getState().items).toHaveLength(0);
    expect(screen.getByText(/tu pedido está vacío/i)).toBeInTheDocument();
  });

  it("muestra el botón Pagar y despliega el selector de métodos de pago", () => {
    useCartStore.getState().agregarProducto(productoMock, 1);

    render(
      <CartDrawer abierto onOpenChange={onOpenChange} tasaBCV={764.35} />
    );

    const botonPagar = screen.getByRole("button", { name: /pagar/i });
    expect(botonPagar).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /pago móvil/i })
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/método de pago/i)).not.toBeInTheDocument();

    fireEvent.click(botonPagar);

    expect(
      screen.getByRole("button", { name: /pago móvil/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /efectivo/i })).toBeInTheDocument();
    expect(screen.getByText(/método de pago/i)).toBeInTheDocument();
  });

  it("desplaza el foco al bloque de pago al pulsar Pagar y a los datos al elegir método", async () => {
    useCartStore.getState().agregarProducto(productoMock, 1);
    const scrollSpy = vi.spyOn(Element.prototype, "scrollIntoView");

    render(
      <CartDrawer abierto onOpenChange={onOpenChange} tasaBCV={764.35} />
    );

    fireEvent.click(screen.getByRole("button", { name: /pagar/i }));

    await waitFor(() =>
      expect(scrollSpy).toHaveBeenCalledWith({
        behavior: "smooth",
        block: "nearest",
      })
    );

    fireEvent.click(screen.getByRole("button", { name: /pago móvil/i }));

    await waitFor(() => expect(scrollSpy).toHaveBeenCalledTimes(2));
  });

  it("mantiene el método elegido y la sección de pago al reabrir el carrito", () => {
    useCartStore.getState().agregarProducto(productoMock, 1);

    const { rerender } = render(
      <CartDrawer abierto={false} onOpenChange={onOpenChange} tasaBCV={764.35} />
    );

    rerender(
      <CartDrawer abierto onOpenChange={onOpenChange} tasaBCV={764.35} />
    );
    fireEvent.click(screen.getByRole("button", { name: /pagar/i }));
    fireEvent.click(screen.getByRole("button", { name: /pago móvil/i }));
    expect(screen.getByText("0414-1234567")).toBeInTheDocument();

    rerender(
      <CartDrawer abierto={false} onOpenChange={onOpenChange} tasaBCV={764.35} />
    );
    rerender(
      <CartDrawer abierto onOpenChange={onOpenChange} tasaBCV={764.35} />
    );

    expect(screen.getByText(/método de pago/i)).toBeInTheDocument();
    expect(screen.getByText("0414-1234567")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /pago móvil/i })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });

  it("muestra los datos del método con botón copiar al elegir Pago Móvil", () => {
    useCartStore.getState().agregarProducto(productoMock, 1);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    });
    const clipboardMock = vi.spyOn(navigator.clipboard, "writeText");

    render(
      <CartDrawer abierto onOpenChange={onOpenChange} tasaBCV={764.35} />
    );

    fireEvent.click(screen.getByRole("button", { name: /pagar/i }));
    fireEvent.click(screen.getByRole("button", { name: /pago móvil/i }));

    expect(screen.getByText("0414-1234567")).toBeInTheDocument();
    expect(screen.getByText("V-12.345.678")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /copiar teléfono/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /copiar teléfono/i }));

    expect(clipboardMock).toHaveBeenCalledWith("0414-1234567");
  });

  it("copia todos los datos del método con el botón Copiar todos", async () => {
    useCartStore.getState().agregarProducto(productoMock, 1);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    });
    const clipboardMock = vi.spyOn(navigator.clipboard, "writeText");

    render(
      <>
        <Toaster />
        <CartDrawer abierto onOpenChange={onOpenChange} tasaBCV={764.35} />
      </>
    );

    fireEvent.click(screen.getByRole("button", { name: /pagar/i }));
    fireEvent.click(screen.getByRole("button", { name: /pago móvil/i }));

    const botonCopiarTodos = screen.getByRole("button", {
      name: /copiar todos/i,
    });
    expect(botonCopiarTodos).toBeInTheDocument();

    fireEvent.click(botonCopiarTodos);

    expect(
      await screen.findByRole("button", { name: /datos copiados/i })
    ).toBeInTheDocument();
    expect(clipboardMock).toHaveBeenCalledWith(
      `Monto a pagar: ${formatearBs(4.5 * 764.35)}\nTeléfono: 0414-1234567\nCédula: V-12.345.678`
    );
  });

  it("muestra el monto a pagar en Bs para Pago Móvil y Transferencia", () => {
    useCartStore.getState().agregarProducto(productoMock, 1);

    render(
      <>
        <Toaster />
        <CartDrawer abierto onOpenChange={onOpenChange} tasaBCV={764.35} />
      </>
    );

    fireEvent.click(screen.getByRole("button", { name: /pagar/i }));
    fireEvent.click(screen.getByRole("button", { name: /pago móvil/i }));

    expect(screen.getByText("Monto a pagar")).toBeInTheDocument();
    expect(screen.getAllByText(formatearBs(4.5 * 764.35)).length).toBeGreaterThanOrEqual(1);
    expect(
      screen.getByRole("button", { name: /copiar monto a pagar/i })
    ).toBeInTheDocument();
  });

  it("no muestra el monto a pagar en métodos sin monto (Zelle)", () => {
    useCartStore.getState().agregarProducto(productoMock, 1);

    render(
      <CartDrawer abierto onOpenChange={onOpenChange} tasaBCV={764.35} />
    );

    fireEvent.click(screen.getByRole("button", { name: /pagar/i }));
    fireEvent.click(screen.getByRole("button", { name: /^zelle$/i }));

    expect(screen.queryByText("Monto a pagar")).not.toBeInTheDocument();
  });

  it("no muestra Copiar todos en métodos sin datos", () => {
    useCartStore.getState().agregarProducto(productoMock, 1);

    render(
      <CartDrawer abierto onOpenChange={onOpenChange} tasaBCV={764.35} />
    );

    fireEvent.click(screen.getByRole("button", { name: /pagar/i }));
    fireEvent.click(screen.getByRole("button", { name: /efectivo/i }));

    expect(
      screen.queryByRole("button", { name: /copiar todos/i })
    ).not.toBeInTheDocument();
  });

  it("no permite enviar con método digital sin comprobante", () => {
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
    fireEvent.click(screen.getByRole("button", { name: /pagar/i }));
    fireEvent.click(screen.getByRole("button", { name: /pago móvil/i }));

    const botonCargar = screen.getByRole("button", {
      name: /cargar comprobante/i,
    });
    expect(botonCargar).toBeDisabled();
    expect(
      screen.queryByRole("button", { name: /enviar pedido/i })
    ).not.toBeInTheDocument();
    expect(crearOrdenMock).not.toHaveBeenCalled();
  });

  it("envía el pedido con comprobante, método y pago pendiente", async () => {
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
    fireEvent.click(screen.getByRole("button", { name: /pagar/i }));
    fireEvent.click(screen.getByRole("button", { name: /pago móvil/i }));

    const inputComprobante = screen.getByTestId("ik-upload");
    fireEvent.change(inputComprobante, {
      target: { files: [new File([""], "comprobante.jpg", { type: "image/jpeg" })] },
    });
    expect(
      await screen.findByText(/comprobante cargado/i)
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /enviar pedido/i }));

    expect(await screen.findByText(/pedido #12 recibido/i)).toBeInTheDocument();
    expect(crearOrdenMock).toHaveBeenCalledWith(
      expect.objectContaining({
        nombreCliente: "María",
        metodoPago: "PAGO_MOVIL",
        comprobanteUrl: "https://ik.imagekit.io/renacer/comprobante.jpg",
        pagoVerificado: false,
        items: [
          {
            productId: "prod_1",
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

  it("envía directo con Efectivo sin comprobante y pago verificado", async () => {
    crearOrdenMock.mockResolvedValue({ id: "orden_2", numero: 13 });
    useCartStore.getState().agregarProducto(productoMock, 1);

    render(
      <>
        <Toaster />
        <CartDrawer abierto onOpenChange={onOpenChange} tasaBCV={764.35} />
      </>
    );

    fireEvent.change(screen.getByLabelText(/tu nombre/i), {
      target: { value: "Pedro" },
    });
    fireEvent.click(screen.getByRole("button", { name: /pagar/i }));
    fireEvent.click(screen.getByRole("button", { name: /efectivo/i }));

    expect(screen.getByText(/paga en el local/i)).toBeInTheDocument();
    expect(screen.queryByTestId("ik-upload")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /enviar pedido/i }));

    expect(await screen.findByText(/pedido #13 recibido/i)).toBeInTheDocument();
    expect(crearOrdenMock).toHaveBeenCalledWith(
      expect.objectContaining({
        nombreCliente: "Pedro",
        metodoPago: "EFECTIVO",
        comprobanteUrl: undefined,
        pagoVerificado: true,
      })
    );
  });

  it("muestra error si falta el nombre", async () => {
    useCartStore.getState().agregarProducto(productoMock, 1);

    render(
      <>
        <Toaster />
        <CartDrawer abierto onOpenChange={onOpenChange} tasaBCV={764.35} />
      </>
    );

    fireEvent.click(screen.getByRole("button", { name: /pagar/i }));
    fireEvent.click(screen.getByRole("button", { name: /efectivo/i }));
    fireEvent.click(screen.getByRole("button", { name: /enviar pedido/i }));

    expect(
      await screen.findByText(/escribe tu nombre para entregarte tu pedido/i)
    ).toBeInTheDocument();
    expect(crearOrdenMock).not.toHaveBeenCalled();
  });

  it("muestra error si Firestore falla y mantiene el pedido", async () => {
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
    fireEvent.click(screen.getByRole("button", { name: /pagar/i }));
    fireEvent.click(screen.getByRole("button", { name: /efectivo/i }));
    fireEvent.click(screen.getByRole("button", { name: /enviar pedido/i }));

    expect(
      await screen.findByText(/no se pudo enviar el pedido/i)
    ).toBeInTheDocument();
    expect(useCartStore.getState().items).toHaveLength(1);
  });
});