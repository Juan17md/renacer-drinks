import Link from "next/link";
import Image from "next/image";
import { MapPin, Clock, Coffee } from "lucide-react";
import { IconoInstagram } from "@/components/icons/IconoInstagram";

const DATOS_CAFETERIA = {
  direccion: "Dentro de Zona Gym, Ruezga Sur Sector 7 Calle 8, Barquisimeto, Lara",
  urlMapa: "https://maps.app.goo.gl/3Bi6iZRkv2ej18he9",
  instagram: process.env.NEXT_PUBLIC_CAFE_INSTAGRAM || "https://www.instagram.com/renacer.drinks",
};

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-[#f8f1ec]/85">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3 lg:px-8">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Image
              src="/logo_sin_fondo.png"
              alt="Logo de Renacer Drinks & Coffe"
              width={36}
              height={36}
              className="h-9 w-9 object-contain"
            />
            <span className="font-heading text-lg font-bold text-brand-coffee">
              Renacer Drinks & Coffe
            </span>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Café artesanal y bebidas para renacer cada día en Barquisimeto,
            Lara. Hecho con amor y buenos granos.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-brand-coffee">
            Horarios
          </h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-brand-rose-deep" aria-hidden="true" />
              Lunes a Domingo: 6:00 am – 12:00 pm
            </li>
            <li className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-brand-rose-deep" aria-hidden="true" />
              Lunes a Domingo: 2:00 pm – 9:00 pm
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-brand-coffee">
            Contáctanos
          </h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <Link
                href={DATOS_CAFETERIA.urlMapa}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-9 items-start gap-2 transition-colors hover:text-brand-rose-deep"
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-rose-deep" aria-hidden="true" />
                <span>{DATOS_CAFETERIA.direccion}</span>
              </Link>
            </li>
            <li>
              <Link
                href={DATOS_CAFETERIA.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-9 items-center gap-2 transition-colors hover:text-brand-rose-deep"
              >
                <IconoInstagram className="h-4 w-4 text-brand-rose-deep" />
                @renacer.drinks
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border/60 py-5">
        <p className="flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
          <Coffee className="h-4 w-4 text-brand-rose-deep" aria-hidden="true" />
          © {new Date().getFullYear()} Renacer Drinks & Coffe. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}