import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { DatosUsuario, RolUsuario } from "@/types/usuario";

export const ROLES_USUARIO: readonly { valor: RolUsuario; etiqueta: string }[] = [
  { valor: "admin", etiqueta: "Administrador" },
  { valor: "operador", etiqueta: "Operador" },
];

function esRolValido(rol: unknown): rol is RolUsuario {
  return rol === "admin" || rol === "operador";
}

function serializarDocumentoUsuario(
  uid: string,
  datos: Record<string, unknown> | undefined
): DatosUsuario | null {
  if (!datos) return null;
  if (typeof datos.email !== "string" || !esRolValido(datos.rol)) return null;

  return {
    uid,
    email: datos.email,
    nombre: typeof datos.nombre === "string" ? datos.nombre : "",
    rol: datos.rol,
    bloqueado: datos.bloqueado === true,
    creadoEn:
      typeof datos.creadoEn === "string" ? datos.creadoEn : "",
  };
}

export async function obtenerUsuarioPorUid(uid: string): Promise<DatosUsuario | null> {
  const documento = await getDoc(doc(db, "usuarios", uid));
  return serializarDocumentoUsuario(uid, documento.data());
}

export function escucharUsuario(
  uid: string,
  alCambiar: (usuario: DatosUsuario | null) => void
) {
  return onSnapshot(doc(db, "usuarios", uid), (documento) => {
    alCambiar(serializarDocumentoUsuario(uid, documento.data()));
  });
}