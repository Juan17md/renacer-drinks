import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Producto } from "@/types/product";

export interface ItemCarrito {
  producto: Producto;
  cantidad: number;
}

interface CartState {
  items: ItemCarrito[];
  agregarProducto: (producto: Producto, cantidad?: number) => void;
  eliminarProducto: (productoId: string) => void;
  actualizarCantidad: (productoId: string, cantidad: number) => void;
  vaciarCarrito: () => void;
  obtenerCantidadTotal: () => number;
  obtenerSubtotalUSD: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      agregarProducto: (producto, cantidad = 1) =>
        set((estado) => {
          const existente = estado.items.find(
            (item) => item.producto.id === producto.id
          );

          if (existente) {
            return {
              items: estado.items.map((item) =>
                item.producto.id === producto.id
                  ? {
                      ...item,
                      cantidad: item.cantidad + cantidad,
                    }
                  : item
              ),
            };
          }

          return {
            items: [...estado.items, { producto, cantidad }],
          };
        }),

      eliminarProducto: (productoId) =>
        set((estado) => ({
          items: estado.items.filter(
            (item) => item.producto.id !== productoId
          ),
        })),

      actualizarCantidad: (productoId, cantidad) =>
        set((estado) => {
          if (cantidad <= 0) {
            return {
              items: estado.items.filter(
                (item) => item.producto.id !== productoId
              ),
            };
          }

          return {
            items: estado.items.map((item) =>
              item.producto.id === productoId
                ? { ...item, cantidad }
                : item
            ),
          };
        }),

      vaciarCarrito: () => set({ items: [] }),

      obtenerCantidadTotal: () =>
        get().items.reduce((total, item) => total + item.cantidad, 0),

      obtenerSubtotalUSD: () =>
        get().items.reduce(
          (total, item) => total + item.producto.price * item.cantidad,
          0
        ),
    }),
    {
      name: "renacer-cart",
    }
  )
);