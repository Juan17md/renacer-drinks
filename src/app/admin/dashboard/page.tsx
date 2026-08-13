import Link from "next/link";
import { Package, ReceiptText, Wallet } from "lucide-react";
import { obtenerTasaBCV } from "@/lib/bcv";
import { formatearBs } from "@/lib/utils";

export const revalidate = 3600;

export default async function PaginaDashboard() {
  const tasa = await obtenerTasaBCV();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-brand-coffee sm:text-3xl">
          Dashboard
        </h1>
        <p className="mt-1 text-base text-muted-foreground">
          Resumen del panel de administración.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border/60 bg-white p-6">
          <h2 className="font-heading text-base font-semibold uppercase tracking-wider text-muted-foreground">
            Tasa BCV del día
          </h2>
          {tasa.promedio > 0 ? (
            <p className="mt-2 font-heading text-3xl font-bold text-brand-rose-deep">
              {formatearBs(tasa.promedio)}
            </p>
          ) : (
            <p className="mt-2 text-base text-muted-foreground">
              No disponible en este momento
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-border/60 bg-white p-6">
          <h2 className="font-heading text-base font-semibold uppercase tracking-wider text-muted-foreground">
            Accesos rápidos
          </h2>
          <div className="mt-4 flex flex-col gap-3">
            <Link
              href="/admin/ordenes"
              className="flex min-h-12 items-center gap-3 rounded-xl bg-brand-rose-light px-4 text-base font-medium text-brand-rose-deep transition-colors hover:bg-brand-rose/30"
            >
              <ReceiptText className="h-4 w-4" aria-hidden="true" />
              Ver órdenes en vivo
            </Link>
            <Link
              href="/admin/inventario"
              className="flex min-h-12 items-center gap-3 rounded-xl bg-brand-rose-light px-4 text-base font-medium text-brand-rose-deep transition-colors hover:bg-brand-rose/30"
            >
              <Package className="h-4 w-4" aria-hidden="true" />
              Gestionar inventario
            </Link>
            <Link
              href="/admin/finanzas"
              className="flex min-h-12 items-center gap-3 rounded-xl bg-brand-rose-light px-4 text-base font-medium text-brand-rose-deep transition-colors hover:bg-brand-rose/30"
            >
              <Wallet className="h-4 w-4" aria-hidden="true" />
              Registrar finanzas
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}