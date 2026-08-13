import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RegistrarVentaModal } from "@/components/admin/ventas/RegistrarVentaModal";
import { Toaster } from "@/components/ui/sonner";

const { registrarVentaMock } = vi.hoisted(() => ({
  registrarVentaMock: vi.fn().mockResolvedValue({ id: "tx_1" }),
}));

vi.mock("@/services/transactions", () => ({
  registrarVenta: registrarVentaMock,
}));

const productosMock = [
  {
    id: "prod_1",
    name: "Café Mocca Helado",
    description: "Espresso doble con chocolate",
    price: 4.5,
    costo: 3.5,
    category: "bebidas-frias",
    isAvailable: true,
    imageUrl: "",
    imageId: "",
    updatedAt: "2026-08-13T10:00:00Z",
  },
  {
    id: "prod_2",
    name: "Capuchino",
    description: "Café con leche espumosa",
    price: 3,
    costo: 2,
    category: "bebidas-calientes",
    isAvailable: false,
    imageUrl: "",
    imageId: "",
    updatedAt: "2026-08-13T10:00:00Z",
  },
];

const onOpenChange = vi.fn();
const onRegistrada = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
});

describe("RegistrarVentaModal", () => {
  it("muestra solo los productos disponibles del catálogo en la búsqueda", async () => {
    render(
      <RegistrarVentaModal
        abierto
        onOpenChange={onOpenChange}
        productos={productosMock}
        tasaBCV={80}
        onRegistrada={onRegistrada}
      />
    );

    fireEvent.click(
      screen.getByRole("button", { name: /buscar producto del catálogo/i })
    );

    expect(screen.getByText("Café Mocca Helado")).toBeInTheDocument();
    expect(screen.queryByText("Capuchino")).not.toBeInTheDocument();
  });

  it("agrega el producto y calcula el total automáticamente", async () => {
    render(
      <RegistrarVentaModal
        abierto
        onOpenChange={onOpenChange}
        productos={productosMock}
        tasaBCV={80}
        onRegistrada={onRegistrada}
      />
    );

    fireEvent.click(
      screen.getByRole("button", { name: /buscar producto del catálogo/i })
    );
    fireEvent.click(screen.getByText("Café Mocca Helado"));
    fireEvent.click(
      screen.getByRole("button", { name: /aumentar cantidad de café mocca helado/i })
    );

    expect(screen.getAllByText("$9.00")).toHaveLength(2);
  });

  it("registra la venta con cliente, productos, método y monto", async () => {
    render(
      <>
        <Toaster />
        <RegistrarVentaModal
          abierto
          onOpenChange={onOpenChange}
          productos={productosMock}
          tasaBCV={80}
          onRegistrada={onRegistrada}
        />
      </>
    );

    fireEvent.change(screen.getByLabelText(/nombre del cliente/i), {
      target: { value: "María" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /buscar producto del catálogo/i })
    );
    fireEvent.click(screen.getByText("Café Mocca Helado"));
    fireEvent.click(
      screen.getByRole("button", { name: /registrar venta/i })
    );

    expect(await screen.findByText(/venta registrada correctamente/i)).toBeInTheDocument();
    expect(registrarVentaMock).toHaveBeenCalledWith(
      {
        customerName: "María",
        items: [
          {
            productId: "prod_1",
            nombre: "Café Mocca Helado",
            precioVenta: 4.5,
            costo: 3.5,
            cantidad: 1,
            subtotal: 4.5,
          },
        ],
        amount: 4.5,
        paymentMethod: "EFECTIVO",
      },
      80
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("permite editar el monto calculado", async () => {
    render(
      <RegistrarVentaModal
        abierto
        onOpenChange={onOpenChange}
        productos={productosMock}
        tasaBCV={80}
        onRegistrada={onRegistrada}
      />
    );

    fireEvent.click(
      screen.getByRole("button", { name: /buscar producto del catálogo/i })
    );
    fireEvent.click(screen.getByText("Café Mocca Helado"));

    fireEvent.change(screen.getByLabelText(/monto \(usd\) \*/i), {
      target: { value: "10" },
    });

    expect(screen.getByText("$10.00")).toBeInTheDocument();
  });

  it("valida que se agregue al menos un producto", async () => {
    render(
      <RegistrarVentaModal
        abierto
        onOpenChange={onOpenChange}
        productos={productosMock}
        tasaBCV={80}
        onRegistrada={onRegistrada}
      />
    );

    fireEvent.click(
      screen.getByRole("button", { name: /registrar venta/i })
    );

    expect(
      await screen.findByText(/agrega al menos un producto a la venta/i)
    ).toBeInTheDocument();
    expect(registrarVentaMock).not.toHaveBeenCalled();
  });
});