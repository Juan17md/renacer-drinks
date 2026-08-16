"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DollarSign, TrendingUp, ReceiptText, ShoppingCart, Coffee, Package, Wallet, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RegistrarVentaModal } from "@/components/admin/ventas/RegistrarVentaModal";
import { obtenerResumenDiario, obtenerProductoMasVendidoSemana, type ProductoMasVendido } from "@/services/transactions";
import { obtenerProductosCompletos } from "@/services/products";
import { obtenerFechaLocalISO, formatearUSD, formatearBs } from "@/lib/utils";
import type { Producto } from "@/types/product";
import type { ResumenDiario } from "@/types/transaction";

interface DashboardClienteProps {
  tasaBCVInicial: number;
}

export function DashboardCliente({
  tasaBCVInicial,
}: DashboardClienteProps) {
  const [ventaAbierta, setVentaAbierta] = useState(false);
  const [tasaBCV, setTasaBCV] = useState(tasaBCVInicial);
  const [resumen, setResumen] = useState<ResumenDiario | null>(null);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [masVendido, setMasVendido] = useState<ProductoMasVendido | null>(null);

  useEffect(() => {
    const hoy = obtenerFechaLocalISO().slice(0, 10);
    obtenerResumenDiario(hoy).then(setResumen);
    obtenerProductosCompletos().then(setProductos);
    obtenerProductoMasVendidoSemana().then(setMasVendido);
  }, []);

  const tarjetas = [
    {
      titulo: "Monto vendido hoy",
      valorUSD: resumen?.totalIncome ?? 0,
      icono: DollarSign,
      color: "bg-emerald-100 text-emerald-700",
    },
    {
      titulo: "Monto ganado hoy",
      valorUSD: resumen?.totalProfit ?? 0,
      icono: TrendingUp,
      color: "bg-brand-rose-light text-brand-rose-deep",
    },
    {
      titulo: "Ventas del día",
      contador: resumen?.totalSales ?? 0,
      icono: ReceiptText,
      color: "bg-sky-100 text-sky-700",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-brand-coffee sm:text-3xl">
          Dashboard
        </h1>
        <p className="mt-1 text-base text-muted-foreground">
          Resumen del panel de administración.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {tarjetas.map((tarjeta) => (
          <div
            key={tarjeta.titulo}
            className="rounded-2xl border border-border/60 bg-white p-5"
          >
            <div className="flex items-center gap-3">
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tarjeta.color}`}
              >
                <tarjeta.icono className="h-5 w-5" aria-hidden="true" />
              </span>
              <h2 className="font-heading text-base font-semibold uppercase tracking-wider text-muted-foreground">
                {tarjeta.titulo}
              </h2>
            </div>
            {"contador" in tarjeta ? (
              <p className="mt-3 font-heading text-2xl font-bold text-brand-coffee">
                {tarjeta.contador}
              </p>
            ) : (
              <>
                <p className="mt-3 font-heading text-2xl font-bold text-brand-coffee">
                  {formatearUSD(tarjeta.valorUSD)}
                </p>
                <p className="mt-1 text-base text-muted-foreground">
                  {formatearBs(tarjeta.valorUSD * tasaBCV)}
                </p>
              </>
            )}
          </div>
        ))}
      </div>

      {masVendido && (
        <div className="grid gap-4 sm:grid-cols-1">
          <div className="rounded-2xl border border-border/60 bg-white p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <Trophy className="h-5 w-5" aria-hidden="true" />
              </span>
              <h2 className="font-heading text-base font-semibold uppercase tracking-wider text-muted-foreground">
                Más vendido de la semana
              </h2>
            </div>
            <p className="mt-3 font-heading text-2xl font-bold text-brand-coffee">
              {masVendido.nombre}
            </p>
            <p className="mt-1 text-base text-muted-foreground">
              {masVendido.cantidad} unidad{masVendido.cantidad !== 1 ? "es" : ""} vendida{masVendido.cantidad !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border/60 bg-white p-6">
          <h2 className="font-heading text-base font-semibold uppercase tracking-wider text-muted-foreground">
            Tasa BCV del día
          </h2>
          {tasaBCV > 0 ? (
            <p className="mt-2 font-heading text-3xl font-bold text-brand-rose-deep">
              {formatearBs(tasaBCV)}
            </p>
          ) : (
            <p className="mt-2 text-base text-muted-foreground">
              No disponible en este momento
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-border/60 bg-white p-6">
          <h2 className="font-heading text-base font-semibold uppercase tracking-wider text-muted-foreground">
            Accesos rápidos
          </h2>
          <div className="mt-4 flex flex-col gap-3">
            <Button
              className="h-12 justify-start gap-3 px-4 text-base"
              onClick={() => setVentaAbierta(true)}
            >
              <ShoppingCart className="h-4 w-4" aria-hidden="true" />
              Registrar venta
            </Button>
            <Link
              href="/admin/ordenes"
              className="flex min-h-12 items-center gap-3 rounded-xl bg-brand-rose-light px-4 text-base font-medium text-brand-rose-deep transition-colors hover:bg-brand-rose/30"
            >
              <ReceiptText className="h-4 w-4" aria-hidden="true" />
              Ver órdenes en vivo
            </Link>
            <Link
              href="/admin/catalogo"
              className="flex min-h-12 items-center gap-3 rounded-xl bg-brand-rose-light px-4 text-base font-medium text-brand-rose-deep transition-colors hover:bg-brand-rose/30"
            >
              <Coffee className="h-4 w-4" aria-hidden="true" />
              Gestionar catálogo
            </Link>
            <Link
              href="/admin/inventario"
              className="flex min-h-12 items-center gap-3 rounded-xl bg-brand-rose-light px-4 text-base font-medium text-brand-rose-deep transition-colors hover:bg-brand-rose/30"
            >
              <Package className="h-4 w-4" aria-hidden="true" />
              Ver inventario
            </Link>
            <Link
              href="/admin/finanzas"
              className="flex min-h-12 items-center gap-3 rounded-xl bg-brand-rose-light px-4 text-base font-medium text-brand-rose-deep transition-colors hover:bg-brand-rose/30"
            >
              <Wallet className="h-4 w-4" aria-hidden="true" />
              Registrar finanzas
            </Link>
          </div>
        </div>
      </div>

      <RegistrarVentaModal
        abierto={ventaAbierta}
        onOpenChange={setVentaAbierta}
        productos={productos}
        tasaBCV={tasaBCV}
        onRegistrada={() => window.location.reload()}
      />
    </div>
  );
}
