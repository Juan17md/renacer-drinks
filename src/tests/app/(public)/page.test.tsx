import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import PaginaInicio from "@/app/(public)/page";

vi.mock("@/components/public/FeaturedProducts", () => ({
  FeaturedProducts: () => <div data-testid="destacados">Destacados mock</div>,
}));

vi.mock("@/components/public/PromosSection", () => ({
  PromosSection: () => <div data-testid="promos">Promos mock</div>,
}));

describe("Página de Inicio (Landing)", () => {
  it("ensambla el hero, la historia y la ubicación", async () => {
    const elemento = await PaginaInicio();
    render(elemento);

    expect(
      screen.getByText(/cada día es una nueva oportunidad/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/un lugar donde cada taza cuenta una historia/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/ubicación y horarios/i)).toBeInTheDocument();
    expect(screen.getByTestId("destacados")).toBeInTheDocument();
  });

  it("muestra los horarios de atención de la cafetería", async () => {
    const elemento = await PaginaInicio();
    render(elemento);

    expect(screen.getByText(/6:00 am – 12:00 pm/i)).toBeInTheDocument();
    expect(screen.getByText(/2:00 pm – 9:00 pm/i)).toBeInTheDocument();
  });

  it("muestra la dirección de la cafetería", async () => {
    const elemento = await PaginaInicio();
    render(elemento);

    expect(
      screen.getByText(/Ruezga Sur Sector 7 Calle 8/i)
    ).toBeInTheDocument();
  });
});