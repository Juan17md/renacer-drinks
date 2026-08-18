import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { PanelOrdenes } from "@/components/admin/ordenes/PanelOrdenes";

const {
  suscriptorMock,
  suscriptorMetodosMock,
  actualizarEstadoMock,
  verificarPagoMock,
  registrarIngresoMock,
  toastMock,
  useAuthMock,
  eliminarOrdenMock,
} = vi.hoisted(() => {
  return {
    suscriptorMock: vi.fn((_callback: (ordenes: unknown[]) => void) => {
      return () => undefined;
    }),
    suscriptorMetodosMock: vi.fn(
      (_callback: (metodos: unknown[]) => void) => {
        return () => undefined;
      }
    ),
    actualizarEstadoMock: vi.fn().mockResolvedValue(undefined),
    verificarPagoMock: vi.fn().mockResolvedValue(undefined),
    registrarIngresoMock: vi.fn().mockResolvedValue(undefined),
    toastMock: { success: vi.fn(), error: vi.fn() },
    useAuthMock: vi.fn(() => ({
      usuario: { getIdToken: vi.fn().mockResolvedValue("token-admin") },
      esAdmin: false,
    })),
    eliminarOrdenMock: vi.fn().mockResolvedValue({ ok: true }),
  };
});

vi.mock("@/actions/ordenes", () => ({
  eliminarOrden: eliminarOrdenMock,
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: useAuthMock,
}));

vi.mock("@/services/orders", () => ({
  escucharOrdenes: (callback: (ordenes: unknown[]) => void) =>
    suscriptorMock(callback),
  actualizarEstadoOrden: actualizarEstadoMock,
  verificarPagoOrden: verificarPagoMock,
}));

vi.mock("@/services/metodosPago", () => ({
  escucharMetodosPago: (callback: (metodos: unknown[]) => void) =>
    suscriptorMetodosMock(callback),
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

function emitirMetodos(metodos: unknown[]) {
  const callback = suscriptorMetodosMock.mock.calls[0][0] as (
    metodos: unknown[]
  ) => void;
  act(() => callback(metodos));
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

  it("valida el pago de un método digital sin entregar ni registrar finanzas", async () => {
    render(<PanelOrdenes />);
    emitir([
      ordenMock("a", 12, "recibida", {
        metodoPago: "PAGO_MOVIL",
        comprobanteUrl: "https://ik.imagekit.io/renacer/comprobante.jpg",
        pagoVerificado: false,
      }),
    ]);

    fireEvent.click(
      screen.getByRole("button", { name: /validar pago de la orden 12/i })
    );

    await waitFor(() => {
      expect(verificarPagoMock).toHaveBeenCalledWith("a");
    });
    expect(actualizarEstadoMock).not.toHaveBeenCalled();
    expect(registrarIngresoMock).not.toHaveBeenCalled();
    expect(toastMock.success).toHaveBeenCalledWith(
      "Pago de la orden #12 validado"
    );
  });

  it("procesa el pago en efectivo sin entregar ni registrar finanzas", async () => {
    render(<PanelOrdenes />);
    emitir([
      ordenMock("a", 12, "recibida", {
        metodoPago: "EFECTIVO",
        pagoVerificado: false,
      }),
    ]);

    fireEvent.click(
      screen.getByRole("button", { name: /procesar pago de la orden 12/i })
    );

    await waitFor(() => {
      expect(verificarPagoMock).toHaveBeenCalledWith("a");
    });
    expect(actualizarEstadoMock).not.toHaveBeenCalled();
    expect(registrarIngresoMock).not.toHaveBeenCalled();
    expect(toastMock.success).toHaveBeenCalledWith(
      "Pago de la orden #12 validado"
    );
  });

  it("bloquea el botón Entregar mientras el pago esté pendiente", () => {
    render(<PanelOrdenes />);
    emitir([
      ordenMock("a", 12, "recibida", {
        metodoPago: "PAGO_MOVIL",
        comprobanteUrl: "https://ik.imagekit.io/renacer/comprobante.jpg",
        pagoVerificado: false,
      }),
    ]);

    expect(
      screen.getByRole("button", { name: /entregar orden 12/i })
    ).toBeDisabled();
  });

  it("entrega una orden con pago verificado y registra finanzas", async () => {
    render(<PanelOrdenes />);
    emitir([
      ordenMock("a", 12, "recibida", {
        metodoPago: "EFECTIVO",
        pagoVerificado: true,
      }),
    ]);

    fireEvent.click(
      screen.getByRole("button", { name: /entregar orden 12/i })
    );

    await waitFor(() => {
      expect(actualizarEstadoMock).toHaveBeenCalledWith("a", "entregada");
      expect(registrarIngresoMock).toHaveBeenCalledWith(
        "a",
        6,
        "Venta orden #12"
      );
    });
    expect(verificarPagoMock).not.toHaveBeenCalled();
    expect(toastMock.success).toHaveBeenCalledWith(
      expect.stringContaining("registrados en finanzas")
    );
  });

  it("no muestra el botón de validar pago si el pago ya está verificado", () => {
    render(<PanelOrdenes />);
    emitir([
      ordenMock("a", 12, "recibida", {
        metodoPago: "PAGO_MOVIL",
        comprobanteUrl: "https://ik.imagekit.io/renacer/comprobante.jpg",
        pagoVerificado: true,
      }),
    ]);

    expect(
      screen.queryByRole("button", { name: /validar pago de la orden 12/i })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /entregar orden 12/i })
    ).toBeEnabled();
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

  it("muestra el método de pago con badge de pago pendiente y botón validar", () => {
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
      screen.getByRole("button", { name: /validar pago de la orden 12/i })
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

  it("abre el comprobante en un diálogo y muestra el botón de validar pago", () => {
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
      screen.getByRole("button", { name: /validar pago de la orden 12/i })
    ).toBeInTheDocument();
  });

  it("muestra el comprobante con área de scroll para imágenes grandes", () => {
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

    const imagen = screen.getByAltText(
      /comprobante de pago de la orden #12/i
    ) as HTMLImageElement;
    expect(imagen).toHaveAttribute(
      "src",
      "https://ik.imagekit.io/renacer/comprobante.jpg"
    );
    expect(imagen.closest("div")).toHaveClass("max-h-[60vh]");
    expect(imagen.closest("div")).toHaveClass("overflow-y-auto");
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

  it("valida el pago desde el diálogo y lo cierra sin entregar", async () => {
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
      screen.getByRole("button", { name: /validar pago de la orden 12/i })
    );

    await waitFor(() => expect(verificarPagoMock).toHaveBeenCalledWith("a"));
    expect(registrarIngresoMock).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(
        screen.queryByText(/comprobante de la orden #12/i)
      ).not.toBeInTheDocument()
    );
  });

  it("muestra el botón de entregar deshabilitado en órdenes sin método", () => {
    render(<PanelOrdenes />);
    emitir([ordenMock("a", 12, "recibida")]);

    expect(
      screen.getByRole("button", { name: /procesar pago de la orden 12/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /entregar orden 12/i })
    ).toBeDisabled();
  });

  it("pagina las órdenes de 15 en 15 con controles anterior/siguiente", () => {
    const muchas = Array.from({ length: 32 }, (_, indice) =>
      ordenMock(`o${indice}`, indice + 1, "recibida")
    );
    render(<PanelOrdenes />);
    emitir(muchas);

    expect(screen.getByText("Página 1 de 3")).toBeInTheDocument();
    expect(screen.getByText("#1")).toBeInTheDocument();
    expect(screen.queryByText("#16")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /página anterior/i })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: /página siguiente/i }));
    expect(screen.getByText("Página 2 de 3")).toBeInTheDocument();
    expect(screen.getByText("#16")).toBeInTheDocument();
    expect(screen.queryByText("#1")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /página anterior/i })).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: /página siguiente/i }));
    fireEvent.click(screen.getByRole("button", { name: /página siguiente/i }));
    expect(screen.getByText("Página 3 de 3")).toBeInTheDocument();
    expect(screen.getByText("#32")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /página siguiente/i })
    ).toBeDisabled();
  });

  it("oculta la paginación cuando hay 15 órdenes o menos", () => {
    const quince = Array.from({ length: 15 }, (_, indice) =>
      ordenMock(`o${indice}`, indice + 1, "recibida")
    );
    render(<PanelOrdenes />);
    emitir(quince);

    expect(screen.queryByText(/página \d+ de \d+/i)).not.toBeInTheDocument();
    expect(screen.getByText("#15")).toBeInTheDocument();
  });

  it("reinicia a la primera página al cambiar el filtro", () => {
    const muchas = Array.from({ length: 20 }, (_, indice) =>
      ordenMock(`o${indice}`, indice + 1, "recibida")
    );
    const entregadas = Array.from({ length: 2 }, (_, indice) =>
      ordenMock(`e${indice}`, indice + 30, "entregada")
    );
    render(<PanelOrdenes />);
    emitir([...muchas, ...entregadas]);

    fireEvent.click(screen.getByRole("button", { name: /todas/i }));
    fireEvent.click(screen.getByRole("button", { name: /página siguiente/i }));
    expect(screen.getByText("Página 2 de 2")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^recibida$/i }));
    expect(screen.getByText("Página 1 de 2")).toBeInTheDocument();
    expect(screen.getByText("#1")).toBeInTheDocument();
  });

  it("usa el requiereComprobante real para un método personalizado", () => {
    render(<PanelOrdenes />);
    emitirMetodos([
      {
        id: "pago-bolivares",
        label: "Pago en Bolívares",
        activo: true,
        requiereComprobante: true,
        datos: [],
      },
    ]);
    emitir([
      ordenMock("a", 12, "recibida", {
        metodoPago: "pago-bolivares",
        pagoVerificado: false,
      }),
    ]);

    expect(screen.getByText("Pago en Bolívares")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /validar pago de la orden 12/i })
    ).toBeInTheDocument();
  });

  it("procesa el pago de un método personalizado sin comprobante", () => {
    render(<PanelOrdenes />);
    emitirMetodos([
      {
        id: "pago-bolivares",
        label: "Pago en Bolívares",
        activo: true,
        requiereComprobante: false,
        datos: [],
      },
    ]);
    emitir([
      ordenMock("a", 12, "recibida", {
        metodoPago: "pago-bolivares",
        pagoVerificado: false,
      }),
    ]);

    expect(
      screen.getByRole("button", { name: /procesar pago de la orden 12/i })
    ).toBeInTheDocument();
  });

  it("reemplaza el label del método por el de Firestore cuando existe", () => {
    render(<PanelOrdenes />);
    emitirMetodos([
      {
        id: "PAGO_MOVIL",
        label: "Pago Móvil (Banesco)",
        activo: true,
        requiereComprobante: true,
        datos: [],
      },
    ]);
    emitir([
      ordenMock("a", 12, "recibida", {
        metodoPago: "PAGO_MOVIL",
        comprobanteUrl: "https://ik.imagekit.io/renacer/comprobante.jpg",
        pagoVerificado: false,
      }),
    ]);

    expect(screen.getByText("Pago Móvil (Banesco)")).toBeInTheDocument();
  });

  it("no muestra el botón de eliminar para un operador", () => {
    useAuthMock.mockReturnValue({
      usuario: { getIdToken: vi.fn().mockResolvedValue("token-operador") },
      esAdmin: false,
    });
    render(<PanelOrdenes />);
    emitir([ordenMock("a", 12, "entregada")]);

    expect(
      screen.queryByRole("button", { name: /eliminar orden 12/i })
    ).not.toBeInTheDocument();
  });

  it("muestra el botón de eliminar para el admin en cualquier estado", () => {
    useAuthMock.mockReturnValue({
      usuario: { getIdToken: vi.fn().mockResolvedValue("token-admin") },
      esAdmin: true,
    });
    render(<PanelOrdenes />);
    emitir([
      ordenMock("a", 12, "entregada"),
      ordenMock("b", 13, "cancelada"),
      ordenMock("c", 14, "recibida"),
    ]);
    fireEvent.click(screen.getByRole("button", { name: /todas/i }));

    expect(
      screen.getAllByRole("button", { name: /eliminar orden \d+/i })
    ).toHaveLength(3);
  });

  it("elimina la orden tras confirmar en el diálogo", async () => {
    useAuthMock.mockReturnValue({
      usuario: { getIdToken: vi.fn().mockResolvedValue("token-admin") },
      esAdmin: true,
    });
    render(<PanelOrdenes />);
    emitir([ordenMock("a", 12, "entregada")]);
    fireEvent.click(screen.getByRole("button", { name: /todas/i }));

    fireEvent.click(
      screen.getByRole("button", { name: /eliminar orden 12/i })
    );

    expect(
      screen.getByText(/se eliminará permanentemente, junto con su registro en finanzas/i)
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^eliminar orden$/i }));

    await waitFor(() => {
      expect(eliminarOrdenMock).toHaveBeenCalledWith("a", "token-admin");
    });
    expect(toastMock.success).toHaveBeenCalledWith("Orden #12 eliminada");
  });

  it("muestra el error si la eliminación falla", async () => {
    useAuthMock.mockReturnValue({
      usuario: { getIdToken: vi.fn().mockResolvedValue("token-admin") },
      esAdmin: true,
    });
    eliminarOrdenMock.mockResolvedValue({
      ok: false,
      error: "Solo el administrador puede eliminar órdenes.",
    });
    render(<PanelOrdenes />);
    emitir([ordenMock("a", 12, "recibida")]);

    fireEvent.click(
      screen.getByRole("button", { name: /eliminar orden 12/i })
    );
    fireEvent.click(screen.getByRole("button", { name: /^eliminar orden$/i }));

    await waitFor(() => {
      expect(toastMock.error).toHaveBeenCalledWith(
        "Solo el administrador puede eliminar órdenes."
      );
    });
  });
});