export type TipoTransaccion = "INGRESO" | "EGRESO";

export type MetodoPago =
  | "EFECTIVO"
  | "PAGO_MOVIL"
  | "PUNTO"
  | "TRANSFERENCIA"
  | "BINANCE"
  | "ZELLE"
  | "OTRO";

export const METODOS_PAGO: { valor: MetodoPago; label: string }[] = [
  { valor: "EFECTIVO", label: "Efectivo" },
  { valor: "PAGO_MOVIL", label: "Pago Móvil" },
  { valor: "PUNTO", label: "Punto" },
  { valor: "TRANSFERENCIA", label: "Transferencia" },
  { valor: "BINANCE", label: "Binance" },
  { valor: "ZELLE", label: "Zelle" },
  { valor: "OTRO", label: "Otro" },
];

export interface TransaccionFinanciera {
  id: string;
  type: TipoTransaccion;
  amount: number;
  amountBs: number;
  bcvRate: number;
  concept: string;
  paymentMethod: MetodoPago;
  date: string;
  createdBy: string;
}

export interface DatosTransaccion {
  type: TipoTransaccion;
  amount: number;
  concept: string;
  paymentMethod: MetodoPago;
}

export interface ResumenDiario {
  id: string;
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
}
