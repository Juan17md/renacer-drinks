import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PaginaMetodosPago } from "@/components/admin/pagos/PaginaMetodosPago";

const {
  obtenerMetodosMock,
  guardarMetodoMock,
  sembrarMetodosMock,
  toastMock,
} = vi.hoisted(() => ({
  obtenerMetodosMock: vi.fn(),
  guardarMetodoMock: vi.fn().mockResolvedValue({ ok: true }),
  sembrarMetodosMock: vi.fn().mockResolvedValue({ ok: true }),
  toastMock: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/services/metodosPago", () => ({
  obtenerMetodosPago: obtenerMetodosMock,
}));

vi.mock("@/actions/metodosPago", () => ({
  guardarMetodoPago: guardarMetodoMock,
  sembrarMetodosPagoPorDefecto: sembrarMetodosMock,
}));

vi.mock("sonner", () => ({
  toast: toastMock,
}));

const metodosMock = [
  {
    id: "PAGO_MOVIL",
    label: "Pago Móvil",
    activo: true,
    requiereComprobante: true,
    datos: [{ etiqueta: "Teléfono", valor: "0414-1234567" }],
  },
  {
    id: "EFECTIVO",
    label: "Efectivo",
    activo: true,
    requiereComprobante: false,
    datos: [],
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(window, "location", {
    value: { reload: vi.fn() },
    writable: true,
  });
});

describe("PaginaMetodosPago", () => {
  it("muestra los métodos de pago con sus datos", async () => {
    obtenerMetodosMock.mockResolvedValue(metodosMock);

    render(<PaginaMetodosPago />);

    expect(await screen.findByDisplayValue("Pago Móvil")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Efectivo")).toBeInTheDocument();
    expect(screen.getByDisplayValue("0414-1234567")).toBeInTheDocument();
  });

  it("guarda los cambios editados de un método", async () => {
    obtenerMetodosMock.mockResolvedValue(metodosMock);

    render(<PaginaMetodosPago />);
    await screen.findByDisplayValue("Pago Móvil");

    const inputTelefono = screen.getByDisplayValue("0414-1234567");
    fireEvent.change(inputTelefono, { target: { value: "0424-7654321" } });
    fireEvent.click(
      screen.getAllByRole("button", { name: /guardar cambios/i })[0]
    );

    await waitFor(() => {
      expect(guardarMetodoMock).toHaveBeenCalledWith("PAGO_MOVIL", {
        label: "Pago Móvil",
        activo: true,
        requiereComprobante: true,
        datos: [{ etiqueta: "Teléfono", valor: "0424-7654321" }],
      });
    });
    expect(toastMock.success).toHaveBeenCalledWith("Método de pago guardado");
  });

  it("permite agregar un dato nuevo al método", async () => {
    obtenerMetodosMock.mockResolvedValue([metodosMock[1]]);

    render(<PaginaMetodosPago />);
    await screen.findByDisplayValue("Efectivo");

    fireEvent.click(screen.getByRole("button", { name: /agregar dato/i }));

    expect(screen.getByLabelText(/etiqueta del dato 1/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/valor del dato 1/i)).toBeInTheDocument();
  });

  it("ofrece cargar los métodos por defecto cuando no hay ninguno", async () => {
    obtenerMetodosMock.mockResolvedValue([]);

    render(<PaginaMetodosPago />);

    const botonSembrar = await screen.findByRole("button", {
      name: /cargar métodos por defecto/i,
    });
    fireEvent.click(botonSembrar);

    await waitFor(() => {
      expect(sembrarMetodosMock).toHaveBeenCalled();
    });
  });

  it("muestra error si falla la carga", async () => {
    obtenerMetodosMock.mockRejectedValue(new Error("sin conexión"));

    render(<PaginaMetodosPago />);

    await waitFor(() => {
      expect(toastMock.error).toHaveBeenCalledWith(
        "No se pudieron cargar los métodos de pago"
      );
    });
  });

  it("deshabilita un método con guardado automático al tocar el switch", async () => {
    obtenerMetodosMock.mockResolvedValue(metodosMock);

    render(<PaginaMetodosPago />);
    await screen.findByDisplayValue("Pago Móvil");

    expect(screen.getAllByText("Activo")).toHaveLength(2);

    fireEvent.click(
      screen.getByRole("switch", {
        name: /habilitar o deshabilitar pago móvil/i,
      })
    );

    await waitFor(() => {
      expect(guardarMetodoMock).toHaveBeenCalledWith("PAGO_MOVIL", {
        label: "Pago Móvil",
        activo: false,
        requiereComprobante: true,
        datos: [{ etiqueta: "Teléfono", valor: "0414-1234567" }],
      });
    });
    expect(toastMock.success).toHaveBeenCalledWith(
      "Método deshabilitado"
    );
    expect(screen.getByText("Inactivo")).toBeInTheDocument();
  });

  it("habilita un método con guardado automático al tocar el switch", async () => {
    obtenerMetodosMock.mockResolvedValue([
      { ...metodosMock[1], activo: false },
    ]);

    render(<PaginaMetodosPago />);
    await screen.findByDisplayValue("Efectivo");

    expect(screen.getByText("Inactivo")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("switch", {
        name: /habilitar o deshabilitar efectivo/i,
      })
    );

    await waitFor(() => {
      expect(guardarMetodoMock).toHaveBeenCalledWith("EFECTIVO", {
        label: "Efectivo",
        activo: true,
        requiereComprobante: false,
        datos: [],
      });
    });
    expect(toastMock.success).toHaveBeenCalledWith("Método habilitado");
    expect(screen.getByText("Activo")).toBeInTheDocument();
  });

  it("revierte el switch si falla el guardado automático", async () => {
    obtenerMetodosMock.mockResolvedValue(metodosMock);
    guardarMetodoMock.mockResolvedValueOnce({
      ok: false,
      error: "No se pudo guardar el método de pago",
    });

    render(<PaginaMetodosPago />);
    await screen.findByDisplayValue("Pago Móvil");

    fireEvent.click(
      screen.getByRole("switch", {
        name: /habilitar o deshabilitar pago móvil/i,
      })
    );

    await waitFor(() => {
      expect(toastMock.error).toHaveBeenCalledWith(
        "No se pudo guardar el método de pago"
      );
    });
    expect(screen.getAllByText("Activo")).toHaveLength(2);
    expect(screen.queryByText("Inactivo")).not.toBeInTheDocument();
  });
});