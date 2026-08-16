"use server";

import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";
import * as Sentry from "@sentry/nextjs";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import type { PromocionInput } from "@/types/promotion";

const COLECCION_PROMOCIONES = "promociones";

export type DatosPromocion = PromocionInput;

function validarPromocion(datos: DatosPromocion): string | null {
  if (!datos.titulo.trim()) return "El título es obligatorio.";
  if (datos.titulo.trim().length > 80) {
    return "El título no puede superar los 80 caracteres.";
  }
  if (!datos.horario.trim()) return "El horario es obligatorio.";
  if (datos.horario.trim().length > 120) {
    return "El horario no puede superar los 120 caracteres.";
  }
  if (!datos.descripcion.trim()) return "La descripción es obligatoria.";
  if (datos.descripcion.trim().length > 200) {
    return "La descripción no puede superar los 200 caracteres.";
  }
  if (!Array.isArray(datos.ofertas)) return "Las ofertas deben ser una lista.";
  if (datos.ofertas.length > 10) return "Máximo 10 ofertas por promoción.";
  for (const oferta of datos.ofertas) {
    if (!oferta.nombre.trim()) {
      return "Cada oferta debe tener nombre.";
    }
    if (
      !Number.isFinite(oferta.precio) ||
      !Number.isFinite(oferta.costo) ||
      oferta.precio < 0 ||
      oferta.costo < 0
    ) {
      return "Cada oferta debe tener precio y costo válidos (mayores o iguales a 0).";
    }
    if (oferta.precio < oferta.costo) {
      return `La oferta "${oferta.nombre}" tiene un costo mayor que su precio de venta.`;
    }
  }
  return null;
}

export async function crearPromocion(datos: DatosPromocion) {
  const errorValidacion = validarPromocion(datos);
  if (errorValidacion) return { ok: false as const, error: errorValidacion };

  try {
    const db = getAdminFirestore();
    const referencia = await db.collection(COLECCION_PROMOCIONES).add({
      titulo: datos.titulo.trim(),
      horario: datos.horario.trim(),
      descripcion: datos.descripcion.trim(),
      ofertas: datos.ofertas.map((oferta) => ({
        nombre: oferta.nombre.trim(),
        precio: oferta.precio,
        costo: oferta.costo,
        ...(oferta.esProteina ? { esProteina: true } : {}),
      })),
      activo: datos.activo,
      updatedAt: FieldValue.serverTimestamp(),
    });
    revalidatePath("/");
    revalidatePath("/admin/promociones");
    return { ok: true as const, id: referencia.id };
  } catch (error) {
    Sentry.captureException(error);
    console.error("Error al crear promoción:", error);
    return { ok: false as const, error: "No se pudo crear la promoción" };
  }
}

export async function actualizarPromocion(id: string, datos: DatosPromocion) {
  const errorValidacion = validarPromocion(datos);
  if (errorValidacion) return { ok: false as const, error: errorValidacion };

  try {
    const db = getAdminFirestore();
    await db.doc(`${COLECCION_PROMOCIONES}/${id}`).update({
      titulo: datos.titulo.trim(),
      horario: datos.horario.trim(),
      descripcion: datos.descripcion.trim(),
      ofertas: datos.ofertas.map((oferta) => ({
        nombre: oferta.nombre.trim(),
        precio: oferta.precio,
        costo: oferta.costo,
        ...(oferta.esProteina ? { esProteina: true } : {}),
      })),
      activo: datos.activo,
      updatedAt: FieldValue.serverTimestamp(),
    });
    revalidatePath("/");
    revalidatePath("/admin/promociones");
    return { ok: true as const };
  } catch (error) {
    Sentry.captureException(error);
    console.error(`Error al actualizar promoción ${id}:`, error);
    return { ok: false as const, error: "No se pudo actualizar la promoción" };
  }
}

export async function eliminarPromocion(id: string) {
  try {
    const db = getAdminFirestore();
    await db.doc(`${COLECCION_PROMOCIONES}/${id}`).delete();
    revalidatePath("/");
    revalidatePath("/admin/promociones");
    return { ok: true as const };
  } catch (error) {
    Sentry.captureException(error);
    console.error(`Error al eliminar promoción ${id}:`, error);
    return { ok: false as const, error: "No se pudo eliminar la promoción" };
  }
}