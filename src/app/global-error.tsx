"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="es">
      <body className="flex min-h-[100dvh] items-center justify-center bg-brand-cream p-6 font-sans text-brand-coffee">
        <div className="flex max-w-md flex-col items-center gap-4 text-center">
          <h1 className="font-heading text-3xl font-bold">
            ¡Ups! Algo salió mal
          </h1>
          <p className="text-muted-foreground">
            Ocurrió un error inesperado en Renacer Drinks & Coffe. Intenta
            recargar la página.
          </p>
          <Button onClick={reset} className="min-h-12">
            Reintentar
          </Button>
        </div>
      </body>
    </html>
  );
}