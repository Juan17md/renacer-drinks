import { Suspense } from "react";
import { PaginaTransaccionesCliente } from "@/components/admin/finanzas/PaginaTransaccionesCliente";

export default function PaginaTransacciones() {
  return (
    <Suspense
      fallback={<p className="text-base text-muted-foreground">Cargando...</p>}
    >
      <PaginaTransaccionesCliente />
    </Suspense>
  );
}