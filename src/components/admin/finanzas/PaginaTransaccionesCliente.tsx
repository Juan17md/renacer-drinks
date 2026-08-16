"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { obtenerTransacciones } from "@/services/transactions";
import type { TransaccionFinanciera } from "@/types/transaction";
import { TransactionsTable } from "./TransactionsTable";

export function PaginaTransaccionesCliente() {
  const [transacciones, setTransacciones] = useState<TransaccionFinanciera[]>(
    []
  );
  const [cargando, setCargando] = useState(true);

  const cargarDatos = useCallback(async () => {
    const transaccionesObtenidas = await obtenerTransacciones(200);
    setTransacciones(transaccionesObtenidas);
    setCargando(false);
  }, []);

  useEffect(() => {
    cargarDatos().catch(() => setCargando(false));
  }, [cargarDatos]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-brand-coffee sm:text-3xl">
            Historial de transacciones
          </h1>
          <p className="mt-1 text-base text-muted-foreground">
            Todas las operaciones registradas en finanzas.
          </p>
        </div>
        <Link
          href="/admin/finanzas"
          className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-white px-4 py-2 text-base font-semibold text-brand-coffee transition-colors hover:bg-brand-cream"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver a finanzas
        </Link>
      </div>

      {cargando ? (
        <p className="text-base text-muted-foreground">
          Cargando historial de transacciones...
        </p>
      ) : (
        <TransactionsTable
          transacciones={transacciones}
          onEliminada={cargarDatos}
        />
      )}
    </div>
  );
}