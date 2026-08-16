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
      { nombre: "2 Merengadas", precio: 4.5, costo: 3.5 },
      { nombre: "2 Especiales", precio: 5.6, costo: 4.6 },
    ],
    activo: true,
    updatedAt: "2026-08-14T00:00:00Z",
  },
  {
    id: "tarde_de_poder",
    titulo: "Tarde de Poder",
    horario: "Por tiempo limitado",
    descripcion: "Añade extra de proteína a tu batido por $0.50.",
    ofertas: [
      { nombre: "Proteína extra", precio: 0.5, costo: 0.25, esProteina: true },
    ],
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
    expect(screen.getByText("Venta: $4.50")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Tarde de Poder" })
    ).toBeInTheDocument();
    expect(screen.getByText("Proteína extra")).toBeInTheDocument();
    expect(screen.getByText("Venta: $0.50")).toBeInTheDocument();
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
    fireEvent.change(screen.getByLabelText("Precio de venta de la oferta 1"), {
      target: { value: "3.90" },
    });
    fireEvent.change(screen.getByLabelText("Costo de la oferta 1"), {
      target: { value: "2.50" },
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Crear promoción" })
    );

    await waitFor(() => {
      expect(crearPromocionMock).toHaveBeenCalledWith({
        titulo: "Martes de Oferta",
        horario: "Martes 2PM a 5PM",
        descripcion: "Descuento en batidos.",
        ofertas: [
          { nombre: "1 Batido Proteico", precio: 3.9, costo: 2.5, esProteina: false },
        ],
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

  it("marca una oferta como proteína extra y muestra su ganancia", async () => {
    render(<PaginaPromociones />);
    await screen.findByRole("heading", { name: "Tarde de Poder" });

    fireEvent.click(
      screen.getByRole("button", { name: "Editar promoción Tarde de Poder" })
    );

    const costo = await screen.findByLabelText("Costo de la oferta 1");
    fireEvent.change(costo, { target: { value: "0.30" } });

    const precio = screen.getByLabelText("Precio de venta de la oferta 1");
    fireEvent.change(precio, { target: { value: "0.50" } });

    expect(
      screen
        .getAllByText((contenido, elemento) =>
          Boolean(elemento?.textContent?.includes("Ganancia:")) &&
          Boolean(elemento?.textContent?.includes("$0.20"))
        )
        .length
    ).toBeGreaterThan(0);

    fireEvent.click(
      screen.getByRole("button", { name: "Guardar cambios" })
    );

    await waitFor(() => {
      expect(actualizarPromocionMock).toHaveBeenCalledWith(
        "tarde_de_poder",
        expect.objectContaining({
          ofertas: [
            expect.objectContaining({
              nombre: "Proteína extra",
              precio: 0.5,
              costo: 0.3,
              esProteina: true,
            }),
          ],
        })
      );
    });
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