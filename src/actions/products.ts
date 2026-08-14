"use server";

import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";
import * as Sentry from "@sentry/nextjs";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { imagekit } from "@/lib/imagekit";
import { generarSlug } from "@/lib/utils";

export interface DatosProducto {
  name: string;
  description: string;
  price: number;
  costo: number;
  category: string;
  isAvailable: boolean;
  destacado: boolean;
  imageUrl: string;
  imageId: string;
}

function validarProducto(datos: DatosProducto): string | null {
  if (!datos.name.trim()) return "El nombre es obligatorio.";
  if (!datos.price || Number.isNaN(datos.price) || datos.price <= 0) {
    return "Ingresa un precio de venta válido en USD.";
  }
  if (!datos.costo || Number.isNaN(datos.costo) || datos.costo < 0) {
    return "Ingresa un precio (costo) válido en USD.";
  }
  if (datos.price < datos.costo) {
    return "El precio de venta no puede ser menor que el precio (costo).";
  }
  if (!datos.category) return "Selecciona una categoría.";
  return null;
}

export async function crearProducto(datos: DatosProducto) {
  const errorValidacion = validarProducto(datos);
  if (errorValidacion) return { ok: false as const, error: errorValidacion };

  try {
    const db = getAdminFirestore();
    const referencia = await db.collection("products").add({
      ...datos,
      updatedAt: FieldValue.serverTimestamp(),
    });
    revalidatePath("/catalogo");
    revalidatePath("/");
    revalidatePath("/admin/catalogo");
    return { ok: true as const, id: referencia.id };
  } catch (error) {
    Sentry.captureException(error);
    console.error("Error al crear producto:", error);
    return { ok: false as const, error: "No se pudo crear el producto" };
  }
}

export async function actualizarProducto(id: string, datos: DatosProducto) {
  const errorValidacion = validarProducto(datos);
  if (errorValidacion) return { ok: false as const, error: errorValidacion };

  try {
    const db = getAdminFirestore();
    await db.doc(`products/${id}`).update({
      ...datos,
      updatedAt: FieldValue.serverTimestamp(),
    });
    revalidatePath("/catalogo");
    revalidatePath("/");
    revalidatePath("/admin/catalogo");
    return { ok: true as const };
  } catch (error) {
    Sentry.captureException(error);
    console.error(`Error al actualizar producto ${id}:`, error);
    return { ok: false as const, error: "No se pudo actualizar el producto" };
  }
}

export async function eliminarProducto(id: string, imageId: string) {
  try {
    const db = getAdminFirestore();
    await db.doc(`products/${id}`).delete();

    if (imageId) {
      try {
        await imagekit.deleteFile(imageId);
      } catch (errorEliminar) {
        console.error(`Error al eliminar imagen ${imageId}:`, errorEliminar);
      }
    }

    revalidatePath("/catalogo");
    revalidatePath("/");
    return { ok: true as const };
  } catch (error) {
    Sentry.captureException(error);
    console.error(`Error al eliminar producto ${id}:`, error);
    return { ok: false as const, error: "No se pudo eliminar el producto" };
  }
}

export async function crearCategoria(datos: { name: string }) {
  try {
    const nombre = datos.name.trim();
    if (!nombre) {
      return { ok: false as const, error: "El nombre es obligatorio" };
    }
    const slug = generarSlug(nombre);
    const db = getAdminFirestore();
    const referencia = await db.collection("categories").add({
      name: nombre,
      slug,
    });
    revalidatePath("/catalogo");
    revalidatePath("/admin/catalogo");
    return { ok: true as const, id: referencia.id };
  } catch (error) {
    Sentry.captureException(error);
    console.error("Error al crear categoría:", error);
    return { ok: false as const, error: "No se pudo crear la categoría" };
  }
}

export async function eliminarCategoria(id: string) {
  try {
    const db = getAdminFirestore();
    await db.doc(`categories/${id}`).delete();
    revalidatePath("/catalogo");
    revalidatePath("/admin/catalogo");
    return { ok: true as const };
  } catch (error) {
    Sentry.captureException(error);
    console.error(`Error al eliminar categoría ${id}:`, error);
    return { ok: false as const, error: "No se pudo eliminar la categoría" };
  }
}