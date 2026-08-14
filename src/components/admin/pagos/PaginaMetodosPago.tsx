"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Save, Trash2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { obtenerMetodosPago } from "@/services/metodosPago";
import { guardarMetodoPago, sembrarMetodosPagoPorDefecto } from "@/actions/metodosPago";
import type { MetodoPagoConfig, DatoMetodoPago } from "@/types/payment";
import type { MetodoPago } from "@/types/transaction";

interface EstadoEdicion {
  label: string;
  activo: boolean;
  requiereComprobante: boolean;
  datos: DatoMetodoPago[];
}

export function PaginaMetodosPago() {
  const [metodos, setMetodos] = useState<MetodoPagoConfig[]>([]);
  const [cargando, setCargando] = useState(true);
  const [sembrando, setSembrando] = useState(false);
  const [guardando, setGuardando] = useState<MetodoPago | null>(null);
  const [edicion, setEdicion] = useState<Record<string, EstadoEdicion>>({});

  useEffect(() => {
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
  }, []);

  const actualizarEdicion = (
    id: MetodoPago,
    cambios: Partial<EstadoEdicion>
  ) => {
    setEdicion((anterior) => ({
      ...anterior,
      [id]: { ...anterior[id], ...cambios },
    }));
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

  const manejarGuardar = async (id: MetodoPago) => {
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
      </div>

      {metodos.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-border/60 bg-white px-6 py-16 text-center">
          <p className="font-medium text-brand-coffee">
            Aún no hay métodos de pago configurados
          </p>
          <p className="text-base text-muted-foreground">
            Carga los métodos por defecto y luego edita los datos con tu
            información real.
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
                  <Switch
                    checked={actual?.activo ?? false}
                    onCheckedChange={(activo) =>
                      actualizarEdicion(metodo.id, { activo })
                    }
                    aria-label={`Activar método ${metodo.label}`}
                  />
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
    </div>
  );
}