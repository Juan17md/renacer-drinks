"use server";

import "server-only";
import * as Sentry from "@sentry/nextjs";
import {
  getAdminFirestore,
  getAdminAuth,
} from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";

const COLECCION_ORDENES = "ordenes";
const COLECCION_USUARIOS = "usuarios";
const COLECCION_TRANSACCIONES = "financial_transactions";
const COLECCION_RESUMENES = "daily_summaries";

export async function eliminarOrden(id: string, idToken: string) {
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
        error: "Solo el administrador puede eliminar órdenes.",
      };
    }

    const transacciones = await db
      .collection(COLECCION_TRANSACCIONES)
      .where("ordenId", "==", id)
      .get();

    const batch = db.batch();
    batch.delete(db.doc(`${COLECCION_ORDENES}/${id}`));

    for (const transaccion of transacciones.docs) {
      const datos = transaccion.data();
      const dia = String(datos?.date ?? "").slice(0, 10);

      if (dia) {
        const refResumen = db.doc(`${COLECCION_RESUMENES}/${dia}`);
        const resumen = await refResumen.get();
        if (resumen.exists) {
          const amount = Number(datos?.amount ?? 0);
          const ganancia = Number(datos?.ganancia ?? 0);
          batch.update(refResumen, {
            totalIncome: FieldValue.increment(-amount),
            totalProfit: FieldValue.increment(-ganancia),
            totalSales: FieldValue.increment(-1),
            netProfit: FieldValue.increment(-amount),
          });
        }
      }

      batch.delete(transaccion.ref);
    }

    await batch.commit();
    revalidatePath("/admin/ordenes");
    return { ok: true as const };
  } catch (error) {
    Sentry.captureException(error);
    console.error(`Error al eliminar la orden ${id}:`, error);
    return { ok: false as const, error: "No se pudo eliminar la orden" };
  }
}