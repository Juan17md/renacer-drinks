import {
  collection,
  addDoc,
  doc,
  getDocs,
  query,
  orderBy,
  limit,
  where,
  runTransaction,
  type DocumentSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type {
  TransaccionFinanciera,
  DatosTransaccion,
  ResumenDiario,
  TipoTransaccion,
} from "@/types/transaction";
import { obtenerFechaLocalISO } from "@/lib/utils";

const COLECCION_TRANSACCIONES = "financial_transactions";
const COLECCION_RESUMENES = "daily_summaries";

function obtenerFechaHoraLocalISO(fecha = new Date()): string {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  const hora = String(fecha.getHours()).padStart(2, "0");
  const minutos = String(fecha.getMinutes()).padStart(2, "0");
  const segundos = String(fecha.getSeconds()).padStart(2, "0");
  return `${anio}-${mes}-${dia}T${hora}:${minutos}:${segundos}`;
}

function transformarTransaccion(
  snapshot: DocumentSnapshot
): TransaccionFinanciera {
  const datos = snapshot.data();
  return {
    id: snapshot.id,
    type: (datos?.type as TipoTransaccion) ?? "INGRESO",
    amount: Number(datos?.amount ?? 0),
    amountBs: Number(datos?.amountBs ?? 0),
    bcvRate: Number(datos?.bcvRate ?? 0),
    concept: String(datos?.concept ?? ""),
    paymentMethod: (datos?.paymentMethod ?? "OTRO") as TransaccionFinanciera["paymentMethod"],
    date: String(datos?.date ?? ""),
    createdBy: String(datos?.createdBy ?? ""),
  };
}

async function actualizarResumenDiario(
  fecha: string,
  type: TipoTransaccion,
  amount: number
): Promise<void> {
  const refResumen = doc(db, COLECCION_RESUMENES, fecha);

  await runTransaction(db, async (transaccion) => {
    const snapshot = await transaccion.get(refResumen);
    const actual = snapshot.data() ?? { totalIncome: 0, totalExpense: 0 };
    const incremento =
      type === "INGRESO"
        ? { totalIncome: Number(actual.totalIncome) + amount }
        : { totalExpense: Number(actual.totalExpense) + amount };

    transaccion.set(
      refResumen,
      {
        ...actual,
        ...incremento,
        netProfit: Number(actual.totalIncome) - Number(actual.totalExpense),
      },
      { merge: true }
    );
  });
}

export async function registrarTransaccion(
  datos: DatosTransaccion,
  tasaBCV: number
): Promise<TransaccionFinanciera> {
  const fecha = obtenerFechaHoraLocalISO();
  const amountBs = datos.amount * tasaBCV;

  const referencia = await addDoc(collection(db, COLECCION_TRANSACCIONES), {
    type: datos.type,
    amount: datos.amount,
    amountBs,
    bcvRate: tasaBCV,
    concept: datos.concept,
    paymentMethod: datos.paymentMethod,
    date: fecha,
    createdBy: "admin",
  });

  await actualizarResumenDiario(fecha.slice(0, 10), datos.type, datos.amount);

  return {
    id: referencia.id,
    ...datos,
    amountBs,
    bcvRate: tasaBCV,
    date: fecha,
    createdBy: "admin",
  };
}

export async function registrarIngresoPorOrden(
  ordenId: string,
  totalUSD: number,
  concepto: string
): Promise<void> {
  const refOrden = doc(db, "ordenes", ordenId);

  await runTransaction(db, async (transaccion) => {
    const snapshotOrden = await transaccion.get(refOrden);
    const datosOrden = snapshotOrden.data();

    if (datosOrden?.registradoEnFinanzas) return;

    const fecha = obtenerFechaHoraLocalISO();
    const tasaBCV = Number(datosOrden?.bcvRate ?? 0);

    const refTransaccion = doc(collection(db, COLECCION_TRANSACCIONES));
    transaccion.set(refTransaccion, {
      type: "INGRESO",
      amount: totalUSD,
      amountBs: totalUSD * tasaBCV,
      bcvRate: tasaBCV,
      concept: concepto,
      paymentMethod: "EFECTIVO",
      date: fecha,
      createdBy: "admin",
      ordenId,
    });

    const refResumen = doc(db, COLECCION_RESUMENES, fecha.slice(0, 10));
    const snapshotResumen = await transaccion.get(refResumen);
    const resumen = snapshotResumen.data() ?? { totalIncome: 0, totalExpense: 0 };
    transaccion.set(
      refResumen,
      {
        ...resumen,
        totalIncome: Number(resumen.totalIncome) + totalUSD,
        netProfit: Number(resumen.totalIncome) + totalUSD - Number(resumen.totalExpense),
      },
      { merge: true }
    );

    transaccion.update(refOrden, { registradoEnFinanzas: true });
  });
}

export async function obtenerTransacciones(
  maximo = 100
): Promise<TransaccionFinanciera[]> {
  const consulta = query(
    collection(db, COLECCION_TRANSACCIONES),
    orderBy("date", "desc"),
    limit(maximo)
  );
  const snapshot = await getDocs(consulta);
  return snapshot.docs.map(transformarTransaccion);
}

export async function obtenerTransaccionesDeHoy(): Promise<
  TransaccionFinanciera[]
> {
  const hoy = obtenerFechaLocalISO().slice(0, 10);
  const consulta = query(
    collection(db, COLECCION_TRANSACCIONES),
    where("date", ">=", `${hoy}T00:00:00`),
    where("date", "<=", `${hoy}T23:59:59`),
    orderBy("date", "desc")
  );
  const snapshot = await getDocs(consulta);
  return snapshot.docs.map(transformarTransaccion);
}

export async function obtenerResumenDiario(
  fecha: string
): Promise<ResumenDiario | null> {
  const snapshot = await getDocs(query(collection(db, COLECCION_RESUMENES)));
  const documento = snapshot.docs.find((d) => d.id === fecha);
  if (!documento) return null;
  const datos = documento.data();
  return {
    id: fecha,
    totalIncome: Number(datos.totalIncome ?? 0),
    totalExpense: Number(datos.totalExpense ?? 0),
    netProfit: Number(datos.netProfit ?? 0),
  };
}
