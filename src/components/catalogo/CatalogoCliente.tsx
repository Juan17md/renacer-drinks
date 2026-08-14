"use client";

import { useMemo, useState } from "react";
import { SearchBar } from "@/components/catalogo/SearchBar";
import { CategoryFilter } from "@/components/catalogo/CategoryFilter";
import { ProductGrid } from "@/components/catalogo/ProductGrid";
import { BcvBadgeHeader } from "@/components/catalogo/BcvBadgeHeader";
import type { ProductoPublico } from "@/types/product";
import type { Categoria } from "@/types/category";

interface CatalogoClienteProps {
  productos: ProductoPublico[];
  categorias: Categoria[];
  tasaBCV: number;
  fechaActualizacion: string;
}

export function CatalogoCliente({
  productos,
  categorias,
  tasaBCV,
  fechaActualizacion,
}: CatalogoClienteProps) {
  const [busqueda, setBusqueda] = useState("");
  const [categoriaActiva, setCategoriaActiva] = useState("todas");

  const productosFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    return productos.filter((producto) => {
      const coincideCategoria =
        categoriaActiva === "todas" || producto.category === categoriaActiva;
      const coincideBusqueda =
        termino === "" ||
        producto.name.toLowerCase().includes(termino) ||
        producto.description.toLowerCase().includes(termino);
      return coincideCategoria && coincideBusqueda;
    });
  }, [productos, busqueda, categoriaActiva]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-heading text-[1.75rem] font-bold text-brand-coffee sm:text-4xl">
              Nuestro menú
            </h1>
            <p className="mt-1 text-muted-foreground">
              Elige tu bebida favorita y envíala a la barra.
            </p>
          </div>
          <BcvBadgeHeader
            tasaBCV={tasaBCV}
            fechaActualizacion={fechaActualizacion}
          />
        </div>

        <SearchBar valor={busqueda} onCambiarValor={setBusqueda} />
        <CategoryFilter
          categorias={categorias}
          categoriaActiva={categoriaActiva}
          onCambiarCategoria={setCategoriaActiva}
        />
      </div>

      <ProductGrid productos={productosFiltrados} tasaBCV={tasaBCV} />
    </div>
  );
}