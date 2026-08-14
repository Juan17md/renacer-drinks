export interface Producto {
  id: string;
  name: string;
  description: string;
  price: number;
  costo: number;
  category: string;
  isAvailable: boolean;
  destacado: boolean;
  imageUrl: string;
  imageId: string;
  updatedAt: string;
}

// Versión pública del producto: el costo es información interna del negocio
// y nunca debe exponerse al cliente.
export type ProductoPublico = Omit<Producto, "costo">;

export interface ProductoInput {
  name: string;
  description: string;
  price: number;
  costo: number;
  category: string;
  isAvailable: boolean;
  destacado: boolean;
  imageUrl: string;
  imageId: string;
}
