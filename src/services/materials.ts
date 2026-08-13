import "server-only";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Material } from "@/types/material";

const COLECCION_MATERIALES = "materials";

function convertirMaterial(docSnapshot: {
  id: string;
  data: () => Record<string, unknown>;
}): Material {
  const datos = docSnapshot.data();
  return {
    id: docSnapshot.id,
    nombre: String(datos.nombre ?? ""),
    unidad: String(datos.unidad ?? "und"),
    cantidad: Number(datos.cantidad ?? 0),
    updatedAt:
      datos.updatedAt instanceof Date
        ? datos.updatedAt.toISOString()
        : String(datos.updatedAt ?? ""),
  };
}

export async function obtenerMateriales(): Promise<Material[]> {
  try {
    const consulta = query(
      collection(db, COLECCION_MATERIALES),
      orderBy("nombre", "asc")
    );
    const snapshots = await getDocs(consulta);
    return snapshots.docs.map(convertirMaterial);
  } catch (error) {
    console.error("Error al obtener materiales:", error);
    return [];
  }
}
