import { describe, it, expect, vi } from "vitest";
import {
  obtenerMetodosPago,
  escucharMetodosPago,
  METODOS_PAGO_PREDETERMINADOS,
} from "@/services/metodosPago";

const mocksFirestore = vi.hoisted(() => ({
  getDocs: vi.fn(),
  onSnapshot: vi.fn(() => () => undefined),
}));

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(() => ({})),
  getDocs: mocksFirestore.getDocs,
  onSnapshot: mocksFirestore.onSnapshot,
}));

vi.mock("@/lib/firebase", () => ({
  db: {},
}));

describe("metodosPago", () => {
  it("obtiene y transforma los métodos de pago", async () => {
    mocksFirestore.getDocs.mockResolvedValue({
      docs: [
        {
          id: "PAGO_MOVIL",
          data: () => ({
            label: "Pago Móvil",
            activo: true,
            requiereComprobante: true,
            datos: [{ etiqueta: "Teléfono", valor: "0414-1234567" }],
          }),
        },
        {
          id: "EFECTIVO",
          data: () => ({
            label: "Efectivo",
            activo: true,
            requiereComprobante: false,
            datos: [],
          }),
        },
      ],
    });

    const metodos = await obtenerMetodosPago();

    expect(metodos).toHaveLength(2);
    expect(metodos[0]).toEqual({
      id: "PAGO_MOVIL",
      label: "Pago Móvil",
      activo: true,
      requiereComprobante: true,
      datos: [{ etiqueta: "Teléfono", valor: "0414-1234567" }],
    });
    expect(metodos[1].requiereComprobante).toBe(false);
  });

  it("escucha los cambios en tiempo real", () => {
    const callback = vi.fn();
    escucharMetodosPago(callback);

    const ejecutarCallback = mocksFirestore.onSnapshot.mock.calls[0][1];
    ejecutarCallback({
      docs: [
        {
          id: "ZELLE",
          data: () => ({
            label: "Zelle",
            activo: true,
            requiereComprobante: true,
            datos: [],
          }),
        },
      ],
    });

    expect(callback).toHaveBeenCalledWith([
      expect.objectContaining({ id: "ZELLE", label: "Zelle" }),
    ]);
  });

  it("define métodos por defecto con los seis métodos del panel", () => {
    expect(METODOS_PAGO_PREDETERMINADOS.map((m) => m.id)).toEqual([
      "PAGO_MOVIL",
      "ZELLE",
      "TRANSFERENCIA",
      "BINANCE",
      "PUNTO",
      "EFECTIVO",
    ]);
    expect(
      METODOS_PAGO_PREDETERMINADOS.filter(
        (m) => !m.requiereComprobante
      ).map((m) => m.id)
    ).toEqual(["PUNTO", "EFECTIVO"]);
  });
});
