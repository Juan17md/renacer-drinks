import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { PaginaTransaccionesCliente } from "@/components/admin/finanzas/PaginaTransaccionesCliente";

const mocksServicios = vi.hoisted(() => ({
  obtenerTransacciones: vi.fn().mockResolvedValue([
    {
      id: "tx_1",
      type: "INGRESO",
      amount: 6,
      amountBs: 4586.1,
      bcvRate: 764.35,
      concept: "Venta orden #12",
      paymentMethod: "EFECTIVO",
      date: "2026-08-16T10:30:00",
      createdBy: "admin",
      ganancia: 2,
    },
    {
      id: "tx_2",
      type: "EGRESO",
      amount: 3,
      amountBs: 2293.05,
      bcvRate: 764.35,
      concept: "Compra de leche",
      paymentMethod: "PUNTO",
      date: "2026-08-16T11:00:00",
      createdBy: "admin",
      ganancia: 0,
    },
  ]),
}));

vi.mock("@/services/transactions", () => ({
  obtenerTransacciones: mocksServicios.obtenerTransacciones,
}));

vi.mock("@/actions/transacciones", () => ({
  eliminarTransaccion: vi.fn(),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    usuario: { getIdToken: vi.fn().mockResolvedValue("token-admin") },
    esAdmin: true,
  }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("PaginaTransaccionesCliente", () => {
  it("muestra el historial completo con sus operaciones", async () => {
    render(<PaginaTransaccionesCliente />);

    expect(
      await screen.findByText("Historial de transacciones")
    ).toBeInTheDocument();
    expect(screen.getByText("Venta orden #12")).toBeInTheDocument();
    expect(screen.getByText("Compra de leche")).toBeInTheDocument();
    expect(mocksServicios.obtenerTransacciones).toHaveBeenCalledWith(200);
  });
});