import { obtenerProductos } from "@/services/products";
import { obtenerCategorias } from "@/services/categories";
import { InventarioCliente } from "@/components/admin/inventario/InventarioCliente";

export const revalidate = 300;

export default async function PaginaInventario() {
  const [productos, categorias] = await Promise.all([
    obtenerProductos(),
    obtenerCategorias(),
  ]);

  return (
    <InventarioCliente productos={productos} categorias={categorias} />
  );
}