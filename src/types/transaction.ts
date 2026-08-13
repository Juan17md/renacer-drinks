export type TipoTransaccion = "INGRESO" | "EGRESO";

export type MetodoPago = "EFECTIVO" | "PAGO_MOVIL" | "PUNTO" | "OTRO";

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

export interface ResumenDiario {
  id: string;
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
}
