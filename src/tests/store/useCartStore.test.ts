import { describe, it, expect, beforeEach } from "vitest";
import { useCartStore } from "@/store/useCartStore";
import type { ProductoPublico } from "@/types/product";

const productoBase: ProductoPublico = {
  id: "prod_1",
  name: "Café Mocca Helado",
  description: "Espresso doble con chocolate artesanal",
  price: 4.5,
  category: "bebidas-frias",
  isAvailable: true,
  destacado: false,
  imageUrl: "https://ik.imagekit.io/renacer/products/mocca.jpg",
  imageId: "ik_1",
  updatedAt: "2026-08-12T23:00:00Z",
};

const producto2: ProductoPublico = {
  ...productoBase,
  id: "prod_2",
  name: "Capuchino",
  price: 3.0,
};

beforeEach(() => {
  useCartStore.setState({ items: [] });
  localStorage.clear();
});

describe("useCartStore", () => {
  it("agrega un producto nuevo al carrito", () => {
    useCartStore.getState().agregarProducto(productoBase);

    const { items } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0].producto.id).toBe("prod_1");
    expect(items[0].cantidad).toBe(1);
  });

  it("incrementa la cantidad si el producto ya existe", () => {
    useCartStore.getState().agregarProducto(productoBase);
    useCartStore.getState().agregarProducto(productoBase, 2);

    const { items } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0].cantidad).toBe(3);
  });

  it("elimina un producto del carrito", () => {
    useCartStore.getState().agregarProducto(productoBase);
    useCartStore.getState().agregarProducto(producto2);

    useCartStore.getState().eliminarProducto("prod_1");

    const { items } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0].producto.id).toBe("prod_2");
  });

  it("actualiza la cantidad de un producto", () => {
    useCartStore.getState().agregarProducto(productoBase);
    useCartStore.getState().actualizarCantidad("prod_1", 5);

    expect(useCartStore.getState().items[0].cantidad).toBe(5);
  });

  it("elimina el producto si la cantidad llega a 0", () => {
    useCartStore.getState().agregarProducto(productoBase);
    useCartStore.getState().actualizarCantidad("prod_1", 0);

    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it("vacía el carrito completo", () => {
    useCartStore.getState().agregarProducto(productoBase);
    useCartStore.getState().agregarProducto(producto2);
    useCartStore.getState().vaciarCarrito();

    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it("calcula la cantidad total de items", () => {
    useCartStore.getState().agregarProducto(productoBase);
    useCartStore.getState().agregarProducto(productoBase);
    useCartStore.getState().agregarProducto(producto2);

    expect(useCartStore.getState().obtenerCantidadTotal()).toBe(3);
  });

  it("calcula el subtotal en USD", () => {
    useCartStore.getState().agregarProducto(productoBase, 2);
    useCartStore.getState().agregarProducto(producto2, 1);

    expect(useCartStore.getState().obtenerSubtotalUSD()).toBe(12);
  });

  it("persiste el estado en localStorage", () => {
    useCartStore.getState().agregarProducto(productoBase);

    const persistido = JSON.parse(localStorage.getItem("renacer-cart")!);
    expect(persistido.state.items).toHaveLength(1);
    expect(persistido.state.items[0].producto.id).toBe("prod_1");
  });
});