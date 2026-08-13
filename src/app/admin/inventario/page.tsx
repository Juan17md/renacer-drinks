import { obtenerMateriales } from "@/services/materials";
import { InventarioCliente } from "@/components/admin/inventario/InventarioCliente";

export const dynamic = "force-dynamic";

export default async function PaginaInventario() {
  const materiales = await obtenerMateriales();

  return <InventarioCliente materiales={materiales} />;
}
