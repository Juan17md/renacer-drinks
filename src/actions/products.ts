"use server";

import "server-only";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { revalidatePath } from "next/cache";
import * as Sentry from "@sentry/nextjs";
import { db } from "@/lib/firebase";
import { imagekit } from "@/lib/imagekit";
import { generarSlug } from "@/lib/utils";

export interface DatosProducto {
  name: string;
  description: string;
  price: number;
  category: string;
  isAvailable: boolean;
  imageUrl: string;
  imageId: string;
}

export async function crearProducto(datos: DatosProducto) {
  try {
    const referencia = await addDoc(collection(db, "products"), {
      ...datos,
      updatedAt: serverTimestamp(),
    });
    revalidatePath("/catalogo");
    revalidatePath("/");
    return { ok: true as const, id: referencia.id };
  } catch (error) {
    Sentry.captureException(error);
    console.error("Error al crear producto:", error);
    return { ok: false as const, error: "No se pudo crear el producto" };
  }
}

export async function actualizarProducto(id: string, datos: DatosProducto) {
  try {
    await updateDoc(doc(db, "products", id), {
      ...datos,
      updatedAt: serverTimestamp(),
    });
    revalidatePath("/catalogo");
    revalidatePath("/");
    return { ok: true as const };
  } catch (error) {
    Sentry.captureException(error);
    console.error(`Error al actualizar producto ${id}:`, error);
    return { ok: false as const, error: "No se pudo actualizar el producto" };
  }
}

export async function eliminarProducto(id: string, imageId: string) {
  try {
    await deleteDoc(doc(db, "products", id));

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
    const referencia = await addDoc(collection(db, "categories"), {
      name: nombre,
      slug,
    });
    revalidatePath("/catalogo");
    revalidatePath("/admin/inventario");
    return { ok: true as const, id: referencia.id };
  } catch (error) {
    Sentry.captureException(error);
    console.error("Error al crear categoría:", error);
    return { ok: false as const, error: "No se pudo crear la categoría" };
  }
}

export async function eliminarCategoria(id: string) {
  try {
    await deleteDoc(doc(db, "categories", id));
    revalidatePath("/catalogo");
    revalidatePath("/admin/inventario");
    return { ok: true as const };
  } catch (error) {
    Sentry.captureException(error);
    console.error(`Error al eliminar categoría ${id}:`, error);
    return { ok: false as const, error: "No se pudo eliminar la categoría" };
  }
}