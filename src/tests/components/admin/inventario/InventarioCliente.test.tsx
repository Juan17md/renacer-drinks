import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { InventarioCliente } from "@/components/admin/inventario/InventarioCliente";

const { obtenerMaterialesMock } = vi.hoisted(() => ({
  obtenerMaterialesMock: vi.fn().mockResolvedValue([
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
  ]),
}));

vi.mock("@/services/materials", () => ({
  obtenerMateriales: obtenerMaterialesMock,
}));

vi.mock("@/actions/materials", () => ({
  crearMaterial: vi.fn().mockResolvedValue({ ok: true }),
  actualizarMaterial: vi.fn().mockResolvedValue({ ok: true }),
  eliminarMaterial: vi.fn().mockResolvedValue({ ok: true }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("InventarioCliente (materiales)", () => {
  it("muestra los materiales con su unidad y cantidad", async () => {
    render(<InventarioCliente />);

    expect(await screen.findAllByText("Leche entera")).toHaveLength(2);
    expect(screen.getAllByText("Café en grano")).toHaveLength(2);
    expect(screen.getAllByText("L")).toHaveLength(2);
    expect(screen.getAllByText("kg")).toHaveLength(2);
    expect(screen.getByText(/2 materiales registrados/i)).toBeInTheDocument();
  });

  it("muestra el estado vacío cuando no hay materiales", async () => {
    obtenerMaterialesMock.mockResolvedValueOnce([]);
    render(<InventarioCliente />);

    expect(
      (await screen.findAllByText(/no hay materiales registrados todavía/i))
        .length
    ).toBeGreaterThan(0);
  });

  it("abre el modal de creación al hacer clic en agregar material", async () => {
    render(<InventarioCliente />);

    fireEvent.click(
      await screen.findByRole("button", { name: /agregar material/i })
    );

    expect(
      screen.getByRole("dialog", { name: /agregar material/i })
    ).toBeInTheDocument();
  });

  it("abre el modal de edición con los datos del material", async () => {
    render(<InventarioCliente />);
    await screen.findAllByRole("button", { name: /editar leche entera/i });

    fireEvent.click(
      screen.getAllByRole("button", { name: /editar leche entera/i })[0]
    );

    const dialogo = await screen.findByRole("dialog", {
      name: /editar material/i,
    });
    expect(dialogo).toBeInTheDocument();
    expect(screen.getByLabelText("Nombre *")).toHaveValue("Leche entera");
    expect(screen.getByLabelText(/cantidad \*/i)).toHaveValue(12);
  });

  it("valida que el nombre sea obligatorio al crear", async () => {
    render(<InventarioCliente />);

    fireEvent.click(
      await screen.findByRole("button", { name: /agregar material/i })
    );
    fireEvent.click(screen.getByRole("button", { name: /crear material/i }));

    expect(
      await screen.findByText(/el nombre del material es obligatorio/i)
    ).toBeInTheDocument();
  });

  it("permite escribir una unidad personalizada con la opción Otra", async () => {
    render(<InventarioCliente />);

    fireEvent.click(
      await screen.findByRole("button", { name: /agregar material/i })
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

  it("pagina los materiales de 30 en 30", async () => {
    const muchos = Array.from({ length: 65 }, (_, indice) => ({
      id: `mat_${indice}`,
      nombre: `Material ${indice + 1}`,
      unidad: "kg",
      cantidad: 1,
      updatedAt: "2026-08-13T10:00:00Z",
    }));
    obtenerMaterialesMock.mockResolvedValueOnce(muchos);

    render(<InventarioCliente />);

    expect(
      await screen.findByText("Página 1 de 3")
    ).toBeInTheDocument();
    expect(screen.getAllByText("Material 1")).toHaveLength(2);
    expect(screen.queryByText("Material 31")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /página anterior/i })
    ).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: /página siguiente/i }));
    expect(screen.getByText("Página 2 de 3")).toBeInTheDocument();
    expect(screen.getAllByText("Material 31")).toHaveLength(2);
    expect(screen.queryByText("Material 1")).not.toBeInTheDocument();
  });
});
