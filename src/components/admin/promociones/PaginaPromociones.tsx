"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Pencil, Save, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { obtenerPromociones } from "@/services/promotions";
import {
  crearPromocion,
  actualizarPromocion,
  eliminarPromocion,
} from "@/actions/promotions";
import type { Promocion, OfertaPromocion } from "@/types/promotion";

interface EstadoFormulario {
  titulo: string;
  horario: string;
  descripcion: string;
  ofertas: OfertaPromocion[];
  activo: boolean;
}

const FORMULARIO_VACIO: EstadoFormulario = {
  titulo: "",
  horario: "",
  descripcion: "",
  ofertas: [{ nombre: "", precio: "" }],
  activo: true,
};

export function PaginaPromociones() {
  const [promociones, setPromociones] = useState<Promocion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<Promocion | null>(null);
  const [formulario, setFormulario] =
    useState<EstadoFormulario>(FORMULARIO_VACIO);
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState<Promocion | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    obtenerPromociones()
      .then(setPromociones)
      .catch(() => toast.error("No se pudieron cargar las promociones"))
      .finally(() => setCargando(false));
  }, []);

  const abrirNueva = () => {
    setEditando(null);
    setFormulario(FORMULARIO_VACIO);
    setError("");
    setModalAbierto(true);
  };

  const abrirEdicion = (promocion: Promocion) => {
    setEditando(promocion);
    setFormulario({
      titulo: promocion.titulo,
      horario: promocion.horario,
      descripcion: promocion.descripcion,
      ofertas:
        promocion.ofertas.length > 0
          ? promocion.ofertas.map((oferta) => ({ ...oferta }))
          : [{ nombre: "", precio: "" }],
      activo: promocion.activo,
    });
    setError("");
    setModalAbierto(true);
  };

  const actualizarFormulario = (cambios: Partial<EstadoFormulario>) => {
    setFormulario((anterior) => ({ ...anterior, ...cambios }));
  };

  const actualizarOferta = (indice: number, cambios: Partial<OfertaPromocion>) => {
    setFormulario((anterior) => ({
      ...anterior,
      ofertas: anterior.ofertas.map((oferta, i) =>
        i === indice ? { ...oferta, ...cambios } : oferta
      ),
    }));
  };

  const manejarGuardar = async () => {
    setError("");
    setGuardando(true);
    const resultado = editando
      ? await actualizarPromocion(editando.id, formulario)
      : await crearPromocion(formulario);
    setGuardando(false);

    if (!resultado.ok) {
      setError(resultado.error ?? "Error al guardar la promoción");
      return;
    }

    toast.success(
      editando ? "Promoción actualizada" : "Promoción creada"
    );
    setModalAbierto(false);
    const promocionesActualizadas = await obtenerPromociones();
    setPromociones(promocionesActualizadas);
  };

  const manejarEliminar = async () => {
    if (!eliminando) return;
    const resultado = await eliminarPromocion(eliminando.id);
    setEliminando(null);
    if (resultado.ok) {
      toast.success("Promoción eliminada");
      setPromociones((anterior) =>
        anterior.filter((promocion) => promocion.id !== eliminando.id)
      );
    } else {
      toast.error(resultado.error ?? "No se pudo eliminar la promoción");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-brand-coffee">
            Promociones
          </h1>
          <p className="mt-1 text-base text-muted-foreground">
            Las promociones activas aparecen en la sección &quot;Promociones del
            día&quot; de la landing.
          </p>
        </div>
        <Button
          type="button"
          onClick={abrirNueva}
        >
          <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
          Nueva promoción
        </Button>
      </div>

      {cargando ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-brand-rose-deep" />
        </div>
      ) : promociones.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border/60 bg-muted/20 px-6 py-12 text-center text-base text-muted-foreground">
          Aún no hay promociones. Crea la primera con &quot;Nueva promoción&quot;.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {promociones.map((promocion) => (
            <article
              key={promocion.id}
              className="flex flex-col rounded-2xl border border-border/60 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-heading text-lg font-bold text-brand-coffee">
                    {promocion.titulo}
                  </h2>
                  <p className="mt-0.5 text-sm text-brand-rose-deep">
                    {promocion.horario}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => abrirEdicion(promocion)}
                    aria-label={`Editar promoción ${promocion.titulo}`}
                  >
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 text-destructive hover:text-destructive"
                    onClick={() => setEliminando(promocion)}
                    aria-label={`Eliminar promoción ${promocion.titulo}`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>

              <p className="mt-3 flex-1 text-sm text-muted-foreground">
                {promocion.descripcion}
              </p>

              {promocion.ofertas.length > 0 && (
                <ul className="mt-4 space-y-1.5">
                  {promocion.ofertas.map((oferta) => (
                    <li
                      key={oferta.nombre}
                      className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2 text-sm"
                    >
                      <span className="text-brand-coffee">{oferta.nombre}</span>
                      <span className="font-medium text-brand-rose-deep">
                        {oferta.precio}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-4 flex items-center justify-between border-t border-dashed border-border/60 pt-3">
                <span className="text-sm text-muted-foreground">
                  {promocion.activo ? "Activa" : "Inactiva"}
                </span>
                <Switch
                  checked={promocion.activo}
                  onCheckedChange={async (activo) => {
                    const resultado = await actualizarPromocion(promocion.id, {
                      titulo: promocion.titulo,
                      horario: promocion.horario,
                      descripcion: promocion.descripcion,
                      ofertas: promocion.ofertas,
                      activo,
                    });
                    if (resultado.ok) {
                      toast.success(
                        activo
                          ? "Promoción activada"
                          : "Promoción desactivada"
                      );
                      setPromociones((anterior) =>
                        anterior.map((p) =>
                          p.id === promocion.id ? { ...p, activo } : p
                        )
                      );
                    } else {
                      toast.error("No se pudo cambiar el estado");
                    }
                  }}
                  aria-label={`Activar promoción ${promocion.titulo}`}
                />
              </div>
            </article>
          ))}
        </div>
      )}

      <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editando ? "Editar promoción" : "Nueva promoción"}
            </DialogTitle>
            <DialogDescription>
              Completa los datos de la promoción que verán los clientes en la
              landing.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="promocion-titulo">Título</Label>
              <Input
                id="promocion-titulo"
                value={formulario.titulo}
                onChange={(evento) =>
                  actualizarFormulario({ titulo: evento.target.value })
                }
                placeholder="Ej: Happy Hours"
                maxLength={80}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="promocion-horario">Horario</Label>
              <Input
                id="promocion-horario"
                value={formulario.horario}
                onChange={(evento) =>
                  actualizarFormulario({ horario: evento.target.value })
                }
                placeholder="Ej: Lunes a Sábado de 8AM a 12PM"
                maxLength={120}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="promocion-descripcion">Descripción</Label>
              <Input
                id="promocion-descripcion"
                value={formulario.descripcion}
                onChange={(evento) =>
                  actualizarFormulario({ descripcion: evento.target.value })
                }
                placeholder="Ej: Dos por el precio de uno en tus favoritas."
                maxLength={200}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Ofertas</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    actualizarFormulario({
                      ofertas: [
                        ...formulario.ofertas,
                        { nombre: "", precio: "" },
                      ],
                    })
                  }
                  aria-label="Agregar oferta"
                >
                  <Plus className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                  Agregar oferta
                </Button>
              </div>
              {formulario.ofertas.map((oferta, indice) => (
                <div
                  key={indice}
                  className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/20 p-2"
                >
                  <Input
                    value={oferta.nombre}
                    onChange={(evento) =>
                      actualizarOferta(indice, {
                        nombre: evento.target.value,
                      })
                    }
                    placeholder="Nombre (Ej: 2 Merengadas)"
                    aria-label={`Nombre de la oferta ${indice + 1}`}
                  />
                  <Input
                    value={oferta.precio}
                    onChange={(evento) =>
                      actualizarOferta(indice, { precio: evento.target.value })
                    }
                    placeholder="Precio (Ej: $4.50)"
                    className="w-32"
                    aria-label={`Precio de la oferta ${indice + 1}`}
                  />
                  {formulario.ofertas.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 shrink-0 text-destructive"
                      onClick={() =>
                        actualizarFormulario({
                          ofertas: formulario.ofertas.filter(
                            (_, i) => i !== indice
                          ),
                        })
                      }
                      aria-label={`Quitar oferta ${indice + 1}`}
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
              <div>
                <p className="text-base font-medium text-brand-coffee">Activa</p>
                <p className="text-base text-muted-foreground">
                  Se muestra en la landing mientras esté activa
                </p>
              </div>
              <Switch
                checked={formulario.activo}
                onCheckedChange={(activo) =>
                  actualizarFormulario({ activo })
                }
                aria-label="Promoción activa"
              />
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-lg bg-destructive/10 px-3 py-2 text-base text-destructive"
              >
                {error}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalAbierto(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={manejarGuardar}
              disabled={guardando}
            >
              {guardando ? (
                <Loader2
                  className="mr-1.5 h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <Save className="mr-1.5 h-4 w-4" aria-hidden="true" />
              )}
              {editando ? "Guardar cambios" : "Crear promoción"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(eliminando)}
        onOpenChange={(abierto) => {
          if (!abierto) setEliminando(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar la promoción?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará &quot;{eliminando?.titulo}&quot; de la landing y del panel.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={manejarEliminar}
              aria-label="Confirmar eliminación de promoción"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}