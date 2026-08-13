import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ProductsDataTable } from "@/components/admin/inventario/ProductsDataTable";
import { InventarioCliente } from "@/components/admin/inventario/InventarioCliente";

const { productosMock, categoriasMock } = vi.hoisted(() => ({
  productosMock: [
    {
      id: "prod_1",
      name: "Café Mocca Helado",
      description: "Espresso doble con chocolate",
      price: 4.5,
      category: "bebidas-frias",
      isAvailable: true,
      imageUrl: "",
      imageId: "",
      updatedAt: "2026-08-12T23:00:00Z",
    },
    {
      id: "prod_2",
      name: "Capuchino",
      description: "Café con leche espumosa",
      price: 3.0,
      category: "bebidas-calientes",
      isAvailable: false,
      imageUrl: "",
      imageId: "",
      updatedAt: "2026-08-12T23:00:00Z",
    },
  ],
  categoriasMock: [
    { id: "cat_1", name: "Bebidas Frías", slug: "bebidas-frias" },
    { id: "cat_2", name: "Bebidas Calientes", slug: "bebidas-calientes" },
  ],
}));

vi.mock("@/actions/products", () => ({
  actualizarProducto: vi.fn().mockResolvedValue({ ok: true }),
  eliminarProducto: vi.fn().mockResolvedValue({ ok: true }),
  crearProducto: vi.fn().mockResolvedValue({ ok: true }),
  crearCategoria: vi.fn().mockResolvedValue({ ok: true }),
  eliminarCategoria: vi.fn().mockResolvedValue({ ok: true }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ProductsDataTable", () => {
  it("renderiza los productos con sus precios", () => {
    render(
      <ProductsDataTable
        productos={productosMock}
        categorias={categoriasMock}
        onEditar={vi.fn()}
      />
    );

    expect(screen.getByText("Café Mocca Helado")).toBeInTheDocument();
    expect(screen.getByText("Capuchino")).toBeInTheDocument();
    expect(screen.getByText("$4.50")).toBeInTheDocument();
    expect(screen.getByText("$3.00")).toBeInTheDocument();
  });

  it("filtra productos por la búsqueda global", () => {
    render(
      <ProductsDataTable
        productos={productosMock}
        categorias={categoriasMock}
        onEditar={vi.fn()}
      />
    );

    fireEvent.change(screen.getByLabelText(/buscar producto/i), {
      target: { value: "capuchino" },
    });

    expect(screen.queryByText("Café Mocca Helado")).not.toBeInTheDocument();
    expect(screen.getByText("Capuchino")).toBeInTheDocument();
  });

  it("ordena por nombre al hacer clic en la columna", () => {
    render(
      <ProductsDataTable
        productos={productosMock}
        categorias={categoriasMock}
        onEditar={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /nombre/i }));
    fireEvent.click(screen.getByRole("button", { name: /nombre/i }));

    const filas = screen.getAllByRole("row");
    expect(filas[1]).toHaveTextContent("Capuchino");
    expect(filas[2]).toHaveTextContent("Café Mocca Helado");
  });

  it("abre el editor al hacer clic en editar", () => {
    const onEditar = vi.fn();
    render(
      <ProductsDataTable
        productos={productosMock}
        categorias={categoriasMock}
        onEditar={onEditar}
      />
    );

    fireEvent.click(
      screen.getByRole("button", { name: /editar café mocca helado/i })
    );

    expect(onEditar).toHaveBeenCalledWith(productosMock[0]);
  });
});

describe("InventarioCliente", () => {
  it("muestra el botón de agregar y el contador de productos", () => {
    render(
      <InventarioCliente productos={productosMock} categorias={categoriasMock} />
    );

    expect(screen.getByText(/2 productos en el menú/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /agregar producto/i })
    ).toBeInTheDocument();
  });

  it("abre el modal de creación al hacer clic en agregar", () => {
    render(
      <InventarioCliente productos={productosMock} categorias={categoriasMock} />
    );

    fireEvent.click(
      screen.getByRole("button", { name: /agregar producto/i })
    );

    expect(
      screen.getByRole("dialog", { name: /agregar producto/i })
    ).toBeInTheDocument();
  });

  it("abre el modal de edición con los datos del producto", async () => {
    render(
      <InventarioCliente productos={productosMock} categorias={categoriasMock} />
    );

    fireEvent.click(
      screen.getByRole("button", { name: /editar café mocca helado/i })
    );

    const dialogo = await screen.findByRole("dialog", {
      name: /editar producto/i,
    });
    expect(dialogo).toBeInTheDocument();
    expect(screen.getByLabelText("Nombre *")).toHaveValue(
      "Café Mocca Helado"
    );
    expect(screen.getByLabelText(/precio \(usd\)/i)).toHaveValue(4.5);
  });
});