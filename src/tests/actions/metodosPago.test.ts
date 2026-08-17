import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  crearMetodoPago,
  guardarMetodoPago,
  cambiarEstadoMetodoPago,
  eliminarMetodoPago,
  sembrarMetodosPagoPorDefecto,
} from "@/actions/metodosPago";

const mocksAdmin = vi.hoisted(() => ({
  getAdminFirestore: vi.fn(),
  getAdminAuth: vi.fn(),
  captureException: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@sentry/nextjs", () => ({
  captureException: mocksAdmin.captureException,
}));

vi.mock("@/lib/firebaseAdmin", () => ({
  getAdminFirestore: mocksAdmin.getAdminFirestore,
  getAdminAuth: mocksAdmin.getAdminAuth,
}));

vi.mock("@/services/metodosPago", () => ({
  METODOS_PAGO_PREDETERMINADOS: [
    {
      id: "PAGO_MOVIL",
      label: "Pago Móvil",
      activo: true,
      requiereComprobante: true,
      datos: [],
    },
    {
      id: "EFECTIVO",
      label: "Efectivo",
      activo: true,
      requiereComprobante: false,
      datos: [],
    },
  ],
}));

function configurarDb() {
  const setMock = vi.fn().mockResolvedValue(undefined);
  const deleteMock = vi.fn().mockResolvedValue(undefined);
  const getMock = vi.fn().mockResolvedValue({ exists: false, data: () => null });
  const docMock = vi.fn(() => ({
    set: setMock,
    get: getMock,
    delete: deleteMock,
  }));
  const batchSetMock = vi.fn();
  const commitMock = vi.fn().mockResolvedValue(undefined);
  const batchMock = vi.fn(() => ({ set: batchSetMock, commit: commitMock }));
  mocksAdmin.getAdminFirestore.mockReturnValue({
    doc: docMock,
    batch: batchMock,
  });
  return { setMock, deleteMock, getMock, docMock, batchSetMock, commitMock };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("crearMetodoPago", () => {
  it("genera el slug del nombre y crea el documento", async () => {
    const { setMock, getMock, docMock } = configurarDb();

    const resultado = await crearMetodoPago({
      label: "Pago en Bolívares",
      activo: true,
      requiereComprobante: true,
      datos: [{ etiqueta: "Banco", valor: "Banesco" }],
    });

    expect(resultado).toEqual({ ok: true, id: "pago-en-bolivares" });
    expect(docMock).toHaveBeenCalledWith("metodos_pago/pago-en-bolivares");
    expect(getMock).toHaveBeenCalled();
    expect(setMock).toHaveBeenCalledWith({
      label: "Pago en Bolívares",
      activo: true,
      requiereComprobante: true,
      datos: [{ etiqueta: "Banco", valor: "Banesco" }],
    });
  });

  it("rechaza un método cuyo slug ya existe", async () => {
    const { setMock, getMock } = configurarDb();
    getMock.mockResolvedValue({ exists: true, data: () => ({}) });

    const resultado = await crearMetodoPago({
      label: "Pago en Bolívares",
      activo: true,
      requiereComprobante: false,
      datos: [],
    });

    expect(resultado).toEqual({
      ok: false,
      error: "Ya existe un método de pago con ese nombre.",
    });
    expect(setMock).not.toHaveBeenCalled();
  });

  it("valida que el nombre sea obligatorio", async () => {
    const { docMock } = configurarDb();

    const resultado = await crearMetodoPago({
      label: "   ",
      activo: true,
      requiereComprobante: false,
      datos: [],
    });

    expect(resultado).toEqual({
      ok: false,
      error: "El nombre del método es obligatorio.",
    });
    expect(docMock).not.toHaveBeenCalled();
  });
});

describe("guardarMetodoPago", () => {
  it("guarda un método con id personalizado en modo merge", async () => {
    const { setMock } = configurarDb();

    const resultado = await guardarMetodoPago("pago-en-bolivares", {
      label: "Pago en Bolívares",
      activo: false,
      requiereComprobante: false,
      datos: [],
    });

    expect(resultado).toEqual({ ok: true });
    expect(setMock).toHaveBeenCalledWith(
      {
        label: "Pago en Bolívares",
        activo: false,
        requiereComprobante: false,
        datos: [],
      },
      { merge: true }
    );
  });

  it("rechaza ids que no son slugs válidos", async () => {
    const { setMock } = configurarDb();

    const resultado = await guardarMetodoPago("Pago Movil", {
      label: "Pago Móvil",
      activo: true,
      requiereComprobante: true,
      datos: [],
    });

    expect(resultado).toEqual({ ok: false, error: "Método de pago no válido." });
    expect(setMock).not.toHaveBeenCalled();
  });
});

describe("cambiarEstadoMetodoPago", () => {
  it("actualiza solo el estado activo en modo merge", async () => {
    const { setMock } = configurarDb();

    const resultado = await cambiarEstadoMetodoPago("pago-en-bolivares", false);

    expect(resultado).toEqual({ ok: true });
    expect(setMock).toHaveBeenCalledWith({ activo: false }, { merge: true });
  });

  it("rechaza ids que no son slugs válidos", async () => {
    const { setMock } = configurarDb();

    const resultado = await cambiarEstadoMetodoPago("Pago Movil", true);

    expect(resultado).toEqual({ ok: false, error: "Método de pago no válido." });
    expect(setMock).not.toHaveBeenCalled();
  });

  it("devuelve error si falla la escritura", async () => {
    const { setMock } = configurarDb();
    setMock.mockRejectedValue(new Error("sin conexión"));

    const resultado = await cambiarEstadoMetodoPago("efectivo", false);

    expect(resultado.ok).toBe(false);
    expect(mocksAdmin.captureException).toHaveBeenCalled();
  });
});

describe("eliminarMetodoPago", () => {
  it("elimina el método cuando el usuario es admin", async () => {
    const { deleteMock, getMock, docMock } = configurarDb();
    mocksAdmin.getAdminAuth.mockReturnValue({
      verifyIdToken: vi.fn().mockResolvedValue({ uid: "uid_admin" }),
    });
    getMock.mockResolvedValue({
      exists: true,
      data: () => ({ rol: "admin" }),
    });

    const resultado = await eliminarMetodoPago("pago-en-bolivares", "token_123");

    expect(resultado).toEqual({ ok: true });
    expect(mocksAdmin.getAdminAuth).toHaveBeenCalled();
    expect(docMock).toHaveBeenCalledWith("usuarios/uid_admin");
    expect(deleteMock).toHaveBeenCalledWith();
  });

  it("rechaza la eliminación si el usuario no es admin", async () => {
    const { deleteMock, getMock } = configurarDb();
    mocksAdmin.getAdminAuth.mockReturnValue({
      verifyIdToken: vi.fn().mockResolvedValue({ uid: "uid_operador" }),
    });
    getMock.mockResolvedValue({
      exists: true,
      data: () => ({ rol: "operador" }),
    });

    const resultado = await eliminarMetodoPago("pago-en-bolivares", "token_123");

    expect(resultado).toEqual({
      ok: false,
      error: "Solo el administrador puede eliminar métodos de pago.",
    });
    expect(deleteMock).not.toHaveBeenCalled();
  });

  it("rechaza la eliminación si el usuario no tiene documento", async () => {
    const { deleteMock } = configurarDb();
    mocksAdmin.getAdminAuth.mockReturnValue({
      verifyIdToken: vi.fn().mockResolvedValue({ uid: "uid_sin_doc" }),
    });

    const resultado = await eliminarMetodoPago("pago-en-bolivares", "token_123");

    expect(resultado.ok).toBe(false);
    expect(deleteMock).not.toHaveBeenCalled();
  });

  it("rechaza la eliminación sin token de sesión", async () => {
    configurarDb();

    const resultado = await eliminarMetodoPago("pago-en-bolivares", "");

    expect(resultado.ok).toBe(false);
    expect(mocksAdmin.getAdminAuth).not.toHaveBeenCalled();
  });
});

describe("sembrarMetodosPagoPorDefecto", () => {
  it("guarda los métodos por defecto en un batch", async () => {
    const { batchSetMock, commitMock, docMock } = configurarDb();

    const resultado = await sembrarMetodosPagoPorDefecto();

    expect(resultado).toEqual({ ok: true });
    expect(docMock).toHaveBeenCalledWith("metodos_pago/PAGO_MOVIL");
    expect(docMock).toHaveBeenCalledWith("metodos_pago/EFECTIVO");
    expect(batchSetMock).toHaveBeenCalledTimes(2);
    expect(commitMock).toHaveBeenCalled();
  });
});