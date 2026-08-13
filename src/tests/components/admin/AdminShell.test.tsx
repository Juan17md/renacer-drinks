import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { AdminShell } from "@/components/admin/AdminShell";

const mocksAuth = vi.hoisted(() => ({
  onAuthStateChanged: vi.fn(),
}));

vi.mock("firebase/auth", () => ({
  onAuthStateChanged: mocksAuth.onAuthStateChanged,
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
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

const replaceMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
  usePathname: () => "/admin/inventario",
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

beforeEach(() => {
  vi.clearAllMocks();
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

  it("muestra el contenido cuando hay sesión activa", async () => {
    mocksAuth.onAuthStateChanged.mockImplementation((_auth, callback) => {
      callback(usuarioMock);
      return () => undefined;
    });

    render(
      <AdminShell>
        <div>Contenido protegido</div>
      </AdminShell>
    );

    expect(
      await screen.findByText("Contenido protegido")
    ).toBeInTheDocument();
    expect(screen.getAllByText(/renacer admin/i).length).toBeGreaterThan(0);
    expect(screen.getByText("admin@renacer.com")).toBeInTheDocument();
  });

  it("muestra los enlaces de navegación del panel", async () => {
    mocksAuth.onAuthStateChanged.mockImplementation((_auth, callback) => {
      callback(usuarioMock);
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
      screen.getByRole("button", { name: /cerrar sesión/i })
    ).toBeInTheDocument();
  });
});