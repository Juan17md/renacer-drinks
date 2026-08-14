import { describe, it, expect, vi, beforeEach } from "vitest";

const { firestoreMock } = vi.hoisted(() => ({
  firestoreMock: {
    collection: vi.fn(),
    addDoc: vi.fn(),
    getDocs: vi.fn(),
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
vi.mock("@/lib/utils", () => ({
  obtenerFechaLocalISO: () => "2026-08-13",
}));

import {
  registrarTransaccion,
  registrarIngresoPorOrden,
  registrarVenta,
  obtenerTransacciones,
  obtenerResumenDiario,
} from "@/services/transactions";

describe("services/transactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    firestoreMock.collection.mockReturnValue("coleccion");
    firestoreMock.query.mockReturnValue("consulta");
    firestoreMock.orderBy.mockReturnValue("ordenado");
    firestoreMock.limit.mockReturnValue("limitado");
    firestoreMock.doc.mockImplementation((_db, nombre, id) => ({ nombre, id }));
    firestoreMock.addDoc.mockResolvedValue({ id: "tx_1" });
    firestoreMock.getDocs.mockResolvedValue({ docs: [] });
    firestoreMock.updateDoc.mockResolvedValue(undefined);
  });

  describe("registrarTransaccion", () => {
    it("guarda la transacción con conversión BCV y actualiza el resumen diario", async () => {
      firestoreMock.runTransaction.mockImplementation(async (_db, callback) => {
        await callback({
          get: vi.fn().mockResolvedValue({ data: () => null }),
          set: vi.fn(),
        });
        return undefined;
      });

      const resultado = await registrarTransaccion(
        {
          type: "INGRESO",
          amount: 5,
          concept: "Venta directa",
          paymentMethod: "EFECTIVO",
        },
        80
      );

      expect(firestoreMock.addDoc).toHaveBeenCalledWith("coleccion", {
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
      expect(firestoreMock.runTransaction).toHaveBeenCalled();
      expect(resultado.id).toBe("tx_1");
      expect(resultado.amountBs).toBe(400);
    });
  });

  describe("registrarIngresoPorOrden", () => {
    it("registra ingreso automático si la orden no está en finanzas", async () => {
      const set = vi.fn();
      const update = vi.fn();
      firestoreMock.runTransaction.mockImplementation(async (_db, callback) => {
        await callback({
          get: vi.fn().mockImplementation((ref) => {
            if (ref.id === "orden_1") {
              return {
                data: () => ({
                  numero: 12,
                  totalUSD: 4.5,
                  bcvRate: 80,
                  estado: "entregada",
                  items: [],
                  createdAt: "2026-08-13T10:00:00",
                  updatedAt: "2026-08-13T10:00:00",
                }),
              };
            }
            if (ref.id === "2026-08-13") {
              return { data: () => null };
            }
            return { data: () => null };
          }),
          set,
          update,
        });
        return undefined;
      });

      await registrarIngresoPorOrden("orden_1", 4.5, "Venta orden #12");

      expect(set).toHaveBeenCalled();
      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({ id: "orden_1" }),
        { registradoEnFinanzas: true }
      );
    });

    it("no registra dos veces si ya estaba registrada", async () => {
      const set = vi.fn();
      const update = vi.fn();
      firestoreMock.runTransaction.mockImplementation(async (_db, callback) => {
        await callback({
          get: vi.fn().mockResolvedValue({
            data: () => ({
              numero: 13,
              totalUSD: 3,
              bcvRate: 80,
              estado: "entregada",
              registradoEnFinanzas: true,
            }),
          }),
          set,
          update,
        });
        return undefined;
      });

      await registrarIngresoPorOrden("orden_2", 3, "Venta orden #13");

      expect(set).not.toHaveBeenCalled();
      expect(update).not.toHaveBeenCalled();
    });

    it("usa el método de pago del cliente en la transacción", async () => {
      const set = vi.fn();
      const update = vi.fn();
      firestoreMock.runTransaction.mockImplementation(async (_db, callback) => {
        await callback({
          get: vi.fn().mockImplementation((ref) => {
            if (ref.id === "orden_1") {
              return {
                data: () => ({
                  numero: 12,
                  totalUSD: 4.5,
                  bcvRate: 80,
                  estado: "entregada",
                  metodoPago: "PAGO_MOVIL",
                  items: [],
                  createdAt: "2026-08-13T10:00:00",
                  updatedAt: "2026-08-13T10:00:00",
                }),
              };
            }
            return { data: () => null };
          }),
          set,
          update,
        });
        return undefined;
      });

      await registrarIngresoPorOrden("orden_1", 4.5, "Venta orden #12");

      const llamadaSet = set.mock.calls[0];
      expect(llamadaSet[1].paymentMethod).toBe("PAGO_MOVIL");
    });

    it("calcula la ganancia real con el costo del catálogo al registrar la orden", async () => {
      const set = vi.fn();
      const update = vi.fn();
      firestoreMock.runTransaction.mockImplementation(async (_db, callback) => {
        await callback({
          get: vi.fn().mockImplementation((ref) => {
            if (ref.id === "orden_1") {
              return {
                data: () => ({
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
                }),
              };
            }
            return { data: () => null };
          }),
          set,
          update,
        });
        return undefined;
      });

      firestoreMock.collection.mockImplementation((_db, nombre) => nombre);
      firestoreMock.getDocs.mockResolvedValue({
        docs: [
          {
            id: "prod_1",
            data: () => ({ costo: 3.5 }),
          },
        ],
      });

      await registrarIngresoPorOrden("orden_1", 9, "Venta orden #12");

      const llamadaSet = set.mock.calls[0];
      const transaccion = llamadaSet[1];
      expect(transaccion.ganancia).toBe(2);
      expect(transaccion.items[0]).toMatchObject({
        productId: "prod_1",
        nombre: "Café Mocca",
        precioVenta: 4.5,
        costo: 3.5,
        cantidad: 2,
      });
    });
  });

  describe("registrarVenta", () => {
    it("registra la venta con items, ganancia real y actualiza el resumen del día", async () => {
      firestoreMock.runTransaction.mockImplementation(async (_db, callback) => {
        await callback({
          get: vi.fn().mockResolvedValue({ data: () => null }),
          set: vi.fn(),
        });
        return undefined;
      });

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

      expect(firestoreMock.addDoc).toHaveBeenCalledWith("coleccion", {
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
