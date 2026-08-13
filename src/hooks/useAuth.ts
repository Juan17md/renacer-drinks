"use client";

import { useEffect, useState, useCallback } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { obtenerUsuarioPorUid, escucharUsuario } from "@/services/usuarios";
import type { DatosUsuario } from "@/types/usuario";

export function useAuth() {
  const [usuario, setUsuario] = useState<User | null>(null);
  const [datosUsuario, setDatosUsuario] = useState<DatosUsuario | null>(null);
  const [cargando, setCargando] = useState(true);
  const [cargandoDatos, setCargandoDatos] = useState(false);

  useEffect(() => {
    const desuscribir = onAuthStateChanged(auth, (usuarioActual) => {
      setUsuario(usuarioActual);
      setCargando(false);
      if (usuarioActual) {
        setCargandoDatos(true);
      } else {
        setDatosUsuario(null);
        setCargandoDatos(false);
      }
    });
    return desuscribir;
  }, []);

  useEffect(() => {
    if (!usuario) return;

    let desuscribirEscucha: (() => void) | null = null;

    obtenerUsuarioPorUid(usuario.uid).then((datos) => {
      if (datos) {
        setDatosUsuario(datos);
        desuscribirEscucha = escucharUsuario(usuario.uid, setDatosUsuario);
      } else {
        setDatosUsuario(null);
      }
      setCargandoDatos(false);
    });

    return () => {
      desuscribirEscucha?.();
    };
  }, [usuario]);

  const iniciarSesion = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  }, []);

  const cerrarSesion = useCallback(async () => {
    await signOut(auth);
  }, []);

  return {
    usuario,
    datosUsuario,
    esAdmin: datosUsuario?.rol === "admin",
    cargando,
    cargandoDatos,
    iniciarSesion,
    cerrarSesion,
  };
}