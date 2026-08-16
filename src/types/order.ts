export type EstadoOrden = "recibida" | "entregada" | "cancelada";

export const ESTADOS_ORDEN = {
  recibida: { label: "Recibida", siguiente: "entregada", anterior: null },
  entregada: { label: "Entregada", siguiente: null, anterior: "recibida" },
  cancelada: { label: "Cancelada", siguiente: null, anterior: null },
} as const;

export interface ItemOrden {
  productId: string;
  nombre: string;
  precio: number;
  cantidad: number;
  subtotal: number;
}

export interface Orden {
  id: string;
  numero: number;
  nombreCliente: string;
  items: ItemOrden[];
  totalUSD: number;
  totalBs: number;
  tasaBCV: number;
  estado: EstadoOrden;
  createdAt: string;
  updatedAt: string;
  metodoPago?: string;
  comprobanteUrl?: string;
  referencia?: string;
  pagoVerificado?: boolean;
}

export type OrdenSinId = Omit<Orden, "id">;

export interface DatosNuevaOrden {
  nombreCliente: string;
  items: ItemOrden[];
  totalUSD: number;
  totalBs: number;
  tasaBCV: number;
  metodoPago?: string;
  comprobanteUrl?: string;
  referencia?: string;
  pagoVerificado?: boolean;
}
