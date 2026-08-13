import { TrendingUp } from "lucide-react";
import { formatearBs } from "@/lib/utils";

interface BcvBadgeHeaderProps {
  tasaBCV: number;
  fechaActualizacion: string;
}

export function BcvBadgeHeader({
  tasaBCV,
  fechaActualizacion,
}: BcvBadgeHeaderProps) {
  if (tasaBCV <= 0) return null;

  const fecha = new Date(fechaActualizacion);
  const fechaFormateada = fecha.toLocaleDateString("es-VE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <div
      className="inline-flex flex-wrap items-center gap-2 rounded-full border border-brand-rose/40 bg-brand-rose-light px-4 py-2 text-sm"
      data-testid="bcv-badge"
    >
      <TrendingUp className="h-4 w-4 text-brand-rose-deep" aria-hidden="true" />
      <span className="font-semibold text-brand-rose-deep">
        Tasa BCV: {formatearBs(tasaBCV)}
      </span>
      <span className="text-muted-foreground">· Actualizada {fechaFormateada}</span>
    </div>
  );
}