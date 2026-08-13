import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { AdminShell } from "@/components/admin/AdminShell";

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

const replaceMock = vi.fn();

let pathnameActual = "/admin/inventario";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
  usePathname: () => pathnameActual,
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

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

const documentoOperador = {
  ...documentoAdmin,
  rol: "operador",
};

beforeEach(() => {
  vi.clearAllMocks();
  pathnameActual = "/admin/inventario";
  replaceMock.mockReset();
  mocksServicioUsuarios.escucharUsuario.mockImplementation((_uid, callback) => {
    callback(documentoAdmin);
    return () => undefined;
  });
});

describe("AdminShell (protección de rutas)", () => {
  it("muestra el estado de carga mientras verifica la sesión", () => {
    mocksAuth.onAuthStateChanged.mockImplementation(() => () => undefined);

    render(
      <AdminShell>
        <div>Contenido protegido</div>
      </AdminShell>
    );

    expect(screen.getByText(/verificando sesión/i)).toBeInTheDocument();
    expect(screen.queryByText("Contenido protegido")).not.toBeInTheDocument();
  });

  it("redirige al login cuando no hay sesión activa", async () => {
    mocksAuth.onAuthStateChanged.mockImplementation((_auth, callback) => {
      callback(null);
      return () => undefined;
    });

    render(
      <AdminShell>
        <div>Contenido protegido</div>
      </AdminShell>
    );

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/admin/login");
    });
    expect(screen.queryByText("Contenido protegido")).not.toBeInTheDocument();
  });

  it("muestra la página de login sin sesión activa sin redirigir ni ocultar el contenido", async () => {
    pathnameActual = "/admin/login";
    mocksAuth.onAuthStateChanged.mockImplementation((_auth, callback) => {
      callback(null);
      return () => undefined;
    });

    render(
      <AdminShell>
        <div>Formulario de inicio de sesión</div>
      </AdminShell>
    );

    expect(
      await screen.findByText("Formulario de inicio de sesión")
    ).toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("redirige al dashboard cuando hay sesión activa visitando la página de login", async () => {
    pathnameActual = "/admin/login";
    mocksAuth.onAuthStateChanged.mockImplementation((_auth, callback) => {
      callback(usuarioMock);
      return () => undefined;
    });
    mocksServicioUsuarios.obtenerUsuarioPorUid.mockResolvedValue(
      documentoAdmin
    );

    render(
      <AdminShell>
        <div>Formulario de inicio de sesión</div>
      </AdminShell>
    );

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/admin/dashboard");
    });
  });

  it("muestra el contenido cuando hay sesión activa con documento admin", async () => {
    mocksAuth.onAuthStateChanged.mockImplementation((_auth, callback) => {
      callback(usuarioMock);
      return () => undefined;
    });
    mocksServicioUsuarios.obtenerUsuarioPorUid.mockResolvedValue(documentoAdmin);

    render(
      <AdminShell>
        <div>Contenido protegido</div>
      </AdminShell>
    );

    expect(
      await screen.findByText("Contenido protegido")
    ).toBeInTheDocument();
    expect(screen.getAllByText(/renacer admin/i).length).toBeGreaterThan(0);
    expect(
      await screen.findByText(/admin@renacer\.com/)
    ).toBeInTheDocument();
  });

  it("muestra los enlaces de navegación del panel", async () => {
    mocksAuth.onAuthStateChanged.mockImplementation((_auth, callback) => {
      callback(usuarioMock);
      return () => undefined;
    });
    mocksServicioUsuarios.obtenerUsuarioPorUid.mockResolvedValue(documentoAdmin);
    mocksServicioUsuarios.escucharUsuario.mockImplementation((_uid, callback) => {
      callback(documentoAdmin);
      return () => undefined;
    });

    render(
      <AdminShell>
        <div>Contenido</div>
      </AdminShell>
    );

    expect(
      await screen.findByRole("link", { name: /dashboard/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /inventario/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /finanzas/i })
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("link", { name: /usuarios/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /cerrar sesión/i })
    ).toBeInTheDocument();
  });

  it("oculta el enlace Usuarios para el rol operador", async () => {
    mocksAuth.onAuthStateChanged.mockImplementation((_auth, callback) => {
      callback(usuarioMock);
      return () => undefined;
    });
    mocksServicioUsuarios.obtenerUsuarioPorUid.mockResolvedValue(
      documentoOperador
    );
    mocksServicioUsuarios.escucharUsuario.mockImplementation(
      (_uid, callback) => {
        callback(documentoOperador);
        return () => undefined;
      }
    );

    render(
      <AdminShell>
        <div>Contenido</div>
      </AdminShell>
    );

    expect(
      await screen.findByRole("link", { name: /dashboard/i })
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(
        screen.queryByRole("link", { name: /usuarios/i })
      ).not.toBeInTheDocument();
    });
  });

  it("redirige al dashboard cuando un operador intenta entrar a /admin/usuarios", async () => {
    pathnameActual = "/admin/usuarios";
    mocksAuth.onAuthStateChanged.mockImplementation((_auth, callback) => {
      callback(usuarioMock);
      return () => undefined;
    });
    mocksServicioUsuarios.obtenerUsuarioPorUid.mockResolvedValue(
      documentoOperador
    );
    mocksServicioUsuarios.escucharUsuario.mockImplementation(
      (_uid, callback) => {
        callback(documentoOperador);
        return () => undefined;
      }
    );

    render(
      <AdminShell>
        <div>Contenido</div>
      </AdminShell>
    );

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/admin/dashboard");
    });
  });

  it("cierra la sesión y redirige al login cuando el usuario está bloqueado", async () => {
    mocksAuth.onAuthStateChanged.mockImplementation((_auth, callback) => {
      callback(usuarioMock);
      return () => undefined;
    });
    mocksServicioUsuarios.obtenerUsuarioPorUid.mockResolvedValue({
      ...documentoAdmin,
      bloqueado: true,
    });
    mocksServicioUsuarios.escucharUsuario.mockImplementation(
      (_uid, callback) => {
        callback({ ...documentoAdmin, bloqueado: true });
        return () => undefined;
      }
    );

    render(
      <AdminShell>
        <div>Contenido</div>
      </AdminShell>
    );

    await waitFor(() => {
      expect(mocksAuth.signOut).toHaveBeenCalled();
      expect(replaceMock).toHaveBeenCalledWith("/admin/login");
    });
    expect(screen.queryByText("Contenido")).not.toBeInTheDocument();
  });

  it("cierra la sesión cuando el usuario no tiene documento en la colección usuarios", async () => {
    mocksAuth.onAuthStateChanged.mockImplementation((_auth, callback) => {
      callback(usuarioMock);
      return () => undefined;
    });
    mocksServicioUsuarios.obtenerUsuarioPorUid.mockResolvedValue(null);

    render(
      <AdminShell>
        <div>Contenido</div>
      </AdminShell>
    );

    await waitFor(() => {
      expect(mocksAuth.signOut).toHaveBeenCalled();
      expect(replaceMock).toHaveBeenCalledWith("/admin/login");
    });
  });
});