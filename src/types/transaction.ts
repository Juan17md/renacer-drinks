export type TipoTransaccion = "INGRESO" | "EGRESO";

export type MetodoPago =
  | "EFECTIVO"
  | "PAGO_MOVIL"
  | "PUNTO"
  | "TRANSFERENCIA"
  | "BINANCE"
  | "ZELLE";

export const METODOS_PAGO: { valor: MetodoPago; label: string }[] = [
  { valor: "EFECTIVO", label: "Efectivo" },
  { valor: "PAGO_MOVIL", label: "Pago Móvil" },
  { valor: "PUNTO", label: "Punto" },
  { valor: "TRANSFERENCIA", label: "Transferencia" },
  { valor: "BINANCE", label: "Binance" },
  { valor: "ZELLE", label: "Zelle" },
];

export interface ItemVenta {
  productId: string;
  nombre: string;
  precioVenta: number;
  costo: number;
  cantidad: number;
  subtotal: number;
}

export interface TransaccionFinanciera {
  id: string;
  type: TipoTransaccion;
  amount: number;
  amountBs: number;
  bcvRate: number;
  concept: string;
  paymentMethod: string;
  date: string;
  createdBy: string;
  customerName?: string;
  ganancia: number;
  items?: ItemVenta[];
}

export interface DatosTransaccion {
  type: TipoTransaccion;
  amount: number;
  concept: string;
  paymentMethod: string;
}

export interface DatosVenta {
  customerName: string;
  items: ItemVenta[];
  amount: number;
  paymentMethod: string;
}

export interface ResumenDiario {
  id: string;
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
  totalSales: number;
  totalProfit: number;
}
