"use client";

import { TrendingUp, TrendingDown, Scale } from "lucide-react";
import { formatearUSD, formatearBs } from "@/lib/utils";

export interface DatosKPIs {
  ingresos: number;
  egresos: number;
  balance: number;
  tasaBCV: number;
}

export function FinancialKPIs({ ingresos, egresos, balance, tasaBCV }: DatosKPIs) {
  const tarjetas = [
    {
      titulo: "Ingresos del mes",
      valorUSD: ingresos,
      icono: TrendingUp,
      color: "bg-emerald-100 text-emerald-700",
    },
    {
      titulo: "Egresos del mes",
      valorUSD: egresos,
      icono: TrendingDown,
      color: "bg-red-100 text-red-700",
    },
    {
      titulo: "Balance neto",
      valorUSD: balance,
      icono: Scale,
      color: "bg-brand-rose-light text-brand-rose-deep",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {tarjetas.map((tarjeta) => (
        <div
          key={tarjeta.titulo}
          className="rounded-2xl border border-border/60 bg-white p-5"
        >
          <div className="flex items-center gap-3">
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tarjeta.color}`}
            >
              <tarjeta.icono className="h-5 w-5" aria-hidden="true" />
            </span>
            <h3 className="font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {tarjeta.titulo}
            </h3>
          </div>
          <p className="mt-3 font-heading text-2xl font-bold text-brand-coffee">
            {formatearUSD(tarjeta.valorUSD)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatearBs(tarjeta.valorUSD * tasaBCV)}
          </p>
        </div>
      ))}
    </div>
  );
}
