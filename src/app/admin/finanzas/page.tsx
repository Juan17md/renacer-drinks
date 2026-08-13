import { Suspense } from "react";
import { PaginaFinanzasCliente } from "@/components/admin/finanzas/PaginaFinanzasCliente";

export default function PaginaFinanzas() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Cargando...</p>}>
      <PaginaFinanzasCliente />
    </Suspense>
  );
}
