import {
  collection,
  getDocs,
  onSnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { MetodoPagoConfig, DatoMetodoPago } from "@/types/payment";

const COLECCION_METODOS = "metodos_pago";

export const METODOS_PAGO_PREDETERMINADOS: MetodoPagoConfig[] = [
  {
    id: "PAGO_MOVIL",
    label: "Pago Móvil",
    activo: true,
    requiereComprobante: true,
    datos: [
      { etiqueta: "Banco", valor: "Banesco" },
      { etiqueta: "Teléfono", valor: "0414-1234567" },
      { etiqueta: "Cédula/RIF", valor: "V-12345678" },
      { etiqueta: "Beneficiario", valor: "Renacer Drinks & Coffe" },
    ],
  },
  {
    id: "ZELLE",
    label: "Zelle",
    activo: true,
    requiereComprobante: true,
    datos: [
      { etiqueta: "Correo", valor: "pagos@renacer.com" },
      { etiqueta: "Beneficiario", valor: "Renacer Drinks & Coffe" },
    ],
  },
  {
    id: "TRANSFERENCIA",
    label: "Transferencia",
    activo: true,
    requiereComprobante: true,
    datos: [
      { etiqueta: "Banco", valor: "Banesco" },
      { etiqueta: "Cuenta", valor: "01340000000000000000" },
      { etiqueta: "Beneficiario", valor: "Renacer Drinks & Coffe" },
    ],
  },
  {
    id: "BINANCE",
    label: "Binance",
    activo: true,
    requiereComprobante: true,
    datos: [
      { etiqueta: "Pay ID", valor: "123456789" },
      { etiqueta: "Beneficiario", valor: "Renacer" },
    ],
  },
  {
    id: "PUNTO",
    label: "Punto",
    activo: true,
    requiereComprobante: false,
    datos: [],
  },
  {
    id: "EFECTIVO",
    label: "Efectivo",
    activo: true,
    requiereComprobante: false,
    datos: [],
  },
];

function transformarMetodoPago(
  id: string,
  datos: Record<string, unknown>
): MetodoPagoConfig {
  const datosPares = Array.isArray(datos.datos)
    ? (datos.datos as DatoMetodoPago[])
    : [];
  return {
    id,
    label: String(datos.label ?? ""),
    activo: Boolean(datos.activo ?? false),
    requiereComprobante: Boolean(datos.requiereComprobante ?? false),
    datos: datosPares,
  };
}

export async function obtenerMetodosPago(): Promise<MetodoPagoConfig[]> {
  const snapshot = await getDocs(collection(db, COLECCION_METODOS));
  return snapshot.docs.map((doc) =>
    transformarMetodoPago(doc.id, doc.data())
  );
}

export function escucharMetodosPago(
  callback: (metodos: MetodoPagoConfig[]) => void,
  onError?: (error: unknown) => void
): Unsubscribe {
  return onSnapshot(
    collection(db, COLECCION_METODOS),
    (snapshot) => {
      callback(
        snapshot.docs.map((doc) => transformarMetodoPago(doc.id, doc.data()))
      );
    },
    (error) => {
      onError?.(error);
    }
  );
}