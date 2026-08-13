export interface Producto {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  isAvailable: boolean;
  imageUrl: string;
  imageId: string;
  updatedAt: string;
}

export interface ProductoInput {
  name: string;
  description: string;
  price: number;
  category: string;
  isAvailable: boolean;
  imageUrl: string;
  imageId: string;
}
