import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  limit,
  where,
  runTransaction,
  type DocumentSnapshot,
  type Transaction,
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
import { obtenerFechaLocalISO, generarSlug } from "@/lib/utils";
import { obtenerTasaBCV } from "@/lib/bcv";

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
    paymentMethod: (datos?.paymentMethod ?? "EFECTIVO") as TransaccionFinanciera["paymentMethod"],
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

interface IncrementoResumen {
  income?: number;
  expense?: number;
  ventas?: number;
  ganancia?: number;
}

async function actualizarResumenEnTransaccion(
  transaccion: Transaction,
  fecha: string,
  incremento: IncrementoResumen
): Promise<void> {
  const refResumen = doc(db, COLECCION_RESUMENES, fecha);
  const snapshot = await transaccion.get(refResumen);
  const actual = snapshot.data() ?? {
    totalIncome: 0,
    totalExpense: 0,
    netProfit: 0,
    totalSales: 0,
    totalProfit: 0,
  };

  const totalIncome = Number(actual.totalIncome) + (incremento.income ?? 0);
  const totalExpense = Number(actual.totalExpense) + (incremento.expense ?? 0);

  transaccion.set(
    refResumen,
    {
      totalIncome,
      totalExpense,
      netProfit: totalIncome - totalExpense,
      totalSales: Number(actual.totalSales) + (incremento.ventas ?? 0),
      totalProfit: Number(actual.totalProfit) + (incremento.ganancia ?? 0),
    },
    { merge: true }
  );
}

export async function registrarTransaccion(
  datos: DatosTransaccion,
  tasaBCV: number
): Promise<TransaccionFinanciera> {
  const fecha = obtenerFechaHoraLocalISO();
  const amountBs = datos.amount * tasaBCV;
  const esIngreso = datos.type === "INGRESO";
  const refTransaccion = doc(collection(db, COLECCION_TRANSACCIONES));

  await runTransaction(db, async (transaccion) => {
    await actualizarResumenEnTransaccion(transaccion, fecha.slice(0, 10), {
      income: esIngreso ? datos.amount : 0,
      expense: esIngreso ? 0 : datos.amount,
      ventas: esIngreso ? 1 : 0,
    });

    transaccion.set(refTransaccion, {
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
  });

  return {
    id: refTransaccion.id,
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
  const refTransaccion = doc(collection(db, COLECCION_TRANSACCIONES));

  await runTransaction(db, async (transaccion) => {
    await actualizarResumenEnTransaccion(transaccion, fecha.slice(0, 10), {
      income: datos.amount,
      ventas: 1,
      ganancia,
    });

    transaccion.set(refTransaccion, {
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
  });

  return {
    id: refTransaccion.id,
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

  const snapshotPrevia = await getDoc(refOrden);
  const datosPrevia = snapshotPrevia.data();
  const tasaDeOrden = Number(datosPrevia?.tasaBCV ?? datosPrevia?.bcvRate ?? 0);
  let tasaBCV = tasaDeOrden;
  if (tasaDeOrden <= 0) {
    try {
      const tasaActual = await obtenerTasaBCV();
      tasaBCV = tasaActual.promedio;
    } catch {
      tasaBCV = 0;
    }
  }

  await runTransaction(db, async (transaccion) => {
    const snapshotOrden = await transaccion.get(refOrden);
    const datosOrden = snapshotOrden.data();

    if (datosOrden?.registradoEnFinanzas) return;

    const fecha = obtenerFechaHoraLocalISO();
    const metodoPago =
      (datosOrden?.metodoPago as string | undefined) ?? "EFECTIVO";
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

    const ganancia = await calcularGananciaPorOrden(transaccion, items);

    // Resumen diario: se resuelve antes de la escritura de la transacción para
    // respetar la regla de Firestore "todas las lecturas antes de las escrituras".
    await actualizarResumenEnTransaccion(transaccion, fecha.slice(0, 10), {
      income: totalUSD,
      ventas: 1,
      ganancia,
    });

    const refTransaccion = doc(collection(db, COLECCION_TRANSACCIONES));
    transaccion.set(refTransaccion, {
      type: "INGRESO",
      amount: totalUSD,
      amountBs: totalUSD * tasaBCV,
      bcvRate: tasaBCV,
      concept: concepto,
      paymentMethod: metodoPago,
      date: fecha,
      createdBy: "admin",
      ordenId,
      ganancia,
      items,
    });

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

const PREFIJO_PRODUCTO_PROMO = "promo-";

async function resolverCostoOfertaPromo(
  transaccion: Transaction,
  productId: string
): Promise<number> {
  const resto = productId.slice(PREFIJO_PRODUCTO_PROMO.length);
  const indiceGuion = resto.indexOf("-");
  if (indiceGuion <= 0) return 0;

  const promoId = resto.slice(0, indiceGuion);
  const slug = resto.slice(indiceGuion + 1);

  try {
    const snapshot = await transaccion.get(doc(db, "promociones", promoId));
    const ofertas = snapshot.data()?.ofertas;
    if (!Array.isArray(ofertas)) return 0;

    const oferta = ofertas.find(
      (item: { nombre?: string }) =>
        generarSlug(String(item.nombre ?? "")) === slug
    );
    return Number(oferta?.costo ?? 0);
  } catch (error) {
    console.error(
      `Error al resolver el costo de la oferta ${productId}:`,
      error
    );
    return 0;
  }
}

async function calcularGananciaPorOrden(
  transaccion: Transaction,
  items: {
    productId?: string;
    precioVenta: number;
    cantidad: number;
    costo: number;
  }[]
): Promise<number> {
  const ids = items
    .map((item) => item.productId)
    .filter((productId): productId is string => Boolean(productId));

  if (ids.length === 0) return 0;

  const costos = new Map<string, number>();
  for (const id of ids) {
    if (id.startsWith(PREFIJO_PRODUCTO_PROMO)) {
      costos.set(id, await resolverCostoOfertaPromo(transaccion, id));
      continue;
    }
    try {
      const snapshot = await transaccion.get(doc(db, "products", id));
      costos.set(id, Number(snapshot.data()?.costo ?? 0));
    } catch (error) {
      console.error(`Error al resolver el costo del producto ${id}:`, error);
    }
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
