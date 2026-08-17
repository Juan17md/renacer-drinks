"use server";

import "server-only";
import { getAdminFirestore, getAdminAuth } from "@/lib/firebaseAdmin";
import { revalidatePath } from "next/cache";
import * as Sentry from "@sentry/nextjs";
import type { DatosNuevoUsuario, DatosEditarUsuario, RolUsuario } from "@/types/usuario";

function esRolValido(rol: string): rol is RolUsuario {
  return rol === "admin" || rol === "operador";
}

function normalizarEmail(email: string): string {
  return email.trim().toLowerCase();
}

function mensajeErrorCrearUsuario(error: unknown): string {
  const codigo = (error as { code?: string }).code;
  switch (codigo) {
    case "auth/email-already-exists":
      return "Ya existe un usuario con ese correo.";
    case "auth/invalid-email":
      return "El correo electrónico no es válido.";
    case "auth/weak-password":
      return "La contraseña debe tener al menos 6 caracteres.";
    case "auth/invalid-password":
      return "La contraseña no es válida.";
    default:
      return "No se pudo crear el usuario";
  }
}

export async function crearUsuario(datos: DatosNuevoUsuario) {
  try {
    const email = normalizarEmail(datos.email);
    if (!email || !datos.password || !datos.nombre.trim()) {
      return { ok: false as const, error: "Completa todos los campos" };
    }
    if (!esRolValido(datos.rol)) {
      return { ok: false as const, error: "Rol inválido" };
    }

    const auth = getAdminAuth();
    const usuarioCreado = await auth.createUser({
      email,
      password: datos.password,
      displayName: datos.nombre.trim(),
    });

    const db = getAdminFirestore();
    await db.collection("usuarios").doc(usuarioCreado.uid).set({
      email,
      nombre: datos.nombre.trim(),
      rol: datos.rol,
      bloqueado: false,
      creadoEn: new Date().toISOString(),
    });

    revalidatePath("/admin/usuarios");
    return { ok: true as const, uid: usuarioCreado.uid };
  } catch (error) {
    Sentry.captureException(error);
    console.error("Error al crear usuario:", error);
    return { ok: false as const, error: mensajeErrorCrearUsuario(error) };
  }
}

export async function editarUsuario(uid: string, datos: DatosEditarUsuario) {
  try {
    if (!datos.nombre.trim() || !esRolValido(datos.rol)) {
      return { ok: false as const, error: "Datos inválidos" };
    }

    const db = getAdminFirestore();
    await db.doc(`usuarios/${uid}`).update({
      nombre: datos.nombre.trim(),
      rol: datos.rol,
    });

    await getAdminAuth().updateUser(uid, {
      displayName: datos.nombre.trim(),
    });

    revalidatePath("/admin/usuarios");
    return { ok: true as const };
  } catch (error) {
    Sentry.captureException(error);
    console.error(`Error al editar usuario ${uid}:`, error);
    return { ok: false as const, error: "No se pudo editar el usuario" };
  }
}

export async function bloquearUsuario(uid: string, bloquear: boolean) {
  try {
    const db = getAdminFirestore();
    await db.doc(`usuarios/${uid}`).update({ bloqueado: bloquear });

    await getAdminAuth().updateUser(uid, { disabled: bloquear });

    revalidatePath("/admin/usuarios");
    return { ok: true as const };
  } catch (error) {
    Sentry.captureException(error);
    console.error(`Error al ${bloquear ? "bloquear" : "desbloquear"} usuario ${uid}:`, error);
    return { ok: false as const, error: "No se pudo actualizar el bloqueo" };
  }
}

export async function eliminarUsuario(uid: string) {
  try {
    const db = getAdminFirestore();
    await db.doc(`usuarios/${uid}`).delete();

    await getAdminAuth().deleteUser(uid);

    revalidatePath("/admin/usuarios");
    return { ok: true as const };
  } catch (error) {
    Sentry.captureException(error);
    console.error(`Error al eliminar usuario ${uid}:`, error);
    return { ok: false as const, error: "No se pudo eliminar el usuario" };
  }
}

export async function obtenerTodosLosUsuarios() {
  try {
    const db = getAdminFirestore();
    const snapshot = await db.collection("usuarios").orderBy("creadoEn", "desc").get();
    return snapshot.docs.map((documento) => ({
      uid: documento.id,
      ...documento.data(),
    }));
  } catch (error) {
    Sentry.captureException(error);
    console.error("Error al obtener usuarios:", error);
    return [];
  }
}