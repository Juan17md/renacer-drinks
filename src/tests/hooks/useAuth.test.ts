import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mocksAuth = vi.hoisted(() => ({
  onAuthStateChanged: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
}));

const mocksServicioUsuarios = vi.hoisted(() => ({
  obtenerUsuarioPorUid: vi.fn(),
  escucharUsuario: vi.fn(),
}));

vi.mock("firebase/auth", () => ({
  onAuthStateChanged: mocksAuth.onAuthStateChanged,
  signInWithEmailAndPassword: mocksAuth.signInWithEmailAndPassword,
  signOut: mocksAuth.signOut,
}));

vi.mock("firebase/app", () => ({
  initializeApp: vi.fn(() => ({})),
  getApps: vi.fn(() => []),
  getApp: vi.fn(() => ({})),
}));

vi.mock("firebase/firestore", () => ({
  getFirestore: vi.fn(() => ({})),
}));

vi.mock("@/lib/firebase", () => ({
  auth: {},
  db: {},
}));

vi.mock("@/services/usuarios", () => ({
  obtenerUsuarioPorUid: mocksServicioUsuarios.obtenerUsuarioPorUid,
  escucharUsuario: mocksServicioUsuarios.escucharUsuario,
}));

import { useAuth } from "@/hooks/useAuth";
import { renderHook, act, waitFor } from "@testing-library/react";

const usuarioMock = {
  uid: "uid_1",
  email: "admin@renacer.com",
  emailVerified: true,
};

const documentoAdmin = {
  uid: "uid_1",
  email: "admin@renacer.com",
  nombre: "Admin Renacer",
  rol: "admin",
  bloqueado: false,
  creadoEn: "2026-01-01T00:00:00.000Z",
};

beforeEach(() => {
  vi.clearAllMocks();
  mocksServicioUsuarios.escucharUsuario.mockImplementation((_uid, callback) => {
    callback(documentoAdmin);
    return () => undefined;
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useAuth", () => {
  it("expone cargando=true hasta que Auth resuelve el estado", async () => {
    let capturador: (usuario: unknown) => void = () => undefined;
    mocksAuth.onAuthStateChanged.mockImplementation((_auth, callback) => {
      capturador = callback;
      return () => undefined;
    });

    const { result } = renderHook(() => useAuth());
    expect(result.current.cargando).toBe(true);

    act(() => capturador(null));
    await waitFor(() => expect(result.current.cargando).toBe(false));
    expect(result.current.usuario).toBeNull();
    expect(result.current.datosUsuario).toBeNull();
  });

  it("expone el usuario autenticado cuando Auth lo emite", async () => {
    let capturador: (usuario: unknown) => void = () => undefined;
    mocksAuth.onAuthStateChanged.mockImplementation((_auth, callback) => {
      capturador = callback;
      return () => undefined;
    });
    mocksServicioUsuarios.obtenerUsuarioPorUid.mockResolvedValue(documentoAdmin);

    const { result } = renderHook(() => useAuth());

    act(() => capturador(usuarioMock));
    await waitFor(() => expect(result.current.usuario).toEqual(usuarioMock));
    expect(result.current.cargando).toBe(false);
  });

  it("carga el documento del usuario y expone esAdmin según el rol", async () => {
    mocksAuth.onAuthStateChanged.mockImplementation((_auth, callback) => {
      callback(usuarioMock);
      return () => undefined;
    });
    mocksServicioUsuarios.obtenerUsuarioPorUid.mockResolvedValue(documentoAdmin);

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.datosUsuario).toEqual(documentoAdmin);
    });
    expect(result.current.esAdmin).toBe(true);
    expect(mocksServicioUsuarios.obtenerUsuarioPorUid).toHaveBeenCalledWith(
      "uid_1"
    );
    expect(mocksServicioUsuarios.escucharUsuario).toHaveBeenCalledWith(
      "uid_1",
      expect.any(Function)
    );
  });

  it("esAdmin es false para el rol operador", async () => {
    mocksAuth.onAuthStateChanged.mockImplementation((_auth, callback) => {
      callback(usuarioMock);
      return () => undefined;
    });
    mocksServicioUsuarios.obtenerUsuarioPorUid.mockResolvedValue({
      ...documentoAdmin,
      rol: "operador",
    });
    mocksServicioUsuarios.escucharUsuario.mockImplementation(
      (_uid, callback) => {
        callback({ ...documentoAdmin, rol: "operador" });
        return () => undefined;
      }
    );

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.datosUsuario?.rol).toBe("operador");
    });
    expect(result.current.esAdmin).toBe(false);
  });

  it("queda sin datos cuando el usuario no tiene documento", async () => {
    mocksAuth.onAuthStateChanged.mockImplementation((_auth, callback) => {
      callback(usuarioMock);
      return () => undefined;
    });
    mocksServicioUsuarios.obtenerUsuarioPorUid.mockResolvedValue(null);

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.cargandoDatos).toBe(false);
    });
    expect(result.current.datosUsuario).toBeNull();
    expect(result.current.esAdmin).toBe(false);
  });

  it("inicia sesión con email y password", async () => {
    mocksAuth.signInWithEmailAndPassword.mockResolvedValue({});
    mocksAuth.onAuthStateChanged.mockImplementation((_auth, callback) => {
      callback(null);
      return () => undefined;
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.iniciarSesion("admin@renacer.com", "secreto");
    });

    expect(mocksAuth.signInWithEmailAndPassword).toHaveBeenCalledWith(
      {},
      "admin@renacer.com",
      "secreto"
    );
  });

  it("cierra la sesión con signOut", async () => {
    mocksAuth.signOut.mockResolvedValue(undefined);
    mocksAuth.onAuthStateChanged.mockImplementation((_auth, callback) => {
      callback(null);
      return () => undefined;
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.cerrarSesion();
    });

    expect(mocksAuth.signOut).toHaveBeenCalled();
  });

  it("suscripción se desuscribe al desmontar", () => {
    const desuscribir = vi.fn();
    mocksAuth.onAuthStateChanged.mockImplementation((_auth, callback) => {
      callback(null);
      return desuscribir;
    });

    const { unmount } = renderHook(() => useAuth());
    unmount();

    expect(desuscribir).toHaveBeenCalled();
  });

  it("deja de escuchar el documento al desmontar", async () => {
    const desuscribirDoc = vi.fn();
    mocksAuth.onAuthStateChanged.mockImplementation((_auth, callback) => {
      callback(usuarioMock);
      return () => undefined;
    });
    mocksServicioUsuarios.obtenerUsuarioPorUid.mockResolvedValue(documentoAdmin);
    mocksServicioUsuarios.escucharUsuario.mockImplementation(() => desuscribirDoc);

    const { unmount } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(mocksServicioUsuarios.escucharUsuario).toHaveBeenCalled();
    });
    unmount();

    expect(desuscribirDoc).toHaveBeenCalled();
  });
});