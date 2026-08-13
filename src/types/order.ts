export type EstadoOrden = "recibida" | "lista" | "entregada";

export const ESTADOS_ORDEN = {
  recibida: { label: "Recibida", siguiente: "lista", anterior: null },
  lista: { label: "Lista", siguiente: "entregada", anterior: "recibida" },
  entregada: { label: "Entregada", siguiente: null, anterior: "lista" },
} as const;

export interface ItemOrden {
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
}

export type OrdenSinId = Omit<Orden, "id">;

export interface DatosNuevaOrden {
  nombreCliente: string;
  items: ItemOrden[];
  totalUSD: number;
  totalBs: number;
  tasaBCV: number;
}
