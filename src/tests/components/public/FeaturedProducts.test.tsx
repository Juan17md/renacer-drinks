import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { FeaturedProducts } from "@/components/public/FeaturedProducts";

const { productoMock, tasaMock } = vi.hoisted(() => ({
  productoMock: {
    id: "prod_1",
    name: "Café Mocca Helado",
    description: "Espresso doble con chocolate artesanal",
    price: 2.0,
    category: "bebidas-frias",
    isAvailable: true,
    imageUrl: "https://ik.imagekit.io/renacer/products/mocca.jpg",
    imageId: "ik_1",
    updatedAt: "2026-08-12T23:00:00Z",
  },
  tasaMock: {
    promedio: 764.35,
    fechaActualizacion: "2026-08-12T20:00:00Z",
    moneda: "Bolívar",
    codigo: "VES",
  },
}));

vi.mock("@/services/products", () => ({
  obtenerProductosDisponibles: vi.fn().mockResolvedValue([productoMock]),
}));

vi.mock("@/lib/bcv", () => ({
  obtenerTasaBCV: vi.fn().mockResolvedValue(tasaMock),
}));

describe("FeaturedProducts", () => {
  it("renderiza productos destacados con precio en USD y Bs.", async () => {
    const elemento = await FeaturedProducts();
    render(elemento);

    expect(screen.getByText("Café Mocca Helado")).toBeInTheDocument();
    expect(screen.getByText("$2.00")).toBeInTheDocument();
    expect(screen.getByText("Bs. 1.528,70")).toBeInTheDocument();
  });

  it("muestra mensaje de próximamente cuando no hay productos", async () => {
    vi.mocked(
      (await import("@/services/products")).obtenerProductosDisponibles
    ).mockResolvedValueOnce([]);

    const elemento = await FeaturedProducts();
    render(elemento);

    expect(
      screen.getByText(/próximamente nuestro menú/i)
    ).toBeInTheDocument();
  });
});