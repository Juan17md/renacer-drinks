import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PaginaPromociones } from "@/components/admin/promociones/PaginaPromociones";

const {
  obtenerPromocionesMock,
  crearPromocionMock,
  actualizarPromocionMock,
  eliminarPromocionMock,
  toastMock,
} = vi.hoisted(() => ({
  obtenerPromocionesMock: vi.fn(),
  crearPromocionMock: vi.fn().mockResolvedValue({ ok: true }),
  actualizarPromocionMock: vi.fn().mockResolvedValue({ ok: true }),
  eliminarPromocionMock: vi.fn().mockResolvedValue({ ok: true }),
  toastMock: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/services/promotions", () => ({
  obtenerPromociones: obtenerPromocionesMock,
}));

vi.mock("@/actions/promotions", () => ({
  crearPromocion: crearPromocionMock,
  actualizarPromocion: actualizarPromocionMock,
  eliminarPromocion: eliminarPromocionMock,
}));

vi.mock("sonner", () => ({
  toast: toastMock,
}));

const promocionesMock = [
  {
    id: "happy_hours",
    titulo: "Happy Hours",
    horario: "Lunes a Sábado de 8AM a 12PM",
    descripcion: "Dos por el precio de uno en tus favoritas.",
    ofertas: [
      { nombre: "2 Merengadas", precio: "$4.50" },
      { nombre: "2 Especiales", precio: "$5.60" },
    ],
    activo: true,
    updatedAt: "2026-08-14T00:00:00Z",
  },
  {
    id: "tarde_de_poder",
    titulo: "Tarde de Poder",
    horario: "Por tiempo limitado",
    descripcion: "Añade extra de proteína a tu batido por $0.50.",
    ofertas: [],
    activo: false,
    updatedAt: "2026-08-14T00:00:00Z",
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  obtenerPromocionesMock.mockResolvedValue(promocionesMock);
});

describe("PaginaPromociones", () => {
  it("muestra las promociones existentes", async () => {
    render(<PaginaPromociones />);

    expect(
      await screen.findByRole("heading", { name: "Happy Hours" })
    ).toBeInTheDocument();
    expect(screen.getByText("2 Merengadas")).toBeInTheDocument();
    expect(screen.getByText("$4.50")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Tarde de Poder" })
    ).toBeInTheDocument();
  });

  it("crea una promoción nueva", async () => {
    render(<PaginaPromociones />);
    await screen.findByRole("heading", { name: "Happy Hours" });

    fireEvent.click(screen.getByRole("button", { name: "Nueva promoción" }));

    fireEvent.change(screen.getByLabelText("Título"), {
      target: { value: "Martes de Oferta" },
    });
    fireEvent.change(screen.getByLabelText("Horario"), {
      target: { value: "Martes 2PM a 5PM" },
    });
    fireEvent.change(screen.getByLabelText("Descripción"), {
      target: { value: "Descuento en batidos." },
    });
    fireEvent.change(screen.getByLabelText("Nombre de la oferta 1"), {
      target: { value: "1 Batido Proteico" },
    });
    fireEvent.change(screen.getByLabelText("Precio de la oferta 1"), {
      target: { value: "$3.90" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Crear promoción" })
    );

    await waitFor(() => {
      expect(crearPromocionMock).toHaveBeenCalledWith({
        titulo: "Martes de Oferta",
        horario: "Martes 2PM a 5PM",
        descripcion: "Descuento en batidos.",
        ofertas: [{ nombre: "1 Batido Proteico", precio: "$3.90" }],
        activo: true,
      });
    });
    expect(toastMock.success).toHaveBeenCalledWith("Promoción creada");
  });

  it("edita una promoción existente", async () => {
    render(<PaginaPromociones />);
    await screen.findByRole("heading", { name: "Happy Hours" });

    fireEvent.click(
      screen.getByRole("button", { name: "Editar promoción Happy Hours" })
    );

    const titulo = await screen.findByLabelText("Título");
    fireEvent.change(titulo, { target: { value: "Happy Hours 2x1" } });

    fireEvent.click(
      screen.getByRole("button", { name: "Guardar cambios" })
    );

    await waitFor(() => {
      expect(actualizarPromocionMock).toHaveBeenCalledWith(
        "happy_hours",
        expect.objectContaining({ titulo: "Happy Hours 2x1" })
      );
    });
    expect(toastMock.success).toHaveBeenCalledWith("Promoción actualizada");
  });

  it("agrega una oferta adicional en el formulario", async () => {
    render(<PaginaPromociones />);
    await screen.findByRole("heading", { name: "Happy Hours" });

    fireEvent.click(screen.getByRole("button", { name: "Nueva promoción" }));
    fireEvent.click(screen.getByRole("button", { name: "Agregar oferta" }));

    expect(
      screen.getByLabelText("Nombre de la oferta 2")
    ).toBeInTheDocument();
  });

  it("elimina una promoción tras confirmar", async () => {
    render(<PaginaPromociones />);
    await screen.findByRole("heading", { name: "Happy Hours" });

    fireEvent.click(
      screen.getByRole("button", { name: "Eliminar promoción Happy Hours" })
    );

    expect(
      await screen.findByText((contenido) =>
        contenido.includes('Se eliminará "Happy Hours" de la landing y del panel.')
      )
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Confirmar eliminación de promoción" })
    );

    await waitFor(() => {
      expect(eliminarPromocionMock).toHaveBeenCalledWith("happy_hours");
    });
    expect(toastMock.success).toHaveBeenCalledWith("Promoción eliminada");
  });

  it("desactiva una promoción con el switch", async () => {
    render(<PaginaPromociones />);
    await screen.findByRole("heading", { name: "Happy Hours" });

    fireEvent.click(
      screen.getByRole("switch", { name: "Activar promoción Happy Hours" })
    );

    await waitFor(() => {
      expect(actualizarPromocionMock).toHaveBeenCalledWith(
        "happy_hours",
        expect.objectContaining({ activo: false })
      );
    });
    expect(toastMock.success).toHaveBeenCalledWith("Promoción desactivada");
  });

  it("muestra error si falla la carga", async () => {
    obtenerPromocionesMock.mockRejectedValue(new Error("sin conexión"));

    render(<PaginaPromociones />);

    await waitFor(() => {
      expect(toastMock.error).toHaveBeenCalledWith(
        "No se pudieron cargar las promociones"
      );
    });
  });
});