import "server-only";
import { collection, getDocs, doc, getDoc, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Producto, ProductoPublico } from "@/types/product";

function convertirProducto(docSnapshot: {
  id: string;
  data: () => Record<string, unknown>;
}): Producto {
  const datos = docSnapshot.data();
  return {
    id: docSnapshot.id,
    name: String(datos.name ?? ""),
    description: String(datos.description ?? ""),
    price: Number(datos.price ?? 0),
    costo: Number(datos.costo ?? 0),
    category: String(datos.category ?? ""),
    isAvailable: Boolean(datos.isAvailable ?? true),
    imageUrl: String(datos.imageUrl ?? ""),
    imageId: String(datos.imageId ?? ""),
    updatedAt:
      datos.updatedAt instanceof Date
        ? datos.updatedAt.toISOString()
        : String(datos.updatedAt ?? ""),
  };
}

export async function obtenerProductos(): Promise<ProductoPublico[]> {
  const productos = await obtenerProductosCompletos();
  // El costo es información interna del negocio: nunca se expone al público.
  return productos.map(({ costo: _costo, ...producto }) => producto);
}

export async function obtenerProductosCompletos(): Promise<Producto[]> {
  try {
    const consulta = query(
      collection(db, "products"),
      orderBy("name", "asc")
    );
    const snapshots = await getDocs(consulta);
    return snapshots.docs.map(convertirProducto);
  } catch (error) {
    console.error("Error al obtener productos:", error);
    return [];
  }
}

export async function obtenerProductosDisponibles(): Promise<ProductoPublico[]> {
  const productos = await obtenerProductos();
  return productos.filter((producto) => producto.isAvailable);
}

export async function obtenerProductoPorId(id: string): Promise<Producto | null> {
  try {
    const referencia = doc(db, "products", id);
    const snapshot = await getDoc(referencia);
    if (!snapshot.exists()) return null;
    return convertirProducto(snapshot);
  } catch (error) {
    console.error(`Error al obtener el producto ${id}:`, error);
    return null;
  }
}
