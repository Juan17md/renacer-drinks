import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { PanelOrdenes } from "@/components/admin/ordenes/PanelOrdenes";

const { suscriptorMock, actualizarEstadoMock } = vi.hoisted(() => {
  let callbackActual: ((ordenes: unknown[]) => void) | null = null;
  return {
    suscriptorMock: vi.fn((callback: (ordenes: unknown[]) => void) => {
      callbackActual = callback;
      return () => undefined;
    }),
    actualizarEstadoMock: vi.fn().mockResolvedValue(undefined),
    emitir: (ordenes: unknown[]) => {
      callbackActual?.(ordenes);
    },
  };
});

vi.mock("@/services/orders", () => ({
  escucharOrdenes: (callback: (ordenes: unknown[]) => void) =>
    suscriptorMock(callback),
  actualizarEstadoOrden: actualizarEstadoMock,
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

function ordenMock(id: string, numero: number, estado: "recibida" | "lista" | "entregada") {
  return {
    id,
    numero,
    nombreCliente: "María",
    items: [{ nombre: "Tropical", precio: 3, cantidad: 2, subtotal: 6 }],
    totalUSD: 6,
    totalBs: 4586.1,
    tasaBCV: 764.35,
    estado,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function emitir(ordenes: unknown[]) {
  const callback = suscriptorMock.mock.calls[0][0] as (ordenes: unknown[]) => void;
  act(() => callback(ordenes));
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("PanelOrdenes", () => {
  it("muestra el estado de carga inicial", () => {
    render(<PanelOrdenes />);
    expect(screen.getByText(/conectando en tiempo real/i)).toBeInTheDocument();
  });

  it("muestra las órdenes pendientes con sus items", () => {
    render(<PanelOrdenes />);
    emitir([ordenMock("a", 12, "recibida")]);

    expect(screen.getByText("#12")).toBeInTheDocument();
    expect(screen.getByText("María")).toBeInTheDocument();
    expect(screen.getByText("Tropical")).toBeInTheDocument();
    expect(screen.getByText("2×")).toBeInTheDocument();
    expect(screen.getAllByText("$6.00")).toHaveLength(2);
  });

  it("muestra mensaje cuando no hay órdenes", () => {
    render(<PanelOrdenes />);
    emitir([]);

    expect(screen.getByText(/sin órdenes en esta vista/i)).toBeInTheDocument();
  });

  it("avanza una orden de recibida a lista", async () => {
    render(<PanelOrdenes />);
    emitir([ordenMock("a", 12, "recibida")]);

    fireEvent.click(
      screen.getByRole("button", { name: /marcar orden 12 como lista/i })
    );

    expect(actualizarEstadoMock).toHaveBeenCalledWith("a", "lista");
  });

  it("marca una orden como entregada desde lista", async () => {
    render(<PanelOrdenes />);
    emitir([ordenMock("a", 12, "lista")]);
    fireEvent.click(screen.getByRole("button", { name: "Lista" }));

    fireEvent.click(
      screen.getByRole("button", { name: /marcar orden 12 como entregada/i })
    );

    expect(actualizarEstadoMock).toHaveBeenCalledWith("a", "entregada");
  });

  it("permite regresar una orden de lista a recibida", async () => {
    render(<PanelOrdenes />);
    emitir([ordenMock("a", 12, "lista")]);
    fireEvent.click(screen.getByRole("button", { name: "Lista" }));

    fireEvent.click(
      screen.getByRole("button", { name: /regresar orden 12 a recibida/i })
    );

    expect(actualizarEstadoMock).toHaveBeenCalledWith("a", "recibida");
  });

  it("filtra las órdenes por estado", () => {
    render(<PanelOrdenes />);
    emitir([
      ordenMock("a", 12, "recibida"),
      ordenMock("b", 13, "entregada"),
    ]);

    fireEvent.click(screen.getByRole("button", { name: /entregada/i }));

    expect(screen.queryByText("#12")).not.toBeInTheDocument();
    expect(screen.getByText("#13")).toBeInTheDocument();
  });
});
