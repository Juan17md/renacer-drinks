import { describe, it, expect, vi } from "vitest";
import type { ReactElement } from "react";
import { render, screen } from "@testing-library/react";
import { PromosSection } from "@/components/public/PromosSection";

const { promocionesMock } = vi.hoisted(() => ({
  promocionesMock: [
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
      activo: true,
      updatedAt: "2026-08-14T00:00:00Z",
    },
  ],
}));

vi.mock("@/services/promotions", () => ({
  obtenerPromocionesActivas: vi.fn().mockResolvedValue(promocionesMock),
}));

describe("PromosSection", () => {
  it("renderiza las promociones activas", async () => {
    const elemento = await PromosSection();
    render(elemento as ReactElement);

    expect(
      screen.getByRole("heading", { name: "Happy Hours" })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/lunes a sábado de 8am a 12pm/i)
    ).toBeInTheDocument();
    expect(screen.getByText("2 Merengadas")).toBeInTheDocument();
    expect(screen.getByText("$4.50")).toBeInTheDocument();
    expect(screen.getByText("2 Especiales")).toBeInTheDocument();
    expect(screen.getByText("$5.60")).toBeInTheDocument();

    expect(
      screen.getByRole("heading", { name: "Tarde de Poder" })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/extra de proteína a tu batido por/i)
    ).toBeInTheDocument();
  });

  it("muestra el indicador de tiempo limitado", async () => {
    const elemento = await PromosSection();
    render(elemento as ReactElement);
    expect(
      screen.getByText(/solo por tiempo limitado/i)
    ).toBeInTheDocument();
  });

  it("se oculta por completo cuando no hay promociones activas", async () => {
    vi.mocked(
      (await import("@/services/promotions")).obtenerPromocionesActivas
    ).mockResolvedValueOnce([]);

    const elemento = await PromosSection();

    expect(elemento).toBeNull();
  });
});
