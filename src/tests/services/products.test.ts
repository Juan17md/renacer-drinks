import { describe, it, expect, vi, beforeEach } from "vitest";

const mocksFirestore = vi.hoisted(() => ({
  getDocs: vi.fn(),
  getDoc: vi.fn(),
}));

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(() => ({})),
  query: vi.fn(() => ({})),
  orderBy: vi.fn(() => ({})),
  doc: vi.fn(() => ({})),
  getDocs: mocksFirestore.getDocs,
  getDoc: mocksFirestore.getDoc,
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/firebase", () => ({
  db: {},
}));

import { obtenerProductos, obtenerProductosDisponibles, obtenerProductoPorId, obtenerProductosCompletos } from "@/services/products";
import { obtenerCategorias } from "@/services/categories";

function crearSnapshot(datos: Record<string, unknown>[], ids: string[]) {
  return {
    docs: datos.map((dato, indice) => ({
      id: ids[indice],
      data: () => dato,
    })),
  };
}

const productoDatos = {
  name: "Café Mocca",
  description: "Espresso con chocolate",
  price: 4.5,
  costo: 3.5,
  category: "bebidas-calientes",
  isAvailable: true,
  imageUrl: "https://ik.imagekit.io/renacer/mocca.jpg",
  imageId: "ik_1",
  updatedAt: new Date("2026-08-12T23:00:00Z"),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("obtenerProductos", () => {
  it("mapea los documentos de Firestore a productos", async () => {
    mocksFirestore.getDocs.mockResolvedValue(
      crearSnapshot([productoDatos], ["prod_1"])
    );

    const productos = await obtenerProductos();

    expect(productos).toHaveLength(1);
    expect(productos[0]).toMatchObject({
      id: "prod_1",
      name: "Café Mocca",
      price: 4.5,
      category: "bebidas-calientes",
      isAvailable: true,
    });
    expect(productos[0].updatedAt).toBe("2026-08-12T23:00:00.000Z");
  });

  it("retorna lista vacía si Firestore falla", async () => {
    mocksFirestore.getDocs.mockRejectedValue(new Error("error firestore"));

    const productos = await obtenerProductos();

    expect(productos).toEqual([]);
  });

  it("nunca expone el costo al público", async () => {
    mocksFirestore.getDocs.mockResolvedValue(
      crearSnapshot([productoDatos], ["prod_1"])
    );

    const productos = await obtenerProductos();

    expect(productos[0]).not.toHaveProperty("costo");
    expect((productos[0] as { costo?: number }).costo).toBeUndefined();
  });
});

describe("obtenerProductosCompletos", () => {
  it("incluye el costo para el panel admin", async () => {
    mocksFirestore.getDocs.mockResolvedValue(
      crearSnapshot([productoDatos], ["prod_1"])
    );

    const productos = await obtenerProductosCompletos();

    expect(productos[0].costo).toBe(3.5);
  });
});

describe("obtenerProductosDisponibles", () => {
  it("filtra solo los productos disponibles", async () => {
    mocksFirestore.getDocs.mockResolvedValue(
      crearSnapshot(
        [
          { ...productoDatos, isAvailable: true },
          { ...productoDatos, isAvailable: false },
        ],
        ["prod_1", "prod_2"]
      )
    );

    const productos = await obtenerProductosDisponibles();

    expect(productos).toHaveLength(1);
    expect(productos[0].id).toBe("prod_1");
  });
});

describe("obtenerProductoPorId", () => {
  it("retorna el producto cuando existe", async () => {
    mocksFirestore.getDoc.mockResolvedValue({
      exists: () => true,
      data: () => productoDatos,
    });

    const producto = await obtenerProductoPorId("prod_1");

    expect(producto).not.toBeNull();
    expect(producto?.name).toBe("Café Mocca");
  });

  it("retorna null cuando no existe", async () => {
    mocksFirestore.getDoc.mockResolvedValue({ exists: () => false });

    const producto = await obtenerProductoPorId("inexistente");

    expect(producto).toBeNull();
  });

  it("retorna null si Firestore falla", async () => {
    mocksFirestore.getDoc.mockRejectedValue(new Error("error"));

    const producto = await obtenerProductoPorId("prod_1");

    expect(producto).toBeNull();
  });
});

describe("obtenerCategorias", () => {
  it("mapea las categorías de Firestore", async () => {
    mocksFirestore.getDocs.mockResolvedValue(
      crearSnapshot(
        [
          { name: "Bebidas Frías", slug: "bebidas-frias" },
          { name: "Bebidas Calientes", slug: "bebidas-calientes" },
        ],
        ["cat_1", "cat_2"]
      )
    );

    const categorias = await obtenerCategorias();

    expect(categorias).toHaveLength(2);
    expect(categorias[0]).toEqual({
      id: "cat_1",
      name: "Bebidas Frías",
      slug: "bebidas-frias",
    });
  });

  it("retorna lista vacía si Firestore falla", async () => {
    mocksFirestore.getDocs.mockRejectedValue(new Error("error"));

    const categorias = await obtenerCategorias();

    expect(categorias).toEqual([]);
  });
});