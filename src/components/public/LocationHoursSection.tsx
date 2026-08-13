import { MapPin, Clock, CalendarDays } from "lucide-react";

const DIRECCION =
  "Dentro de Zona Gym, Ruezga Sur Sector 7 Calle 8, Barquisimeto, Lara";

const URL_MAPA = "https://maps.app.goo.gl/3Bi6iZRkv2ej18he9";

const LATITUD = 10.0876488;
const LONGITUD = -69.3056495;

export function LocationHoursSection() {
  const urlMapa = `https://www.google.com/maps?q=${LATITUD},${LONGITUD}&output=embed`;

  return (
    <section id="ubicacion" className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 md:py-24 lg:px-8">
      <div className="mb-10 text-center" data-reveal>
        <span className="font-heading text-sm font-semibold uppercase tracking-wider text-brand-rose-deep">
          Encuéntranos
        </span>
        <h2 className="mt-2 font-heading text-[1.75rem] font-bold text-brand-coffee sm:text-4xl">
          Ubicación y horarios
        </h2>
      </div>

      <div className="grid gap-8 md:grid-cols-2" data-reveal-stagger>
        <div className="flex flex-col justify-center gap-6 rounded-2xl border border-border/60 bg-white p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-rose-light">
              <MapPin className="h-6 w-6 text-brand-rose-deep" aria-hidden="true" />
            </div>
            <div>
              <h3 className="font-heading text-lg font-semibold text-brand-coffee">
                Dirección
              </h3>
              <p className="mt-1 text-sm font-small leading-relaxed text-muted-foreground sm:text-base">
                {DIRECCION}
              </p>
              <a
                href={URL_MAPA}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-2 rounded-full bg-brand-rose-deep px-4 py-2 text-sm font-small font-medium text-white transition-colors hover:bg-brand-rose-deep/90"
              >
                <MapPin className="h-4 w-4" aria-hidden="true" />
                Cómo llegar
              </a>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-rose-light">
              <Clock className="h-6 w-6 text-brand-rose-deep" aria-hidden="true" />
            </div>
            <div>
              <h3 className="font-heading text-lg font-semibold text-brand-coffee">
                Horarios de atención
              </h3>
              <ul className="mt-1 space-y-1 text-sm font-small text-muted-foreground sm:text-base">
                <li className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-brand-rose-deep" aria-hidden="true" />
                  Lunes a Domingo: 6:00 am – 12:00 pm
                </li>
                <li className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-brand-rose-deep" aria-hidden="true" />
                  Lunes a Domingo: 2:00 pm – 9:00 pm
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border/60 shadow-sm">
          <iframe
            title="Mapa de ubicación de Renacer Drinks & Coffe"
            src={urlMapa}
            className="h-full min-h-[320px] w-full border-0"
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </section>
  );
}