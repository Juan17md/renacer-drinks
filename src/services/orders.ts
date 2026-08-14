import {
  collection,
  updateDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  limit,
  getDocs,
  where,
  runTransaction,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Orden, DatosNuevaOrden, EstadoOrden } from "@/types/order";
import { obtenerFechaLocalISO } from "@/lib/utils";

const COLECCION_ORDENES = "ordenes";
const DOC_CONTADOR = "contador_ordenes";

function transformarOrden(docSnapshot: {
  id: string;
  data(): Record<string, unknown>;
}): Orden {
  const datos = docSnapshot.data();
  return {
    id: docSnapshot.id,
    numero: Number(datos.numero ?? 0),
    nombreCliente: String(datos.nombreCliente ?? ""),
    items: Array.isArray(datos.items) ? (datos.items as Orden["items"]) : [],
    totalUSD: Number(datos.totalUSD ?? 0),
    totalBs: Number(datos.totalBs ?? 0),
    tasaBCV: Number(datos.tasaBCV ?? 0),
    estado: (datos.estado as EstadoOrden) ?? "recibida",
    createdAt: String(datos.createdAt ?? ""),
    updatedAt: String(datos.updatedAt ?? ""),
    metodoPago: datos.metodoPago ? (datos.metodoPago as Orden["metodoPago"]) : undefined,
    comprobanteUrl: datos.comprobanteUrl
      ? String(datos.comprobanteUrl)
      : undefined,
    pagoVerificado:
      datos.pagoVerificado === undefined
        ? undefined
        : Boolean(datos.pagoVerificado),
  };
}

export async function crearOrden(datos: DatosNuevaOrden): Promise<Orden> {
  const ahora = obtenerFechaLocalISO();

  const nuevaOrden = await runTransaction(db, async (transaccion) => {
    const refContador = doc(db, COLECCION_ORDENES, DOC_CONTADOR);
    const snapshotContador = await transaccion.get(refContador);
    const numero = (snapshotContador.data()?.numero ?? 0) + 1;

    const refOrden = doc(collection(db, COLECCION_ORDENES));
    transaccion.set(refOrden, {
      numero,
      nombreCliente: datos.nombreCliente,
      items: datos.items,
      totalUSD: datos.totalUSD,
      totalBs: datos.totalBs,
      tasaBCV: datos.tasaBCV,
      estado: "recibida",
      createdAt: ahora,
      updatedAt: ahora,
      ...(datos.metodoPago ? { metodoPago: datos.metodoPago } : {}),
      ...(datos.comprobanteUrl ? { comprobanteUrl: datos.comprobanteUrl } : {}),
      ...(typeof datos.pagoVerificado === "boolean"
        ? { pagoVerificado: datos.pagoVerificado }
        : {}),
    });
    transaccion.set(refContador, { numero }, { merge: true });

    return { id: refOrden.id, numero };
  });

  return {
    ...datos,
    id: nuevaOrden.id,
    numero: nuevaOrden.numero,
    estado: "recibida" as EstadoOrden,
    createdAt: ahora,
    updatedAt: ahora,
  };
}

export async function verificarPagoOrden(id: string): Promise<void> {
  await updateDoc(doc(db, COLECCION_ORDENES, id), {
    pagoVerificado: true,
    updatedAt: obtenerFechaLocalISO(),
  });
}

export async function actualizarEstadoOrden(
  id: string,
  estado: EstadoOrden
): Promise<void> {
  await updateDoc(doc(db, COLECCION_ORDENES, id), {
    estado,
    updatedAt: obtenerFechaLocalISO(),
  });
}

export function escucharOrdenes(
  callback: (ordenes: Orden[]) => void,
  onError?: (error: unknown) => void
): Unsubscribe {
  const consulta = query(
    collection(db, COLECCION_ORDENES),
    orderBy("createdAt", "desc"),
    limit(100)
  );

  return onSnapshot(
    consulta,
    (snapshot) => {
      callback(snapshot.docs.map(transformarOrden));
    },
    (error) => {
      onError?.(error);
    }
  );
}

export async function obtenerOrdenesPorEstado(
  estado: EstadoOrden,
  maximo = 50
): Promise<Orden[]> {
  const consulta = query(
    collection(db, COLECCION_ORDENES),
    where("estado", "==", estado),
    orderBy("createdAt", "desc"),
    limit(maximo)
  );
  const snapshot = await getDocs(consulta);
  return snapshot.docs.map(transformarOrden);
}
