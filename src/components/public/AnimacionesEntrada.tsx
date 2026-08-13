"use client";

import { useEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function AnimacionesEntrada({ children }: { children: ReactNode }) {
  const raizRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const raiz = raizRef.current;
    if (!raiz) return;

    const contexto = gsap.context(() => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(raiz.querySelectorAll("[data-reveal]"), { clearProps: "all" });
        gsap.set(raiz.querySelectorAll("[data-reveal-stagger] > *"), {
          clearProps: "all",
        });
      });

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.utils.toArray<HTMLElement>(raiz.querySelectorAll("[data-reveal]")).forEach((elemento) => {
          gsap.from(elemento, {
            opacity: 0,
            y: 24,
            duration: 0.8,
            ease: "power2.out",
            scrollTrigger: {
              trigger: elemento,
              start: "top 85%",
              once: true,
            },
          });
        });

        gsap.utils
          .toArray<HTMLElement>(raiz.querySelectorAll("[data-reveal-stagger]"))
          .forEach((contenedor) => {
            gsap.from(contenedor.children, {
              opacity: 0,
              y: 24,
              duration: 0.6,
              stagger: 0.12,
              ease: "power2.out",
              scrollTrigger: {
                trigger: contenedor,
                start: "top 85%",
                once: true,
              },
            });
          });
      });
    }, raiz);

    const manejarCarga = () => ScrollTrigger.refresh();
    window.addEventListener("load", manejarCarga);
    const temporizador = window.setTimeout(() => ScrollTrigger.refresh(), 500);

    return () => {
      window.removeEventListener("load", manejarCarga);
      window.clearTimeout(temporizador);
      contexto.revert();
    };
  }, []);

  return (
    <div ref={raizRef} className="contents">
      {children}
    </div>
  );
}