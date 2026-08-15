import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ProductCard } from "@/components/catalogo/ProductCard";
import { CatalogoCliente } from "@/components/catalogo/CatalogoCliente";
import { useCartStore } from "@/store/useCartStore";

const { productoMock, productoAgotadoMock } = vi.hoisted(() => ({
  productoMock: {
    id: "prod_1",
    name: "Café Mocca Helado",
    description: "Espresso doble con chocolate artesanal y hielo",
    price: 4.5,
    category: "bebidas-frias",
    isAvailable: true,
    destacado: false,
    imageUrl: "https://ik.imagekit.io/renacer/products/mocca.jpg",
    imageId: "ik_1",
    updatedAt: "2026-08-12T23:00:00Z",
  },
  productoAgotadoMock: {
    id: "prod_2",
    name: "Frappé de Oreo",
    description: "Frappé cremoso de galleta Oreo",
    price: 5.0,
    category: "bebidas-frias",
    isAvailable: false,
    destacado: false,
    imageUrl: "",
    imageId: "",
    updatedAt: "2026-08-12T23:00:00Z",
  },
}));

beforeEach(() => {
  useCartStore.setState({ items: [] });
});

describe("ProductCard", () => {
  it("muestra nombre, precio USD y precio Bs. con la tasa", () => {
    render(<ProductCard producto={productoMock} tasaBCV={764.35} />);

    expect(screen.getByText("Café Mocca Helado")).toBeInTheDocument();
    expect(screen.getByText("$4.50")).toBeInTheDocument();
    expect(screen.getByText("Bs. 3.439,58")).toBeInTheDocument();
  });

  it("agrega el producto al pedido al hacer clic", () => {
    render(<ProductCard producto={productoMock} tasaBCV={764.35} />);

    fireEvent.click(
      screen.getByRole("button", { name: /agregar café mocca helado al pedido/i })
    );

    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().items[0].cantidad).toBe(1);
  });

  it("deshabilita el botón si el producto está agotado", () => {
    render(<ProductCard producto={productoAgotadoMock} tasaBCV={764.35} />);

    const boton = screen.getByRole("button", {
      name: /agregar frappé de oreo al pedido/i,
    });
    expect(boton).toBeDisabled();
    expect(screen.getByText("Agotado")).toBeInTheDocument();
  });
});

describe("CatalogoCliente", () => {
  it("filtra productos por búsqueda", () => {
    render(
      <CatalogoCliente
        productos={[productoMock, productoAgotadoMock]}
        categorias={[]}
        tasaBCV={764.35}
        fechaActualizacion="2026-08-12T20:00:00Z"
      />
    );

    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "oreo" },
    });

    expect(screen.queryByText("Café Mocca Helado")).not.toBeInTheDocument();
    expect(screen.getByText("Frappé de Oreo")).toBeInTheDocument();
  });

  it("filtra productos por categoría", () => {
    const productoPostre = {
      ...productoMock,
      id: "prod_3",
      name: "Cheesecake",
      category: "postres",
    };

    render(
      <CatalogoCliente
        productos={[productoMock, productoAgotadoMock, productoPostre]}
        categorias={[
          { id: "cat_1", name: "Bebidas Frías", slug: "bebidas-frias" },
          { id: "cat_2", name: "Postres", slug: "postres" },
        ]}
        tasaBCV={764.35}
        fechaActualizacion="2026-08-12T20:00:00Z"
      />
    );

    expect(screen.getByText("Cheesecake")).toBeInTheDocument();
    expect(screen.getByText("Café Mocca Helado")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /postres/i }));

    expect(screen.getByText("Cheesecake")).toBeInTheDocument();
    expect(screen.queryByText("Café Mocca Helado")).not.toBeInTheDocument();
  });

  it("muestra la tasa BCV en el badge", () => {
    render(
      <CatalogoCliente
        productos={[productoMock]}
        categorias={[]}
        tasaBCV={764.35}
        fechaActualizacion="2026-08-12T20:00:00Z"
      />
    );

    expect(screen.getByTestId("bcv-badge")).toHaveTextContent("Bs. 764,35");
  });

  it("muestra mensaje de vacío cuando no hay coincidencias", () => {
    render(
      <CatalogoCliente
        productos={[productoMock]}
        categorias={[]}
        tasaBCV={764.35}
        fechaActualizacion="2026-08-12T20:00:00Z"
      />
    );

    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "no existe" },
    });

    expect(screen.getByText(/no encontramos productos/i)).toBeInTheDocument();
  });
});