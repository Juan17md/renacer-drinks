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
  const deleteOrdenMock = vi.fn();
  const deleteTransaccionMock = vi.fn();
  const commitMock = vi.fn().mockResolvedValue(undefined);
  const batchMock = vi.fn(() => ({
    delete: vi.fn((ref: { ruta: string }) => {
      if (ref.ruta.startsWith("ordenes/")) deleteOrdenMock(ref.ruta);
      else deleteTransaccionMock(ref.ruta);
    }),
    commit: commitMock,
  }));
  const getMock = vi
    .fn()
    .mockResolvedValue({ exists: true, data: () => ({ rol: "admin" }) });
  const docMock = vi.fn((ruta: string) => ({ ruta, get: getMock }));
  const transaccionesMock = vi.fn().mockResolvedValue({
    forEach: (callback: (transaccion: { ref: { ruta: string } }) => void) => {
      callback({ ref: { ruta: "financial_transactions/transaccion-1" } });
      callback({ ref: { ruta: "financial_transactions/transaccion-2" } });
    },
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
    deleteOrdenMock,
    deleteTransaccionMock,
    commitMock,
    getMock,
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

  it("elimina la orden y sus transacciones financieras vinculadas", async () => {
    const { deleteOrdenMock, deleteTransaccionMock, commitMock, docMock } =
      configurarDb();

    const resultado = await eliminarOrden("orden-1", "token-admin");

    expect(resultado).toEqual({ ok: true });
    expect(docMock).toHaveBeenCalledWith("usuarios/uid-123");
    expect(deleteOrdenMock).toHaveBeenCalledWith("ordenes/orden-1");
    expect(deleteTransaccionMock).toHaveBeenCalledWith(
      "financial_transactions/transaccion-1"
    );
    expect(deleteTransaccionMock).toHaveBeenCalledWith(
      "financial_transactions/transaccion-2"
    );
    expect(commitMock).toHaveBeenCalled();
    expect(mocksAdmin.revalidatePath).toHaveBeenCalledWith("/admin/ordenes");
  });

  it("elimina la orden aunque no tenga transacciones vinculadas", async () => {
    const { deleteOrdenMock, deleteTransaccionMock, commitMock, collectionMock } =
      configurarDb();
    collectionMock.mockReturnValue({
      where: vi.fn(() => ({
        get: vi.fn().mockResolvedValue({ forEach: () => undefined }),
      })),
    });

    const resultado = await eliminarOrden("orden-1", "token-admin");

    expect(resultado).toEqual({ ok: true });
    expect(deleteOrdenMock).toHaveBeenCalledWith("ordenes/orden-1");
    expect(deleteTransaccionMock).not.toHaveBeenCalled();
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