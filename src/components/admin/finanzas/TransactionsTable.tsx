"use client";

import { useMemo, useState } from "react";
import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { formatearUSD } from "@/lib/utils";
import type {
  TransaccionFinanciera,
  TipoTransaccion,
} from "@/types/transaction";

interface TransactionsTableProps {
  transacciones: TransaccionFinanciera[];
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

export function TransactionsTable({ transacciones }: TransactionsTableProps) {
  const [filtro, setFiltro] = useState<"TODAS" | TipoTransaccion>("TODAS");

  const filtradas = useMemo(
    () =>
      filtro === "TODAS"
        ? transacciones
        : transacciones.filter((t) => t.type === filtro),
    [transacciones, filtro]
  );

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
              onClick={() => setFiltro(opcion.valor)}
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
        <ul className="mt-4 divide-y divide-border/60">
          {filtradas.map((transaccion) => (
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
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
