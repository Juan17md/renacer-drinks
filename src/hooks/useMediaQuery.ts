"use client";

import { useEffect, useState } from "react";

export function useMediaQuery(consulta: string): boolean {
  const [coincide, setCoincide] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(consulta).matches : false
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia(consulta);
    setCoincide(mediaQuery.matches);
    const manejarCambio = (evento: MediaQueryListEvent) =>
      setCoincide(evento.matches);
    mediaQuery.addEventListener("change", manejarCambio);
    return () => mediaQuery.removeEventListener("change", manejarCambio);
  }, [consulta]);

  return coincide;
}