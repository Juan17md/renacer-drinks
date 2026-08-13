"use client";

import { Search, X } from "lucide-react";

interface SearchBarProps {
  valor: string;
  onCambiarValor: (valor: string) => void;
}

export function SearchBar({ valor, onCambiarValor }: SearchBarProps) {
  return (
    <div className="relative">
      <Search
        className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <input
        type="search"
        value={valor}
        onChange={(evento) => onCambiarValor(evento.target.value)}
        placeholder="Buscar bebidas, postres..."
        aria-label="Buscar productos del menú"
        className="h-12 w-full rounded-full border border-border bg-white pl-12 pr-12 text-base text-brand-coffee placeholder:text-muted-foreground focus:border-brand-rose focus:outline-none focus:ring-2 focus:ring-brand-rose/40"
      />
      {valor && (
        <button
          type="button"
          onClick={() => onCambiarValor("")}
          aria-label="Limpiar búsqueda"
          className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-brand-coffee"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}