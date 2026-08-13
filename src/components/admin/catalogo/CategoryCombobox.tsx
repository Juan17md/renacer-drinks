"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Loader2, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn, generarSlug } from "@/lib/utils";
import { crearCategoria } from "@/actions/products";
import type { Categoria } from "@/types/category";

interface CategoryComboboxProps {
  categorias: Categoria[];
  valor: string;
  onSeleccionar: (slug: string) => void;
}

export function CategoryCombobox({
  categorias,
  valor,
  onSeleccionar,
}: CategoryComboboxProps) {
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [creando, setCreando] = useState(false);
  const [error, setError] = useState("");

  const termino = busqueda.trim().toLowerCase();
  const filtradas = categorias.filter((categoria) =>
    categoria.name.toLowerCase().includes(termino)
  );
  const seleccionada = categorias.find((categoria) => categoria.slug === valor);
  const existeExacta = categorias.some(
    (categoria) => categoria.name.toLowerCase() === termino
  );

  const manejarCrear = async () => {
    if (!termino || existeExacta || creando) return;
    setCreando(true);
    setError("");
    const resultado = await crearCategoria({ name: termino });
    setCreando(false);
    if (resultado.ok) {
      onSeleccionar(generarSlug(termino));
      setBusqueda("");
      setAbierto(false);
    } else {
      setError(resultado.error ?? "No se pudo crear la categoría");
    }
  };

  return (
    <Popover open={abierto} onOpenChange={setAbierto}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={abierto}
          aria-label="Seleccionar categoría"
          className="h-12 w-full justify-between text-base font-normal"
        >
          {seleccionada ? (
            seleccionada.name
          ) : (
            <span className="text-muted-foreground">Selecciona...</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <div className="relative border-b border-border/60">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
            placeholder="Buscar categoría..."
            aria-label="Buscar categoría"
            className="h-11 border-0 pl-9 text-base focus-visible:ring-0"
          />
        </div>

        <div className="max-h-56 overflow-y-auto p-1.5">
          {filtradas.length === 0 && !existeExacta && (
            <Button
              type="button"
              variant="ghost"
              className="h-11 w-full justify-start gap-2 text-base"
              onClick={manejarCrear}
              disabled={creando || !termino}
            >
              {creando ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Plus className="h-4 w-4" aria-hidden="true" />
              )}
              {termino
                ? `Crear categoría "${busqueda.trim()}"`
                : "Escribe para crear una categoría"}
            </Button>
          )}

          {filtradas.map((categoria) => (
            <button
              key={categoria.id}
              type="button"
              onClick={() => {
                onSeleccionar(categoria.slug);
                setBusqueda("");
                setAbierto(false);
              }}
              className={cn(
                "flex min-h-11 w-full items-center justify-between rounded-lg px-3 py-2 text-left text-base transition-colors hover:bg-accent",
                categoria.slug === valor && "bg-accent"
              )}
            >
              <span>{categoria.name}</span>
              {categoria.slug === valor && (
                <Check className="h-4 w-4 text-brand-rose-deep" aria-hidden="true" />
              )}
            </button>
          ))}
        </div>

        {error && (
          <p
            role="alert"
            className="border-t border-border/60 px-3 py-2 text-base text-destructive"
          >
            {error}
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
}
