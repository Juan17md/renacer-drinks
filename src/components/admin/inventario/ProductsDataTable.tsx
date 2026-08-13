"use client";

import { useState } from "react";
import Image from "next/image";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowUpDown, Pencil, Trash2, Search } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { formatearUSD } from "@/lib/utils";
import {
  actualizarProducto,
  eliminarProducto,
} from "@/actions/products";
import type { Producto } from "@/types/product";
import type { Categoria } from "@/types/category";

interface ProductsDataTableProps {
  productos: Producto[];
  categorias: Categoria[];
  onEditar: (producto: Producto) => void;
}

export function ProductsDataTable({
  productos,
  categorias,
  onEditar,
}: ProductsDataTableProps) {
  const [ordenamiento, setOrdenamiento] = useState<SortingState>([]);
  const [filtroGlobal, setFiltroGlobal] = useState("");

  const columnas: ColumnDef<Producto>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <button
          type="button"
          className="flex min-h-9 items-center gap-1 font-medium"
          onClick={() => column.toggleSorting()}
        >
          Nombre
          <ArrowUpDown className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-brand-rose-light">
            {row.original.imageUrl ? (
              <Image
                src={row.original.imageUrl}
                alt={row.original.name}
                fill
                sizes="40px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <span className="text-lg" aria-hidden="true">☕</span>
              </div>
            )}
          </div>
          <span className="font-medium text-brand-coffee">
            {row.original.name}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "category",
      header: "Categoría",
      cell: ({ row }) => {
        const categoria = categorias.find(
          (c) => c.slug === row.original.category
        );
        return (
          <Badge variant="secondary" className="whitespace-nowrap">
            {categoria?.name ?? row.original.category}
          </Badge>
        );
      },
    },
    {
      accessorKey: "price",
      header: ({ column }) => (
        <button
          type="button"
          className="flex min-h-9 items-center gap-1 font-medium"
          onClick={() => column.toggleSorting()}
        >
          Precio USD
          <ArrowUpDown className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      ),
      cell: ({ row }) => (
        <span className="font-semibold text-brand-rose-deep">
          {formatearUSD(row.original.price)}
        </span>
      ),
    },
    {
      id: "disponibilidad",
      header: "Disponible",
      cell: ({ row }) => (
        <ToggleDisponibilidad producto={row.original} />
      ),
    },
    {
      id: "acciones",
      header: "Acciones",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 text-muted-foreground hover:text-brand-rose-deep"
            onClick={() => onEditar(row.original)}
            aria-label={`Editar ${row.original.name}`}
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
          </Button>
          <EliminarProducto producto={row.original} />
        </div>
      ),
    },
  ];

  const tabla = useReactTable({
    data: productos,
    columns: columnas,
    state: { sorting: ordenamiento, globalFilter: filtroGlobal },
    onSortingChange: setOrdenamiento,
    onGlobalFilterChange: setFiltroGlobal,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: (fila, _columnaId, valor) => {
      const producto = fila.original as Producto;
      const termino = String(valor).toLowerCase();
      return (
        producto.name.toLowerCase().includes(termino) ||
        producto.description.toLowerCase().includes(termino)
      );
    },
  });

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          type="search"
          value={filtroGlobal}
          onChange={(evento) => setFiltroGlobal(evento.target.value)}
          placeholder="Buscar producto..."
          aria-label="Buscar producto en el inventario"
          className="h-11 w-full rounded-lg border border-input bg-white pl-10 pr-3 text-base text-brand-coffee placeholder:text-muted-foreground focus:border-brand-rose focus:outline-none focus:ring-2 focus:ring-brand-rose/40"
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border/60 bg-white">
        <Table>
          <TableHeader>
            {tabla.getHeaderGroups().map((grupoCabecera) => (
              <TableRow key={grupoCabecera.id}>
                {grupoCabecera.headers.map((cabecera) => (
                  <TableHead key={cabecera.id}>
                    {cabecera.isPlaceholder
                      ? null
                      : flexRender(
                          cabecera.column.columnDef.header,
                          cabecera.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {tabla.getRowModel().rows.length > 0 ? (
              tabla.getRowModel().rows.map((fila) => (
                <TableRow key={fila.id}>
                  {fila.getVisibleCells().map((celda) => (
                    <TableCell key={celda.id}>
                      {flexRender(
                        celda.column.columnDef.cell,
                        celda.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columnas.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No hay productos que coincidan con la búsqueda.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function ToggleDisponibilidad({ producto }: { producto: Producto }) {
  const [cambiando, setCambiando] = useState(false);

  const manejarCambio = async (disponible: boolean) => {
    setCambiando(true);
    try {
      const resultado = await actualizarProducto(producto.id, {
        name: producto.name,
        description: producto.description,
        price: producto.price,
        category: producto.category,
        isAvailable: disponible,
        imageUrl: producto.imageUrl,
        imageId: producto.imageId,
      });
      if (resultado.ok) {
        toast.success(
          `${producto.name} ${disponible ? "disponible" : "agotado"}`
        );
      } else {
        toast.error(resultado.error);
      }
    } finally {
      setCambiando(false);
    }
  };

  return (
    <Switch
      checked={producto.isAvailable}
      onCheckedChange={manejarCambio}
      disabled={cambiando}
      aria-label={`Disponibilidad de ${producto.name}`}
    />
  );
}

function EliminarProducto({ producto }: { producto: Producto }) {
  const [eliminando, setEliminando] = useState(false);

  const manejarEliminar = async () => {
    setEliminando(true);
    try {
      const resultado = await eliminarProducto(producto.id, producto.imageId);
      if (resultado.ok) {
        toast.success(`${producto.name} eliminado`);
      } else {
        toast.error(resultado.error);
      }
    } finally {
      setEliminando(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 text-muted-foreground hover:text-destructive"
          aria-label={`Eliminar ${producto.name}`}
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar {producto.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción eliminará el producto y su imagen de ImageKit. Esta
            acción no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={manejarEliminar}
            disabled={eliminando}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {eliminando ? "Eliminando..." : "Eliminar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}