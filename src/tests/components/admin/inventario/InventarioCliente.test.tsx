import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { InventarioCliente } from "@/components/admin/inventario/InventarioCliente";

const { materialesMock } = vi.hoisted(() => ({
  materialesMock: [
    {
      id: "mat_1",
      nombre: "Leche entera",
      unidad: "L",
      cantidad: 12,
      updatedAt: "2026-08-13T10:00:00Z",
    },
    {
      id: "mat_2",
      nombre: "Café en grano",
      unidad: "kg",
      cantidad: 3.5,
      updatedAt: "2026-08-13T10:00:00Z",
    },
  ],
}));

vi.mock("@/actions/materials", () => ({
  crearMaterial: vi.fn().mockResolvedValue({ ok: true }),
  actualizarMaterial: vi.fn().mockResolvedValue({ ok: true }),
  eliminarMaterial: vi.fn().mockResolvedValue({ ok: true }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("InventarioCliente (materiales)", () => {
  it("muestra los materiales con su unidad y cantidad", () => {
    render(<InventarioCliente materiales={materialesMock} />);

    expect(screen.getByText("Leche entera")).toBeInTheDocument();
    expect(screen.getByText("Café en grano")).toBeInTheDocument();
    expect(screen.getByText("L")).toBeInTheDocument();
    expect(screen.getByText("kg")).toBeInTheDocument();
    expect(screen.getByText(/2 materiales registrados/i)).toBeInTheDocument();
  });

  it("muestra el estado vacío cuando no hay materiales", () => {
    render(<InventarioCliente materiales={[]} />);

    expect(
      screen.getByText(/no hay materiales registrados todavía/i)
    ).toBeInTheDocument();
  });

  it("abre el modal de creación al hacer clic en agregar material", () => {
    render(<InventarioCliente materiales={materialesMock} />);

    fireEvent.click(
      screen.getByRole("button", { name: /agregar material/i })
    );

    expect(
      screen.getByRole("dialog", { name: /agregar material/i })
    ).toBeInTheDocument();
  });

  it("abre el modal de edición con los datos del material", async () => {
    render(<InventarioCliente materiales={materialesMock} />);

    fireEvent.click(
      screen.getByRole("button", { name: /editar leche entera/i })
    );

    const dialogo = await screen.findByRole("dialog", {
      name: /editar material/i,
    });
    expect(dialogo).toBeInTheDocument();
    expect(screen.getByLabelText("Nombre *")).toHaveValue("Leche entera");
    expect(screen.getByLabelText(/cantidad \*/i)).toHaveValue(12);
  });

  it("valida que el nombre sea obligatorio al crear", async () => {
    render(<InventarioCliente materiales={materialesMock} />);

    fireEvent.click(
      screen.getByRole("button", { name: /agregar material/i })
    );
    fireEvent.click(screen.getByRole("button", { name: /crear material/i }));

    expect(
      await screen.findByText(/el nombre del material es obligatorio/i)
    ).toBeInTheDocument();
  });

  it("permite escribir una unidad personalizada con la opción Otra", async () => {
    render(<InventarioCliente materiales={materialesMock} />);

    fireEvent.click(
      screen.getByRole("button", { name: /agregar material/i })
    );

    fireEvent.click(
      screen.getByRole("combobox", { name: /unidad de medida/i })
    );
    const opciones = await screen.findAllByText("Otra...");
    fireEvent.click(opciones[opciones.length - 1]);

    expect(
      screen.getByLabelText(/escribe la unidad \*/i)
    ).toBeInTheDocument();
  });
});
