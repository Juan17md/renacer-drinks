import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { obtenerProductosDisponibles } from "@/services/products";
import { obtenerTasaBCV } from "@/lib/bcv";
import { formatearUSD, formatearBs, convertirUSDaBs } from "@/lib/utils";

export async function FeaturedProducts() {
  const [productos, tasa] = await Promise.all([
    obtenerProductosDisponibles(),
    obtenerTasaBCV(),
  ]);

  const destacados = productos.slice(0, 3);

  if (destacados.length === 0) {
    return (
      <section className="border-y border-border/60 bg-white">
        <div className="mx-auto w-full max-w-7xl px-4 py-16 text-center sm:px-6 md:py-24 lg:px-8">
          <h2 className="font-heading text-[1.75rem] font-bold text-brand-coffee sm:text-4xl">
            Próximamente nuestro menú
          </h2>
          <p className="mx-auto mt-4 max-w-md text-muted-foreground">
            Estamos preparando algo especial. Muy pronto podrás ver nuestras
            bebidas destacadas aquí.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section id="destacados" className="border-y border-border/60 bg-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 md:py-24 lg:px-8">
        <div className="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end" data-reveal>
          <div>
            <span className="font-heading text-sm font-semibold uppercase tracking-wider text-brand-rose-deep font-small">
              Favoritos
            </span>
            <h2 className="mt-2 font-heading text-[1.75rem] font-bold text-brand-coffee sm:text-4xl">
              Productos destacados
            </h2>
          </div>
          <Link
            href="/catalogo"
            className="inline-flex min-h-12 items-center gap-2 rounded-md px-4 text-sm font-small font-medium text-brand-rose-deep transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Ver menú completo
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" data-reveal-stagger>
          {destacados.map((producto) => {
            const precioBs = convertirUSDaBs(producto.price, tasa.promedio);
            return (
              <article
                key={producto.id}
                className="group overflow-hidden rounded-2xl border border-border/60 bg-background transition-shadow hover:shadow-lg"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-brand-rose-light">
                  {producto.imageUrl ? (
                    <Image
                      src={producto.imageUrl}
                      alt={producto.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <span className="text-5xl" aria-hidden="true">☕</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2 p-5">
                  <h3 className="font-heading text-lg font-semibold text-brand-coffee">
                    {producto.name}
                  </h3>
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="font-semibold text-brand-rose-deep">
                      {formatearUSD(producto.price)}
                    </span>
                    {tasa.promedio > 0 && (
                      <span className="text-sm font-small text-muted-foreground">
                        {formatearBs(precioBs)}
                      </span>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}