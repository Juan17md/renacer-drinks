"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductsDataTable } from "@/components/admin/inventario/ProductsDataTable";
import { ProductFormModal } from "@/components/admin/inventario/ProductFormModal";
import { CategoryManager } from "@/components/admin/inventario/CategoryManager";
import type { Producto } from "@/types/product";
import type { Categoria } from "@/types/category";

interface InventarioClienteProps {
  productos: Producto[];
  categorias: Categoria[];
}

export function InventarioCliente({
  productos,
  categorias,
}: InventarioClienteProps) {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [productoEditando, setProductoEditando] = useState<Producto | null>(
    null
  );

  const abrirCrear = () => {
    setProductoEditando(null);
    setModalAbierto(true);
  };

  const abrirEditar = (producto: Producto) => {
    setProductoEditando(producto);
    setModalAbierto(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-brand-coffee sm:text-3xl">
            Inventario
          </h1>
          <p className="mt-1 text-base text-muted-foreground">
            {productos.length} producto{productos.length === 1 ? "" : "s"} en
            el menú
          </p>
        </div>
        <Button className="h-12" onClick={abrirCrear}>
          <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
          Agregar producto
        </Button>
      </div>

      <ProductsDataTable
        productos={productos}
        categorias={categorias}
        onEditar={abrirEditar}
      />

      <CategoryManager categorias={categorias} />

      <ProductFormModal
        abierto={modalAbierto}
        onOpenChange={setModalAbierto}
        producto={productoEditando}
        categorias={categorias}
      />
    </div>
  );
}