import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { PanelOrdenes } from "@/components/admin/ordenes/PanelOrdenes";

const { suscriptorMock, actualizarEstadoMock, verificarPagoMock, toastMock } =
  vi.hoisted(() => {
    let callbackActual: ((ordenes: unknown[]) => void) | null = null;
    return {
      suscriptorMock: vi.fn((callback: (ordenes: unknown[]) => void) => {
        callbackActual = callback;
        return () => undefined;
      }),
      actualizarEstadoMock: vi.fn().mockResolvedValue(undefined),
      verificarPagoMock: vi.fn().mockResolvedValue(undefined),
      toastMock: { success: vi.fn(), error: vi.fn() },
      emitir: (ordenes: unknown[]) => {
        callbackActual?.(ordenes);
      },
    };
  });

vi.mock("@/services/orders", () => ({
  escucharOrdenes: (callback: (ordenes: unknown[]) => void) =>
    suscriptorMock(callback),
  actualizarEstadoOrden: actualizarEstadoMock,
  verificarPagoOrden: verificarPagoMock,
}));

vi.mock("@/services/transactions", () => ({
  registrarIngresoPorOrden: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("sonner", () => ({
  toast: toastMock,
}));

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    const { src, alt, ...resto } = props;
    return React.createElement("img", {
      src: String(src ?? ""),
      alt: String(alt ?? ""),
      ...resto,
    });
  },
}));

function ordenMock(
  id: string,
  numero: number,
  estado: "recibida" | "lista" | "entregada" | "cancelada",
  pago?: { metodoPago?: string; comprobanteUrl?: string; pagoVerificado?: boolean }
) {
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
    ...pago,
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

  it("muestra el botón de cancelar en órdenes recibidas", () => {
    render(<PanelOrdenes />);
    emitir([ordenMock("a", 12, "recibida")]);

    expect(
      screen.getByRole("button", { name: /cancelar orden 12/i })
    ).toBeInTheDocument();
  });

  it("no muestra el botón de cancelar en órdenes entregadas o canceladas", () => {
    render(<PanelOrdenes />);
    emitir([
      ordenMock("a", 12, "entregada"),
      ordenMock("b", 13, "cancelada"),
    ]);

    fireEvent.click(screen.getByRole("button", { name: /todas/i }));

    expect(
      screen.queryByRole("button", { name: /cancelar orden/i })
    ).not.toBeInTheDocument();
  });

  it("cancela una orden tras confirmar en el diálogo", async () => {
    render(<PanelOrdenes />);
    emitir([ordenMock("a", 12, "recibida")]);

    fireEvent.click(
      screen.getByRole("button", { name: /cancelar orden 12/i })
    );

    expect(
      screen.getByText(/¿cancelar la orden #12\?/i)
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /^cancelar orden$/i })
    );

    await waitFor(() => {
      expect(actualizarEstadoMock).toHaveBeenCalledWith("a", "cancelada");
    });
    expect(toastMock.success).toHaveBeenCalledWith("Orden #12 cancelada");
  });

  it("muestra el método de pago con badge de pago pendiente", () => {
    render(<PanelOrdenes />);
    emitir([
      ordenMock("a", 12, "recibida", {
        metodoPago: "PAGO_MOVIL",
        comprobanteUrl: "https://ik.imagekit.io/renacer/comprobante.jpg",
        pagoVerificado: false,
      }),
    ]);

    expect(screen.getByText("Pago Móvil")).toBeInTheDocument();
    expect(screen.getByText("Pago pendiente")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /ver comprobante de la orden 12/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /verificar pago de la orden 12/i })
    ).toBeInTheDocument();
  });

  it("muestra badge de pago verificado sin botón de verificación", () => {
    render(<PanelOrdenes />);
    emitir([
      ordenMock("a", 12, "recibida", {
        metodoPago: "EFECTIVO",
        pagoVerificado: true,
      }),
    ]);

    expect(screen.getByText("Efectivo")).toBeInTheDocument();
    expect(screen.getByText("Pago verificado")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /verificar pago/i })
    ).not.toBeInTheDocument();
  });

  it("bloquea el avance a lista cuando el pago está pendiente", () => {
    render(<PanelOrdenes />);
    emitir([
      ordenMock("a", 12, "recibida", {
        metodoPago: "ZELLE",
        comprobanteUrl: "https://ik.imagekit.io/renacer/comprobante.jpg",
        pagoVerificado: false,
      }),
    ]);

    const botonAvanzar = screen.getByRole("button", {
      name: /marcar orden 12 como lista/i,
    });
    expect(botonAvanzar).toBeDisabled();
  });

  it("permite avanzar a lista con el pago verificado", () => {
    render(<PanelOrdenes />);
    emitir([
      ordenMock("a", 12, "recibida", {
        metodoPago: "PAGO_MOVIL",
        comprobanteUrl: "https://ik.imagekit.io/renacer/comprobante.jpg",
        pagoVerificado: true,
      }),
    ]);

    const botonAvanzar = screen.getByRole("button", {
      name: /marcar orden 12 como lista/i,
    });
    expect(botonAvanzar).not.toBeDisabled();
  });

  it("verifica el pago de una orden", async () => {
    render(<PanelOrdenes />);
    emitir([
      ordenMock("a", 12, "recibida", {
        metodoPago: "PAGO_MOVIL",
        comprobanteUrl: "https://ik.imagekit.io/renacer/comprobante.jpg",
        pagoVerificado: false,
      }),
    ]);

    fireEvent.click(
      screen.getByRole("button", { name: /verificar pago de la orden 12/i })
    );

    await waitFor(() => {
      expect(verificarPagoMock).toHaveBeenCalledWith("a");
    });
  });

  it("abre el comprobante de pago en un diálogo", () => {
    render(<PanelOrdenes />);
    emitir([
      ordenMock("a", 12, "recibida", {
        metodoPago: "PAGO_MOVIL",
        comprobanteUrl: "https://ik.imagekit.io/renacer/comprobante.jpg",
        pagoVerificado: false,
      }),
    ]);

    fireEvent.click(
      screen.getByRole("button", { name: /ver comprobante de la orden 12/i })
    );

    expect(screen.getByText(/comprobante de la orden #12/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /verificar pago de la orden 12/i })
    ).toBeInTheDocument();
  });

  it("verifica el pago desde el diálogo del comprobante y lo cierra", async () => {
    render(<PanelOrdenes />);
    emitir([
      ordenMock("a", 12, "recibida", {
        metodoPago: "PAGO_MOVIL",
        comprobanteUrl: "https://ik.imagekit.io/renacer/comprobante.jpg",
        pagoVerificado: false,
      }),
    ]);

    fireEvent.click(
      screen.getByRole("button", { name: /ver comprobante de la orden 12/i })
    );

    fireEvent.click(
      screen.getByRole("button", { name: /verificar pago de la orden 12/i })
    );

    await waitFor(() =>
      expect(verificarPagoMock).toHaveBeenCalledWith("a")
    );
    expect(toastMock.success).toHaveBeenCalledWith(
      expect.stringContaining("verificado")
    );
    await waitFor(() =>
      expect(
        screen.queryByText(/comprobante de la orden #12/i)
      ).not.toBeInTheDocument()
    );
  });

  it("no muestra el botón verificar en el diálogo cuando el pago ya está verificado", () => {
    render(<PanelOrdenes />);
    emitir([
      ordenMock("a", 12, "recibida", {
        metodoPago: "PAGO_MOVIL",
        comprobanteUrl: "https://ik.imagekit.io/renacer/comprobante.jpg",
        pagoVerificado: true,
      }),
    ]);

    fireEvent.click(
      screen.getByRole("button", { name: /ver comprobante de la orden 12/i })
    );

    expect(
      screen.queryByRole("button", { name: /verificar pago de la orden 12/i })
    ).not.toBeInTheDocument();
  });

  it("no muestra datos de pago en órdenes sin método", () => {
    render(<PanelOrdenes />);
    emitir([ordenMock("a", 12, "recibida")]);

    expect(screen.queryByText(/pago pendiente/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /verificar pago/i })
    ).not.toBeInTheDocument();
  });
});
