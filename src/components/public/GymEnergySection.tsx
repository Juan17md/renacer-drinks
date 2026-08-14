import { Dumbbell, Milk, Zap, FlaskConical } from "lucide-react";

const BENEFICIOS = [
  {
    icono: Milk,
    titulo: "Batidos con proteína",
    descripcion:
      "Whey en batidos cremosos y deliciosos, preparados al momento para reponer fuerzas después del gym.",
  },
  {
    icono: Zap,
    titulo: "Energía para tu rutina",
    descripcion:
      "Bebidas energizantes y cafés que te acompañan antes, durante y después de entrenar.",
  },
  {
    icono: FlaskConical,
    titulo: "Suplementos",
    descripcion:
      "Una selección de suplementos deportivos para complementar tu entrenamiento y tu recuperación.",
  },
];

export function GymEnergySection() {
  return (
    <section
      id="energia-gym"
      aria-labelledby="energia-gym-titulo"
      className="bg-brand-cream"
    >
      <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 md:py-24 lg:px-8">
        <div className="mb-10 text-center" data-reveal>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-rose-light px-4 py-1.5 text-xs font-small font-semibold uppercase tracking-wider text-brand-rose-deep">
            <Dumbbell className="h-3.5 w-3.5" aria-hidden="true" />
            Dentro de Zona Gym
          </span>
          <h2
            id="energia-gym-titulo"
            className="mt-4 font-heading text-[1.75rem] font-bold text-brand-coffee sm:text-4xl"
          >
            Energía para tu entrenamiento
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
            Estamos dentro del gimnasio, así que preparamos todo lo que tu
            cuerpo necesita antes y después de entrenar: batidos con proteína,
            bebidas energizantes y suplementos listos para llevar.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-reveal-stagger>
          {BENEFICIOS.map((beneficio) => (
            <div
              key={beneficio.titulo}
              className="flex flex-col items-start gap-4 rounded-2xl border border-border/60 bg-white p-6 transition-shadow hover:shadow-md"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-rose-light">
                <beneficio.icono
                  className="h-6 w-6 text-brand-rose-deep"
                  aria-hidden="true"
                />
              </div>
              <h3 className="font-heading text-lg font-semibold text-brand-coffee">
                {beneficio.titulo}
              </h3>
              <p className="text-sm font-small leading-relaxed text-muted-foreground">
                {beneficio.descripcion}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}