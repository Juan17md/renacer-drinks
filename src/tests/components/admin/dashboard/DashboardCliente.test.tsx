import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DashboardCliente } from "@/components/admin/dashboard/DashboardCliente";
import { obtenerFechaLocalISO } from "@/lib/utils";

const { obtenerResumenDiarioMock, obtenerProductosCompletosMock } =
  vi.hoisted(() => ({
    obtenerResumenDiarioMock: vi.fn().mockResolvedValue({
      id: "2026-08-13",
      totalIncome: 100,
      totalExpense: 0,
      netProfit: 100,
      totalSales: 12,
      totalProfit: 25,
    }),
    obtenerProductosCompletosMock: vi.fn().mockResolvedValue([]),
  }));

vi.mock("@/services/transactions", () => ({
  obtenerResumenDiario: obtenerResumenDiarioMock,
}));

vi.mock("@/services/products", () => ({
  obtenerProductosCompletos: obtenerProductosCompletosMock,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("DashboardCliente", () => {
  it("carga el resumen del día y muestra las tarjetas: monto vendido, ganado y ventas", async () => {
    render(<DashboardCliente tasaBCVInicial={80} />);

    expect(obtenerResumenDiarioMock).toHaveBeenCalledWith(
      obtenerFechaLocalISO().slice(0, 10)
    );

    expect(await screen.findByText(/monto vendido hoy/i)).toBeInTheDocument();
    expect(screen.getByText(/monto ganado hoy/i)).toBeInTheDocument();
    expect(screen.getByText(/ventas del día/i)).toBeInTheDocument();
    expect(screen.getByText("$100.00")).toBeInTheDocument();
    expect(screen.getByText("$25.00")).toBeInTheDocument();
    expect(screen.getByText("$12.00")).toBeInTheDocument();
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