"use server";

import "server-only";
import * as Sentry from "@sentry/nextjs";
import { getAdminFirestore, getAdminAuth } from "@/lib/firebaseAdmin";
import type { MetodoPagoDatosGuardado, DatoMetodoPago } from "@/types/payment";
import { METODOS_PAGO_PREDETERMINADOS } from "@/services/metodosPago";
import { generarSlug } from "@/lib/utils";

const COLECCION_METODOS = "metodos_pago";
const COLECCION_USUARIOS = "usuarios";
const PATRON_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function validarDatosMetodoPago(
  datos: MetodoPagoDatosGuardado
): string | null {
  if (!datos.label.trim()) return "El nombre del método es obligatorio.";
  if (!Array.isArray(datos.datos)) return "Los datos deben ser una lista.";
  if (datos.datos.length > 10) return "Máximo 10 datos por método.";
  for (const par of datos.datos) {
    if (!par.etiqueta.trim() || !par.valor.trim()) {
      return "Cada dato debe tener etiqueta y valor.";
    }
  }
  return null;
}

export async function crearMetodoPago(datos: MetodoPagoDatosGuardado) {
  const errorValidacion = validarDatosMetodoPago(datos);
  if (errorValidacion) {
    return { ok: false as const, error: errorValidacion };
  }

  const id = generarSlug(datos.label.trim());
  if (!id || !PATRON_SLUG.test(id)) {
    return {
      ok: false as const,
      error: "El nombre no genera un identificador válido.",
    };
  }

  try {
    const db = getAdminFirestore();
    const existente = await db.doc(`${COLECCION_METODOS}/${id}`).get();
    if (existente.exists) {
      return {
        ok: false as const,
        error: "Ya existe un método de pago con ese nombre.",
      };
    }

    await db.doc(`${COLECCION_METODOS}/${id}`).set({
      label: datos.label.trim(),
      activo: Boolean(datos.activo),
      requiereComprobante: Boolean(datos.requiereComprobante),
      datos: datos.datos.map((par: DatoMetodoPago) => ({
        etiqueta: par.etiqueta.trim(),
        valor: par.valor.trim(),
      })),
    });
    return { ok: true as const, id };
  } catch (error) {
    Sentry.captureException(error);
    console.error(`Error al crear método de pago ${id}:`, error);
    return { ok: false as const, error: "No se pudo crear el método de pago" };
  }
}

export async function guardarMetodoPago(
  id: string,
  datos: MetodoPagoDatosGuardado
) {
  if (!PATRON_SLUG.test(id)) {
    return { ok: false as const, error: "Método de pago no válido." };
  }
  const errorValidacion = validarDatosMetodoPago(datos);
  if (errorValidacion) {
    return { ok: false as const, error: errorValidacion };
  }

  try {
    const db = getAdminFirestore();
    await db.doc(`${COLECCION_METODOS}/${id}`).set(
      {
        label: datos.label.trim(),
        activo: Boolean(datos.activo),
        requiereComprobante: Boolean(datos.requiereComprobante),
        datos: datos.datos.map((par: DatoMetodoPago) => ({
          etiqueta: par.etiqueta.trim(),
          valor: par.valor.trim(),
        })),
      },
      { merge: true }
    );
    return { ok: true as const };
  } catch (error) {
    Sentry.captureException(error);
    console.error(`Error al guardar método de pago ${id}:`, error);
    return { ok: false as const, error: "No se pudo guardar el método de pago" };
  }
}

export async function eliminarMetodoPago(id: string, idToken: string) {
  if (!PATRON_SLUG.test(id)) {
    return { ok: false as const, error: "Método de pago no válido." };
  }
  if (!idToken) {
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
        error: "Solo el administrador puede eliminar métodos de pago.",
      };
    }

    await db.doc(`${COLECCION_METODOS}/${id}`).delete();
    return { ok: true as const };
  } catch (error) {
    Sentry.captureException(error);
    console.error(`Error al eliminar método de pago ${id}:`, error);
    return { ok: false as const, error: "No se pudo eliminar el método de pago" };
  }
}

export async function sembrarMetodosPagoPorDefecto() {
  try {
    const db = getAdminFirestore();
    const batch = db.batch();
    for (const metodo of METODOS_PAGO_PREDETERMINADOS) {
      batch.set(
        db.doc(`${COLECCION_METODOS}/${metodo.id}`),
        {
          label: metodo.label,
          activo: metodo.activo,
          requiereComprobante: metodo.requiereComprobante,
          datos: metodo.datos,
        },
        { merge: true }
      );
    }
    await batch.commit();
    return { ok: true as const };
  } catch (error) {
    Sentry.captureException(error);
    console.error("Error al sembrar métodos de pago:", error);
    return {
      ok: false as const,
      error: "No se pudieron cargar los métodos de pago",
    };
  }
}