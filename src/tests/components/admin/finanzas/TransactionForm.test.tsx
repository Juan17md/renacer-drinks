import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TransactionForm } from "@/components/admin/finanzas/TransactionForm";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const { registrarTransaccionMock } = vi.hoisted(() => ({
  registrarTransaccionMock: vi.fn(),
}));

vi.mock("@/services/transactions", () => ({
  registrarTransaccion: registrarTransaccionMock,
}));

import { toast } from "sonner";

describe("TransactionForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza los campos del formulario", () => {
    render(<TransactionForm tasaBCV={80} onRegistrada={vi.fn()} />);
    expect(screen.getByLabelText(/monto \(usd\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/concepto/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /registrar/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ingreso/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /egreso/i })).toBeInTheDocument();
  });

  it("valida que el monto sea requerido", async () => {
    render(<TransactionForm tasaBCV={80} onRegistrada={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /registrar/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/monto válido/i);
    expect(registrarTransaccionMock).not.toHaveBeenCalled();
  });

  it("registra una transacción de ingreso correctamente", async () => {
    registrarTransaccionMock.mockResolvedValue({
      id: "tx1",
      type: "INGRESO",
      amount: 5,
      amountBs: 400,
      bcvRate: 80,
      concept: "Venta directa",
      paymentMethod: "EFECTIVO",
      date: "2026-08-13T10:00:00",
      createdBy: "admin",
    });

    const onRegistrada = vi.fn();
    render(<TransactionForm tasaBCV={80} onRegistrada={onRegistrada} />);

    fireEvent.change(screen.getByLabelText(/monto \(usd\)/i), {
      target: { value: "5" },
    });
    fireEvent.change(screen.getByLabelText(/concepto/i), {
      target: { value: "Venta directa" },
    });
    fireEvent.click(screen.getByRole("button", { name: /registrar/i }));

    await waitFor(() => {
      expect(registrarTransaccionMock).toHaveBeenCalledWith(
        {
          type: "INGRESO",
          amount: 5,
          concept: "Venta directa",
          paymentMethod: "EFECTIVO",
        },
        80
      );
    });
    expect(toast.success).toHaveBeenCalledWith("Ingreso registrado correctamente");
    expect(onRegistrada).toHaveBeenCalled();
  });

  it("cambia a egreso y registra con método de pago", async () => {
    registrarTransaccionMock.mockResolvedValue({
      id: "tx2",
      type: "EGRESO",
      amount: 10,
      amountBs: 800,
      bcvRate: 80,
      concept: "Compra insumos",
      paymentMethod: "EFECTIVO",
      date: "2026-08-13T10:00:00",
      createdBy: "admin",
    });

    render(<TransactionForm tasaBCV={80} onRegistrada={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /egreso/i }));
    fireEvent.change(screen.getByLabelText(/monto \(usd\)/i), {
      target: { value: "10" },
    });
    fireEvent.change(screen.getByLabelText(/concepto/i), {
      target: { value: "Compra insumos" },
    });
    fireEvent.click(screen.getByRole("button", { name: /registrar/i }));

    await waitFor(() => {
      expect(registrarTransaccionMock).toHaveBeenCalledWith(
        expect.objectContaining({ type: "EGRESO", paymentMethod: "EFECTIVO" }),
        80
      );
    });
    expect(toast.success).toHaveBeenCalledWith("Egreso registrado correctamente");
  });
});
