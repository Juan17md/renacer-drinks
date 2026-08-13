"use client";

import { cn } from "@/lib/utils";
import type { Categoria } from "@/types/category";

interface CategoryFilterProps {
  categorias: Categoria[];
  categoriaActiva: string;
  onCambiarCategoria: (slug: string) => void;
}

export function CategoryFilter({
  categorias,
  categoriaActiva,
  onCambiarCategoria,
}: CategoryFilterProps) {
  return (
    <div
      className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0"
      role="group"
      aria-label="Filtrar por categoría"
    >
      <div className="flex w-max gap-2">
        <button
          type="button"
          onClick={() => onCambiarCategoria("todas")}
          aria-pressed={categoriaActiva === "todas"}
          className={cn(
            "min-h-11 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-small font-medium transition-colors",
            categoriaActiva === "todas"
              ? "border-brand-rose-deep bg-brand-rose-deep text-white"
              : "border-border bg-white text-muted-foreground hover:border-brand-rose hover:text-brand-rose-deep"
          )}
        >
          Todas
        </button>
        {categorias.map((categoria) => {
          const activa = categoriaActiva === categoria.slug;
          return (
            <button
              key={categoria.id}
              type="button"
              onClick={() => onCambiarCategoria(categoria.slug)}
              aria-pressed={activa}
              className={cn(
                "min-h-11 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-small font-medium transition-colors",
                activa
                  ? "border-brand-rose-deep bg-brand-rose-deep text-white"
                  : "border-border bg-white text-muted-foreground hover:border-brand-rose hover:text-brand-rose-deep"
              )}
            >
              {categoria.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}