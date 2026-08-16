"use client";

import { useMemo, useState } from "react";
import { ArrowDownCircle, ArrowUpCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { eliminarTransaccion } from "@/actions/transacciones";
import { useAuth } from "@/hooks/useAuth";
import { formatearUSD } from "@/lib/utils";
import type {
  TransaccionFinanciera,
  TipoTransaccion,
} from "@/types/transaction";

interface TransactionsTableProps {
  transacciones: TransaccionFinanciera[];
  onEliminada?: () => void;
}

function formatearFechaHora(fechaISO: string): string {
  if (!fechaISO) return "—";
  const [fecha, hora] = fechaISO.split("T");
  if (!fecha) return fechaISO;
  const [anio, mes, dia] = fecha.split("-");
  const horaCorta = hora?.slice(0, 5) ?? "";
  return `${dia}/${mes}/${anio}${horaCorta ? ` · ${horaCorta}` : ""}`;
}

const FILTROS: { valor: "TODAS" | TipoTransaccion; label: string }[] = [
  { valor: "TODAS", label: "Todas" },
  { valor: "INGRESO", label: "Ingresos" },
  { valor: "EGRESO", label: "Egresos" },
];

const TRANSACCIONES_POR_PAGINA = 15;

export function TransactionsTable({
  transacciones,
  onEliminada,
}: TransactionsTableProps) {
  const { usuario, esAdmin } = useAuth();
  const [filtro, setFiltro] = useState<"TODAS" | TipoTransaccion>("TODAS");
  const [pagina, setPagina] = useState(1);
  const [eliminando, setEliminando] = useState<string | null>(null);

  const filtradas = useMemo(
    () =>
      filtro === "TODAS"
        ? transacciones
        : transacciones.filter((t) => t.type === filtro),
    [transacciones, filtro]
  );

  const totalPaginas = Math.max(
    1,
    Math.ceil(filtradas.length / TRANSACCIONES_POR_PAGINA)
  );
  const paginaActual = Math.min(pagina, totalPaginas);
  const paginadas = filtradas.slice(
    (paginaActual - 1) * TRANSACCIONES_POR_PAGINA,
    paginaActual * TRANSACCIONES_POR_PAGINA
  );

  const manejarFiltro = (nuevoFiltro: "TODAS" | TipoTransaccion) => {
    setFiltro(nuevoFiltro);
    setPagina(1);
  };

  const manejarEliminar = async (transaccion: TransaccionFinanciera) => {
    if (!usuario) return;
    setEliminando(transaccion.id);
    try {
      const idToken = await usuario.getIdToken();
      const resultado = await eliminarTransaccion(transaccion.id, idToken);
      if (resultado.ok) {
        toast.success("Operación eliminada");
        onEliminada?.();
      } else {
        toast.error(resultado.error);
      }
    } catch (error) {
      console.error("Error al eliminar la transacción:", error);
      toast.error("No se pudo eliminar la operación");
    } finally {
      setEliminando(null);
    }
  };

  return (
    <div className="rounded-2xl border border-border/60 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-heading text-base font-semibold uppercase tracking-wider text-muted-foreground">
          Historial de transacciones
        </h3>
        <div className="flex rounded-full bg-brand-cream p-1" role="group" aria-label="Filtrar por tipo">
          {FILTROS.map((opcion) => (
            <button
              key={opcion.valor}
              type="button"
              onClick={() => manejarFiltro(opcion.valor)}
              className={`rounded-full px-3 py-1.5 text-base font-semibold transition-colors ${
                filtro === opcion.valor
                  ? "bg-brand-rose text-white"
                  : "text-muted-foreground hover:text-brand-coffee"
              }`}
              aria-pressed={filtro === opcion.valor}
            >
              {opcion.label}
            </button>
          ))}
        </div>
      </div>

      {filtradas.length === 0 ? (
        <p className="mt-6 text-center text-base text-muted-foreground">
          No hay transacciones registradas.
        </p>
      ) : (
        <>
          <ul className="mt-4 divide-y divide-border/60">
            {paginadas.map((transaccion) => (
            <li
              key={transaccion.id}
              className="flex items-center gap-3 py-3"
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                  transaccion.type === "INGRESO"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {transaccion.type === "INGRESO" ? (
                  <ArrowDownCircle className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <ArrowUpCircle className="h-4 w-4" aria-hidden="true" />
                )}
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-semibold text-brand-coffee">
                  {transaccion.concept || "Sin concepto"}
                </p>
                <p className="text-base text-muted-foreground">
                  {formatearFechaHora(transaccion.date)}
                  {transaccion.paymentMethod ? ` · ${transaccion.paymentMethod.replaceAll("_", " ")}` : ""}
                </p>
              </div>

              <div className="text-right">
                <p
                  className={`text-base font-bold ${
                    transaccion.type === "INGRESO"
                      ? "text-emerald-600"
                      : "text-red-600"
                  }`}
                >
                  {transaccion.type === "INGRESO" ? "+" : "−"}
                  {formatearUSD(transaccion.amount)}
                </p>
                <p className="text-base text-muted-foreground">
                  {transaccion.amountBs > 0
                    ? `Bs. ${transaccion.amountBs.toLocaleString("es-VE", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`
                    : "—"}
                </p>
              </div>

              {esAdmin && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 shrink-0 text-muted-foreground hover:bg-red-50 hover:text-destructive"
                      disabled={eliminando === transaccion.id}
                      aria-label={`Eliminar operación ${transaccion.concept}`}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        ¿Eliminar esta operación?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {transaccion.concept || "Sin concepto"} por{" "}
                        {formatearUSD(transaccion.amount)} se eliminará
                        permanentemente
                        {transaccion.ordenId
                          ? ", y su orden quedará sin registro en finanzas"
                          : ""}
                        . Esta acción no se puede deshacer.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Volver</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => manejarEliminar(transaccion)}
                        disabled={eliminando === transaccion.id}
                        className="bg-destructive text-white hover:bg-destructive/90"
                      >
                        {eliminando === transaccion.id
                          ? "Eliminando..."
                          : "Eliminar operación"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </li>
          ))}
        </ul>

        {totalPaginas > 1 && (
          <div className="mt-4 flex items-center justify-center gap-4">
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
        </>
      )}
    </div>
  );
}
