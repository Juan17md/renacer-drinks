import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PaginaLogin from "@/app/admin/login/page";

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

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    refresh: vi.fn(),
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocksAuth.onAuthStateChanged.mockImplementation((_auth, callback) => {
    callback(null);
    return () => undefined;
  });
});

describe("Página de Login", () => {
  it("renderiza el formulario de inicio de sesión", () => {
    render(<PaginaLogin />);

    expect(
      screen.getByText(/panel de administración/i)
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Correo electrónico")).toBeInTheDocument();
    expect(screen.getByLabelText("Contraseña")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /iniciar sesión/i })
    ).toBeInTheDocument();
  });

  it("muestra error si los campos están vacíos", () => {
    render(<PaginaLogin />);

    fireEvent.click(screen.getByRole("button", { name: /iniciar sesión/i }));

    expect(
      screen.getByText(/ingresa tu correo y contraseña/i)
    ).toBeInTheDocument();
    expect(mocksAuth.signInWithEmailAndPassword).not.toHaveBeenCalled();
  });

  it("inicia sesión y redirige al dashboard", async () => {
    mocksAuth.signInWithEmailAndPassword.mockResolvedValue({});

    render(<PaginaLogin />);

    fireEvent.change(screen.getByLabelText("Correo electrónico"), {
      target: { value: "admin@renacer.com" },
    });
    fireEvent.change(screen.getByLabelText("Contraseña"), {
      target: { value: "secreto123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(mocksAuth.signInWithEmailAndPassword).toHaveBeenCalledWith(
        {},
        "admin@renacer.com",
        "secreto123"
      );
    });
    expect(pushMock).toHaveBeenCalledWith("/admin/dashboard");
  });

  it("muestra error de credenciales inválidas", async () => {
    mocksAuth.signInWithEmailAndPassword.mockRejectedValue({
      code: "auth/invalid-credential",
    });

    render(<PaginaLogin />);

    fireEvent.change(screen.getByLabelText("Correo electrónico"), {
      target: { value: "admin@renacer.com" },
    });
    fireEvent.change(screen.getByLabelText("Contraseña"), {
      target: { value: "incorrecta" },
    });
    fireEvent.click(screen.getByRole("button", { name: /iniciar sesión/i }));

    expect(
      await screen.findByText(/correo o contraseña incorrectos/i)
    ).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });
});