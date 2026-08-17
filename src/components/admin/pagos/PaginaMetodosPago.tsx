"use client";

import { useEffect, useState } from "react";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

interface EstadoFormulario {
  label: string;
  activo: boolean;
  requiereComprobante: boolean;
  datos: DatoMetodoPago[];
}

const FORMULARIO_VACIO: EstadoFormulario = {
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
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [formulario, setFormulario] =
    useState<EstadoFormulario>(FORMULARIO_VACIO);
  const [enviandoModal, setEnviandoModal] = useState(false);
  const [eliminando, setEliminando] = useState<string | null>(null);

  const recargar = () => {
    obtenerMetodosPago()
      .then(setMetodos)
      .catch(() => toast.error("No se pudieron cargar los métodos de pago"))
      .finally(() => setCargando(false));
  };

  useEffect(() => {
    recargar();
  }, []);

  const actualizarFormulario = (cambios: Partial<EstadoFormulario>) => {
    setFormulario((anterior) => ({ ...anterior, ...cambios }));
  };

  const abrirCrear = () => {
    setEditandoId(null);
    setFormulario(FORMULARIO_VACIO);
    setModalAbierto(true);
  };

  const abrirEditar = (metodo: MetodoPagoConfig) => {
    setEditandoId(metodo.id);
    setFormulario({
      label: metodo.label,
      activo: metodo.activo,
      requiereComprobante: metodo.requiereComprobante,
      datos: metodo.datos.map((dato) => ({ ...dato })),
    });
    setModalAbierto(true);
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

  const manejarEnviarModal = async () => {
    setEnviandoModal(true);
    const resultado = editandoId
      ? await guardarMetodoPago(editandoId, formulario)
      : await crearMetodoPago(formulario);
    setEnviandoModal(false);
    if (resultado.ok) {
      toast.success(
        editandoId ? "Método de pago guardado" : "Método de pago creado"
      );
      setModalAbierto(false);
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

  const manejarToggleActivo = async (id: string, activo: boolean) => {
    if (guardando === id) return;
    const metodo = metodos.find((m) => m.id === id);
    if (!metodo) return;
    const anterior = metodo.activo;
    setMetodos((actuales) =>
      actuales.map((m) => (m.id === id ? { ...m, activo } : m))
    );
    setGuardando(id);
    const resultado = await guardarMetodoPago(id, {
      label: metodo.label,
      activo,
      requiereComprobante: metodo.requiereComprobante,
      datos: metodo.datos,
    });
    setGuardando(null);
    if (resultado.ok) {
      toast.success(activo ? "Método habilitado" : "Método deshabilitado");
    } else {
      setMetodos((actuales) =>
        actuales.map((m) => (m.id === id ? { ...m, activo: anterior } : m))
      );
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
          <Button onClick={abrirCrear} className="h-12">
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
        <>
          <div className="space-y-3 md:hidden">
            {metodos.map((metodo) => (
              <div
                key={metodo.id}
                className="rounded-2xl border border-border/60 bg-white p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium text-brand-coffee">{metodo.label}</p>
                  <Switch
                    checked={metodo.activo}
                    onCheckedChange={(activo) =>
                      manejarToggleActivo(metodo.id, activo)
                    }
                    disabled={guardando === metodo.id}
                    aria-label={`Habilitar o deshabilitar ${metodo.label}`}
                  />
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 text-base text-muted-foreground">
                  <Badge
                    variant="secondary"
                    className={cn(
                      "h-6 px-2.5 text-xs font-semibold",
                      metodo.activo
                        ? "bg-[#588157] text-white"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {metodo.activo ? "Activo" : "Inactivo"}
                  </Badge>
                  <span>
                    Requiere comprobante:{" "}
                    {metodo.requiereComprobante ? "Sí" : "No"}
                  </span>
                  <span>
                    {metodo.datos.length}{" "}
                    {metodo.datos.length === 1 ? "dato" : "datos"}
                  </span>
                </div>

                <div className="mt-4 flex flex-col gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10 w-full"
                    onClick={() => abrirEditar(metodo)}
                    aria-label={`Editar método ${metodo.label}`}
                  >
                    <Pencil className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                    Editar
                  </Button>
                  {esAdmin && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-10 w-full text-muted-foreground hover:bg-red-50 hover:text-destructive"
                          disabled={eliminando === metodo.id}
                          aria-label={`Eliminar método de pago ${metodo.label}`}
                        >
                          {eliminando === metodo.id ? (
                            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden="true" />
                          ) : (
                            <Trash2 className="mr-1.5 h-4 w-4" aria-hidden="true" />
                          )}
                          Eliminar
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
              </div>
            ))}
          </div>

          <div className="hidden overflow-x-auto rounded-2xl border border-border/60 bg-white md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Requiere comprobante</TableHead>
                <TableHead>Datos</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {metodos.map((metodo) => (
                <TableRow key={metodo.id}>
                  <TableCell className="font-medium text-brand-coffee">
                    {metodo.label}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className={cn(
                          "h-6 px-2.5 text-xs font-semibold",
                          metodo.activo
                            ? "bg-[#588157] text-white"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {metodo.activo ? "Activo" : "Inactivo"}
                      </Badge>
                      <Switch
                        checked={metodo.activo}
                        onCheckedChange={(activo) =>
                          manejarToggleActivo(metodo.id, activo)
                        }
                        disabled={guardando === metodo.id}
                        aria-label={`Habilitar o deshabilitar ${metodo.label}`}
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    {metodo.requiereComprobante ? "Sí" : "No"}
                  </TableCell>
                  <TableCell>
                    {metodo.datos.length}{" "}
                    {metodo.datos.length === 1 ? "dato" : "datos"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9"
                        onClick={() => abrirEditar(metodo)}
                        aria-label={`Editar método ${metodo.label}`}
                      >
                        <Pencil className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                        Editar
                      </Button>
                      {esAdmin && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 text-muted-foreground hover:bg-red-50 hover:text-destructive"
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </>
      )}

      <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">
              {editandoId
                ? "Editar método de pago"
                : "Nuevo método de pago"}
            </DialogTitle>
            <DialogDescription>
              {editandoId
                ? "Modifica la información del método y guarda los cambios."
                : "El identificador se genera automáticamente a partir del nombre."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="nuevo-metodo-label">Nombre *</Label>
              <Input
                id="nuevo-metodo-label"
                value={formulario.label}
                onChange={(evento) =>
                  actualizarFormulario({ label: evento.target.value })
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
                checked={formulario.requiereComprobante}
                onCheckedChange={(requiereComprobante) =>
                  actualizarFormulario({ requiereComprobante })
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
                checked={formulario.activo}
                onCheckedChange={(activo) =>
                  actualizarFormulario({ activo })
                }
                aria-label="Habilitar el nuevo método"
              />
            </div>

            <div>
              <Label>Datos que verá el cliente</Label>
              <ul className="mt-2 space-y-2">
                {formulario.datos.map((dato, indice) => (
                  <li key={indice} className="flex gap-2">
                    <Input
                      value={dato.etiqueta}
                      onChange={(evento) => {
                        const datos = [...formulario.datos];
                        datos[indice] = {
                          ...datos[indice],
                          etiqueta: evento.target.value,
                        };
                        actualizarFormulario({ datos });
                      }}
                      placeholder="Etiqueta (ej. Teléfono)"
                      className="h-10 w-1/3"
                      maxLength={40}
                      aria-label={`Etiqueta del nuevo dato ${indice + 1}`}
                    />
                    <Input
                      value={dato.valor}
                      onChange={(evento) => {
                        const datos = [...formulario.datos];
                        datos[indice] = {
                          ...datos[indice],
                          valor: evento.target.value,
                        };
                        actualizarFormulario({ datos });
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
                        actualizarFormulario({
                          datos: formulario.datos.filter(
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
              {formulario.datos.length < 10 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2 h-9"
                  onClick={() =>
                    actualizarFormulario({
                      datos: [
                        ...formulario.datos,
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
                onClick={manejarEnviarModal}
                disabled={enviandoModal}
                className="h-11"
              >
                {enviandoModal ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Pencil className="mr-2 h-4 w-4" aria-hidden="true" />
                )}
                {editandoId ? "Guardar cambios" : "Crear método"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}