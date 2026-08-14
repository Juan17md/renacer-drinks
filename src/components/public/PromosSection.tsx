import { Clock, Zap, PartyPopper, Sparkles } from "lucide-react";

const PROMOCIONES = [
  {
    titulo: "Happy Hours",
    horario: "Lunes a Sábado de 8AM a 12PM",
    descripcion: "Dos por el precio de uno en tus favoritas.",
    ofertas: [
      { nombre: "2 Merengadas", precio: "$4.50" },
      { nombre: "2 Especiales", precio: "$5.60" },
    ],
    icono: PartyPopper,
  },
  {
    titulo: "Tarde de Poder",
    horario: "Por tiempo limitado",
    descripcion:
      "Añade extra de proteína a tu batido por $0.50.",
    ofertas: [],
    icono: Zap,
  },
] as const;

export function PromosSection() {
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
          {PROMOCIONES.map((promo) => (
            <article
              key={promo.titulo}
              className="flex flex-col rounded-2xl bg-white p-6 shadow-lg sm:p-7"
            >
              <div className="flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-rose-light">
                  <promo.icono
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
                      className="flex items-center justify-between rounded-xl border border-dashed border-brand-rose/40 px-4 py-3"
                    >
                      <span className="font-medium text-brand-coffee">
                        {oferta.nombre}
                      </span>
                      <span className="font-heading text-lg font-bold text-brand-rose-deep">
                        {oferta.precio}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
