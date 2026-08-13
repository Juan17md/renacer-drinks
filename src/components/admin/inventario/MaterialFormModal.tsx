"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { crearMaterial, actualizarMaterial } from "@/actions/materials";
import { UNIDADES_MEDIDA } from "@/types/material";
import type { Material } from "@/types/material";

interface MaterialFormModalProps {
  abierto: boolean;
  onOpenChange: (abierto: boolean) => void;
  material?: Material | null;
}

const OPCION_OTRA = "__otra__";

export function MaterialFormModal({
  abierto,
  onOpenChange,
  material,
}: MaterialFormModalProps) {
  const [nombre, setNombre] = useState("");
  const [unidad, setUnidad] = useState("");
  const [unidadOtra, setUnidadOtra] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const esOtra = unidad === OPCION_OTRA;
  const unidadFinal = esOtra ? unidadOtra.trim() : unidad;

  useEffect(() => {
    if (abierto) {
      const unidadActual = material?.unidad ?? "";
      const predefinida = UNIDADES_MEDIDA.includes(unidadActual);
      setNombre(material?.nombre ?? "");
      setUnidad(predefinida ? unidadActual : OPCION_OTRA);
      setUnidadOtra(predefinida ? "" : unidadActual);
      setCantidad(material ? String(material.cantidad) : "");
      setError("");
    }
  }, [abierto, material]);

  const manejarEnvio = async (evento: React.FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    setError("");

    const cantidadNumerica = Number(cantidad);
    if (!nombre.trim()) {
      setError("El nombre del material es obligatorio.");
      return;
    }
    if (!unidadFinal) {
      setError("Indica la unidad de medida.");
      return;
    }
    if (!cantidad || Number.isNaN(cantidadNumerica) || cantidadNumerica < 0) {
      setError("Ingresa una cantidad válida.");
      return;
    }

    setGuardando(true);
    const datos = {
      nombre: nombre.trim(),
      unidad: unidadFinal,
      cantidad: cantidadNumerica,
    };

    const resultado = material
      ? await actualizarMaterial(material.id, datos)
      : await crearMaterial(datos);

    setGuardando(false);

    if (resultado.ok) {
      toast.success(material ? "Material actualizado" : "Material creado");
      onOpenChange(false);
    } else {
      setError(resultado.error ?? "Error al guardar");
    }
  };

  return (
    <Dialog open={abierto} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">
            {material ? "Editar material" : "Agregar material"}
          </DialogTitle>
          <DialogDescription>
            Registra los materiales con los que cuenta el negocio y su
            cantidad disponible.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={manejarEnvio} className="space-y-5" noValidate>
          <div className="space-y-2">
            <Label htmlFor="material-nombre">Nombre *</Label>
            <Input
              id="material-nombre"
              value={nombre}
              onChange={(evento) => setNombre(evento.target.value)}
              placeholder="Ej. Leche entera"
              className="h-12 text-base"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="material-unidad">Unidad de medida</Label>
              <Select value={unidad} onValueChange={setUnidad}>
                <SelectTrigger id="material-unidad" className="h-12 text-base">
                  <SelectValue placeholder="Selecciona..." />
                </SelectTrigger>
                <SelectContent>
                  {UNIDADES_MEDIDA.map((unidadDisponible) => (
                    <SelectItem key={unidadDisponible} value={unidadDisponible}>
                      {unidadDisponible}
                    </SelectItem>
                  ))}
                  <SelectItem value={OPCION_OTRA}>Otra...</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="material-cantidad">Cantidad *</Label>
              <Input
                id="material-cantidad"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={cantidad}
                onChange={(evento) => setCantidad(evento.target.value)}
                placeholder="0"
                className="h-12 text-base"
              />
            </div>
          </div>

          {esOtra && (
            <div className="space-y-2">
              <Label htmlFor="material-unidad-otra">Escribe la unidad *</Label>
              <Input
                id="material-unidad-otra"
                value={unidadOtra}
                onChange={(evento) => setUnidadOtra(evento.target.value)}
                placeholder="Ej. docena, galón..."
                className="h-12 text-base"
              />
            </div>
          )}

          {error && (
            <p
              role="alert"
              className="rounded-lg bg-destructive/10 px-3 py-2 text-base text-destructive"
            >
              {error}
            </p>
          )}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="h-12"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={guardando} className="h-12">
              {guardando && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              )}
              {material ? "Guardar cambios" : "Crear material"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
