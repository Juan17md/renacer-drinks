"use client";

import { useEffect } from "react";

export function RegistroServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Silencioso: el modo offline es una mejora progresiva
    });
  }, []);

  return null;
}
