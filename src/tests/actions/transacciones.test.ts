import { describe, it, expect, vi, beforeEach } from "vitest";
import { eliminarTransaccion } from "@/actions/transacciones";

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

function configurarDb(transaccion?: {
  type?: string;
  amount?: number;
  ganancia?: number;
  date?: string;
  ordenId?: string;
  existe?: boolean;
}) {
  const deleteMock = vi.fn();
  const updateMock = vi.fn();
  const commitMock = vi.fn().mockResolvedValue(undefined);
  const batchMock = vi.fn(() => ({
    delete: deleteMock,
    update: updateMock,
    commit: commitMock,
  }));
  const docMock = vi.fn((ruta: string) => {
    const esUsuario = ruta.startsWith("usuarios/");
    const esResumen = ruta.startsWith("daily_summaries/");
    const esTransaccion = ruta.startsWith("financial_transactions/");
    const get = vi.fn().mockResolvedValue(
      esUsuario
        ? { exists: true, data: () => ({ rol: "admin" }) }
        : esResumen
          ? { exists: true, data: () => ({ totalIncome: 100, totalProfit: 20 }) }
          : esTransaccion
            ? {
                exists: transaccion?.existe ?? true,
                data: () => transaccion,
              }
            : { exists: true, data: () => ({}) }
    );
    return { ruta, get };
  });
  mocksAdmin.getAdminFirestore.mockReturnValue({
    doc: docMock,
    batch: batchMock,
  });
  return { deleteMock, updateMock, commitMock, docMock };
}

function configurarAuth() {
  mocksAdmin.getAdminAuth.mockReturnValue({
    verifyIdToken: vi.fn().mockResolvedValue({ uid: "uid-123" }),
  });
}

const TRANSACCION_INGRESO = {
  type: "INGRESO",
  amount: 6,
  ganancia: 2,
  date: "2026-08-16T10:30:00",
};

beforeEach(() => {
  vi.clearAllMocks();
  configurarAuth();
});

describe("eliminarTransaccion", () => {
  it("rechaza la solicitud sin id o sin token", async () => {
    const resultado = await eliminarTransaccion("", "");
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

    const resultado = await eliminarTransaccion("tx-1", "token-invalido");

    expect(resultado).toEqual({
      ok: false,
      error: "No se pudo eliminar la operación",
    });
    expect(mocksAdmin.captureException).toHaveBeenCalled();
  });

  it("rechaza la eliminación si el usuario no es admin", async () => {
    mocksAdmin.getAdminFirestore.mockReturnValue({
      doc: vi.fn(() => ({
        get: vi.fn().mockResolvedValue({
          exists: true,
          data: () => ({ rol: "operador" }),
        }),
      })),
    });

    const resultado = await eliminarTransaccion("tx-1", "token-operador");

    expect(resultado).toEqual({
      ok: false,
      error: "Solo el administrador puede eliminar operaciones.",
    });
  });

  it("rechaza la eliminación si el usuario no tiene documento de rol", async () => {
    mocksAdmin.getAdminFirestore.mockReturnValue({
      doc: vi.fn(() => ({
        get: vi.fn().mockResolvedValue({ exists: false, data: () => null }),
      })),
    });

    const resultado = await eliminarTransaccion("tx-1", "token-operador");

    expect(resultado).toEqual({
      ok: false,
      error: "Solo el administrador puede eliminar operaciones.",
    });
  });

  it("rechaza la eliminación si la transacción no existe", async () => {
    configurarDb({ existe: false });

    const resultado = await eliminarTransaccion("tx-1", "token-admin");

    expect(resultado).toEqual({
      ok: false,
      error: "La operación no existe o ya fue eliminada.",
    });
  });

  it("elimina un ingreso y descuenta el resumen diario", async () => {
    const { deleteMock, updateMock, commitMock, docMock } = configurarDb(
      TRANSACCION_INGRESO
    );

    const resultado = await eliminarTransaccion("tx-1", "token-admin");

    expect(resultado).toEqual({ ok: true });
    expect(docMock).toHaveBeenCalledWith("usuarios/uid-123");
    expect(docMock).toHaveBeenCalledWith("financial_transactions/tx-1");
    expect(docMock).toHaveBeenCalledWith("daily_summaries/2026-08-16");
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ ruta: "daily_summaries/2026-08-16" }),
      expect.objectContaining({
        totalIncome: expect.objectContaining({ operand: -6 }),
        totalProfit: expect.objectContaining({ operand: -2 }),
        totalSales: expect.objectContaining({ operand: -1 }),
        netProfit: expect.objectContaining({ operand: -6 }),
      })
    );
    expect(deleteMock).toHaveBeenCalledWith(
      expect.objectContaining({ ruta: "financial_transactions/tx-1" })
    );
    expect(commitMock).toHaveBeenCalled();
    expect(mocksAdmin.revalidatePath).toHaveBeenCalledWith("/admin/finanzas");
  });

  it("elimina un egreso y descuenta el gasto del resumen diario", async () => {
    const { updateMock } = configurarDb({
      type: "EGRESO",
      amount: 3,
      ganancia: 0,
      date: "2026-08-15T18:00:00",
    });

    const resultado = await eliminarTransaccion("tx-2", "token-admin");

    expect(resultado).toEqual({ ok: true });
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ ruta: "daily_summaries/2026-08-15" }),
      expect.objectContaining({
        totalExpense: expect.objectContaining({ operand: -3 }),
        netProfit: expect.objectContaining({ operand: 3 }),
      })
    );
    expect(updateMock).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ totalIncome: expect.anything() })
    );
  });

  it("marca la orden vinculada como no registrada en finanzas", async () => {
    const { updateMock } = configurarDb({
      ...TRANSACCION_INGRESO,
      ordenId: "orden-1",
    });

    const resultado = await eliminarTransaccion("tx-1", "token-admin");

    expect(resultado).toEqual({ ok: true });
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ ruta: "ordenes/orden-1" }),
      { registradoEnFinanzas: false }
    );
  });

  it("no descuenta el resumen si el documento del día no existe", async () => {
    mocksAdmin.getAdminFirestore.mockReturnValue({
      doc: vi.fn((ruta: string) => ({
        ruta,
        get: vi.fn().mockResolvedValue(
          ruta.startsWith("daily_summaries/")
            ? { exists: false, data: () => null }
            : ruta.startsWith("usuarios/")
              ? { exists: true, data: () => ({ rol: "admin" }) }
              : {
                  exists: true,
                  data: () => TRANSACCION_INGRESO,
                }
        ),
      })),
      batch: vi.fn(() => ({
        delete: vi.fn(),
        update: vi.fn(),
        commit: vi.fn().mockResolvedValue(undefined),
      })),
    });

    const resultado = await eliminarTransaccion("tx-1", "token-admin");

    expect(resultado).toEqual({ ok: true });
  });

  it("elimina la transacción sin fecha sin tocar el resumen", async () => {
    const { deleteMock, updateMock } = configurarDb({
      type: "INGRESO",
      amount: 6,
      ganancia: 2,
    });

    const resultado = await eliminarTransaccion("tx-1", "token-admin");

    expect(resultado).toEqual({ ok: true });
    expect(updateMock).not.toHaveBeenCalled();
    expect(deleteMock).toHaveBeenCalledWith(
      expect.objectContaining({ ruta: "financial_transactions/tx-1" })
    );
  });

  it("devuelve error si falla Firestore", async () => {
    mocksAdmin.getAdminFirestore.mockReturnValue({
      doc: vi.fn(() => ({
        get: vi.fn().mockRejectedValue(new Error("firestore caído")),
      })),
    });

    const resultado = await eliminarTransaccion("tx-1", "token-admin");

    expect(resultado).toEqual({
      ok: false,
      error: "No se pudo eliminar la operación",
    });
    expect(mocksAdmin.captureException).toHaveBeenCalled();
  });
});