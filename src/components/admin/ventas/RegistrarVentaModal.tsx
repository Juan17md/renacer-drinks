"use client";

import { useMemo, useState } from "react";
import { Loader2, Minus, Plus, Search, Trash2 } from "lucide-react";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { registrarVenta } from "@/services/transactions";
import { METODOS_PAGO, type MetodoPago } from "@/types/transaction";
import { formatearUSD, convertirUSDaBs } from "@/lib/utils";
import type { Producto } from "@/types/product";
import type { ItemVenta } from "@/types/transaction";

interface RegistrarVentaModalProps {
  abierto: boolean;
  onOpenChange: (abierto: boolean) => void;
  productos: Producto[];
  tasaBCV: number;
  onRegistrada: () => void;
}

export function RegistrarVentaModal({
  abierto,
  onOpenChange,
  productos,
  tasaBCV,
  onRegistrada,
}: RegistrarVentaModalProps) {
  const disponibles = useMemo(
    () => productos.filter((producto) => producto.isAvailable),
    [productos]
  );

  const [cliente, setCliente] = useState("");
  const [items, setItems] = useState<ItemVenta[]>([]);
  const [metodo, setMetodo] = useState<MetodoPago>("EFECTIVO");
  const [busqueda, setBusqueda] = useState("");
  const [montoEditable, setMontoEditable] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [seleccionAbierta, setSeleccionAbierta] = useState(false);

  const totalCalculado = items.reduce(
    (total, item) => total + item.precioVenta * item.cantidad,
    0
  );
  const montoUSD = Number(montoEditable) > 0 ? Number(montoEditable) : totalCalculado;
  const totalBs = convertirUSDaBs(montoUSD, tasaBCV);

  const termino = busqueda.trim().toLowerCase();
  const filtrados = disponibles.filter(
    (producto) =>
      producto.name.toLowerCase().includes(termino) ||
      producto.description.toLowerCase().includes(termino)
  );

  const agregarProducto = (producto: Producto) => {
    setItems((actuales) => {
      const existente = actuales.find(
        (item) => item.productId === producto.id
      );
      if (existente) {
        return actuales.map((item) =>
          item.productId === producto.id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        );
      }
      return [
        ...actuales,
        {
          productId: producto.id,
          nombre: producto.name,
          precioVenta: producto.price,
          costo: producto.costo,
          cantidad: 1,
          subtotal: producto.price,
        },
      ];
    });
    setBusqueda("");
    setSeleccionAbierta(false);
  };

  const cambiarCantidad = (productId: string, cantidad: number) => {
    setItems((actuales) => {
      if (cantidad <= 0) {
        return actuales.filter((item) => item.productId !== productId);
      }
      return actuales.map((item) =>
        item.productId === productId
          ? {
              ...item,
              cantidad,
              subtotal: item.precioVenta * cantidad,
            }
          : item
      );
    });
  };

  const manejarEnvio = async (evento: React.FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    setError("");

    if (items.length === 0) {
      setError("Agrega al menos un producto a la venta.");
      return;
    }
    if (montoUSD <= 0 || Number.isNaN(montoUSD)) {
      setError("El monto debe ser mayor a cero.");
      return;
    }

    setGuardando(true);
    try {
      await registrarVenta(
        {
          customerName: cliente.trim(),
          items,
          amount: montoUSD,
          paymentMethod: metodo,
        },
        tasaBCV
      );
      toast.success("Venta registrada correctamente");
      setItems([]);
      setCliente("");
      setMontoEditable("");
      setMetodo("EFECTIVO");
      onRegistrada();
      onOpenChange(false);
    } catch {
      setError("No se pudo registrar la venta.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={abierto} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading">Registrar venta</DialogTitle>
          <DialogDescription>
            Selecciona los productos vendidos del catálogo. La ganancia se
            calcula con el costo de cada producto.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={manejarEnvio} className="space-y-5" noValidate>
          <div className="space-y-2">
            <Label htmlFor="venta-cliente">Nombre del cliente</Label>
            <Input
              id="venta-cliente"
              value={cliente}
              onChange={(evento) => setCliente(evento.target.value)}
              placeholder="Opcional"
              className="h-12 text-base"
              maxLength={40}
            />
          </div>

          <div className="space-y-2">
            <Label>Productos vendidos *</Label>
            <Popover open={seleccionAbierta} onOpenChange={setSeleccionAbierta}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 w-full justify-start gap-2 text-base font-normal text-muted-foreground"
                >
                  <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
                  Buscar producto del catálogo...
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
                    placeholder="Buscar producto..."
                    aria-label="Buscar producto del catálogo"
                    className="h-11 border-0 pl-9 text-base focus-visible:ring-0"
                    autoFocus
                  />
                </div>
                <div className="max-h-56 overflow-y-auto p-1.5">
                  {filtrados.length === 0 ? (
                    <p className="px-3 py-3 text-base text-muted-foreground">
                      No hay productos que coincidan.
                    </p>
                  ) : (
                    filtrados.map((producto) => (
                      <button
                        key={producto.id}
                        type="button"
                        onClick={() => agregarProducto(producto)}
                        className="flex min-h-11 w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-base transition-colors hover:bg-accent"
                      >
                        <span>{producto.name}</span>
                        <span className="shrink-0 font-semibold text-brand-rose-deep">
                          {formatearUSD(producto.price)}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {items.length > 0 && (
            <ul className="space-y-2">
              {items.map((item) => (
                <li
                  key={item.productId}
                  className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/30 px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-medium text-brand-coffee">
                      {item.nombre}
                    </p>
                    <p className="text-sm font-small text-muted-foreground">
                      {formatearUSD(item.precioVenta)} c/u
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() =>
                        cambiarCantidad(item.productId, item.cantidad - 1)
                      }
                      aria-label={`Reducir cantidad de ${item.nombre}`}
                    >
                      <Minus className="h-4 w-4" aria-hidden="true" />
                    </Button>
                    <span
                      className="w-10 text-center text-base font-semibold"
                      aria-label={`Cantidad de ${item.nombre}`}
                    >
                      {item.cantidad}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() =>
                        cambiarCantidad(item.productId, item.cantidad + 1)
                      }
                      aria-label={`Aumentar cantidad de ${item.nombre}`}
                    >
                      <Plus className="h-4 w-4" aria-hidden="true" />
                    </Button>
                    <span className="w-16 text-right text-base font-semibold text-brand-coffee">
                      {formatearUSD(item.subtotal)}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-muted-foreground hover:text-destructive"
                      onClick={() =>
                        setItems((actuales) =>
                          actuales.filter(
                            (actual) => actual.productId !== item.productId
                          )
                        )
                      }
                      aria-label={`Quitar ${item.nombre}`}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="venta-metodo">Método de pago</Label>
              <Select value={metodo} onValueChange={(v) => setMetodo(v as MetodoPago)}>
                <SelectTrigger
                  id="venta-metodo"
                  className="h-12 w-full text-base"
                >
                  <SelectValue placeholder="Selecciona..." />
                </SelectTrigger>
                <SelectContent>
                  {METODOS_PAGO.map((metodoPago) => (
                    <SelectItem
                      key={metodoPago.valor}
                      value={metodoPago.valor}
                      className="text-base"
                    >
                      {metodoPago.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="venta-monto">Monto (USD) *</Label>
              <Input
                id="venta-monto"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={montoEditable}
                onChange={(evento) => setMontoEditable(evento.target.value)}
                placeholder={totalCalculado.toFixed(2)}
                className="h-12 text-base"
              />
            </div>
          </div>

          <div className="rounded-xl bg-brand-rose-light px-4 py-3">
            <p className="text-base text-brand-rose-deep">
              Total:{" "}
              <strong className="font-heading">
                {formatearUSD(montoUSD)}
              </strong>{" "}
              ~ <strong>{totalBs.toFixed(2)} Bs</strong>
            </p>
            <p className="text-sm font-small text-brand-rose-deep/80">
              Tasa BCV: {tasaBCV > 0 ? `${tasaBCV.toFixed(2)} Bs/USD` : "no disponible"}
            </p>
          </div>

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
              Registrar venta
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
