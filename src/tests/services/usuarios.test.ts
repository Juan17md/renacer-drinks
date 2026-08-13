import { describe, it, expect, vi } from "vitest";

const mocksFirestore = vi.hoisted(() => ({
  getDoc: vi.fn(),
  onSnapshot: vi.fn(),
  doc: vi.fn((_db, _coleccion, id) => ({ id })),
}));

vi.mock("firebase/app", () => ({
  initializeApp: vi.fn(() => ({})),
  getApps: vi.fn(() => []),
  getApp: vi.fn(() => ({})),
}));

vi.mock("firebase/firestore", () => ({
  getFirestore: vi.fn(() => ({})),
  getDoc: mocksFirestore.getDoc,
  onSnapshot: mocksFirestore.onSnapshot,
  doc: mocksFirestore.doc,
}));

vi.mock("@/lib/firebase", () => ({
  auth: {},
  db: {},
}));

import {
  obtenerUsuarioPorUid,
  escucharUsuario,
  ROLES_USUARIO,
} from "@/services/usuarios";

describe("servicio de usuarios", () => {
  it("serializa un documento válido de usuario", async () => {
    mocksFirestore.getDoc.mockResolvedValue({
      data: () => ({
        email: "operador@renacer.com",
        nombre: "Operador Uno",
        rol: "operador",
        bloqueado: false,
        creadoEn: "2026-01-10T00:00:00.000Z",
      }),
    });

    const usuario = await obtenerUsuarioPorUid("uid_operador");

    expect(usuario).toEqual({
      uid: "uid_operador",
      email: "operador@renacer.com",
      nombre: "Operador Uno",
      rol: "operador",
      bloqueado: false,
      creadoEn: "2026-01-10T00:00:00.000Z",
    });
    expect(mocksFirestore.doc).toHaveBeenCalledWith(
      {},
      "usuarios",
      "uid_operador"
    );
  });

  it("devuelve null cuando el documento no existe", async () => {
    mocksFirestore.getDoc.mockResolvedValue({ data: () => undefined });

    const usuario = await obtenerUsuarioPorUid("uid_inexistente");

    expect(usuario).toBeNull();
  });

  it("devuelve null cuando el rol no es válido", async () => {
    mocksFirestore.getDoc.mockResolvedValue({
      data: () => ({ email: "x@y.com", rol: "superusuario" }),
    });

    const usuario = await obtenerUsuarioPorUid("uid_1");

    expect(usuario).toBeNull();
  });

  it("trata bloqueado como false si falta el campo", async () => {
    mocksFirestore.getDoc.mockResolvedValue({
      data: () => ({ email: "x@y.com", rol: "admin" }),
    });

    const usuario = await obtenerUsuarioPorUid("uid_1");

    expect(usuario?.bloqueado).toBe(false);
    expect(usuario?.nombre).toBe("");
  });

  it("escucha cambios del documento y notifica al callback", () => {
    const desuscribir = vi.fn();
    let capturador: (documento: unknown) => void = () => undefined;
    mocksFirestore.onSnapshot.mockImplementation((_referencia, callback) => {
      capturador = callback;
      return desuscribir;
    });

    const alCambiar = vi.fn();
    const resultado = escucharUsuario("uid_1", alCambiar);

    capturador({ data: () => ({ email: "a@b.com", rol: "admin" }) });

    expect(alCambiar).toHaveBeenCalledWith(
      expect.objectContaining({ uid: "uid_1", rol: "admin" })
    );

    capturador({ data: () => undefined });
    expect(alCambiar).toHaveBeenLastCalledWith(null);

    resultado();
    expect(desuscribir).toHaveBeenCalled();
  });

  it("expone los roles disponibles con sus etiquetas", () => {
    expect(ROLES_USUARIO).toEqual([
      { valor: "admin", etiqueta: "Administrador" },
      { valor: "operador", etiqueta: "Operador" },
    ]);
  });
});