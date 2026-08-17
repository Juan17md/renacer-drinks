import { describe, it, expect, vi, beforeEach } from "vitest";
import { crearUsuario } from "@/actions/usuarios";

const mocksAdmin = vi.hoisted(() => ({
  getAdminFirestore: vi.fn(),
  createUser: vi.fn(),
  captureException: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@sentry/nextjs", () => ({
  captureException: mocksAdmin.captureException,
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("firebase-admin/auth", () => ({
  getAuth: () => ({ createUser: mocksAdmin.createUser }),
}));

vi.mock("@/lib/firebaseAdmin", () => ({
  getAdminFirestore: mocksAdmin.getAdminFirestore,
}));

function configurarDb() {
  const setMock = vi.fn().mockResolvedValue(undefined);
  const docMock = vi.fn(() => ({ set: setMock }));
  mocksAdmin.getAdminFirestore.mockReturnValue({
    collection: () => ({ doc: docMock }),
  });
  return { setMock, docMock };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("crearUsuario", () => {
  it("crea el usuario en Auth y guarda su documento en Firestore", async () => {
    const { setMock, docMock } = configurarDb();
    mocksAdmin.createUser.mockResolvedValue({
      uid: "uid_nuevo",
    });

    const resultado = await crearUsuario({
      nombre: "Juan Operador",
      email: "  OPERADOR@RENACER.COM ",
      password: "clave123",
      rol: "operador",
    });

    expect(resultado).toEqual({ ok: true, uid: "uid_nuevo" });
    expect(mocksAdmin.createUser).toHaveBeenCalledWith({
      email: "operador@renacer.com",
      password: "clave123",
      displayName: "Juan Operador",
    });
    expect(docMock).toHaveBeenCalledWith("uid_nuevo");
    expect(setMock).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "operador@renacer.com",
        nombre: "Juan Operador",
        rol: "operador",
        bloqueado: false,
      })
    );
  });

  it("informa cuando el correo ya existe", async () => {
    configurarDb();
    mocksAdmin.createUser.mockRejectedValue({
      code: "auth/email-already-exists",
    });

    const resultado = await crearUsuario({
      nombre: "Juan",
      email: "juan@renacer.com",
      password: "clave123",
      rol: "admin",
    });

    expect(resultado).toEqual({
      ok: false,
      error: "Ya existe un usuario con ese correo.",
    });
    expect(mocksAdmin.captureException).toHaveBeenCalled();
  });

  it("informa cuando la contraseña es débil", async () => {
    configurarDb();
    mocksAdmin.createUser.mockRejectedValue({ code: "auth/weak-password" });

    const resultado = await crearUsuario({
      nombre: "Juan",
      email: "juan@renacer.com",
      password: "123",
      rol: "admin",
    });

    expect(resultado).toEqual({
      ok: false,
      error: "La contraseña debe tener al menos 6 caracteres.",
    });
  });

  it("rechaza campos incompletos sin llamar a Auth", async () => {
    configurarDb();

    const resultado = await crearUsuario({
      nombre: "   ",
      email: "",
      password: "",
      rol: "admin",
    });

    expect(resultado).toEqual({ ok: false, error: "Completa todos los campos" });
    expect(mocksAdmin.createUser).not.toHaveBeenCalled();
  });
});