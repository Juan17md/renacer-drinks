import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PaginaUsuariosCliente } from "@/components/admin/usuarios/PaginaUsuariosCliente";

const mocksActions = vi.hoisted(() => ({
  crearUsuario: vi.fn(),
  editarUsuario: vi.fn(),
  eliminarUsuario: vi.fn(),
  bloquearUsuario: vi.fn(),
  obtenerTodosLosUsuarios: vi.fn(),
}));

vi.mock("firebase/app", () => ({
  initializeApp: vi.fn(() => ({})),
  getApps: vi.fn(() => []),
  getApp: vi.fn(() => ({})),
}));

vi.mock("firebase/auth", () => ({
  getAuth: vi.fn(() => ({})),
}));

vi.mock("firebase/firestore", () => ({
  getFirestore: vi.fn(() => ({})),
}));

vi.mock("@/lib/firebase", () => ({
  auth: {},
  db: {},
}));

vi.mock("@/services/usuarios", () => ({
  ROLES_USUARIO: [
    { valor: "admin", etiqueta: "Administrador" },
    { valor: "operador", etiqueta: "Operador" },
  ],
}));

vi.mock("@/actions/usuarios", () => ({
  crearUsuario: mocksActions.crearUsuario,
  editarUsuario: mocksActions.editarUsuario,
  eliminarUsuario: mocksActions.eliminarUsuario,
  bloquearUsuario: mocksActions.bloquearUsuario,
  obtenerTodosLosUsuarios: mocksActions.obtenerTodosLosUsuarios,
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    usuario: { uid: "uid_admin", email: "juan9182morales@gmail.com" },
    datosUsuario: {
      uid: "uid_admin",
      email: "juan9182morales@gmail.com",
      nombre: "Juan Morales",
      rol: "admin",
      bloqueado: false,
      creadoEn: "2026-01-01T00:00:00.000Z",
    },
    esAdmin: true,
    cargando: false,
    cargandoDatos: false,
  }),
}));

const toastMock = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({
  toast: toastMock,
}));

const usuariosMock = [
  {
    uid: "uid_admin",
    email: "juan9182morales@gmail.com",
    nombre: "Juan Morales",
    rol: "admin",
    bloqueado: false,
    creadoEn: "2026-01-01T00:00:00.000Z",
  },
  {
    uid: "uid_operador",
    email: "operador@renacer.com",
    nombre: "Operador Uno",
    rol: "operador",
    bloqueado: true,
    creadoEn: "2026-08-10T00:00:00.000Z",
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  mocksActions.obtenerTodosLosUsuarios.mockResolvedValue(usuariosMock);
  mocksActions.crearUsuario.mockResolvedValue({ ok: true, uid: "uid_nuevo" });
  mocksActions.editarUsuario.mockResolvedValue({ ok: true });
  mocksActions.eliminarUsuario.mockResolvedValue({ ok: true });
  mocksActions.bloquearUsuario.mockResolvedValue({ ok: true });
});

describe("PaginaUsuariosCliente", () => {
  it("lista los usuarios con su rol y estado", async () => {
    render(<PaginaUsuariosCliente />);

    expect(
      await screen.findByText("juan9182morales@gmail.com")
    ).toBeInTheDocument();
    expect(screen.getByText("operador@renacer.com")).toBeInTheDocument();
    expect(screen.getAllByText("Administrador")).toHaveLength(1);
    expect(screen.getAllByText("Operador")).toHaveLength(1);
    expect(screen.getByText("Bloqueado")).toBeInTheDocument();
    expect(screen.getByText("Activo")).toBeInTheDocument();
  });

  it("muestra un mensaje cuando no hay usuarios", async () => {
    mocksActions.obtenerTodosLosUsuarios.mockResolvedValue([]);
    render(<PaginaUsuariosCliente />);

    expect(
      await screen.findByText(/aún no hay usuarios/i)
    ).toBeInTheDocument();
  });

  it("deshabilita acciones sobre el propio usuario", async () => {
    render(<PaginaUsuariosCliente />);

    const filaAdmin = await screen.findByText("juan9182morales@gmail.com");
    const fila = filaAdmin.closest("tr");
    expect(fila).not.toBeNull();

    const botones = fila!.querySelectorAll("button");
    botones.forEach((boton) => {
      expect(boton).toBeDisabled();
    });
  });

  it("crea un usuario a través de la action", async () => {
    render(<PaginaUsuariosCliente />);

    fireEvent.click(
      await screen.findByRole("button", { name: /nuevo usuario/i })
    );

    const dialogo = await screen.findByRole("dialog");
    fireEvent.change(
      screen.getByLabelText("Nombre"),
      { target: { value: "Operador Dos" } }
    );
    fireEvent.change(
      screen.getByLabelText("Correo electrónico"),
      { target: { value: "operador2@renacer.com" } }
    );
    fireEvent.change(
      screen.getByLabelText("Contraseña"),
      { target: { value: "clave-secreta" } }
    );

    fireEvent.click(
      screen.getByRole("button", { name: /crear usuario/i })
    );

    await waitFor(() => {
      expect(mocksActions.crearUsuario).toHaveBeenCalledWith({
        email: "operador2@renacer.com",
        nombre: "Operador Dos",
        rol: "operador",
        password: "clave-secreta",
      });
    });
    expect(toastMock.success).toHaveBeenCalledWith(
      "Usuario creado correctamente"
    );
    expect(dialogo).not.toBeInTheDocument();
  });

  it("muestra un toast de error si la creación falla", async () => {
    mocksActions.crearUsuario.mockResolvedValue({
      ok: false,
      error: "No se pudo crear el usuario",
    });
    render(<PaginaUsuariosCliente />);

    fireEvent.click(
      await screen.findByRole("button", { name: /nuevo usuario/i })
    );
    fireEvent.change(
      screen.getByLabelText("Nombre"),
      { target: { value: "Fallo" } }
    );
    fireEvent.change(
      screen.getByLabelText("Correo electrónico"),
      { target: { value: "fallo@renacer.com" } }
    );
    fireEvent.change(
      screen.getByLabelText("Contraseña"),
      { target: { value: "clave-secreta" } }
    );
    fireEvent.click(
      screen.getByRole("button", { name: /crear usuario/i })
    );

    await waitFor(() => {
      expect(toastMock.error).toHaveBeenCalledWith(
        "No se pudo crear el usuario"
      );
    });
  });

  it("bloquea y desbloquea usuarios", async () => {
    let conteoFetch = 0;
    mocksActions.obtenerTodosLosUsuarios.mockImplementation(async () => {
      conteoFetch += 1;
      return [
        usuariosMock[0],
        { ...usuariosMock[1], bloqueado: conteoFetch === 1 },
      ];
    });

    render(<PaginaUsuariosCliente />);

    await screen.findByText("operador@renacer.com");
    const botonDesbloquear = screen.getByRole("button", {
      name: /desbloquear a operador uno/i,
    });
    fireEvent.click(botonDesbloquear);

    await waitFor(() => {
      expect(mocksActions.bloquearUsuario).toHaveBeenLastCalledWith(
        "uid_operador",
        false
      );
    });
    await waitFor(() => {
      expect(toastMock.success).toHaveBeenCalledWith("Usuario desbloqueado");
    });

    const botonBloquear = await screen.findByRole("button", {
      name: "Bloquear a Operador Uno",
    });
    fireEvent.click(botonBloquear);

    await waitFor(() => {
      expect(mocksActions.bloquearUsuario).toHaveBeenLastCalledWith(
        "uid_operador",
        true
      );
    });
  });

  it("elimina un usuario tras confirmar en el diálogo", async () => {
    render(<PaginaUsuariosCliente />);

    await screen.findByText("operador@renacer.com");
    fireEvent.click(
      screen.getByRole("button", { name: /eliminar a operador uno/i })
    );

    expect(
      screen.getByText(/¿eliminar usuario\?/i)
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^eliminar$/i }));

    await waitFor(() => {
      expect(mocksActions.eliminarUsuario).toHaveBeenCalledWith("uid_operador");
    });
    expect(toastMock.success).toHaveBeenCalledWith(
      "Usuario eliminado correctamente"
    );
  });
});