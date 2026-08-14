import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  escucharOrdenes,
  actualizarEstadoOrden,
  crearOrden,
  verificarPagoOrden,
} from "@/services/orders";

const mocksFirestore = vi.hoisted(() => ({
  runTransaction: vi.fn(),
  onSnapshot: vi.fn(() => () => undefined),
  updateDoc: vi.fn(),
}));

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(() => ({})),
  query: vi.fn(() => ({})),
  orderBy: vi.fn(() => ({})),
  limit: vi.fn(() => ({})),
  where: vi.fn(() => ({})),
  doc: vi.fn(() => ({})),
  increment: vi.fn(() => ({})),
  addDoc: vi.fn(() => ({})),
  getDocs: vi.fn(() => ({ docs: [] })),
  runTransaction: mocksFirestore.runTransaction,
  onSnapshot: mocksFirestore.onSnapshot,
  updateDoc: mocksFirestore.updateDoc,
}));

vi.mock("@/lib/firebase", () => ({
  db: {},
}));

describe("escucharOrdenes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("transforma los documentos de Firestore a órdenes", () => {
    const callback = vi.fn();
    const onError = vi.fn();

    const desuscribir = escucharOrdenes(callback, onError);

    const snapshotMock = {
      docs: [
        {
          id: "abc123",
          data: () => ({
            numero: 5,
            nombreCliente: "María",
            items: [
              {
                productId: "prod_1",
                nombre: "Tropical",
                precio: 3,
                cantidad: 2,
                subtotal: 6,
              },
            ],
            totalUSD: 6,
            totalBs: 4586.1,
            tasaBCV: 764.35,
            estado: "recibida",
            createdAt: "2026-08-13T10:00:00",
            updatedAt: "2026-08-13T10:00:00",
          }),
        },
      ],
    };

    const ejecutarCallback = mocksFirestore.onSnapshot.mock.calls[0][1];
    ejecutarCallback(snapshotMock);

    expect(callback).toHaveBeenCalledWith([
      expect.objectContaining({
        id: "abc123",
        numero: 5,
        nombreCliente: "María",
        estado: "recibida",
        totalUSD: 6,
      }),
    ]);
    expect(onError).not.toHaveBeenCalled();
    expect(desuscribir).toBeTypeOf("function");
  });

  it("transforma los campos de pago de la orden", () => {
    const callback = vi.fn();
    escucharOrdenes(callback);

    const snapshotMock = {
      docs: [
        {
          id: "abc123",
          data: () => ({
            numero: 6,
            nombreCliente: "María",
            items: [],
            totalUSD: 6,
            totalBs: 4586.1,
            tasaBCV: 764.35,
            estado: "recibida",
            createdAt: "2026-08-13T10:00:00",
            updatedAt: "2026-08-13T10:00:00",
            metodoPago: "PAGO_MOVIL",
            comprobanteUrl: "https://ik.imagekit.io/renacer/comprobante.jpg",
            pagoVerificado: false,
          }),
        },
      ],
    };

    const ejecutarCallback =
      mocksFirestore.onSnapshot.mock.calls.at(-1)![1];
    ejecutarCallback(snapshotMock);

    expect(callback).toHaveBeenCalledWith([
      expect.objectContaining({
        metodoPago: "PAGO_MOVIL",
        comprobanteUrl: "https://ik.imagekit.io/renacer/comprobante.jpg",
        pagoVerificado: false,
      }),
    ]);
  });

  it("llama onError cuando la suscripción falla", () => {
    const callback = vi.fn();
    const onError = vi.fn();
    escucharOrdenes(callback, onError);

    const ejecutarError = mocksFirestore.onSnapshot.mock.calls[0][2];
    ejecutarError(new Error("sin conexión"));

    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });
});

describe("actualizarEstadoOrden", () => {
  it("actualiza el estado y la fecha en Firestore", async () => {
    mocksFirestore.updateDoc.mockResolvedValue(undefined);

    await actualizarEstadoOrden("abc123", "lista");

    expect(mocksFirestore.updateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        estado: "lista",
        updatedAt: expect.any(String),
      })
    );
  });
});

describe("verificarPagoOrden", () => {
  it("marca el pago como verificado en Firestore", async () => {
    mocksFirestore.updateDoc.mockResolvedValue(undefined);

    await verificarPagoOrden("abc123");

    expect(mocksFirestore.updateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        pagoVerificado: true,
        updatedAt: expect.any(String),
      })
    );
  });
});

describe("crearOrden", () => {
  it("crea la orden con número secuencial vía transacción", async () => {
    mocksFirestore.runTransaction.mockImplementation(async (_db, ejecutor) => {
      return ejecutor({
        get: vi.fn().mockResolvedValue({
          data: () => ({ numero: 10 }),
        }),
        set: vi.fn(),
      });
    });

    const resultado = await crearOrden({
      nombreCliente: "Pedro",
      items: [{ nombre: "Tropical", precio: 3, cantidad: 1, subtotal: 3 }],
      totalUSD: 3,
      totalBs: 2293.05,
      tasaBCV: 764.35,
    });

    expect(resultado.numero).toBe(11);
    expect(resultado.estado).toBe("recibida");
    expect(mocksFirestore.runTransaction).toHaveBeenCalled();
  });
});
