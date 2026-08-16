"use client";

import { useEffect, useState } from "react";
import {
  Loader2,
  Plus,
  Save,
  Trash2,
  Sparkles,
  PencilLine,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useAuth } from "@/hooks/useAuth";
import { obtenerMetodosPago } from "@/services/metodosPago";
import {
  crearMetodoPago,
  guardarMetodoPago,
  eliminarMetodoPago,
  sembrarMetodosPagoPorDefecto,
} from "@/actions/metodosPago";
import { cn } from "@/lib/utils";
import type { MetodoPagoConfig, DatoMetodoPago } from "@/types/payment";

interface EstadoEdicion {
  label: string;
  activo: boolean;
  requiereComprobante: boolean;
  datos: DatoMetodoPago[];
}

const FORMULARIO_VACIO: EstadoEdicion = {
  label: "",
  activo: true,
  requiereComprobante: false,
  datos: [],
};

export function PaginaMetodosPago() {
  const { usuario, esAdmin } = useAuth();
  const [metodos, setMetodos] = useState<MetodoPagoConfig[]>([]);
  const [cargando, setCargando] = useState(true);
  const [sembrando, setSembrando] = useState(false);
  const [guardando, setGuardando] = useState<string | null>(null);
  const [edicion, setEdicion] = useState<Record<string, EstadoEdicion>>({});
  const [modalAbierto, setModalAbierto] = useState(false);
  const [formularioNuevo, setFormularioNuevo] =
    useState<EstadoEdicion>(FORMULARIO_VACIO);
  const [creando, setCreando] = useState(false);
  const [eliminando, setEliminando] = useState<string | null>(null);

  const recargar = () => {
    obtenerMetodosPago()
      .then((metodosObtenidos) => {
        setMetodos(metodosObtenidos);
        const estadoInicial: Record<string, EstadoEdicion> = {};
        for (const metodo of metodosObtenidos) {
          estadoInicial[metodo.id] = {
            label: metodo.label,
            activo: metodo.activo,
            requiereComprobante: metodo.requiereComprobante,
            datos: metodo.datos.map((dato) => ({ ...dato })),
          };
        }
        setEdicion(estadoInicial);
      })
      .catch(() => toast.error("No se pudieron cargar los métodos de pago"))
      .finally(() => setCargando(false));
  };

  useEffect(() => {
    recargar();
  }, []);

  const actualizarEdicion = (
    id: string,
    cambios: Partial<EstadoEdicion>
  ) => {
    setEdicion((anterior) => ({
      ...anterior,
      [id]: { ...anterior[id], ...cambios },
    }));
  };

  const actualizarFormularioNuevo = (cambios: Partial<EstadoEdicion>) => {
    setFormularioNuevo((anterior) => ({ ...anterior, ...cambios }));
  };

  const manejarSembrar = async () => {
    setSembrando(true);
    const resultado = await sembrarMetodosPagoPorDefecto();
    setSembrando(false);
    if (resultado.ok) {
      toast.success("Métodos de pago cargados");
      window.location.reload();
    } else {
      toast.error(resultado.error);
    }
  };

  const manejarCrear = async () => {
    setCreando(true);
    const resultado = await crearMetodoPago(formularioNuevo);
    setCreando(false);
    if (resultado.ok) {
      toast.success("Método de pago creado");
      setModalAbierto(false);
      setFormularioNuevo(FORMULARIO_VACIO);
      recargar();
    } else {
      toast.error(resultado.error);
    }
  };

  const manejarEliminar = async (id: string) => {
    if (!usuario) return;
    setEliminando(id);
    const idToken = await usuario.getIdToken();
    const resultado = await eliminarMetodoPago(id, idToken);
    setEliminando(null);
    if (resultado.ok) {
      toast.success("Método de pago eliminado");
      recargar();
    } else {
      toast.error(resultado.error);
    }
  };

  const manejarGuardar = async (id: string) => {
    const actual = edicion[id];
    if (!actual) return;
    setGuardando(id);
    const resultado = await guardarMetodoPago(id, actual);
    setGuardando(null);
    if (resultado.ok) {
      toast.success("Método de pago guardado");
    } else {
      toast.error(resultado.error);
    }
  };

  const manejarToggleActivo = async (id: string, activo: boolean) => {
    const actual = edicion[id];
    if (!actual || guardando === id) return;
    const anterior = actual.activo;
    actualizarEdicion(id, { activo });
    setGuardando(id);
    const resultado = await guardarMetodoPago(id, { ...actual, activo });
    setGuardando(null);
    if (resultado.ok) {
      toast.success(activo ? "Método habilitado" : "Método deshabilitado");
    } else {
      actualizarEdicion(id, { activo: anterior });
      toast.error(resultado.error);
    }
  };

  if (cargando) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-border/60 bg-white py-16">
        <Loader2 className="h-8 w-8 animate-spin text-brand-rose-deep" aria-hidden="true" />
        <p className="text-base text-muted-foreground">Cargando métodos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-brand-coffee sm:text-3xl">
            Métodos de pago
          </h1>
          <p className="mt-1 text-base text-muted-foreground">
            Estos datos se muestran al cliente al pagar su pedido y los puede
            copiar con un toque.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          {metodos.length === 0 && (
            <Button
              onClick={manejarSembrar}
              disabled={sembrando}
              className="h-12"
            >
              {sembrando ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" aria-hidden="true" />
              )}
              Cargar métodos por defecto
            </Button>
          )}
          <Button
            onClick={() => setModalAbierto(true)}
            className="h-12"
          >
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Agregar método
          </Button>
        </div>
      </div>

      {metodos.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-border/60 bg-white px-6 py-16 text-center">
          <p className="font-medium text-brand-coffee">
            Aún no hay métodos de pago configurados
          </p>
          <p className="text-base text-muted-foreground">
            Carga los métodos por defecto o crea uno nuevo, y luego edita los
            datos con tu información real.
          </p>
        </div>
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {metodos.map((metodo) => {
            const actual = edicion[metodo.id];
            return (
              <li
                key={metodo.id}
                className="rounded-2xl border border-border/60 bg-white p-5"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-2">
                    <Label htmlFor={`label-${metodo.id}`}>Nombre</Label>
                    <Input
                      id={`label-${metodo.id}`}
                      value={actual?.label ?? ""}
                      onChange={(evento) =>
                        actualizarEdicion(metodo.id, {
                          label: evento.target.value,
                        })
                      }
                      className="h-11"
                      maxLength={60}
                    />
                  </div>
                  {esAdmin && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="mt-6 h-10 w-10 shrink-0 text-muted-foreground hover:bg-red-50 hover:text-destructive"
                          disabled={eliminando === metodo.id}
                          aria-label={`Eliminar método de pago ${metodo.label}`}
                        >
                          {eliminando === metodo.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                          ) : (
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            ¿Eliminar el método {metodo.label}?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Las órdenes y transacciones que ya lo usan
                            conservarán su registro. Esta acción no se puede
                            deshacer.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Volver</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => manejarEliminar(metodo.id)}
                            disabled={eliminando === metodo.id}
                            className="bg-destructive text-white hover:bg-destructive/90"
                          >
                            {eliminando === metodo.id
                              ? "Eliminando..."
                              : "Eliminar método"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
                  <div>
                    <p className="text-base font-medium text-brand-coffee">
                      Habilitado
                    </p>
                    <p className="text-base text-muted-foreground">
                      {actual?.activo
                        ? "Visible para los clientes al pagar"
                        : "Oculto para los clientes al pagar"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="secondary"
                      className={cn(
                        "h-6 px-2.5 text-xs font-semibold",
                        actual?.activo
                          ? "bg-[#588157] text-white"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {actual?.activo ? "Activo" : "Inactivo"}
                    </Badge>
                    <Switch
                      checked={actual?.activo ?? false}
                      onCheckedChange={(activo) =>
                        manejarToggleActivo(metodo.id, activo)
                      }
                      disabled={guardando === metodo.id}
                      aria-label={`Habilitar o deshabilitar ${metodo.label}`}
                    />
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
                  <div>
                    <p className="text-base font-medium text-brand-coffee">
                      Requiere comprobante
                    </p>
                    <p className="text-base text-muted-foreground">
                      El cliente debe subir imagen del pago para enviar el
                      pedido
                    </p>
                  </div>
                  <Switch
                    checked={actual?.requiereComprobante ?? false}
                    onCheckedChange={(requiereComprobante) =>
                      actualizarEdicion(metodo.id, { requiereComprobante })
                    }
                    aria-label={`Requerir comprobante para ${metodo.label}`}
                  />
                </div>

                <div className="mt-4">
                  <Label>Datos que verá el cliente</Label>
                  <ul className="mt-2 space-y-2">
                    {(actual?.datos ?? []).map((dato, indice) => (
                      <li key={indice} className="flex gap-2">
                        <Input
                          value={dato.etiqueta}
                          onChange={(evento) => {
                            const datos = [...(actual?.datos ?? [])];
                            datos[indice] = {
                              ...datos[indice],
                              etiqueta: evento.target.value,
                            };
                            actualizarEdicion(metodo.id, { datos });
                          }}
                          placeholder="Etiqueta (ej. Teléfono)"
                          className="h-10 w-1/3"
                          maxLength={40}
                          aria-label={`Etiqueta del dato ${indice + 1}`}
                        />
                        <Input
                          value={dato.valor}
                          onChange={(evento) => {
                            const datos = [...(actual?.datos ?? [])];
                            datos[indice] = {
                              ...datos[indice],
                              valor: evento.target.value,
                            };
                            actualizarEdicion(metodo.id, { datos });
                          }}
                          placeholder="Valor (ej. 0414-1234567)"
                          className="h-10 flex-1"
                          maxLength={100}
                          aria-label={`Valor del dato ${indice + 1}`}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={() =>
                            actualizarEdicion(metodo.id, {
                              datos: (actual?.datos ?? []).filter(
                                (_, i) => i !== indice
                              ),
                            })
                          }
                          aria-label={`Eliminar dato ${indice + 1}`}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                  {(actual?.datos ?? []).length < 10 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2 h-9"
                      onClick={() =>
                        actualizarEdicion(metodo.id, {
                          datos: [
                            ...(actual?.datos ?? []),
                            { etiqueta: "", valor: "" },
                          ],
                        })
                      }
                    >
                      <Plus className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                      Agregar dato
                    </Button>
                  )}
                </div>

                <Button
                  className="mt-4 h-11 w-full"
                  onClick={() => manejarGuardar(metodo.id)}
                  disabled={guardando === metodo.id}
                >
                  {guardando === metodo.id ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" aria-hidden="true" />
                  )}
                  Guardar cambios
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">
              Nuevo método de pago
            </DialogTitle>
            <DialogDescription>
              El identificador se genera automáticamente a partir del nombre.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="nuevo-metodo-label">Nombre *</Label>
              <Input
                id="nuevo-metodo-label"
                value={formularioNuevo.label}
                onChange={(evento) =>
                  actualizarFormularioNuevo({ label: evento.target.value })
                }
                placeholder="Ej. Pago en Bolívares"
                className="h-11"
                maxLength={60}
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
              <div>
                <p className="text-base font-medium text-brand-coffee">
                  Requiere comprobante
                </p>
                <p className="text-base text-muted-foreground">
                  El cliente debe subir imagen del pago para enviar el pedido
                </p>
              </div>
              <Switch
                checked={formularioNuevo.requiereComprobante}
                onCheckedChange={(requiereComprobante) =>
                  actualizarFormularioNuevo({ requiereComprobante })
                }
                aria-label="Requerir comprobante para el nuevo método"
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
              <div>
                <p className="text-base font-medium text-brand-coffee">
                  Habilitado
                </p>
                <p className="text-base text-muted-foreground">
                  Visible para los clientes al pagar
                </p>
              </div>
              <Switch
                checked={formularioNuevo.activo}
                onCheckedChange={(activo) =>
                  actualizarFormularioNuevo({ activo })
                }
                aria-label="Habilitar el nuevo método"
              />
            </div>

            <div>
              <Label>Datos que verá el cliente</Label>
              <ul className="mt-2 space-y-2">
                {formularioNuevo.datos.map((dato, indice) => (
                  <li key={indice} className="flex gap-2">
                    <Input
                      value={dato.etiqueta}
                      onChange={(evento) => {
                        const datos = [...formularioNuevo.datos];
                        datos[indice] = {
                          ...datos[indice],
                          etiqueta: evento.target.value,
                        };
                        actualizarFormularioNuevo({ datos });
                      }}
                      placeholder="Etiqueta (ej. Teléfono)"
                      className="h-10 w-1/3"
                      maxLength={40}
                      aria-label={`Etiqueta del nuevo dato ${indice + 1}`}
                    />
                    <Input
                      value={dato.valor}
                      onChange={(evento) => {
                        const datos = [...formularioNuevo.datos];
                        datos[indice] = {
                          ...datos[indice],
                          valor: evento.target.value,
                        };
                        actualizarFormularioNuevo({ datos });
                      }}
                      placeholder="Valor (ej. 0414-1234567)"
                      className="h-10 flex-1"
                      maxLength={100}
                      aria-label={`Valor del nuevo dato ${indice + 1}`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() =>
                        actualizarFormularioNuevo({
                          datos: formularioNuevo.datos.filter(
                            (_, i) => i !== indice
                          ),
                        })
                      }
                      aria-label={`Eliminar dato nuevo ${indice + 1}`}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </li>
                ))}
              </ul>
              {formularioNuevo.datos.length < 10 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2 h-9"
                  onClick={() =>
                    actualizarFormularioNuevo({
                      datos: [
                        ...formularioNuevo.datos,
                        { etiqueta: "", valor: "" },
                      ],
                    })
                  }
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                  Agregar dato
                </Button>
              )}
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="h-11"
                onClick={() => setModalAbierto(false)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={manejarCrear}
                disabled={creando}
                className="h-11"
              >
                {creando ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <PencilLine className="mr-2 h-4 w-4" aria-hidden="true" />
                )}
                Crear método
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}