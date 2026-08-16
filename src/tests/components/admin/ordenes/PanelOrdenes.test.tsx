import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { PanelOrdenes } from "@/components/admin/ordenes/PanelOrdenes";

const {
  suscriptorMock,
  actualizarEstadoMock,
  verificarPagoMock,
  registrarIngresoMock,
  toastMock,
} = vi.hoisted(() => {
  return {
    suscriptorMock: vi.fn((_callback: (ordenes: unknown[]) => void) => {
      return () => undefined;
    }),
    actualizarEstadoMock: vi.fn().mockResolvedValue(undefined),
    verificarPagoMock: vi.fn().mockResolvedValue(undefined),
    registrarIngresoMock: vi.fn().mockResolvedValue(undefined),
    toastMock: { success: vi.fn(), error: vi.fn() },
  };
});

vi.mock("@/services/orders", () => ({
  escucharOrdenes: (callback: (ordenes: unknown[]) => void) =>
    suscriptorMock(callback),
  actualizarEstadoOrden: actualizarEstadoMock,
  verificarPagoOrden: verificarPagoMock,
}));

vi.mock("@/services/transactions", () => ({
  registrarIngresoPorOrden: registrarIngresoMock,
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
  estado: "recibida" | "entregada" | "cancelada",
  pago?: {
    metodoPago?: string;
    comprobanteUrl?: string;
    referencia?: string;
    pagoVerificado?: boolean;
  }
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
  const callback = suscriptorMock.mock.calls[0][0] as (
    ordenes: unknown[]
  ) => void;
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

  it("procesa el pago: verifica, entrega y registra finanzas", async () => {
    render(<PanelOrdenes />);
    emitir([
      ordenMock("a", 12, "recibida", {
        metodoPago: "PAGO_MOVIL",
        comprobanteUrl: "https://ik.imagekit.io/renacer/comprobante.jpg",
        pagoVerificado: false,
      }),
    ]);

    fireEvent.click(
      screen.getByRole("button", { name: /procesar pago de la orden 12/i })
    );

    await waitFor(() => {
      expect(verificarPagoMock).toHaveBeenCalledWith("a");
      expect(actualizarEstadoMock).toHaveBeenCalledWith("a", "entregada");
      expect(registrarIngresoMock).toHaveBeenCalledWith(
        "a",
        6,
        "Venta orden #12"
      );
    });
    expect(toastMock.success).toHaveBeenCalledWith(
      expect.stringContaining("registrados en finanzas")
    );
  });

  it("no vuelve a verificar el pago si ya estaba verificado", async () => {
    render(<PanelOrdenes />);
    emitir([
      ordenMock("a", 12, "recibida", {
        metodoPago: "EFECTIVO",
        pagoVerificado: true,
      }),
    ]);

    fireEvent.click(
      screen.getByRole("button", { name: /procesar pago de la orden 12/i })
    );

    await waitFor(() => {
      expect(verificarPagoMock).not.toHaveBeenCalled();
      expect(actualizarEstadoMock).toHaveBeenCalledWith("a", "entregada");
    });
  });

  it("permite regresar una orden de entregada a recibida", async () => {
    render(<PanelOrdenes />);
    emitir([ordenMock("a", 12, "entregada")]);

    fireEvent.click(screen.getByRole("button", { name: /entregada/i }));

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
      screen.getByRole("button", { name: /procesar pago de la orden 12/i })
    ).toBeInTheDocument();
  });

  it("muestra la referencia del pago en la tarjeta cuando no hay imagen", () => {
    render(<PanelOrdenes />);
    emitir([
      ordenMock("a", 12, "recibida", {
        metodoPago: "TRANSFERENCIA",
        referencia: "1234567890",
        pagoVerificado: false,
      }),
    ]);

    expect(screen.getByText("Referencia:")).toBeInTheDocument();
    expect(screen.getByText("1234567890")).toBeInTheDocument();
  });

  it("abre el comprobante en un diálogo y muestra el botón de procesar pago", () => {
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
      screen.getByRole("button", { name: /procesar pago de la orden 12/i })
    ).toBeInTheDocument();
  });

  it("muestra la referencia en el diálogo cuando no hay imagen", () => {
    render(<PanelOrdenes />);
    emitir([
      ordenMock("a", 12, "recibida", {
        metodoPago: "TRANSFERENCIA",
        referencia: "987654",
        pagoVerificado: false,
      }),
    ]);

    expect(screen.getByText("987654")).toBeInTheDocument();
  });

  it("procesa el pago desde el diálogo y lo cierra", async () => {
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
      screen.getByRole("button", { name: /procesar pago de la orden 12/i })
    );

    await waitFor(() =>
      expect(registrarIngresoMock).toHaveBeenCalledWith(
        "a",
        6,
        "Venta orden #12"
      )
    );
    await waitFor(() =>
      expect(
        screen.queryByText(/comprobante de la orden #12/i)
      ).not.toBeInTheDocument()
    );
  });

  it("no muestra datos de pago en órdenes sin método", () => {
    render(<PanelOrdenes />);
    emitir([ordenMock("a", 12, "recibida")]);

    expect(screen.queryByText(/pago pendiente/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /procesar pago/i })
    ).toBeInTheDocument();
  });
});
