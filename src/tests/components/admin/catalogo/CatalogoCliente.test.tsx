import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CatalogoCliente } from "@/components/admin/catalogo/CatalogoCliente";
import { ProductsDataTable } from "@/components/admin/catalogo/ProductsDataTable";
import type { Producto } from "@/types/product";

const { productosMock, categoriasMock, actualizarProductoMock, crearProductoMock } =
  vi.hoisted(() => ({
    productosMock: [
      {
        id: "prod_1",
        name: "Café Mocca Helado",
        description: "Espresso doble con chocolate",
        price: 4.5,
        costo: 3.5,
        category: "bebidas-frias",
        isAvailable: true,
        destacado: false,
        imageUrl: "",
        imageId: "",
        updatedAt: "2026-08-12T23:00:00Z",
      },
      {
        id: "prod_2",
        name: "Capuchino",
        description: "Café con leche espumosa",
        price: 3.0,
        costo: 2.0,
        category: "bebidas-calientes",
        isAvailable: false,
        destacado: false,
        imageUrl: "",
        imageId: "",
        updatedAt: "2026-08-12T23:00:00Z",
      },
    ],
    categoriasMock: [
      { id: "cat_1", name: "Bebidas Frías", slug: "bebidas-frias" },
      { id: "cat_2", name: "Bebidas Calientes", slug: "bebidas-calientes" },
    ],
    actualizarProductoMock: vi.fn().mockResolvedValue({ ok: true }),
    crearProductoMock: vi.fn().mockResolvedValue({ ok: true }),
  }));

vi.mock("@/actions/products", () => ({
  actualizarProducto: actualizarProductoMock,
  eliminarProducto: vi.fn().mockResolvedValue({ ok: true }),
  crearProducto: crearProductoMock,
  crearCategoria: vi.fn().mockResolvedValue({ ok: true }),
  eliminarCategoria: vi.fn().mockResolvedValue({ ok: true }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ProductsDataTable (catálogo)", () => {
  it("muestra precio de venta, costo y ganancia de cada producto", () => {
    render(
      <ProductsDataTable
        productos={productosMock}
        categorias={categoriasMock}
        onEditar={vi.fn()}
      />
    );

    expect(screen.getAllByText("$4.50")).toHaveLength(2);
    expect(screen.getAllByText("$3.50")).toHaveLength(2);
    expect(screen.getAllByText("$1.00")).toHaveLength(4);
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
    expect(screen.getAllByText("Capuchino")).toHaveLength(2);
  });

  it("pagina los productos de 30 en 30 y reinicia al buscar", () => {
    const muchos = Array.from({ length: 65 }, (_, indice) => ({
      id: `prod_${indice}`,
      name: `Producto ${indice + 1}`,
      description: `Descripción ${indice + 1}`,
      price: 3 + indice,
      costo: 2,
      category: "bebidas-frias",
      isAvailable: true,
      destacado: false,
      imageUrl: "",
      imageId: "",
      updatedAt: "2026-08-12T23:00:00Z",
    }));

    render(
      <ProductsDataTable
        productos={muchos}
        categorias={categoriasMock}
        onEditar={vi.fn()}
      />
    );

    expect(screen.getByText("Página 1 de 3")).toBeInTheDocument();
    expect(screen.getAllByText("Producto 1")).toHaveLength(2);
    expect(screen.queryByText("Producto 31")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /página anterior/i })
    ).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: /página siguiente/i }));
    expect(screen.getByText("Página 2 de 3")).toBeInTheDocument();
    expect(screen.getAllByText("Producto 31")).toHaveLength(2);
    expect(screen.queryByText("Producto 1")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/buscar producto/i), {
      target: { value: "Producto 40" },
    });
    expect(screen.queryByText(/página \d+ de \d+/i)).not.toBeInTheDocument();
    expect(screen.getAllByText("Producto 40")).toHaveLength(2);
  });

  it("oculta la paginación con 30 productos o menos", () => {
    const treinta = Array.from({ length: 30 }, (_, indice) => ({
      id: `prod_${indice}`,
      name: `Producto ${indice + 1}`,
      description: `Descripción ${indice + 1}`,
      price: 3,
      costo: 2,
      category: "bebidas-frias",
      isAvailable: true,
      destacado: false,
      imageUrl: "",
      imageId: "",
      updatedAt: "2026-08-12T23:00:00Z",
    }));

    render(
      <ProductsDataTable
        productos={treinta}
        categorias={categoriasMock}
        onEditar={vi.fn()}
      />
    );

    expect(screen.queryByText(/página \d+ de \d+/i)).not.toBeInTheDocument();
    expect(screen.getAllByText("Producto 30")).toHaveLength(2);
  });
});

describe("CatalogoCliente", () => {
  it("muestra el botón de agregar y el contador de productos del menú", () => {
    render(
      <CatalogoCliente productos={productosMock} categorias={categoriasMock} />
    );

    expect(screen.getByText(/2 productos en el menú público/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /agregar producto/i })
    ).toBeInTheDocument();
  });

  it("abre el modal de edición con los datos del producto", async () => {
    render(
      <CatalogoCliente productos={productosMock} categorias={categoriasMock} />
    );

    fireEvent.click(
      screen.getAllByRole("button", { name: /editar café mocca helado/i })[0]
    );

    const dialogo = await screen.findByRole("dialog", {
      name: /editar producto/i,
    });
    expect(dialogo).toBeInTheDocument();
    expect(screen.getByLabelText("Nombre *")).toHaveValue(
      "Café Mocca Helado"
    );
    expect(screen.getByLabelText(/precio \(costo\) usd/i)).toHaveValue(3.5);
    expect(screen.getByLabelText(/precio de venta usd/i)).toHaveValue(4.5);
  });

  it("rechaza el guardado si el precio de venta es menor que el costo", async () => {
    render(
      <CatalogoCliente productos={productosMock} categorias={categoriasMock} />
    );

    fireEvent.click(
      screen.getByRole("button", { name: /agregar producto/i })
    );

    fireEvent.change(screen.getByLabelText("Nombre *"), {
      target: { value: "Nuevo café" },
    });
    fireEvent.change(screen.getByLabelText(/precio \(costo\) usd/i), {
      target: { value: "5" },
    });
    fireEvent.change(screen.getByLabelText(/precio de venta usd/i), {
      target: { value: "4" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /crear producto/i })
    );

    expect(
      await screen.findByText(
        /el precio de venta no puede ser menor que el precio \(costo\)/i
      )
    ).toBeInTheDocument();
    expect(crearProductoMock).not.toHaveBeenCalled();
  });

  it("crea el producto con costo y precio de venta correctos", async () => {
    render(
      <CatalogoCliente productos={productosMock} categorias={categoriasMock} />
    );

    fireEvent.click(
      screen.getByRole("button", { name: /agregar producto/i })
    );

    fireEvent.change(screen.getByLabelText("Nombre *"), {
      target: { value: "Nuevo café" },
    });
    fireEvent.change(screen.getByLabelText(/precio \(costo\) usd/i), {
      target: { value: "2" },
    });
    fireEvent.change(screen.getByLabelText(/precio de venta usd/i), {
      target: { value: "3" },
    });
    fireEvent.click(
      screen.getByRole("combobox", { name: /seleccionar categoría/i })
    );
    const opcionesCategoria = await screen.findAllByText("Bebidas Frías");
    fireEvent.click(opcionesCategoria[opcionesCategoria.length - 1]);
    fireEvent.click(screen.getByRole("button", { name: /crear producto/i }));

    expect(crearProductoMock).toHaveBeenCalledWith({
      name: "Nuevo café",
      description: "",
      price: 3,
      costo: 2,
      category: "bebidas-frias",
      isAvailable: true,
      destacado: false,
      imageUrl: "",
      imageId: "",
    });
  });

  it("marca el producto como destacado desde el modal", async () => {
    render(
      <CatalogoCliente productos={productosMock} categorias={categoriasMock} />
    );

    fireEvent.click(
      screen.getByRole("button", { name: /agregar producto/i })
    );

    fireEvent.change(screen.getByLabelText("Nombre *"), {
      target: { value: "Batido Estrella" },
    });
    fireEvent.change(screen.getByLabelText(/precio \(costo\) usd/i), {
      target: { value: "2" },
    });
    fireEvent.change(screen.getByLabelText(/precio de venta usd/i), {
      target: { value: "3" },
    });
    fireEvent.click(
      screen.getByRole("combobox", { name: /seleccionar categoría/i })
    );
    const opcionesCategoria = await screen.findAllByText("Bebidas Frías");
    fireEvent.click(opcionesCategoria[opcionesCategoria.length - 1]);

    fireEvent.click(
      screen.getByRole("switch", { name: "Destacado en la landing" })
    );

    fireEvent.click(screen.getByRole("button", { name: /crear producto/i }));

    expect(crearProductoMock).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Batido Estrella", destacado: true })
    );
  });

  it("muestra la ganancia por unidad al llenar ambos precios", async () => {
    render(
      <CatalogoCliente productos={productosMock} categorias={categoriasMock} />
    );

    fireEvent.click(
      screen.getByRole("button", { name: /agregar producto/i })
    );

    fireEvent.change(screen.getByLabelText(/precio \(costo\) usd/i), {
      target: { value: "2.5" },
    });
    fireEvent.change(screen.getByLabelText(/precio de venta usd/i), {
      target: { value: "4" },
    });

    expect(
      await screen.findByText(/ganancia por unidad/i)
    ).toBeInTheDocument();
  });
});
