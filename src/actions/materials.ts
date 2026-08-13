"use server";

import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";
import * as Sentry from "@sentry/nextjs";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import type { MaterialInput } from "@/types/material";

function validarMaterial(datos: MaterialInput): string | null {
  if (!datos.nombre.trim()) return "El nombre del material es obligatorio.";
  if (!datos.unidad.trim()) return "Indica la unidad de medida.";
  if (
    !datos.cantidad ||
    Number.isNaN(datos.cantidad) ||
    datos.cantidad < 0
  ) {
    return "Ingresa una cantidad válida.";
  }
  return null;
}

export async function crearMaterial(datos: MaterialInput) {
  const errorValidacion = validarMaterial(datos);
  if (errorValidacion) return { ok: false as const, error: errorValidacion };

  try {
    const db = getAdminFirestore();
    const referencia = await db.collection("materials").add({
      nombre: datos.nombre.trim(),
      unidad: datos.unidad.trim(),
      cantidad: Number(datos.cantidad),
      updatedAt: FieldValue.serverTimestamp(),
    });
    revalidatePath("/admin/inventario");
    return { ok: true as const, id: referencia.id };
  } catch (error) {
    Sentry.captureException(error);
    console.error("Error al crear material:", error);
    return { ok: false as const, error: "No se pudo crear el material" };
  }
}

export async function actualizarMaterial(id: string, datos: MaterialInput) {
  const errorValidacion = validarMaterial(datos);
  if (errorValidacion) return { ok: false as const, error: errorValidacion };

  try {
    const db = getAdminFirestore();
    await db.doc(`materials/${id}`).update({
      nombre: datos.nombre.trim(),
      unidad: datos.unidad.trim(),
      cantidad: Number(datos.cantidad),
      updatedAt: FieldValue.serverTimestamp(),
    });
    revalidatePath("/admin/inventario");
    return { ok: true as const };
  } catch (error) {
    Sentry.captureException(error);
    console.error(`Error al actualizar material ${id}:`, error);
    return { ok: false as const, error: "No se pudo actualizar el material" };
  }
}

export async function eliminarMaterial(id: string) {
  try {
    const db = getAdminFirestore();
    await db.doc(`materials/${id}`).delete();
    revalidatePath("/admin/inventario");
    return { ok: true as const };
  } catch (error) {
    Sentry.captureException(error);
    console.error(`Error al eliminar material ${id}:`, error);
    return { ok: false as const, error: "No se pudo eliminar el material" };
  }
}
