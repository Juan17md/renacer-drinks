import { obtenerTasaBCV } from "@/lib/bcv";
import { DashboardCliente } from "@/components/admin/dashboard/DashboardCliente";

export default async function PaginaDashboard() {
  const tasa = await obtenerTasaBCV();

  return <DashboardCliente tasaBCVInicial={tasa.promedio} />;
}
