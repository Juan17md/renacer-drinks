import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DashboardCliente } from "@/components/admin/dashboard/DashboardCliente";
import { obtenerFechaLocalISO } from "@/lib/utils";

const {
  obtenerResumenDiarioMock,
  obtenerProductosCompletosMock,
  obtenerProductoMasVendidoSemanaMock,
} = vi.hoisted(() => ({
  obtenerResumenDiarioMock: vi.fn().mockResolvedValue({
    id: "2026-08-13",
    totalIncome: 100,
    totalExpense: 0,
    netProfit: 100,
    totalSales: 12,
    totalProfit: 25,
  }),
  obtenerProductosCompletosMock: vi.fn().mockResolvedValue([]),
  obtenerProductoMasVendidoSemanaMock: vi.fn().mockResolvedValue({
    nombre: "Café Mocca",
    productId: "prod_1",
    cantidad: 14,
  }),
}));

vi.mock("@/services/transactions", () => ({
  obtenerResumenDiario: obtenerResumenDiarioMock,
  obtenerProductoMasVendidoSemana: obtenerProductoMasVendidoSemanaMock,
}));

vi.mock("@/services/products", () => ({
  obtenerProductosCompletos: obtenerProductosCompletosMock,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("DashboardCliente", () => {
  it("carga el resumen del día y muestra las tarjetas: monto vendido, ganado y ventas (contador)", async () => {
    render(<DashboardCliente tasaBCVInicial={80} />);

    expect(obtenerResumenDiarioMock).toHaveBeenCalledWith(
      obtenerFechaLocalISO().slice(0, 10)
    );
    expect(obtenerProductoMasVendidoSemanaMock).toHaveBeenCalled();

    expect(await screen.findByText(/monto vendido hoy/i)).toBeInTheDocument();
    expect(screen.getByText(/monto ganado hoy/i)).toBeInTheDocument();
    expect(screen.getByText(/ventas del día/i)).toBeInTheDocument();
    expect(screen.getByText("$100.00")).toBeInTheDocument();
    expect(screen.getByText("$25.00")).toBeInTheDocument();
    // "Ventas del día" es un contador puro: no muestra precios ni USD/Bs.
    expect(screen.getByText("12")).toBeInTheDocument();
  });

  it("muestra el producto más vendido de la semana con sus unidades", async () => {
    render(<DashboardCliente tasaBCVInicial={80} />);

    expect(await screen.findByText(/más vendido de la semana/i)).toBeInTheDocument();
    expect(screen.getByText("Café Mocca")).toBeInTheDocument();
    expect(screen.getByText("14 unidades vendidas")).toBeInTheDocument();
  });

  it("oculta el card del más vendido cuando no hay ventas en la semana", async () => {
    obtenerProductoMasVendidoSemanaMock.mockResolvedValue(null);
    render(<DashboardCliente tasaBCVInicial={80} />);

    expect(
      await screen.findByText(/ventas del día/i)
    ).toBeInTheDocument();
    expect(screen.queryByText(/más vendido de la semana/i)).not.toBeInTheDocument();
  });

  it("muestra la tasa BCV inicial y los accesos rápidos", async () => {
    render(<DashboardCliente tasaBCVInicial={80} />);

    expect(await screen.findByText("Bs. 80,00")).toBeInTheDocument();
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

  it("abre el modal de registrar venta desde el acceso rápido", async () => {
    render(<DashboardCliente tasaBCVInicial={80} />);

    fireEvent.click(
      await screen.findByRole("button", { name: /registrar venta/i })
    );

    expect(
      screen.getByRole("dialog", { name: /registrar venta/i })
    ).toBeInTheDocument();
  });
});