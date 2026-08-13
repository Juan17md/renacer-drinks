import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mocksAuth = vi.hoisted(() => ({
  onAuthStateChanged: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
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

import { useAuth } from "@/hooks/useAuth";
import { renderHook, act, waitFor } from "@testing-library/react";

const usuarioMock = {
  uid: "uid_1",
  email: "admin@renacer.com",
  emailVerified: true,
};

beforeEach(() => {
  vi.clearAllMocks();
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
  });

  it("expone el usuario autenticado cuando Auth lo emite", async () => {
    let capturador: (usuario: unknown) => void = () => undefined;
    mocksAuth.onAuthStateChanged.mockImplementation((_auth, callback) => {
      capturador = callback;
      return () => undefined;
    });

    const { result } = renderHook(() => useAuth());

    act(() => capturador(usuarioMock));
    await waitFor(() => expect(result.current.usuario).toEqual(usuarioMock));
    expect(result.current.cargando).toBe(false);
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
});