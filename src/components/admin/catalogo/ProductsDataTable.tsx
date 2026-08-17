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
  const [pagina, setPagina] = useState(1);

  const ELEMENTOS_POR_PAGINA = 30;

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
          Venta USD
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
      accessorKey: "costo",
      header: ({ column }) => (
        <button
          type="button"
          className="flex min-h-9 items-center gap-1 font-medium"
          onClick={() => column.toggleSorting()}
        >
          Costo USD
          <ArrowUpDown className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {formatearUSD(row.original.costo)}
        </span>
      ),
    },
    {
      id: "ganancia",
      header: "Ganancia",
      cell: ({ row }) => (
        <span className="font-semibold text-emerald-600">
          {formatearUSD(row.original.price - row.original.costo)}
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

  const filasFiltradas = tabla.getFilteredRowModel().rows;
  const totalPaginas = Math.max(
    1,
    Math.ceil(filasFiltradas.length / ELEMENTOS_POR_PAGINA)
  );
  const paginaActual = Math.min(pagina, totalPaginas);
  const filasPaginadas = filasFiltradas.slice(
    (paginaActual - 1) * ELEMENTOS_POR_PAGINA,
    paginaActual * ELEMENTOS_POR_PAGINA
  );

  const manejarFiltro = (valor: string) => {
    setFiltroGlobal(valor);
    setPagina(1);
  };

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
          onChange={(evento) => manejarFiltro(evento.target.value)}
          placeholder="Buscar producto..."
          aria-label="Buscar producto en el inventario"
          className="h-11 w-full rounded-lg border border-input bg-white pl-10 pr-3 text-base text-brand-coffee placeholder:text-muted-foreground focus:border-brand-rose focus:outline-none focus:ring-2 focus:ring-brand-rose/40"
        />
      </div>

      <div className="grid gap-3 md:hidden">
        {filasPaginadas.length > 0 ? (
          filasPaginadas.map((fila) => {
            const producto = fila.original;
            const categoria = categorias.find(
              (c) => c.slug === producto.category
            );
            return (
              <div
                key={fila.id}
                className="rounded-2xl border border-border/60 bg-white p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-brand-rose-light">
                    {producto.imageUrl ? (
                      <Image
                        src={producto.imageUrl}
                        alt={producto.name}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <span className="text-lg" aria-hidden="true">☕</span>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-brand-coffee">
                      {producto.name}
                    </p>
                    <Badge
                      variant="secondary"
                      className="mt-1 whitespace-nowrap"
                    >
                      {categoria?.name ?? producto.category}
                    </Badge>
                  </div>
                  <ToggleDisponibilidad producto={producto} />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                  <span className="text-muted-foreground">
                    Venta:{" "}
                    <span className="font-semibold text-brand-rose-deep">
                      {formatearUSD(producto.price)}
                    </span>
                  </span>
                  <span className="text-muted-foreground">
                    Costo:{" "}
                    <span className="text-muted-foreground">
                      {formatearUSD(producto.costo)}
                    </span>
                  </span>
                  <span className="font-semibold text-emerald-600">
                    Ganancia:{" "}
                    <span>{formatearUSD(producto.price - producto.costo)}</span>
                  </span>
                </div>
                <div className="mt-4 flex flex-col gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 w-full"
                    onClick={() => onEditar(producto)}
                    aria-label={`Editar ${producto.name}`}
                  >
                    <Pencil className="mr-1.5 h-4 w-4" aria-hidden="true" />
                    Editar
                  </Button>
                  <EliminarProducto producto={producto} expandido />
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-2xl border border-border/60 bg-white p-6 text-center text-muted-foreground">
            No hay productos que coincidan con la búsqueda.
          </div>
        )}
      </div>

      <div className="hidden overflow-x-auto rounded-2xl border border-border/60 bg-white md:block">
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
            {filasPaginadas.length > 0 ? (
              filasPaginadas.map((fila) => (
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

      {totalPaginas > 1 && (
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            className="h-10"
            onClick={() => setPagina(paginaActual - 1)}
            disabled={paginaActual === 1}
            aria-label="Página anterior"
          >
            Anterior
          </Button>
          <p className="text-base font-medium text-muted-foreground">
            Página {paginaActual} de {totalPaginas}
          </p>
          <Button
            variant="outline"
            className="h-10"
            onClick={() => setPagina(paginaActual + 1)}
            disabled={paginaActual === totalPaginas}
            aria-label="Página siguiente"
          >
            Siguiente
          </Button>
        </div>
      )}
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
        costo: producto.costo,
        category: producto.category,
        isAvailable: disponible,
        destacado: producto.destacado ?? false,
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

function EliminarProducto({
  producto,
  expandido = false,
}: {
  producto: Producto;
  expandido?: boolean;
}) {
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
        {expandido ? (
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full text-destructive hover:text-destructive"
            aria-label={`Eliminar ${producto.name}`}
          >
            <Trash2 className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Eliminar
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 text-muted-foreground hover:text-destructive"
            aria-label={`Eliminar ${producto.name}`}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </Button>
        )}
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