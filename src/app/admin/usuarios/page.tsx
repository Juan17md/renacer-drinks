import { Suspense } from "react";
import { PaginaUsuariosCliente } from "@/components/admin/usuarios/PaginaUsuariosCliente";

export default function PaginaUsuarios() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Cargando...</p>}>
      <PaginaUsuariosCliente />
    </Suspense>
  );
}