"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import {
  ReceiptText,
  Loader2,
  CheckCheck,
  UtensilsCrossed,
  ChevronRight,
  User,
  Clock,
  RefreshCw,
  XCircle,
  CreditCard,
  ImageIcon,
  ShieldCheck,
} from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  escucharOrdenes,
  actualizarEstadoOrden,
  verificarPagoOrden,
} from "@/services/orders";
import { registrarIngresoPorOrden } from "@/services/transactions";
import { ESTADOS_ORDEN, type Orden, type EstadoOrden } from "@/types/order";
import { METODOS_PAGO } from "@/types/transaction";
import { formatearUSD, formatearBs, obtenerFechaLocalISO } from "@/lib/utils";
import { cn } from "@/lib/utils";

const ORDEN_POR_ESTADO: EstadoOrden[] = ["recibida", "lista", "entregada", "cancelada"];

const COLOR_ESTADO: Record<EstadoOrden, string> = {
  recibida: "bg-amber-100 text-amber-800",
  lista: "bg-emerald-100 text-emerald-800",
  entregada: "bg-muted text-muted-foreground",
  cancelada: "bg-red-100 text-red-700",
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

function obtenerLabelMetodoPago(metodoPago?: string): string {
  if (!metodoPago) return "";
  return (
    METODOS_PAGO.find((metodo) => metodo.valor === metodoPago)?.label ??
    metodoPago
  );
}

export function PanelOrdenes() {
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [filtro, setFiltro] = useState<EstadoOrden | "todas">("recibida");
  const [cargando, setCargando] = useState(true);
  const [cambiando, setCambiando] = useState<string | null>(null);
  const [cancelando, setCancelando] = useState<string | null>(null);
  const [verificando, setVerificando] = useState<string | null>(null);
  const [comprobanteVisible, setComprobanteVisible] = useState<Orden | null>(
    null
  );

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

      if (estadoActual.siguiente === "entregada") {
        try {
          await registrarIngresoPorOrden(
            orden.id,
            orden.totalUSD,
            `Venta orden #${orden.numero}`
          );
          toast.success(
            `Ingreso de ${formatearUSD(orden.totalUSD)} registrado en finanzas`
          );
        } catch {
          toast.error("La orden se entregó pero no se registró el ingreso");
        }
      }
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

  const manejarCancelar = async (orden: Orden) => {
    setCancelando(orden.id);
    try {
      await actualizarEstadoOrden(orden.id, "cancelada");
      toast.success(`Orden #${orden.numero} cancelada`);
    } catch (error) {
      console.error("Error al cancelar orden:", error);
      toast.error("No se pudo cancelar la orden");
    } finally {
      setCancelando(null);
    }
  };

  const manejarVerificarPago = async (orden: Orden) => {
    setVerificando(orden.id);
    try {
      await verificarPagoOrden(orden.id);
      toast.success(
        `Pago de la orden #${orden.numero} verificado (${obtenerLabelMetodoPago(
          orden.metodoPago
        )})`
      );
    } catch (error) {
      console.error("Error al verificar pago:", error);
      toast.error("No se pudo verificar el pago");
    } finally {
      setVerificando(null);
    }
  };

  const pendientes = ordenes.filter(
    (o) => o.estado !== "entregada" && o.estado !== "cancelada"
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-brand-coffee sm:text-3xl">
            Órdenes en vivo
          </h1>
          <p className="mt-1 text-base text-muted-foreground">
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
          <p className="text-base text-muted-foreground">Conectando en tiempo real...</p>
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
            <p className="mt-1 text-base text-muted-foreground">
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
                  orden.estado === "entregada" || orden.estado === "cancelada"
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
                      <p className="flex items-center gap-1.5 text-base text-muted-foreground">
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
                      className="flex items-baseline justify-between gap-3 text-base"
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

                {orden.metodoPago && (
                  <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-muted/30 px-3 py-2">
                    <span className="flex items-center gap-1.5 text-base font-medium text-brand-coffee">
                      <CreditCard
                        className="h-4 w-4 text-muted-foreground"
                        aria-hidden="true"
                      />
                      {obtenerLabelMetodoPago(orden.metodoPago)}
                    </span>
                    {orden.pagoVerificado ? (
                      <Badge className="bg-emerald-100 text-emerald-800">
                        Pago verificado
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-100 text-amber-800">
                        Pago pendiente
                      </Badge>
                    )}
                    {orden.comprobanteUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="ml-auto h-8"
                        onClick={() => setComprobanteVisible(orden)}
                        aria-label={`Ver comprobante de la orden ${orden.numero}`}
                      >
                        <ImageIcon className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                        Ver comprobante
                      </Button>
                    )}
                    {orden.pagoVerificado === false && (
                      <Button
                        size="sm"
                        className="h-8"
                        onClick={() => manejarVerificarPago(orden)}
                        disabled={verificando === orden.id}
                        aria-label={`Verificar pago de la orden ${orden.numero}`}
                      >
                        {verificando === orden.id ? (
                          <Loader2
                            className="mr-1.5 h-3.5 w-3.5 animate-spin"
                            aria-hidden="true"
                          />
                        ) : (
                          <ShieldCheck
                            className="mr-1.5 h-3.5 w-3.5"
                            aria-hidden="true"
                          />
                        )}
                        Verificar pago
                      </Button>
                    )}
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between border-t border-dashed border-border/60 pt-3">
                  <div>
                    <p className="font-heading text-lg font-bold text-brand-coffee">
                      {formatearUSD(orden.totalUSD)}
                    </p>
                    <p className="text-base text-muted-foreground">
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
                        disabled={
                          cambiando === orden.id ||
                          (estado.siguiente === "lista" &&
                            orden.pagoVerificado === false)
                        }
                        title={
                          estado.siguiente === "lista" &&
                          orden.pagoVerificado === false
                            ? "Verifica el pago antes de avanzar"
                            : undefined
                        }
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
                    {(orden.estado === "recibida" || orden.estado === "lista") && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 text-muted-foreground hover:bg-red-50 hover:text-destructive"
                            disabled={cambiando === orden.id || cancelando === orden.id}
                            aria-label={`Cancelar orden ${orden.numero}`}
                          >
                            <XCircle className="h-4 w-4" aria-hidden="true" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              ¿Cancelar la orden #{orden.numero}?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              La orden de {orden.nombreCliente} se marcará como
                              cancelada. Esta acción no se puede deshacer.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Volver</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => manejarCancelar(orden)}
                              disabled={cancelando === orden.id}
                              className="bg-destructive text-white hover:bg-destructive/90"
                            >
                              {cancelando === orden.id
                                ? "Cancelando..."
                                : "Cancelar orden"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog
        open={Boolean(comprobanteVisible)}
        onOpenChange={(abierto) => {
          if (!abierto) setComprobanteVisible(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Comprobante de la orden #
              {comprobanteVisible?.numero}
            </DialogTitle>
            <DialogDescription>
              Pago de {comprobanteVisible?.nombreCliente} por{" "}
              {obtenerLabelMetodoPago(comprobanteVisible?.metodoPago)}.
            </DialogDescription>
          </DialogHeader>
          {comprobanteVisible?.comprobanteUrl && (
            <div className="overflow-hidden rounded-xl border border-border/60 bg-muted/30">
              <Image
                src={comprobanteVisible.comprobanteUrl}
                alt={`Comprobante de pago de la orden #${comprobanteVisible.numero}`}
                width={640}
                height={480}
                className="h-auto w-full object-contain"
              />
            </div>
          )}
          {comprobanteVisible && comprobanteVisible.pagoVerificado === false && (
            <Button
              type="button"
              className="mt-4 w-full"
              onClick={() => {
                manejarVerificarPago(comprobanteVisible);
                setComprobanteVisible(null);
              }}
              disabled={verificando === comprobanteVisible.id}
              aria-label={`Verificar pago de la orden ${comprobanteVisible.numero}`}
            >
              {verificando === comprobanteVisible.id ? (
                <Loader2
                  className="mr-1.5 h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <ShieldCheck className="mr-1.5 h-4 w-4" aria-hidden="true" />
              )}
              Verificar pago
            </Button>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
