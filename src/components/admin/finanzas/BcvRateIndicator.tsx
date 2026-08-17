"use client";

import { RefreshCw } from "lucide-react";
import { formatearBs } from "@/lib/utils";

interface BcvRateIndicatorProps {
  tasaBCV: number;
}

export function BcvRateIndicator({ tasaBCV }: BcvRateIndicatorProps) {
  const disponible = tasaBCV > 0;

  return (
    <div className="flex w-full items-center gap-3 rounded-2xl border border-border/60 bg-white p-5 sm:w-auto">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-rose-light">
        <RefreshCw className="h-5 w-5 text-brand-rose-deep" aria-hidden="true" />
      </span>
      <div>
        <h3 className="font-heading text-base font-semibold uppercase tracking-wider text-muted-foreground">
          Tasa BCV del día
        </h3>
        {disponible ? (
          <p className="mt-1 font-heading text-2xl font-bold text-brand-coffee">
            {formatearBs(tasaBCV)}
          </p>
        ) : (
          <p className="mt-1 text-base text-muted-foreground">
            No disponible en este momento
          </p>
        )}
      </div>
    </div>
  );
}
