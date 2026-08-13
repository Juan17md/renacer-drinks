import { obtenerProductosCompletos } from "@/services/products";
import { obtenerCategorias } from "@/services/categories";
import { CatalogoCliente } from "@/components/admin/catalogo/CatalogoCliente";

export const revalidate = 300;

export default async function PaginaCatalogo() {
  const [productos, categorias] = await Promise.all([
    obtenerProductosCompletos(),
    obtenerCategorias(),
  ]);

  return (
    <CatalogoCliente productos={productos} categorias={categorias} />
  );
}
