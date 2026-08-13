"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { crearCategoria, eliminarCategoria } from "@/actions/products";
import type { Categoria } from "@/types/category";

export function CategoryManager({ categorias }: { categorias: Categoria[] }) {
  const [nombre, setNombre] = useState("");
  const [creando, setCreando] = useState(false);

  const manejarCrear = async (evento: React.FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    if (!nombre.trim()) return;

    setCreando(true);
    const resultado = await crearCategoria({ name: nombre });
    setCreando(false);

    if (resultado.ok) {
      toast.success(`Categoría "${nombre.trim()}" creada`);
      setNombre("");
    } else {
      toast.error(resultado.error ?? "No se pudo crear la categoría");
    }
  };

  const manejarEliminar = async (categoria: Categoria) => {
    const resultado = await eliminarCategoria(categoria.id);
    if (resultado.ok) {
      toast.success(`Categoría "${categoria.name}" eliminada`);
    } else {
      toast.error(resultado.error ?? "No se pudo eliminar la categoría");
    }
  };

  return (
    <div className="rounded-2xl border border-border/60 bg-white p-5">
      <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Categorías
      </h2>

      <form onSubmit={manejarCrear} className="mt-4 flex gap-2">
        <Input
          value={nombre}
          onChange={(evento) => setNombre(evento.target.value)}
          placeholder="Nueva categoría..."
          aria-label="Nombre de la nueva categoría"
          className="h-11 flex-1 text-base"
        />
        <Button
          type="submit"
          size="icon"
          className="h-11 w-11 shrink-0"
          disabled={creando || !nombre.trim()}
          aria-label="Crear categoría"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
        </Button>
      </form>

      <ul className="mt-4 flex flex-wrap gap-2">
        {categorias.map((categoria) => (
          <li key={categoria.id}>
            <Badge
              variant="secondary"
              className="gap-2 px-3 py-2 text-sm"
            >
              {categoria.name}
              <button
                type="button"
                onClick={() => manejarEliminar(categoria)}
                aria-label={`Eliminar categoría ${categoria.name}`}
                className="text-muted-foreground transition-colors hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}