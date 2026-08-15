import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BotonAgregarProducto } from "@/components/public/BotonAgregarProducto";
import { useCartStore } from "@/store/useCartStore";
import type { ProductoPublico } from "@/types/product";

const productoMock: ProductoPublico = {
  id: "prod-merengada",
  name: "Merengada",
  description: "Refrescante merengada",
  price: 2.25,
  category: "Bebidas",
  isAvailable: true,
  destacado: false,
  imageUrl: "",
  imageId: "",
  updatedAt: "",
};

describe("BotonAgregarProducto", () => {
  beforeEach(() => {
    useCartStore.getState().vaciarCarrito();
  });

  it("agrega el producto al pedido al hacer clic", () => {
    render(<BotonAgregarProducto producto={productoMock} />);

    fireEvent.click(
      screen.getByRole("button", { name: /agregar merengada al pedido/i })
    );

    const items = useCartStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0].producto.id).toBe("prod-merengada");
    expect(items[0].producto.name).toBe("Merengada");
    expect(items[0].cantidad).toBe(1);
  });

  it("acumula la cantidad al agregar el mismo producto varias veces", () => {
    render(<BotonAgregarProducto producto={productoMock} />);
    const boton = screen.getByRole("button", {
      name: /agregar merengada al pedido/i,
    });

    fireEvent.click(boton);
    fireEvent.click(boton);

    expect(useCartStore.getState().items[0].cantidad).toBe(2);
  });

  it("muestra el feedback Agregado tras el clic", () => {
    render(<BotonAgregarProducto producto={productoMock} />);

    fireEvent.click(
      screen.getByRole("button", { name: /agregar merengada al pedido/i })
    );

    expect(
      screen.getByRole("button", {
        name: /merengada agregado al pedido/i,
      })
    ).toBeInTheDocument();
  });

  it("deshabilita el botón si el producto no está disponible", () => {
    render(
      <BotonAgregarProducto producto={{ ...productoMock, isAvailable: false }} />
    );

    expect(
      screen.getByRole("button", { name: /agregar merengada al pedido/i })
    ).toBeDisabled();
  });
});