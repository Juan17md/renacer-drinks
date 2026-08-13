import type { TasaBCV } from "@/types/bcv";

const TASA_BCV_URL = "https://ve.dolarapi.com/v1/dolares/oficial";
const REVALIDATE_SEGUNDOS = 3600;

const TASA_FALLBACK = 0;

export async function obtenerTasaBCV(): Promise<TasaBCV> {
  try {
    const respuesta = await fetch(TASA_BCV_URL, {
      next: { revalidate: REVALIDATE_SEGUNDOS },
      cache: "force-cache",
    });

    if (!respuesta.ok) {
      throw new Error(
        `La API BCV respondió con estado ${respuesta.status}`
      );
    }

    const datos = (await respuesta.json()) as Partial<TasaBCV>;

    if (typeof datos.promedio !== "number" || datos.promedio <= 0) {
      throw new Error("La API BCV devolvió un promedio inválido");
    }

    return {
      promedio: datos.promedio,
      fechaActualizacion:
        datos.fechaActualizacion ?? new Date().toISOString(),
      moneda: datos.moneda ?? "Bolívar",
      codigo: datos.codigo ?? "VES",
    };
  } catch (error) {
    console.error("Error al consultar la tasa BCV:", error);
    return {
      promedio: TASA_FALLBACK,
      fechaActualizacion: new Date().toISOString(),
      moneda: "Bolívar",
      codigo: "VES",
    };
  }
}