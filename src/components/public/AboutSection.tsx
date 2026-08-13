import { HeartHandshake, Sparkles, Leaf } from "lucide-react";

const VALORES = [
  {
    icono: Leaf,
    titulo: "Ingredientes de calidad",
    descripcion:
      "Granos seleccionados, leche de avena y productos frescos en cada preparación.",
  },
  {
    icono: Sparkles,
    titulo: "Bebidas únicas",
    descripcion:
      "Recetas propias que combinan sabores clásicos con un toque innovador.",
  },
  {
    icono: HeartHandshake,
    titulo: "Atención con cariño",
    descripcion:
      "Un espacio pensado para compartir, trabajar o simplemente disfrutar.",
  },
];

export function AboutSection() {
  return (
    <section id="historia" className="border-y border-border/60 bg-white">
      <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 py-16 sm:px-6 md:grid-cols-2 md:py-24 lg:px-8">
        <div className="flex flex-col items-start gap-6">
          <span className="font-heading text-sm font-semibold uppercase tracking-wider text-brand-rose-deep">
            Nuestra historia
          </span>
          <h2 className="font-heading text-[1.75rem] font-bold leading-tight text-brand-coffee sm:text-4xl">
            Un lugar donde cada taza cuenta una historia
          </h2>
          <div className="space-y-4 text-base leading-relaxed text-muted-foreground">
            <p>
              Renacer Drinks & Coffe nació en Barquisimeto con una idea
              sencilla: crear un espacio donde cada visita sea una pausa
              para reconectar, disfrutar y <strong>renacer</strong>.
            </p>
            <p>
              Ubicados dentro de Zona Gym, somos el punto de encuentro
              perfecto después del entrenamiento: batidos, cafés, frappés y
              bebidas energizantes preparados al momento.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-1">
          {VALORES.map((valor) => (
            <div
              key={valor.titulo}
              className="flex gap-4 rounded-2xl border border-border/60 bg-background p-5 transition-shadow hover:shadow-md"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-rose-light">
                <valor.icono
                  className="h-6 w-6 text-brand-rose-deep"
                  aria-hidden="true"
                />
              </div>
              <div>
                <h3 className="font-heading text-lg font-semibold text-brand-coffee">
                  {valor.titulo}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {valor.descripcion}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}