"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MaterialsDataTable } from "@/components/admin/inventario/MaterialsDataTable";
import { MaterialFormModal } from "@/components/admin/inventario/MaterialFormModal";
import type { Material } from "@/types/material";

interface InventarioClienteProps {
  materiales: Material[];
}

export function InventarioCliente({ materiales }: InventarioClienteProps) {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [materialEditando, setMaterialEditando] = useState<Material | null>(
    null
  );

  const abrirCrear = () => {
    setMaterialEditando(null);
    setModalAbierto(true);
  };

  const abrirEditar = (material: Material) => {
    setMaterialEditando(material);
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
            {materiales.length} material{materiales.length === 1 ? "" : "es"}{" "}
            registrados
          </p>
        </div>
        <Button className="h-12" onClick={abrirCrear}>
          <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
          Agregar material
        </Button>
      </div>

      <MaterialsDataTable
        materiales={materiales}
        onEditar={abrirEditar}
      />

      <MaterialFormModal
        abierto={modalAbierto}
        onOpenChange={setModalAbierto}
        material={materialEditando}
      />
    </div>
  );
}
