import { obtenerTasaBCV } from "@/lib/bcv";
import { obtenerResumenDiario } from "@/services/transactions";
import { obtenerProductosCompletos } from "@/services/products";
import { obtenerFechaLocalISO } from "@/lib/utils";
import { DashboardCliente } from "@/components/admin/dashboard/DashboardCliente";

export const dynamic = "force-dynamic";

export default async function PaginaDashboard() {
  const hoy = obtenerFechaLocalISO().slice(0, 10);
  const [tasa, resumen, productos] = await Promise.all([
    obtenerTasaBCV(),
    obtenerResumenDiario(hoy),
    obtenerProductosCompletos(),
  ]);

  return (
    <DashboardCliente
      tasaBCV={tasa.promedio}
      resumen={resumen}
      productos={productos}
    />
  );
}
