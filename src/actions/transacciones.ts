"use server";

import "server-only";
import * as Sentry from "@sentry/nextjs";
import {
  getAdminFirestore,
  getAdminAuth,
} from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";

const COLECCION_USUARIOS = "usuarios";
const COLECCION_TRANSACCIONES = "financial_transactions";
const COLECCION_RESUMENES = "daily_summaries";
const COLECCION_ORDENES = "ordenes";

export async function eliminarTransaccion(id: string, idToken: string) {
  if (!id || !idToken) {
    return {
      ok: false as const,
      error: "No se pudo verificar tu sesión. Vuelve a iniciar sesión.",
    };
  }

  try {
    const auth = getAdminAuth();
    const { uid } = await auth.verifyIdToken(idToken);
    const db = getAdminFirestore();
    const usuarioDoc = await db.doc(`${COLECCION_USUARIOS}/${uid}`).get();
    const datosUsuario = usuarioDoc.data();
    if (!datosUsuario || datosUsuario.rol !== "admin") {
      return {
        ok: false as const,
        error: "Solo el administrador puede eliminar operaciones.",
      };
    }

    const refTransaccion = db.doc(`${COLECCION_TRANSACCIONES}/${id}`);
    const snapshotTransaccion = await refTransaccion.get();
    if (!snapshotTransaccion.exists) {
      return {
        ok: false as const,
        error: "La operación no existe o ya fue eliminada.",
      };
    }

    const datos = snapshotTransaccion.data();
    const esIngreso = datos?.type === "INGRESO";
    const amount = Number(datos?.amount ?? 0);
    const ganancia = Number(datos?.ganancia ?? 0);
    const dia = String(datos?.date ?? "").slice(0, 10);
    const ordenId = datos?.ordenId ? String(datos.ordenId) : "";

    const batch = db.batch();

    if (dia) {
      const refResumen = db.doc(`${COLECCION_RESUMENES}/${dia}`);
      const resumen = await refResumen.get();
      if (resumen.exists) {
        if (esIngreso) {
          batch.update(refResumen, {
            totalIncome: FieldValue.increment(-amount),
            totalProfit: FieldValue.increment(-ganancia),
            totalSales: FieldValue.increment(-1),
            netProfit: FieldValue.increment(-amount),
          });
        } else {
          batch.update(refResumen, {
            totalExpense: FieldValue.increment(-amount),
            netProfit: FieldValue.increment(amount),
          });
        }
      }
    }

    if (ordenId) {
      batch.update(db.doc(`${COLECCION_ORDENES}/${ordenId}`), {
        registradoEnFinanzas: false,
      });
    }

    batch.delete(refTransaccion);
    await batch.commit();
    revalidatePath("/admin/finanzas");
    return { ok: true as const };
  } catch (error) {
    Sentry.captureException(error);
    console.error(`Error al eliminar la transacción ${id}:`, error);
    return { ok: false as const, error: "No se pudo eliminar la operación" };
  }
}