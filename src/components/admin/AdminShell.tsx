"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { usuario, datosUsuario, esAdmin, cargando, cargandoDatos, cerrarSesion } =
    useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const esPaginaLogin = pathname === "/admin/login";

  useEffect(() => {
    if (cargando || cargandoDatos) return;
    if (!usuario) {
      if (!esPaginaLogin) {
        router.replace("/admin/login");
      }
      return;
    }

    if (!datosUsuario || datosUsuario.bloqueado) {
      cerrarSesion();
      if (!esPaginaLogin) {
        router.replace("/admin/login");
      }
      return;
    }

    if (esPaginaLogin) {
      router.replace("/admin/dashboard");
      return;
    }

    if (!esAdmin && pathname.startsWith("/admin/usuarios")) {
      router.replace("/admin/dashboard");
    }
  }, [
    cargando,
    cargandoDatos,
    usuario,
    datosUsuario,
    esAdmin,
    esPaginaLogin,
    pathname,
    router,
    cerrarSesion,
  ]);

  if (cargando || cargandoDatos) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-brand-cream">
        <div className="flex flex-col items-center gap-3">
          <Loader2
            className="h-8 w-8 animate-spin text-brand-rose-deep"
            aria-hidden="true"
          />
          <p className="text-base text-muted-foreground" aria-live="polite">
            Verificando sesión...
          </p>
        </div>
      </div>
    );
  }

  if (esPaginaLogin) {
    return <>{children}</>;
  }

  if (!usuario || !datosUsuario || datosUsuario.bloqueado) {
    return null;
  }

  return (
    <div className="flex min-h-[100dvh] bg-brand-cream">
      <AdminSidebar />
      <main className="flex-1 overflow-x-hidden pb-16 pt-20 md:pb-8 md:pl-64 md:pt-8">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}