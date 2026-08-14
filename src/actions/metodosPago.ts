"use server";

import "server-only";
import * as Sentry from "@sentry/nextjs";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import type { MetodoPagoDatosGuardado, DatoMetodoPago } from "@/types/payment";
import type { MetodoPago } from "@/types/transaction";
import { METODOS_PAGO_PREDETERMINADOS } from "@/services/metodosPago";

const COLECCION_METODOS = "metodos_pago";
const METODOS_VALIDOS = METODOS_PAGO_PREDETERMINADOS.map((m) => m.id);

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

export async function guardarMetodoPago(
  id: MetodoPago,
  datos: MetodoPagoDatosGuardado
) {
  if (!METODOS_VALIDOS.includes(id)) {
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