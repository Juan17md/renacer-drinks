import { describe, it, expect, vi, beforeEach } from "vitest";

const { firestoreMock } = vi.hoisted(() => ({
  firestoreMock: {
    collection: vi.fn(),
    getDocs: vi.fn(),
    getDoc: vi.fn(),
    doc: vi.fn(),
    runTransaction: vi.fn(),
    query: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    where: vi.fn(),
    updateDoc: vi.fn(),
  },
}));

vi.mock("firebase/firestore", () => firestoreMock);

vi.mock("@/lib/firebase", () => ({ db: {} }));

const { obtenerTasaBCVMock } = vi.hoisted(() => ({
  obtenerTasaBCVMock: vi.fn(),
}));

vi.mock("@/lib/bcv", () => ({
  obtenerTasaBCV: obtenerTasaBCVMock,
}));
vi.mock("@/lib/utils", () => ({
  obtenerFechaLocalISO: () => "2026-08-13",
  generarSlug: (texto: string) =>
    texto
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-"),
}));

import {
  registrarTransaccion,
  registrarIngresoPorOrden,
  registrarVenta,
  obtenerTransacciones,
  obtenerResumenDiario,
} from "@/services/transactions";

// Localiza la escritura de la transacción financiera (payload con `type`),
// ignorando la escritura del resumen diario que ocurre en el mismo commit.
function transaccionEscrita(set: ReturnType<typeof vi.fn>) {
  const llamadas = set.mock.calls as unknown[][];
  const llamada = llamadas.find(
    (call) =>
      call[1] !== undefined &&
      typeof call[1] === "object" &&
      call[1] !== null &&
      "type" in (call[1] as object)
  );
  return (llamada?.[1] ?? {}) as Record<string, unknown>;
}

function mockearLecturaOrden(datos: Record<string, unknown>) {
  firestoreMock.getDoc.mockResolvedValue({ data: () => datos });
}

describe("services/transactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    firestoreMock.collection.mockReturnValue("coleccion");
    firestoreMock.query.mockReturnValue("consulta");
    firestoreMock.orderBy.mockReturnValue("ordenado");
    firestoreMock.limit.mockReturnValue("limitado");
    firestoreMock.doc.mockImplementation(
      (_db: unknown, nombre?: string, id?: string) => ({
        nombre: nombre ?? "coleccion",
        id: id ?? "tx_auto",
      })
    );
    firestoreMock.getDocs.mockResolvedValue({ docs: [] });
    firestoreMock.getDoc.mockResolvedValue({ data: () => null });
    firestoreMock.updateDoc.mockResolvedValue(undefined);
    obtenerTasaBCVMock.mockReset();
  });

  describe("registrarTransaccion", () => {
    it("guarda la transacción y actualiza el resumen en una sola transacción atómica", async () => {
      const set = vi.fn();
      firestoreMock.runTransaction.mockImplementation(
        async (_db: unknown, callback: (tx: unknown) => Promise<void>) => {
          await callback({
            get: vi.fn().mockResolvedValue({ data: () => null }),
            set,
          });
        }
      );

      const resultado = await registrarTransaccion(
        {
          type: "INGRESO",
          amount: 5,
          concept: "Venta directa",
          paymentMethod: "EFECTIVO",
        },
        80
      );

      expect(firestoreMock.runTransaction).toHaveBeenCalledTimes(1);
      expect(set).toHaveBeenCalledWith(expect.anything(), {
        type: "INGRESO",
        amount: 5,
        amountBs: 400,
        bcvRate: 80,
        concept: "Venta directa",
        paymentMethod: "EFECTIVO",
        date: expect.any(String),
        createdBy: "admin",
        ganancia: 0,
      });
      // El resumen se actualiza dentro del mismo commit (netProfit correcto).
      expect(set).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          totalIncome: 5,
          totalExpense: 0,
          netProfit: 5,
          totalSales: 1,
        }),
        { merge: true }
      );
      expect(resultado.id).toBe("tx_auto");
      expect(resultado.amountBs).toBe(400);
    });

    it("suma al egreso sin afectar los ingresos", async () => {
      const set = vi.fn();
      firestoreMock.runTransaction.mockImplementation(
        async (_db: unknown, callback: (tx: unknown) => Promise<void>) => {
          await callback({
            get: vi.fn().mockResolvedValue({ data: () => null }),
            set,
          });
        }
      );

      await registrarTransaccion(
        {
          type: "EGRESO",
          amount: 3,
          concept: "Compra de leche",
          paymentMethod: "EFECTIVO",
        },
        80
      );

      expect(set).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          totalIncome: 0,
          totalExpense: 3,
          netProfit: -3,
          totalSales: 0,
        }),
        { merge: true }
      );
    });
  });

  describe("registrarIngresoPorOrden", () => {
    it("registra ingreso automático si la orden no está en finanzas", async () => {
      const set = vi.fn();
      const update = vi.fn();
      const datosOrden = {
        numero: 12,
        totalUSD: 4.5,
        bcvRate: 80,
        estado: "entregada",
        items: [],
        createdAt: "2026-08-13T10:00:00",
        updatedAt: "2026-08-13T10:00:00",
      };
      mockearLecturaOrden(datosOrden);
      firestoreMock.runTransaction.mockImplementation(
        async (_db: unknown, callback: (tx: unknown) => Promise<void>) => {
          await callback({
            get: vi.fn().mockImplementation((ref: { id?: string }) => {
              if (ref.id === "orden_1") {
                return {
                  data: () => datosOrden,
                };
              }
              return { data: () => null };
            }),
            set,
            update,
          });
        }
      );

      await registrarIngresoPorOrden("orden_1", 4.5, "Venta orden #12");

      expect(transaccionEscrita(set)).toBeTruthy();
      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({ id: "orden_1" }),
        { registradoEnFinanzas: true }
      );
    });

    it("no registra dos veces si ya estaba registrada", async () => {
      const set = vi.fn();
      const update = vi.fn();
      const datosOrden = {
        numero: 13,
        totalUSD: 3,
        bcvRate: 80,
        estado: "entregada",
        registradoEnFinanzas: true,
      };
      mockearLecturaOrden(datosOrden);
      firestoreMock.runTransaction.mockImplementation(
        async (_db: unknown, callback: (tx: unknown) => Promise<void>) => {
          await callback({
            get: vi.fn().mockResolvedValue({
              data: () => datosOrden,
            }),
            set,
            update,
          });
        }
      );

      await registrarIngresoPorOrden("orden_2", 3, "Venta orden #13");

      expect(set).not.toHaveBeenCalled();
      expect(update).not.toHaveBeenCalled();
    });

    it("usa el método de pago del cliente en la transacción", async () => {
      const set = vi.fn();
      const update = vi.fn();
      const datosOrden = {
        numero: 12,
        totalUSD: 4.5,
        bcvRate: 80,
        estado: "entregada",
        metodoPago: "PAGO_MOVIL",
        items: [],
        createdAt: "2026-08-13T10:00:00",
        updatedAt: "2026-08-13T10:00:00",
      };
      mockearLecturaOrden(datosOrden);
      firestoreMock.runTransaction.mockImplementation(
        async (_db: unknown, callback: (tx: unknown) => Promise<void>) => {
          await callback({
            get: vi.fn().mockImplementation((ref: { id?: string }) => {
              if (ref.id === "orden_1") {
                return {
                  data: () => datosOrden,
                };
              }
              return { data: () => null };
            }),
            set,
            update,
          });
        }
      );

      await registrarIngresoPorOrden("orden_1", 4.5, "Venta orden #12");

      expect(transaccionEscrita(set).paymentMethod).toBe("PAGO_MOVIL");
    });

    it("calcula la ganancia real con el costo del catálogo al registrar la orden", async () => {
      const set = vi.fn();
      const update = vi.fn();
      const datosOrden = {
        numero: 12,
        totalUSD: 9,
        bcvRate: 80,
        estado: "entregada",
        items: [
          {
            productId: "prod_1",
            nombre: "Café Mocca",
            precio: 4.5,
            cantidad: 2,
            subtotal: 9,
          },
        ],
        createdAt: "2026-08-13T10:00:00",
        updatedAt: "2026-08-13T10:00:00",
      };
      mockearLecturaOrden(datosOrden);
      firestoreMock.runTransaction.mockImplementation(
        async (_db: unknown, callback: (tx: unknown) => Promise<void>) => {
          await callback({
            get: vi.fn().mockImplementation((ref: { id?: string }) => {
              if (ref.id === "orden_1") {
                return {
                  data: () => datosOrden,
                };
              }
              if (ref.id === "prod_1") {
                return { data: () => ({ costo: 3.5 }) };
              }
              return { data: () => null };
            }),
            set,
            update,
          });
        }
      );

      await registrarIngresoPorOrden("orden_1", 9, "Venta orden #12");

      const transaccion = transaccionEscrita(set);
      expect(transaccion.ganancia).toBe(2);
      expect((transaccion.items as Record<string, unknown>[])[0]).toMatchObject({
        productId: "prod_1",
        nombre: "Café Mocca",
        precioVenta: 4.5,
        costo: 3.5,
        cantidad: 2,
      });
    });

    it("calcula la ganancia de ofertas de promociones y proteína con su costo", async () => {
      const set = vi.fn();
      const update = vi.fn();
      const datosOrden = {
        numero: 12,
        totalUSD: 5,
        bcvRate: 80,
        estado: "entregada",
        items: [
          {
            productId: "promo-happy_hours-2-merengadas",
            nombre: "2 Merengadas",
            precio: 4.5,
            cantidad: 1,
            subtotal: 4.5,
          },
          {
            productId: "promo-tarde_de_poder-proteina-extra",
            nombre: "Proteína extra",
            precio: 0.5,
            cantidad: 1,
            subtotal: 0.5,
          },
        ],
        createdAt: "2026-08-13T10:00:00",
        updatedAt: "2026-08-13T10:00:00",
      };
      mockearLecturaOrden(datosOrden);
      firestoreMock.runTransaction.mockImplementation(
        async (_db: unknown, callback: (tx: unknown) => Promise<void>) => {
          await callback({
            get: vi.fn().mockImplementation((ref: { id?: string }) => {
              if (ref.id === "orden_1") {
                return {
                  data: () => datosOrden,
                };
              }
              if (ref.id === "happy_hours") {
                return {
                  data: () => ({
                    ofertas: [
                      { nombre: "2 Merengadas", precio: 4.5, costo: 3.5 },
                    ],
                  }),
                };
              }
              if (ref.id === "tarde_de_poder") {
                return {
                  data: () => ({
                    ofertas: [
                      {
                        nombre: "Proteína extra",
                        precio: 0.5,
                        costo: 0.25,
                        esProteina: true,
                      },
                    ],
                  }),
                };
              }
              return { data: () => null };
            }),
            set,
            update,
          });
        }
      );

      await registrarIngresoPorOrden("orden_1", 5, "Venta orden #12");

      const transaccion = transaccionEscrita(set);
      expect(transaccion.ganancia).toBe(1.25);
      const items = transaccion.items as Record<string, unknown>[];
      expect(items[0]).toMatchObject({
        productId: "promo-happy_hours-2-merengadas",
        precioVenta: 4.5,
        costo: 3.5,
      });
      expect(items[1]).toMatchObject({
        productId: "promo-tarde_de_poder-proteina-extra",
        precioVenta: 0.5,
        costo: 0.25,
      });
    });

    it("usa la tasaBCV real de la orden para amountBs y bcvRate", async () => {
      const set = vi.fn();
      const update = vi.fn();
      const datosOrden = {
        numero: 14,
        totalUSD: 4.5,
        tasaBCV: 80,
        estado: "entregada",
        items: [],
        createdAt: "2026-08-13T10:00:00",
        updatedAt: "2026-08-13T10:00:00",
      };
      mockearLecturaOrden(datosOrden);
      firestoreMock.runTransaction.mockImplementation(
        async (_db: unknown, callback: (tx: unknown) => Promise<void>) => {
          await callback({
            get: vi.fn().mockImplementation((ref: { id?: string }) => {
              if (ref.id === "orden_1") {
                return { data: () => datosOrden };
              }
              return { data: () => null };
            }),
            set,
            update,
          });
        }
      );

      await registrarIngresoPorOrden("orden_1", 4.5, "Venta orden #14");

      const transaccion = transaccionEscrita(set);
      expect(transaccion.amountBs).toBe(360);
      expect(transaccion.bcvRate).toBe(80);
    });

    it("usa la tasa BCV actual cuando la orden no trae tasa", async () => {
      const set = vi.fn();
      const update = vi.fn();
      const datosOrden = {
        numero: 15,
        totalUSD: 4.5,
        estado: "entregada",
        items: [],
        createdAt: "2026-08-13T10:00:00",
        updatedAt: "2026-08-13T10:00:00",
      };
      obtenerTasaBCVMock.mockResolvedValue({
        promedio: 90,
        fechaActualizacion: "2026-08-16",
        moneda: "Bolívar",
        codigo: "VES",
      });
      mockearLecturaOrden(datosOrden);
      firestoreMock.runTransaction.mockImplementation(
        async (_db: unknown, callback: (tx: unknown) => Promise<void>) => {
          await callback({
            get: vi.fn().mockImplementation((ref: { id?: string }) => {
              if (ref.id === "orden_1") {
                return { data: () => datosOrden };
              }
              return { data: () => null };
            }),
            set,
            update,
          });
        }
      );

      await registrarIngresoPorOrden("orden_1", 4.5, "Venta orden #15");

      expect(obtenerTasaBCVMock).toHaveBeenCalledTimes(1);
      const transaccion = transaccionEscrita(set);
      expect(transaccion.amountBs).toBe(405);
      expect(transaccion.bcvRate).toBe(90);
    });
  });

  describe("registrarVenta", () => {
    it("registra la venta con items, ganancia real y actualiza el resumen del día", async () => {
      const set = vi.fn();
      firestoreMock.runTransaction.mockImplementation(
        async (_db: unknown, callback: (tx: unknown) => Promise<void>) => {
          await callback({
            get: vi.fn().mockResolvedValue({ data: () => null }),
            set,
          });
        }
      );

      const resultado = await registrarVenta(
        {
          customerName: "María",
          items: [
            {
              productId: "prod_1",
              nombre: "Café Mocca",
              precioVenta: 4.5,
              costo: 3.5,
              cantidad: 2,
              subtotal: 9,
            },
          ],
          amount: 9,
          paymentMethod: "PUNTO",
        },
        80
      );

      expect(firestoreMock.runTransaction).toHaveBeenCalledTimes(1);
      expect(set).toHaveBeenCalledWith(expect.anything(), {
        type: "INGRESO",
        amount: 9,
        amountBs: 720,
        bcvRate: 80,
        concept: "Venta directa - María",
        paymentMethod: "PUNTO",
        date: expect.any(String),
        createdBy: "admin",
        customerName: "María",
        ganancia: 2,
        items: [
          {
            productId: "prod_1",
            nombre: "Café Mocca",
            precioVenta: 4.5,
            costo: 3.5,
            cantidad: 2,
            subtotal: 9,
          },
        ],
      });
      expect(resultado.ganancia).toBe(2);
    });
  });

  describe("obtenerTransacciones y obtenerResumenDiario", () => {
    it("devuelve las transacciones mapeadas", async () => {
      firestoreMock.getDocs.mockResolvedValue({
        docs: [
          {
            id: "tx_1",
            data: () => ({
              type: "EGRESO",
              amount: 2,
              amountBs: 160,
              bcvRate: 80,
              concept: "Compra leche",
              paymentMethod: "EFECTIVO",
              date: "2026-08-13T09:00:00",
              createdBy: "admin",
            }),
          },
        ],
      });

      const transacciones = await obtenerTransacciones();
      expect(transacciones).toHaveLength(1);
      expect(transacciones[0].amount).toBe(2);
      expect(firestoreMock.query).toHaveBeenCalled();
    });

    it("devuelve null si no existe resumen del día", async () => {
      firestoreMock.getDocs.mockResolvedValue({ docs: [] });
      const resumen = await obtenerResumenDiario("2026-08-13");
      expect(resumen).toBeNull();
    });
  });
});
