"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { formatearUSD } from "@/lib/utils";

export interface DatoPunto {
  dia: string;
  ingresos: number;
  egresos: number;
}

interface SalesChartProps {
  datos: DatoPunto[];
}

export function SalesChart({ datos }: SalesChartProps) {
  if (datos.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center rounded-2xl border border-border/60 bg-white text-base text-muted-foreground">
        Aún no hay datos suficientes para mostrar el gráfico.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-white p-5">
      <h3 className="font-heading text-base font-semibold uppercase tracking-wider text-muted-foreground">
        Ingresos vs Egresos (últimos 14 días)
      </h3>
      <div className="mt-4 h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={datos} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3e8ea" />
            <XAxis
              dataKey="dia"
              tick={{ fontSize: 12, fill: "#8a7b80" }}
              tickLine={false}
              axisLine={{ stroke: "#f3e8ea" }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "#8a7b80" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(valor: number) => `$${valor}`}
              width={50}
            />
            <Tooltip
              formatter={(valor, nombre) => [
                formatearUSD(Number(valor ?? 0)),
                nombre === "ingresos" ? "Ingresos" : "Egresos",
              ]}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid #f3e8ea",
                fontSize: 13,
              }}
            />
            <Legend
              formatter={(valor: string) =>
                valor === "ingresos" ? "Ingresos" : "Egresos"
              }
              wrapperStyle={{ fontSize: 13 }}
            />
            <Bar
              dataKey="ingresos"
              fill="#059669"
              radius={[6, 6, 0, 0]}
              maxBarSize={28}
            />
            <Bar
              dataKey="egresos"
              fill="#dc2626"
              radius={[6, 6, 0, 0]}
              maxBarSize={28}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
