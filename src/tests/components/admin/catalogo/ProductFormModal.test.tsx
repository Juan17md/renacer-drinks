import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { ProductFormModal } from "@/components/admin/catalogo/ProductFormModal";
import type { Producto } from "@/types/product";
import type { Categoria } from "@/types/category";

const {
  crearProductoMock,
  actualizarProductoMock,
  toastMock,
  useAuthMock,
} = vi.hoisted(() => {
  return {
    crearProductoMock: vi.fn().mockResolvedValue({ ok: true }),
    actualizarProductoMock: vi.fn().mockResolvedValue({ ok: true }),
    toastMock: { success: vi.fn(), error: vi.fn() },
    useAuthMock: vi.fn(() => ({ usuario: null, esAdmin: false })),
  };
});

vi.mock("@/actions/products", () => ({
  crearProducto: crearProductoMock,
  actualizarProducto: actualizarProductoMock,
}));

vi.mock("sonner", () => ({
  toast: toastMock,
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: useAuthMock,
}));

vi.mock("@/lib/imagekit-auth", () => ({
  autenticarImageKit: vi.fn(),
}));

vi.mock("imagekitio-react", () => ({
  IKContext: ({ children }: { children: React.ReactNode }) => children,
  IKUpload: (props: {
    onSuccess?: (respuesta: { url?: string; fileId?: string }) => void;
    onError?: () => void;
    folder?: string;
  }) => (
    <input
      type="file"
      data-testid="ik-upload-producto"
      data-folder={props.folder}
      onChange={() =>
        props.onSuccess?.({
          url: "https://ik.imagekit.io/renacerdrinks/Renacer/productos/mocca.jpg",
          fileId: "file-123",
        })
      }
    />
  ),
}));

vi.mock("@/components/admin/catalogo/CategoryCombobox", () => ({
  CategoryCombobox: (props: {
    valor?: string;
    onSeleccionar?: (valor: string) => void;
  }) => (
    <select
      aria-label="Categoría"
      value={props.valor}
      onChange={(evento) => props.onSeleccionar?.(evento.target.value)}
    >
      <option value="">Selecciona...</option>
      <option value="bebidas-frias">Bebidas frías</option>
    </select>
  ),
}));

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    const { src, alt, ...resto } = props;
    return React.createElement("img", {
      src: String(src ?? ""),
      alt: String(alt ?? ""),
      ...resto,
    });
  },
}));

const categoriasMock: Categoria[] = [
  { id: "bebidas-frias", name: "Bebidas frías", slug: "bebidas-frias" },
];

const productoMock: Producto = {
  id: "prod_1",
  name: "Café Mocca Helado",
  description: "Espresso doble con chocolate",
  price: 4.5,
  costo: 3.5,
  category: "bebidas-frias",
  isAvailable: true,
  destacado: false,
  imageUrl: "https://ik.imagekit.io/renacerdrinks/mocca.jpg",
  imageId: "file-viejo",
  updatedAt: "",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ProductFormModal", () => {
  it("sube la imagen del producto a la carpeta Renacer/productos", () => {
    render(
      <ProductFormModal
        abierto
        onOpenChange={() => undefined}
        categorias={categoriasMock}
      />
    );

    const inputImagen = screen.getByTestId("ik-upload-producto");
    expect(inputImagen).toHaveAttribute(
      "data-folder",
      "/Renacer/productos"
    );

    fireEvent.change(inputImagen, {
      target: { files: [new File([""], "mocca.jpg", { type: "image/jpeg" })] },
    });
    expect(toastMock.success).toHaveBeenCalledWith("Imagen subida correctamente");
  });

  it("carga los datos del producto al editar y muestra su imagen", () => {
    render(
      <ProductFormModal
        abierto
        onOpenChange={() => undefined}
        producto={productoMock}
        categorias={categoriasMock}
      />
    );

    expect(screen.getByLabelText(/nombre/i)).toHaveValue("Café Mocca Helado");
    expect(screen.getByAltText("Vista previa del producto")).toHaveAttribute(
      "src",
      "https://ik.imagekit.io/renacerdrinks/mocca.jpg"
    );
    expect(
      screen.queryByTestId("ik-upload-producto")
    ).not.toBeInTheDocument();
  });

  it("crea el producto con los datos del formulario", async () => {
    render(
      <ProductFormModal
        abierto
        onOpenChange={() => undefined}
        categorias={categoriasMock}
      />
    );

    fireEvent.change(screen.getByLabelText(/nombre/i), {
      target: { value: "Nuevo Batido" },
    });
    fireEvent.change(screen.getByLabelText(/precio \(costo\)/i), {
      target: { value: "2" },
    });
    fireEvent.change(screen.getByLabelText(/precio de venta/i), {
      target: { value: "3" },
    });
    fireEvent.change(screen.getByLabelText(/categoría/i), {
      target: { value: "bebidas-frias" },
    });
    fireEvent.change(screen.getByTestId("ik-upload-producto"), {
      target: { files: [new File([""], "batido.jpg", { type: "image/jpeg" })] },
    });
    fireEvent.click(screen.getByRole("button", { name: /crear producto/i }));

    expect(await screen.findByRole("button", { name: /crear producto/i })).toBeInTheDocument();
    expect(toastMock.success).toHaveBeenCalledWith("Producto creado");
    expect(crearProductoMock).toHaveBeenCalledWith({
      name: "Nuevo Batido",
      description: "",
      price: 3,
      costo: 2,
      category: "bebidas-frias",
      isAvailable: true,
      destacado: false,
      imageUrl:
        "https://ik.imagekit.io/renacerdrinks/Renacer/productos/mocca.jpg",
      imageId: "file-123",
    });
  });
});