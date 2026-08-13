"use client";

import { useEffect, useState } from "react";
import { obtenerTasaBCV } from "@/lib/bcv";
import { obtenerTransacciones } from "@/services/transactions";
import type { TransaccionFinanciera } from "@/types/transaction";
import { TransactionForm } from "./TransactionForm";
import { BcvRateIndicator } from "./BcvRateIndicator";
import { FinancialKPIs } from "./FinancialKPIs";
import { SalesChart, type DatoPunto } from "./SalesChart";
import { TransactionsTable } from "./TransactionsTable";

const DIAS_VENTANA = 14;

function formatearDia(fechaISO: string): string {
  const partes = fechaISO.split("T")[0]?.split("-");
  if (!partes || partes.length !== 3) return fechaISO;
  return `${partes[2]}/${partes[1]}`;
}

function obtenerClaveDia(fechaISO: string): string {
  return fechaISO.split("T")[0] ?? fechaISO;
}

function calcularKPIs(transacciones: TransaccionFinanciera[], mesActual: string) {
  const delMes = transacciones.filter((t) =>
    t.date.startsWith(mesActual)
  );
  const ingresos = delMes
    .filter((t) => t.type === "INGRESO")
    .reduce((suma, t) => suma + t.amount, 0);
  const egresos = delMes
    .filter((t) => t.type === "EGRESO")
    .reduce((suma, t) => suma + t.amount, 0);
  return { ingresos, egresos, balance: ingresos - egresos };
}

export function PaginaFinanzasCliente() {
  const [transacciones, setTransacciones] = useState<TransaccionFinanciera[]>([]);
  const [tasaBCV, setTasaBCV] = useState(0);
  const [cargando, setCargando] = useState(true);

  const cargarDatos = async () => {
    const [transaccionesObtenidas, tasa] = await Promise.all([
      obtenerTransacciones(200),
      obtenerTasaBCV(),
    ]);
    setTransacciones(transaccionesObtenidas);
    setTasaBCV(tasa.promedio ?? 0);
    setCargando(false);
  };

  useEffect(() => {
    cargarDatos().catch(() => setCargando(false));
  }, []);

  const hoy = new Date();
  const mesActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`;

  const { ingresos, egresos, balance } = calcularKPIs(transacciones, mesActual);

  const datosGrafico: DatoPunto[] = [];
  for (let i = DIAS_VENTANA - 1; i >= 0; i--) {
    const fecha = new Date();
    fecha.setDate(hoy.getDate() - i);
    const clave = obtenerClaveDia(
      `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}T00:00:00`
    );
    const delDia = transacciones.filter((t) => obtenerClaveDia(t.date) === clave);
    datosGrafico.push({
      dia: formatearDia(clave),
      ingresos: delDia
        .filter((t) => t.type === "INGRESO")
        .reduce((suma, t) => suma + t.amount, 0),
      egresos: delDia
        .filter((t) => t.type === "EGRESO")
        .reduce((suma, t) => suma + t.amount, 0),
    });
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-brand-coffee sm:text-3xl">
            Finanzas
          </h1>
          <p className="mt-1 text-base text-muted-foreground">
            Control de ingresos y egresos del día a día.
          </p>
        </div>
        <BcvRateIndicator tasaBCV={tasaBCV} />
      </div>

      {cargando ? (
        <p className="text-base text-muted-foreground">Cargando datos financieros...</p>
      ) : (
        <>
          <FinancialKPIs
            ingresos={ingresos}
            egresos={egresos}
            balance={balance}
            tasaBCV={tasaBCV}
          />
          <div className="grid gap-8 lg:grid-cols-2">
            <SalesChart datos={datosGrafico} />
            <TransactionForm tasaBCV={tasaBCV} onRegistrada={cargarDatos} />
          </div>
          <TransactionsTable transacciones={transacciones} />
        </>
      )}
    </div>
  );
}
