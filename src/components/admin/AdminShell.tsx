"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { usuario, cargando } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!cargando && !usuario && pathname !== "/admin/login") {
      router.replace("/admin/login");
    }
  }, [cargando, usuario, pathname, router]);

  if (cargando) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-brand-cream">
        <div className="flex flex-col items-center gap-3">
          <Loader2
            className="h-8 w-8 animate-spin text-brand-rose-deep"
            aria-hidden="true"
          />
          <p className="text-sm text-muted-foreground" aria-live="polite">
            Verificando sesión...
          </p>
        </div>
      </div>
    );
  }

  if (!usuario) {
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