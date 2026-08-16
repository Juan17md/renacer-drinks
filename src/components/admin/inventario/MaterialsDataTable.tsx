"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { eliminarMaterial } from "@/actions/materials";
import type { Material } from "@/types/material";

interface MaterialsDataTableProps {
  materiales: Material[];
  onEditar: (material: Material) => void;
}

export function MaterialsDataTable({
  materiales,
  onEditar,
}: MaterialsDataTableProps) {
  const [pagina, setPagina] = useState(1);

  const ELEMENTOS_POR_PAGINA = 30;
  const totalPaginas = Math.max(
    1,
    Math.ceil(materiales.length / ELEMENTOS_POR_PAGINA)
  );
  const paginaActual = Math.min(pagina, totalPaginas);
  const materialesPaginados = materiales.slice(
    (paginaActual - 1) * ELEMENTOS_POR_PAGINA,
    paginaActual * ELEMENTOS_POR_PAGINA
  );

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-2xl border border-border/60 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Material</TableHead>
              <TableHead>Unidad</TableHead>
              <TableHead>Cantidad</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {materialesPaginados.length > 0 ? (
              materialesPaginados.map((material) => (
                <TableRow key={material.id}>
                  <TableCell>
                    <span className="font-medium text-brand-coffee">
                      {material.nombre}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="whitespace-nowrap">
                      {material.unidad}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold text-brand-coffee">
                      {material.cantidad}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 text-muted-foreground hover:text-brand-rose-deep"
                        onClick={() => onEditar(material)}
                        aria-label={`Editar ${material.nombre}`}
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                      </Button>
                      <EliminarMaterial material={material} />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-24 text-center text-muted-foreground"
                >
                  No hay materiales registrados todavía.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPaginas > 1 && (
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            className="h-10"
            onClick={() => setPagina(paginaActual - 1)}
            disabled={paginaActual === 1}
            aria-label="Página anterior"
          >
            Anterior
          </Button>
          <p className="text-base font-medium text-muted-foreground">
            Página {paginaActual} de {totalPaginas}
          </p>
          <Button
            variant="outline"
            className="h-10"
            onClick={() => setPagina(paginaActual + 1)}
            disabled={paginaActual === totalPaginas}
            aria-label="Página siguiente"
          >
            Siguiente
          </Button>
        </div>
      )}
    </div>
  );
}

function EliminarMaterial({ material }: { material: Material }) {
  const [eliminando, setEliminando] = useState(false);

  const manejarEliminar = async () => {
    setEliminando(true);
    try {
      const resultado = await eliminarMaterial(material.id);
      if (resultado.ok) {
        toast.success(`${material.nombre} eliminado`);
      } else {
        toast.error(resultado.error);
      }
    } finally {
      setEliminando(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 text-muted-foreground hover:text-destructive"
          aria-label={`Eliminar ${material.nombre}`}
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar {material.nombre}?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={manejarEliminar}
            disabled={eliminando}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {eliminando ? "Eliminando..." : "Eliminar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
