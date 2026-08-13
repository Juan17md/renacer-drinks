import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CupSoda } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 20% 0%, rgba(245,160,170,0.25), transparent), radial-gradient(ellipse 60% 50% at 90% 20%, rgba(201,56,74,0.10), transparent)",
        }}
        aria-hidden="true"
      />
      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-10 px-4 pb-16 pt-12 sm:px-6 md:grid-cols-2 md:pt-20 lg:px-8">
        <div className="flex flex-col items-start gap-6" data-reveal>
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-rose/40 bg-brand-rose-light px-4 py-2 text-sm font-small font-medium text-brand-rose-deep">
            <CupSoda className="h-4 w-4" aria-hidden="true" />
            Café artesanal en Barquisimeto
          </span>
          <h1 className="font-heading text-[2.5rem] font-bold leading-tight tracking-tight text-brand-coffee sm:text-5xl lg:text-[3.5rem]">
            Cada día es una nueva oportunidad para{" "}
            <span className="text-brand-rose-deep">renacer</span>
          </h1>
          <p className="max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
            Bebidas frías y calientes preparadas con granos seleccionados,
            leche de avena y mucho cariño. Descubre el menú y pide desde
            tu celular en la barra.
          </p>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link href="/catalogo" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="h-14 w-full text-base sm:w-auto"
              >
                Ver el menú
                <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
              </Button>
            </Link>
            <Link href="/#ubicacion" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="h-14 w-full text-base sm:w-auto"
              >
                Visítanos
              </Button>
            </Link>
          </div>
        </div>

        <div className="relative mx-auto flex max-w-sm items-center justify-center md:max-w-md" data-reveal>
          <div
            className="absolute h-64 w-64 rounded-full bg-brand-rose/30 blur-3xl"
            aria-hidden="true"
          />
          <Image
            src="/logo_sin_fondo.png"
            alt="Logo de Renacer Drinks & Coffe"
            width={400}
            height={400}
            className="relative z-10 h-auto w-full object-contain drop-shadow-xl"
            priority
          />
        </div>
      </div>
    </section>
  );
}