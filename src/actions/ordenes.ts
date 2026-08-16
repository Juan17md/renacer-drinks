"use server";

import "server-only";
import * as Sentry from "@sentry/nextjs";
import { getAdminFirestore, getAdminAuth } from "@/lib/firebaseAdmin";
import { revalidatePath } from "next/cache";

const COLECCION_ORDENES = "ordenes";
const COLECCION_USUARIOS = "usuarios";
const COLECCION_TRANSACCIONES = "financial_transactions";

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

    const batch = db.batch();
    batch.delete(db.doc(`${COLECCION_ORDENES}/${id}`));

    const transacciones = await db
      .collection(COLECCION_TRANSACCIONES)
      .where("ordenId", "==", id)
      .get();
    transacciones.forEach((transaccion) => {
      batch.delete(transaccion.ref);
    });

    await batch.commit();
    revalidatePath("/admin/ordenes");
    return { ok: true as const };
  } catch (error) {
    Sentry.captureException(error);
    console.error(`Error al eliminar la orden ${id}:`, error);
    return { ok: false as const, error: "No se pudo eliminar la orden" };
  }
}