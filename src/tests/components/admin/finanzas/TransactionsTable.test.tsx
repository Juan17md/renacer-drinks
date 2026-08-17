import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TransactionsTable } from "@/components/admin/finanzas/TransactionsTable";

const { toastMock, useAuthMock, eliminarTransaccionMock } = vi.hoisted(() => {
  return {
    toastMock: { success: vi.fn(), error: vi.fn() },
    useAuthMock: vi.fn(() => ({
      usuario: { getIdToken: vi.fn().mockResolvedValue("token-admin") },
      esAdmin: true,
    })),
    eliminarTransaccionMock: vi.fn().mockResolvedValue({ ok: true }),
  };
});

vi.mock("@/actions/transacciones", () => ({
  eliminarTransaccion: eliminarTransaccionMock,
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: useAuthMock,
}));

vi.mock("sonner", () => ({
  toast: toastMock,
}));

function transaccionMock(
  id: string,
  concept: string,
  extras?: {
    type?: "INGRESO" | "EGRESO";
    ordenId?: string;
    items?: { productId: string; nombre: string; precioVenta: number; costo: number; cantidad: number; subtotal: number }[];
  }
) {
  return {
    id,
    type: extras?.type ?? "INGRESO",
    amount: 4.5,
    amountBs: 360,
    bcvRate: 80,
    concept,
    paymentMethod: "EFECTIVO",
    date: "2026-08-13T10:30:00",
    createdBy: "admin",
    ganancia: 0,
    ...(extras?.ordenId ? { ordenId: extras.ordenId } : {}),
    ...(extras?.items ? { items: extras.items } : {}),
  };
}

const transacciones = [
  transaccionMock("tx_1", "Venta orden #12"),
  transaccionMock("tx_2", "Compra de leche", { type: "EGRESO" }),
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe("TransactionsTable", () => {
  it("muestra el historial con conceptos y montos", () => {
    render(<TransactionsTable transacciones={transacciones} />);
    expect(screen.getByText("Venta orden #12")).toBeInTheDocument();
    expect(screen.getByText("Compra de leche")).toBeInTheDocument();
    expect(screen.getByText("+$4.50")).toBeInTheDocument();
    expect(screen.getByText("−$4.50")).toBeInTheDocument();
  });

  it("muestra los productos con su cantidad debajo del concepto", () => {
    render(
      <TransactionsTable
        transacciones={[
          transaccionMock("tx_3", "Venta orden #5", {
            items: [
              { productId: "p1", nombre: "Tropical", precioVenta: 3, costo: 1.5, cantidad: 2, subtotal: 6 },
              { productId: "p2", nombre: "Capuchino", precioVenta: 3.5, costo: 2, cantidad: 1, subtotal: 3.5 },
            ],
          }),
        ]}
      />
    );
    expect(screen.getByText("2× Tropical · 1× Capuchino")).toBeInTheDocument();
  });

  it("no muestra productos cuando la operación no los tiene", () => {
    render(<TransactionsTable transacciones={transacciones} />);
    expect(screen.queryByText(/×/)).not.toBeInTheDocument();
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

  it("pagina el historial de 15 en 15 y reinicia al filtrar", () => {
    const muchas = Array.from({ length: 32 }, (_, indice) =>
      transaccionMock(`tx_${indice}`, `Venta #${indice + 1}`)
    );

    render(<TransactionsTable transacciones={muchas} />);

    expect(screen.getByText("Página 1 de 3")).toBeInTheDocument();
    expect(screen.getByText("Venta #1")).toBeInTheDocument();
    expect(screen.queryByText("Venta #16")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /página anterior/i })
    ).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: /página siguiente/i }));
    expect(screen.getByText("Página 2 de 3")).toBeInTheDocument();
    expect(screen.getByText("Venta #16")).toBeInTheDocument();
    expect(screen.queryByText("Venta #1")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /egresos/i }));
    expect(screen.queryByText(/página \d+ de \d+/i)).not.toBeInTheDocument();
    expect(screen.getByText(/no hay transacciones/i)).toBeInTheDocument();
  });

  it("oculta el botón de eliminar para el rol operador", () => {
    useAuthMock.mockReturnValue({
      usuario: { getIdToken: vi.fn().mockResolvedValue("token-operador") },
      esAdmin: false,
    });

    render(<TransactionsTable transacciones={transacciones} />);

    expect(
      screen.queryByRole("button", { name: /eliminar operación/i })
    ).not.toBeInTheDocument();
  });

  it("muestra el botón de eliminar solo para el admin", () => {
    useAuthMock.mockReturnValue({
      usuario: { getIdToken: vi.fn().mockResolvedValue("token-admin") },
      esAdmin: true,
    });

    render(<TransactionsTable transacciones={transacciones} />);

    expect(
      screen.getAllByRole("button", { name: /eliminar operación/i })
    ).toHaveLength(2);
  });

  it("elimina la operación tras confirmar y refresca la lista", async () => {
    const onEliminada = vi.fn();
    render(
      <TransactionsTable
        transacciones={transacciones}
        onEliminada={onEliminada}
      />
    );

    fireEvent.click(
      screen.getByRole("button", { name: /eliminar operación venta orden/i })
    );
    expect(
      screen.getByText(/¿eliminar esta operación\?/i)
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /eliminar operación$/i })
    );

    await waitFor(() => {
      expect(eliminarTransaccionMock).toHaveBeenCalledWith(
        "tx_1",
        "token-admin"
      );
    });
    expect(toastMock.success).toHaveBeenCalledWith("Operación eliminada");
    expect(onEliminada).toHaveBeenCalled();
  });

  it("advierte que la orden quedará sin registro cuando la operación proviene de una orden", () => {
    render(
      <TransactionsTable
        transacciones={[transaccionMock("tx_3", "Venta orden #5", { ordenId: "orden-5" })]}
      />
    );

    fireEvent.click(
      screen.getByRole("button", { name: /eliminar operación venta orden/i })
    );
    expect(
      screen.getByText(/su orden quedará sin registro en finanzas/i)
    ).toBeInTheDocument();
  });

  it("muestra toast de error cuando la eliminación falla", async () => {
    eliminarTransaccionMock.mockResolvedValue({
      ok: false,
      error: "Solo el administrador puede eliminar operaciones.",
    });

    render(<TransactionsTable transacciones={transacciones} />);

    fireEvent.click(
      screen.getByRole("button", { name: /eliminar operación venta orden/i })
    );
    fireEvent.click(
      screen.getByRole("button", { name: /eliminar operación$/i })
    );

    await waitFor(() => {
      expect(toastMock.error).toHaveBeenCalledWith(
        "Solo el administrador puede eliminar operaciones."
      );
    });
  });
});