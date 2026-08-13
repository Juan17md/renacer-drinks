import "server-only";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Categoria } from "@/types/category";

export async function obtenerCategorias(): Promise<Categoria[]> {
  try {
    const consulta = query(
      collection(db, "categories"),
      orderBy("name", "asc")
    );
    const snapshots = await getDocs(consulta);
    return snapshots.docs.map((snapshot) => ({
      id: snapshot.id,
      name: String(snapshot.data().name ?? ""),
      slug: String(snapshot.data().slug ?? ""),
    }));
  } catch (error) {
    console.error("Error al obtener categorías:", error);
    return [];
  }
}