import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DashboardCliente } from "@/components/admin/dashboard/DashboardCliente";

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
];

describe("DashboardCliente", () => {
  it("muestra las tarjetas del día: monto vendido, monto ganado y ventas", () => {
    render(
      <DashboardCliente
        tasaBCV={80}
        resumen={{ totalIncome: 100, totalProfit: 25, totalSales: 12 }}
        productos={productosMock}
      />
    );

    expect(screen.getByText(/monto vendido hoy/i)).toBeInTheDocument();
    expect(screen.getByText(/monto ganado hoy/i)).toBeInTheDocument();
    expect(screen.getByText(/ventas del día/i)).toBeInTheDocument();
    expect(screen.getByText("$100.00")).toBeInTheDocument();
    expect(screen.getByText("$25.00")).toBeInTheDocument();
    expect(screen.getByText("$12.00")).toBeInTheDocument();
  });

  it("muestra los accesos rápidos incluyendo registrar venta", () => {
    render(
      <DashboardCliente
        tasaBCV={80}
        resumen={null}
        productos={productosMock}
      />
    );

    expect(
      screen.getByRole("button", { name: /registrar venta/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /ver órdenes en vivo/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /gestionar catálogo/i })
    ).toBeInTheDocument();
  });

  it("abre el modal de registrar venta desde el acceso rápido", () => {
    render(
      <DashboardCliente
        tasaBCV={80}
        resumen={null}
        productos={productosMock}
      />
    );

    fireEvent.click(
      screen.getByRole("button", { name: /registrar venta/i })
    );

    expect(
      screen.getByRole("dialog", { name: /registrar venta/i })
    ).toBeInTheDocument();
  });
});