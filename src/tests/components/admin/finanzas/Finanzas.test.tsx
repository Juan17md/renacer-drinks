import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { ReactNode } from "react";
import { FinancialKPIs } from "@/components/admin/finanzas/FinancialKPIs";
import { SalesChart, type DatoPunto } from "@/components/admin/finanzas/SalesChart";
import { TransactionsTable } from "@/components/admin/finanzas/TransactionsTable";

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

describe("TransactionsTable", () => {
  const transacciones = [
    {
      id: "tx_1",
      type: "INGRESO" as const,
      amount: 4.5,
      amountBs: 360,
      bcvRate: 80,
      concept: "Venta orden #12",
      paymentMethod: "EFECTIVO",
      date: "2026-08-13T10:30:00",
      createdBy: "admin",
    },
    {
      id: "tx_2",
      type: "EGRESO" as const,
      amount: 2,
      amountBs: 160,
      bcvRate: 80,
      concept: "Compra de leche",
      paymentMethod: "PUNTO",
      date: "2026-08-13T11:00:00",
      createdBy: "admin",
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("muestra el historial con conceptos y montos", () => {
    render(<TransactionsTable transacciones={transacciones} />);
    expect(screen.getByText("Venta orden #12")).toBeInTheDocument();
    expect(screen.getByText("Compra de leche")).toBeInTheDocument();
    expect(screen.getByText("+$4.50")).toBeInTheDocument();
    expect(screen.getByText("−$2.00")).toBeInTheDocument();
  });

  it("filtra por tipo de transacción", () => {
    render(<TransactionsTable transacciones={transacciones} />);
    fireEvent.click(screen.getByRole("button", { name: /ingresos/i }));
    expect(screen.getByText("Venta orden #12")).toBeInTheDocument();
    expect(screen.queryByText("Compra de leche")).not.toBeInTheDocument();
  });

  it("muestra mensaje cuando no hay transacciones", () => {
    render(<TransactionsTable transacciones={[]} />);
    expect(screen.getByText(/no hay transacciones/i)).toBeInTheDocument();
  });
});
