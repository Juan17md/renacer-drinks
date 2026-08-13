"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Loader2, LogIn, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export default function PaginaLogin() {
  const router = useRouter();
  const { iniciarSesion } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [error, setError] = useState("");
  const [pendiente, setPendiente] = useTransition();

  const manejarEnvio = (evento: React.FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Ingresa tu correo y contraseña.");
      return;
    }

    setPendiente(async () => {
      try {
        await iniciarSesion(email, password);
        toast.success("Bienvenido de vuelta");
        router.push("/admin/dashboard");
        router.refresh();
      } catch (errorAuth) {
        const codigo = (errorAuth as { code?: string }).code;
        if (codigo === "auth/invalid-credential") {
          setError("Correo o contraseña incorrectos.");
        } else if (codigo === "auth/too-many-requests") {
          setError("Demasiados intentos. Espera un momento e inténtalo de nuevo.");
        } else {
          setError("No se pudo iniciar sesión. Inténtalo de nuevo.");
        }
      }
    });
  };

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-brand-cream px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <Image
            src="/logo_sin_fondo.png"
            alt="Logo de Renacer Drinks & Coffe"
            width={96}
            height={96}
            className="h-24 w-24 object-contain"
            priority
          />
          <div>
            <h1 className="font-heading text-2xl font-bold text-brand-coffee">
              Panel de administración
            </h1>
            <p className="mt-1 text-base text-muted-foreground">
              Renacer Drinks & Coffe
            </p>
          </div>
        </div>

        <form
          onSubmit={manejarEnvio}
          className="space-y-5 rounded-2xl border border-border/60 bg-white p-6 shadow-sm"
          noValidate
        >
          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(evento) => setEmail(evento.target.value)}
              placeholder="admin@renacer.com"
              className="h-12 text-base"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <div className="relative">
              <Input
                id="password"
                type={mostrarPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(evento) => setPassword(evento.target.value)}
                placeholder="••••••••"
                className="h-12 pr-12 text-base"
              />
              <button
                type="button"
                onClick={() => setMostrarPassword((mostrar) => !mostrar)}
                aria-label={
                  mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                }
                className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:text-brand-coffee"
              >
                {mostrarPassword ? (
                  <EyeOff className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Eye className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-lg bg-destructive/10 px-3 py-2 text-base text-destructive"
            >
              {error}
            </p>
          )}

          <Button type="submit" disabled={pendiente} className="h-12 w-full text-base">
            {pendiente ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                Iniciando sesión...
              </>
            ) : (
              <>
                <LogIn className="mr-2 h-4 w-4" aria-hidden="true" />
                Iniciar sesión
              </>
            )}
          </Button>
        </form>

        <p className="mt-6 text-center">
          <Link
            href="/"
            className="inline-flex min-h-10 items-center text-base text-muted-foreground transition-colors hover:text-brand-rose-deep"
          >
            ← Volver a la página principal
          </Link>
        </p>
      </div>
    </main>
  );
}