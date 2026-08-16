import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { FinancialKPIs } from "@/components/admin/finanzas/FinancialKPIs";
import { SalesChart, type DatoPunto } from "@/components/admin/finanzas/SalesChart";
import { PaginaFinanzasCliente } from "@/components/admin/finanzas/PaginaFinanzasCliente";

vi.mock("recharts", () => {
  const Nodo = () => null;
  return {
    ResponsiveContainer: ({ children }: { children: ReactNode }) => (
      <div>{children}</div>
    ),
    BarChart: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    Bar: () => <div data-testid="barra" />,
    XAxis: Nodo,
    YAxis: Nodo,
    Tooltip: Nodo,
    Legend: Nodo,
    CartesianGrid: Nodo,
  };
});

const mocksServicios = vi.hoisted(() => ({
  obtenerTransacciones: vi.fn().mockResolvedValue([]),
  obtenerTasaBCV: vi.fn().mockResolvedValue({ promedio: 80 }),
}));

vi.mock("@/lib/bcv", () => ({
  obtenerTasaBCV: mocksServicios.obtenerTasaBCV,
}));

vi.mock("@/services/transactions", () => ({
  obtenerTransacciones: mocksServicios.obtenerTransacciones,
}));

vi.mock("@/components/admin/finanzas/TransactionForm", () => ({
  TransactionForm: () => <div>Formulario de transacción</div>,
}));

describe("FinancialKPIs", () => {
  it("muestra ingresos, egresos y balance con conversión Bs", () => {
    render(
      <FinancialKPIs ingresos={100} egresos={30} balance={70} tasaBCV={80} />
    );
    expect(screen.getByText("Ingresos del mes")).toBeInTheDocument();
    expect(screen.getByText("Egresos del mes")).toBeInTheDocument();
    expect(screen.getByText("Balance neto")).toBeInTheDocument();
    expect(screen.getAllByText("$100.00")).not.toHaveLength(0);
    expect(screen.getByText("Bs. 5.600,00")).toBeInTheDocument();
  });
});

describe("SalesChart", () => {
  it("muestra mensaje vacío cuando no hay datos", () => {
    render(<SalesChart datos={[]} />);
    expect(screen.getByText(/aún no hay datos/i)).toBeInTheDocument();
  });

  it("renderiza barras cuando hay datos", () => {
    const datos: DatoPunto[] = [
      { dia: "01/08", ingresos: 20, egresos: 5 },
      { dia: "02/08", ingresos: 15, egresos: 8 },
    ];
    render(<SalesChart datos={datos} />);
    expect(screen.getAllByTestId("barra")).toHaveLength(2);
  });
});

describe("PaginaFinanzasCliente", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("enlaza al historial completo de transacciones", async () => {
    render(<PaginaFinanzasCliente />);
    expect(
      await screen.findByRole("link", { name: /ver historial completo/i })
    ).toHaveAttribute("href", "/admin/transacciones");
    expect(mocksServicios.obtenerTransacciones).toHaveBeenCalledWith(200);
  });
});