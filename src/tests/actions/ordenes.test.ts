import { describe, it, expect, vi, beforeEach } from "vitest";
import { eliminarOrden } from "@/actions/ordenes";

const mocksAdmin = vi.hoisted(() => ({
  getAdminFirestore: vi.fn(),
  getAdminAuth: vi.fn(),
  captureException: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@sentry/nextjs", () => ({
  captureException: mocksAdmin.captureException,
}));

vi.mock("next/cache", () => ({
  revalidatePath: mocksAdmin.revalidatePath,
}));

vi.mock("@/lib/firebaseAdmin", () => ({
  getAdminFirestore: mocksAdmin.getAdminFirestore,
  getAdminAuth: mocksAdmin.getAdminAuth,
}));

function configurarDb() {
  const deleteMock = vi.fn();
  const updateMock = vi.fn();
  const commitMock = vi.fn().mockResolvedValue(undefined);
  const batchMock = vi.fn(() => ({
    delete: deleteMock,
    update: updateMock,
    commit: commitMock,
  }));
  const docMock = vi.fn((ruta: string) => {
    const esResumen = ruta.startsWith("daily_summaries/");
    const get = vi.fn().mockResolvedValue(
      esResumen
        ? { exists: true, data: () => ({ totalIncome: 100, totalProfit: 20 }) }
        : { exists: true, data: () => ({ rol: "admin" }) }
    );
    return { ruta, get };
  });
  const transaccionesMock = vi.fn().mockResolvedValue({
    docs: [
      {
        ref: { ruta: "financial_transactions/transaccion-1" },
        data: () => ({
          date: "2026-08-16T10:30:00",
          amount: 6,
          ganancia: 2,
        }),
      },
      {
        ref: { ruta: "financial_transactions/transaccion-2" },
        data: () => ({
          date: "2026-08-15T18:00:00",
          amount: 3,
          ganancia: 1,
        }),
      },
    ],
  });
  const collectionMock = vi.fn(() => ({
    where: vi.fn(() => ({ get: transaccionesMock })),
  }));
  mocksAdmin.getAdminFirestore.mockReturnValue({
    doc: docMock,
    batch: batchMock,
    collection: collectionMock,
  });
  return {
    deleteMock,
    updateMock,
    commitMock,
    docMock,
    collectionMock,
  };
}

function configurarAuth(rol: string | null, existe: boolean) {
  mocksAdmin.getAdminAuth.mockReturnValue({
    verifyIdToken: vi.fn().mockResolvedValue({ uid: "uid-123" }),
  });
  mocksAdmin.getAdminFirestore.mockReturnValue({
    doc: vi.fn(() => ({
      get: vi
        .fn()
        .mockResolvedValue({ exists: existe, data: () => (rol ? { rol } : null) }),
    })),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("eliminarOrden", () => {
  it("rechaza la solicitud sin id o sin token", async () => {
    const resultado = await eliminarOrden("", "");
    expect(resultado).toEqual({
      ok: false,
      error: "No se pudo verificar tu sesión. Vuelve a iniciar sesión.",
    });
    expect(mocksAdmin.getAdminAuth).not.toHaveBeenCalled();
  });

  it("rechaza la solicitud si el token no es válido", async () => {
    mocksAdmin.getAdminAuth.mockReturnValue({
      verifyIdToken: vi.fn().mockRejectedValue(new Error("token inválido")),
    });

    const resultado = await eliminarOrden("orden-1", "token-invalido");

    expect(resultado).toEqual({ ok: false, error: "No se pudo eliminar la orden" });
    expect(mocksAdmin.captureException).toHaveBeenCalled();
  });

  it("rechaza la eliminación si el usuario no es admin", async () => {
    configurarAuth("operador", true);

    const resultado = await eliminarOrden("orden-1", "token-operador");

    expect(resultado).toEqual({
      ok: false,
      error: "Solo el administrador puede eliminar órdenes.",
    });
  });

  it("rechaza la eliminación si el usuario no tiene documento de rol", async () => {
    configurarAuth(null, false);

    const resultado = await eliminarOrden("orden-1", "token-operador");

    expect(resultado).toEqual({
      ok: false,
      error: "Solo el administrador puede eliminar órdenes.",
    });
  });

  it("elimina la orden, sus transacciones y descuenta el resumen de cada día", async () => {
    const { deleteMock, updateMock, commitMock, docMock } = configurarDb();

    const resultado = await eliminarOrden("orden-1", "token-admin");

    expect(resultado).toEqual({ ok: true });
    expect(docMock).toHaveBeenCalledWith("usuarios/uid-123");
    expect(docMock).toHaveBeenCalledWith("daily_summaries/2026-08-16");
    expect(docMock).toHaveBeenCalledWith("daily_summaries/2026-08-15");

    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ ruta: "daily_summaries/2026-08-16" }),
      expect.objectContaining({
        totalIncome: expect.objectContaining({ operand: -6 }),
        totalProfit: expect.objectContaining({ operand: -2 }),
        totalSales: expect.objectContaining({ operand: -1 }),
        netProfit: expect.objectContaining({ operand: -6 }),
      })
    );
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ ruta: "daily_summaries/2026-08-15" }),
      expect.objectContaining({
        totalIncome: expect.objectContaining({ operand: -3 }),
        totalProfit: expect.objectContaining({ operand: -1 }),
        totalSales: expect.objectContaining({ operand: -1 }),
        netProfit: expect.objectContaining({ operand: -3 }),
      })
    );

    expect(deleteMock).toHaveBeenCalledWith(
      expect.objectContaining({ ruta: "ordenes/orden-1" })
    );
    expect(deleteMock).toHaveBeenCalledWith(
      expect.objectContaining({ ruta: "financial_transactions/transaccion-1" })
    );
    expect(deleteMock).toHaveBeenCalledWith(
      expect.objectContaining({ ruta: "financial_transactions/transaccion-2" })
    );
    expect(commitMock).toHaveBeenCalled();
    expect(mocksAdmin.revalidatePath).toHaveBeenCalledWith("/admin/ordenes");
  });

  it("no descuenta el resumen si el documento del día no existe", async () => {
    const { deleteMock, updateMock, collectionMock } = configurarDb();
    collectionMock.mockReturnValue({
      where: vi.fn(() => ({
        get: vi.fn().mockResolvedValue({
          docs: [
            {
              ref: { ruta: "financial_transactions/transaccion-1" },
              data: () => ({ date: "2026-08-16T10:30:00", amount: 6, ganancia: 2 }),
            },
          ],
        }),
      })),
    });
    mocksAdmin.getAdminFirestore.mockReturnValue({
      doc: vi.fn((ruta: string) => ({
        ruta,
        get: vi.fn().mockResolvedValue(
          ruta.startsWith("daily_summaries/")
            ? { exists: false, data: () => null }
            : { exists: true, data: () => ({ rol: "admin" }) }
        ),
      })),
      batch: vi.fn(() => ({ delete: deleteMock, update: updateMock, commit: vi.fn() })),
      collection: collectionMock,
    });

    const resultado = await eliminarOrden("orden-1", "token-admin");

    expect(resultado).toEqual({ ok: true });
    expect(updateMock).not.toHaveBeenCalled();
    expect(deleteMock).toHaveBeenCalledWith(
      expect.objectContaining({ ruta: "ordenes/orden-1" })
    );
  });

  it("no descuenta el resumen si la transacción no tiene fecha", async () => {
    const { updateMock, collectionMock } = configurarDb();
    collectionMock.mockReturnValue({
      where: vi.fn(() => ({
        get: vi.fn().mockResolvedValue({
          docs: [
            {
              ref: { ruta: "financial_transactions/transaccion-1" },
              data: () => ({ amount: 6, ganancia: 2 }),
            },
          ],
        }),
      })),
    });

    const resultado = await eliminarOrden("orden-1", "token-admin");

    expect(resultado).toEqual({ ok: true });
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("elimina la orden aunque no tenga transacciones vinculadas", async () => {
    const { deleteMock, commitMock, collectionMock } = configurarDb();
    collectionMock.mockReturnValue({
      where: vi.fn(() => ({
        get: vi.fn().mockResolvedValue({ docs: [] }),
      })),
    });

    const resultado = await eliminarOrden("orden-1", "token-admin");

    expect(resultado).toEqual({ ok: true });
    expect(deleteMock).toHaveBeenCalledWith(
      expect.objectContaining({ ruta: "ordenes/orden-1" })
    );
    expect(commitMock).toHaveBeenCalled();
  });

  it("devuelve error si falla Firestore", async () => {
    mocksAdmin.getAdminFirestore.mockReturnValue({
      doc: vi.fn(() => ({
        get: vi.fn().mockRejectedValue(new Error("firestore caído")),
      })),
    });

    const resultado = await eliminarOrden("orden-1", "token-admin");

    expect(resultado).toEqual({ ok: false, error: "No se pudo eliminar la orden" });
    expect(mocksAdmin.captureException).toHaveBeenCalled();
  });
});