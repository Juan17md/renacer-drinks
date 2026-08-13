"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ReceiptText,
  Loader2,
  CheckCheck,
  UtensilsCrossed,
  ChevronRight,
  User,
  Clock,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  escucharOrdenes,
  actualizarEstadoOrden,
} from "@/services/orders";
import { ESTADOS_ORDEN, type Orden, type EstadoOrden } from "@/types/order";
import { formatearUSD, formatearBs, obtenerFechaLocalISO } from "@/lib/utils";
import { cn } from "@/lib/utils";

const ORDEN_POR_ESTADO: EstadoOrden[] = ["recibida", "lista", "entregada"];

const COLOR_ESTADO: Record<EstadoOrden, string> = {
  recibida: "bg-amber-100 text-amber-800",
  lista: "bg-emerald-100 text-emerald-800",
  entregada: "bg-muted text-muted-foreground",
};

function formatearHora(iso: string): string {
  if (!iso) return "—";
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return "—";
  return fecha.toLocaleTimeString("es-VE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PanelOrdenes() {
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [filtro, setFiltro] = useState<EstadoOrden | "todas">("recibida");
  const [cargando, setCargando] = useState(true);
  const [cambiando, setCambiando] = useState<string | null>(null);

  useEffect(() => {
    const desuscribir = escucharOrdenes(
      (ordenesActuales) => {
        setOrdenes(ordenesActuales);
        setCargando(false);
      },
      () => {
        setCargando(false);
        toast.error("No se pudo conectar con las órdenes en tiempo real");
      }
    );

    return desuscribir;
  }, []);

  const ordenesVisibles =
    filtro === "todas"
      ? ordenes
      : ordenes.filter((orden) => orden.estado === filtro);

  const avisarError = useCallback((error: unknown) => {
    console.error("Error al actualizar orden:", error);
    toast.error("No se pudo actualizar el estado de la orden");
  }, []);

  const manejarAvanzar = async (orden: Orden) => {
    const estadoActual = ESTADOS_ORDEN[orden.estado];
    if (!estadoActual?.siguiente) return;

    setCambiando(orden.id);
    try {
      await actualizarEstadoOrden(orden.id, estadoActual.siguiente);
      toast.success(
        `Orden #${orden.numero} → ${ESTADOS_ORDEN[estadoActual.siguiente].label}`
      );
    } catch (error) {
      avisarError(error);
    } finally {
      setCambiando(null);
    }
  };

  const manejarRegresar = async (orden: Orden) => {
    const estadoActual = ESTADOS_ORDEN[orden.estado];
    if (!estadoActual?.anterior) return;

    setCambiando(orden.id);
    try {
      await actualizarEstadoOrden(orden.id, estadoActual.anterior);
      toast.success(
        `Orden #${orden.numero} → ${ESTADOS_ORDEN[estadoActual.anterior].label}`
      );
    } catch (error) {
      avisarError(error);
    } finally {
      setCambiando(null);
    }
  };

  const pendientes = ordenes.filter((o) => o.estado !== "entregada").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-brand-coffee sm:text-3xl">
            Órdenes en vivo
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {pendientes === 0
              ? "No hay órdenes pendientes."
              : `${pendientes} órdenes pendiente${pendientes === 1 ? "" : "s"} en la barra.`}
          </p>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {(["todas", ...ORDEN_POR_ESTADO] as const).map((estado) => (
            <Button
              key={estado}
              variant={filtro === estado ? "default" : "outline"}
              size="sm"
              className="h-10 shrink-0"
              onClick={() => setFiltro(estado)}
              aria-pressed={filtro === estado}
            >
              {estado === "todas"
                ? "Todas"
                : ESTADOS_ORDEN[estado].label}
            </Button>
          ))}
        </div>
      </div>

      {cargando ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border/60 bg-white py-16">
          <Loader2 className="h-8 w-8 animate-spin text-brand-rose-deep" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">Conectando en tiempo real...</p>
        </div>
      ) : ordenesVisibles.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-border/60 bg-white px-6 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-rose-light">
            <ReceiptText className="h-8 w-8 text-brand-rose-deep" aria-hidden="true" />
          </div>
          <div>
            <p className="font-medium text-brand-coffee">
              Sin órdenes en esta vista
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Cuando un cliente envíe un pedido desde su celular, aparecerá aquí
              al instante.
            </p>
          </div>
        </div>
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {ordenesVisibles.map((orden) => {
            const estado = ESTADOS_ORDEN[orden.estado];
            const hora = formatearHora(orden.createdAt);
            const hoy = obtenerFechaLocalISO().slice(0, 10);
            const esDeHoy = orden.createdAt.slice(0, 10) === hoy;

            return (
              <li
                key={orden.id}
                className={cn(
                  "rounded-2xl border bg-white p-5 transition-opacity",
                  orden.estado === "entregada"
                    ? "border-border/60 opacity-70"
                    : "border-brand-rose/40 shadow-sm"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-rose-light font-heading text-lg font-bold text-brand-rose-deep">
                      #{orden.numero}
                    </span>
                    <div>
                      <p className="flex items-center gap-1.5 font-medium text-brand-coffee">
                        <User className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                        {orden.nombreCliente}
                      </p>
                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                        {esDeHoy ? `Hoy ${hora}` : hora}
                      </p>
                    </div>
                  </div>
                  <Badge className={cn("shrink-0", COLOR_ESTADO[orden.estado])}>
                    {estado.label}
                  </Badge>
                </div>

                <ul className="mt-4 space-y-1.5">
                  {orden.items.map((item, indice) => (
                    <li
                      key={indice}
                      className="flex items-baseline justify-between gap-3 text-sm"
                    >
                      <span className="text-brand-coffee">
                        <span className="font-semibold">{item.cantidad}×</span>{" "}
                        {item.nombre}
                      </span>
                      <span className="shrink-0 text-muted-foreground">
                        {formatearUSD(item.subtotal)}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mt-4 flex items-center justify-between border-t border-dashed border-border/60 pt-3">
                  <div>
                    <p className="font-heading text-lg font-bold text-brand-coffee">
                      {formatearUSD(orden.totalUSD)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatearBs(orden.totalBs)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {estado.anterior && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-10"
                        onClick={() => manejarRegresar(orden)}
                        disabled={cambiando === orden.id}
                        aria-label={`Regresar orden ${orden.numero} a ${ESTADOS_ORDEN[estado.anterior].label}`}
                      >
                        <RefreshCw className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                        {ESTADOS_ORDEN[estado.anterior].label}
                      </Button>
                    )}
                    {estado.siguiente && (
                      <Button
                        size="sm"
                        className="h-10"
                        onClick={() => manejarAvanzar(orden)}
                        disabled={cambiando === orden.id}
                        aria-label={`Marcar orden ${orden.numero} como ${ESTADOS_ORDEN[estado.siguiente].label}`}
                      >
                        {cambiando === orden.id ? (
                          <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden="true" />
                        ) : estado.siguiente === "entregada" ? (
                          <CheckCheck className="mr-1.5 h-4 w-4" aria-hidden="true" />
                        ) : (
                          <UtensilsCrossed className="mr-1.5 h-4 w-4" aria-hidden="true" />
                        )}
                        {ESTADOS_ORDEN[estado.siguiente].label}
                        {estado.siguiente !== "entregada" && (
                          <ChevronRight className="h-4 w-4" aria-hidden="true" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
