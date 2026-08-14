import { Clock, Zap, PartyPopper, Sparkles, type LucideIcon } from "lucide-react";
import { obtenerPromocionesActivas } from "@/services/promotions";
import { BotonAgregarOferta } from "@/components/public/BotonAgregarOferta";
import type { Promocion } from "@/types/promotion";

const ICONOS_POR_INDICE: LucideIcon[] = [PartyPopper, Zap, Sparkles];

function iconoDePromocion(indice: number): LucideIcon {
  return ICONOS_POR_INDICE[indice % ICONOS_POR_INDICE.length];
}

export async function PromosSection() {
  const promociones = await obtenerPromocionesActivas();

  if (promociones.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="promociones-titulo"
      className="relative overflow-hidden bg-brand-rose-deep py-16 sm:py-20"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-20 -left-10 h-72 w-72 rounded-full bg-brand-rose/40 blur-3xl"
      />

      <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center" data-reveal>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-1.5 text-xs font-small font-semibold uppercase tracking-wider text-white">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Solo por tiempo limitado
          </span>
          <h2
            id="promociones-titulo"
            className="mt-4 font-heading text-3xl font-bold text-white sm:text-4xl"
          >
            Promociones del día
          </h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2" data-reveal-stagger>
          {promociones.map((promo: Promocion, indice: number) => {
            const Icono = iconoDePromocion(indice);
            return (
              <article
                key={promo.id}
                className="flex flex-col rounded-2xl bg-white p-6 shadow-lg sm:p-7"
              >
                <div className="flex items-start gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-rose-light">
                    <Icono
                      className="h-6 w-6 text-brand-rose-deep"
                      aria-hidden="true"
                    />
                  </span>
                  <div>
                    <h3 className="font-heading text-xl font-bold text-brand-coffee">
                      {promo.titulo}
                    </h3>
                    <p className="mt-1 flex items-center gap-1.5 text-sm font-small font-medium text-brand-rose-deep">
                      <Clock className="h-4 w-4" aria-hidden="true" />
                      {promo.horario}
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-sm font-small leading-relaxed text-muted-foreground">
                  {promo.descripcion}
                </p>

                {promo.ofertas.length > 0 && (
                  <ul className="mt-5 space-y-2.5">
                    {promo.ofertas.map((oferta) => (
                      <li
                        key={oferta.nombre}
                        className="flex flex-col gap-3 rounded-xl border border-dashed border-brand-rose/40 px-4 py-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-medium text-brand-coffee">
                            {oferta.nombre}
                          </span>
                          <span className="font-heading text-lg font-bold text-brand-rose-deep">
                            {oferta.precio}
                          </span>
                        </div>
                        <BotonAgregarOferta promoId={promo.id} oferta={oferta} />
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}