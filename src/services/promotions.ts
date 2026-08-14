import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Promocion } from "@/types/promotion";

function convertirPromocion(docSnapshot: {
  id: string;
  data: () => Record<string, unknown>;
}): Promocion {
  const datos = docSnapshot.data();
  return {
    id: docSnapshot.id,
    titulo: String(datos.titulo ?? ""),
    horario: String(datos.horario ?? ""),
    descripcion: String(datos.descripcion ?? ""),
    ofertas: Array.isArray(datos.ofertas)
      ? (datos.ofertas as Promocion["ofertas"])
      : [],
    activo: datos.activo === undefined ? true : Boolean(datos.activo),
    updatedAt:
      datos.updatedAt instanceof Date
        ? datos.updatedAt.toISOString()
        : String(datos.updatedAt ?? ""),
  };
}

export async function obtenerPromociones(): Promise<Promocion[]> {
  try {
    const consulta = query(
      collection(db, "promociones"),
      orderBy("titulo", "asc")
    );
    const snapshots = await getDocs(consulta);
    return snapshots.docs.map(convertirPromocion);
  } catch (error) {
    console.error("Error al obtener promociones:", error);
    return [];
  }
}

export async function obtenerPromocionesActivas(): Promise<Promocion[]> {
  const promociones = await obtenerPromociones();
  return promociones.filter((promocion) => promocion.activo);
}