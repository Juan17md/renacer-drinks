import { formatearUSD, formatearBs } from "@/lib/utils";

interface CartSummaryProps {
  totalUSD: number;
  totalBs: number;
  tasaBCV: number;
}

export function CartSummary({ totalUSD, totalBs, tasaBCV }: CartSummaryProps) {
  return (
    <div className="space-y-3 rounded-2xl bg-brand-rose-light/60 p-5">
      <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-brand-coffee">
        Resumen del pedido
      </h2>
      <dl className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">Total (USD)</dt>
          <dd className="font-bold text-brand-coffee">{formatearUSD(totalUSD)}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">Total (Bs.)</dt>
          <dd className="font-bold text-brand-rose-deep">{formatearBs(totalBs)}</dd>
        </div>
        {tasaBCV > 0 && (
          <div className="flex items-center justify-between border-t border-border/60 pt-2">
            <dt className="text-muted-foreground">Tasa BCV aplicada</dt>
            <dd className="font-medium">{formatearBs(tasaBCV)}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}