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
  DatosVenta,
  ResumenDiario,
  TipoTransaccion,
  ItemVenta,
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
    customerName: datos?.customerName ? String(datos.customerName) : undefined,
    ganancia: Number(datos?.ganancia ?? 0),
    items: Array.isArray(datos?.items) ? (datos.items as ItemVenta[]) : undefined,
  };
}

function calcularGanancia(items: ItemVenta[]): number {
  return items.reduce(
    (total, item) => total + (item.precioVenta - item.costo) * item.cantidad,
    0
  );
}

async function actualizarResumenDiario(
  fecha: string,
  type: TipoTransaccion,
  amount: number,
  ganancia = 0
): Promise<void> {
  const refResumen = doc(db, COLECCION_RESUMENES, fecha);

  await runTransaction(db, async (transaccion) => {
    const snapshot = await transaccion.get(refResumen);
    const actual = snapshot.data() ?? {
      totalIncome: 0,
      totalExpense: 0,
      netProfit: 0,
      totalSales: 0,
      totalProfit: 0,
    };
    const incremento =
      type === "INGRESO"
        ? {
            totalIncome: Number(actual.totalIncome) + amount,
            totalSales: Number(actual.totalSales) + 1,
            totalProfit: Number(actual.totalProfit) + ganancia,
          }
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
    ganancia: 0,
  });

  await actualizarResumenDiario(fecha.slice(0, 10), datos.type, datos.amount);

  return {
    id: referencia.id,
    ...datos,
    amountBs,
    bcvRate: tasaBCV,
    date: fecha,
    createdBy: "admin",
    ganancia: 0,
  };
}

export async function registrarVenta(
  datos: DatosVenta,
  tasaBCV: number
): Promise<TransaccionFinanciera> {
  const fecha = obtenerFechaHoraLocalISO();
  const amountBs = datos.amount * tasaBCV;
  const ganancia = calcularGanancia(datos.items);
  const nombreCliente = datos.customerName.trim();
  const concepto = nombreCliente
    ? `Venta directa - ${nombreCliente}`
    : "Venta directa";

  const referencia = await addDoc(collection(db, COLECCION_TRANSACCIONES), {
    type: "INGRESO",
    amount: datos.amount,
    amountBs,
    bcvRate: tasaBCV,
    concept: concepto,
    paymentMethod: datos.paymentMethod,
    date: fecha,
    createdBy: "admin",
    customerName: nombreCliente || undefined,
    ganancia,
    items: datos.items,
  });

  await actualizarResumenDiario(fecha.slice(0, 10), "INGRESO", datos.amount, ganancia);

  return {
    id: referencia.id,
    type: "INGRESO",
    amount: datos.amount,
    amountBs,
    bcvRate: tasaBCV,
    concept: concepto,
    paymentMethod: datos.paymentMethod,
    date: fecha,
    createdBy: "admin",
    customerName: nombreCliente || undefined,
    ganancia,
    items: datos.items,
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
    const itemsOrden = Array.isArray(datosOrden?.items)
      ? datosOrden.items
      : [];

    const items = (itemsOrden as { productId?: string; nombre?: string; precio?: number; cantidad?: number }[])
      .map((item) => {
        const conProducto = item.productId
          ? { productId: String(item.productId) }
          : {};
        return {
          ...conProducto,
          nombre: String(item.nombre ?? ""),
          precioVenta: Number(item.precio ?? 0),
          costo: 0,
          cantidad: Number(item.cantidad ?? 0),
          subtotal: Number(item.precio ?? 0) * Number(item.cantidad ?? 0),
        };
      })
      .filter((item) => item.nombre && item.cantidad > 0);

    const refTransaccion = doc(collection(db, COLECCION_TRANSACCIONES));
    const ganancia = await calcularGananciaPorOrden(items);
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
      ganancia,
      items,
    });

    const refResumen = doc(db, COLECCION_RESUMENES, fecha.slice(0, 10));
    const snapshotResumen = await transaccion.get(refResumen);
    const resumen = snapshotResumen.data() ?? {
      totalIncome: 0,
      totalExpense: 0,
      netProfit: 0,
      totalSales: 0,
      totalProfit: 0,
    };
    transaccion.set(
      refResumen,
      {
        ...resumen,
        totalIncome: Number(resumen.totalIncome) + totalUSD,
        totalSales: Number(resumen.totalSales) + 1,
        totalProfit: Number(resumen.totalProfit) + ganancia,
        netProfit:
          Number(resumen.totalIncome) + totalUSD - Number(resumen.totalExpense),
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
    totalSales: Number(datos.totalSales ?? 0),
    totalProfit: Number(datos.totalProfit ?? 0),
  };
}

async function calcularGananciaPorOrden(
  items: {
    productId?: string;
    precioVenta: number;
    cantidad: number;
    costo: number;
  }[]
): Promise<number> {
  const ids = items.map((item) => item.productId).filter(Boolean);
  if (ids.length === 0) return 0;

  const costos = new Map<string, number>();
  try {
    const consulta = query(
      collection(db, "products"),
      where("__name__", "in", ids)
    );
    const snapshot = await getDocs(consulta);
    snapshot.docs.forEach((documento) => {
      costos.set(documento.id, Number(documento.data().costo ?? 0));
    });
  } catch (error) {
    console.error("Error al resolver costos de la orden:", error);
  }

  let gananciaTotal = 0;
  for (const item of items) {
    if (!item.productId) continue;
    const costo = costos.get(item.productId) ?? 0;
    if (costo > 0) {
      gananciaTotal += (item.precioVenta - costo) * item.cantidad;
    }
    item.costo = costo;
  }
  return gananciaTotal;
}
