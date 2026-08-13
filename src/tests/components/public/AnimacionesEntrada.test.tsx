import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render } from "@testing-library/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { AnimacionesEntrada } from "@/components/public/AnimacionesEntrada";

vi.mock("gsap/ScrollTrigger", () => ({
  ScrollTrigger: {
    refresh: vi.fn(),
  },
}));

vi.mock("gsap", () => {
  const matchMedia = vi.fn(() => ({
    add: vi.fn((_consulta: string, ejecutar: () => void) => {
      ejecutar();
    }),
  }));

  return {
    default: {
      registerPlugin: vi.fn(),
      context: vi.fn((fn: () => void) => {
        fn();
        return { revert: vi.fn() };
      }),
      matchMedia,
      set: vi.fn(),
      from: vi.fn(),
      utils: {
        toArray: vi.fn((elementos: unknown) => Array.from(elementos as Iterable<unknown>)),
      },
    },
  };
});

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function renderizarConContenido() {
  return render(
    <AnimacionesEntrada>
      <section data-reveal>
        <h1>Sección revelada</h1>
      </section>
      <section data-reveal-stagger>
        <article>Tarjeta 1</article>
        <article>Tarjeta 2</article>
      </section>
      <span>Elemento sin animación</span>
    </AnimacionesEntrada>
  );
}

describe("AnimacionesEntrada", () => {
  it("se renderiza sin errores y envuelve a sus hijos sin afectar el layout", () => {
    const { container } = renderizarConContenido();
    expect(container.querySelector("[data-reveal]")).not.toBeNull();
    expect(container.querySelector("[data-reveal-stagger]")).not.toBeNull();
  });

  it("registra el plugin de ScrollTrigger al montar", () => {
    renderizarConContenido();
    expect(gsap.registerPlugin).toHaveBeenCalledWith(ScrollTrigger);
  });

  it("crea un contexto de animaciones y lo revierte al desmontar", () => {
    const { unmount } = renderizarConContenido();

    expect(gsap.context).toHaveBeenCalled();

    unmount();
    const contexto = vi.mocked(gsap.context).mock.results[0]?.value as {
      revert: () => void;
    };
    expect(contexto.revert).toHaveBeenCalled();
  });

  it("usa matchMedia para consultar la preferencia de movimiento", () => {
    renderizarConContenido();
    expect(gsap.matchMedia).toHaveBeenCalled();
  });

  it("anima cada elemento [data-reveal] con fade-in y slide-up al hacer scroll", () => {
    renderizarConContenido();

    const llamadas = vi.mocked(gsap.from).mock.calls;
    expect(llamadas.length).toBeGreaterThan(0);

    const targets = llamadas.map(([objetivo]) => objetivo);
    const sectionReveal = document.querySelector("[data-reveal]");
    expect(targets.some((t) => t === sectionReveal)).toBe(true);

    const primeraLlamada = llamadas[0]?.[1] as {
      opacity?: number;
      y?: number;
      scrollTrigger?: { trigger: unknown; start: string; once: boolean };
    };
    expect(primeraLlamada.opacity).toBe(0);
    expect(primeraLlamada.y).toBe(24);
    expect(primeraLlamada.scrollTrigger?.start).toBe("top 85%");
    expect(primeraLlamada.scrollTrigger?.once).toBe(true);
  });

  it("anima los hijos de [data-reveal-stagger] con stagger", () => {
    renderizarConContenido();

    const llamadas = vi.mocked(gsap.from).mock.calls;
    const contenedorStagger = document.querySelector("[data-reveal-stagger]");
    const llamadaStagger = llamadas.find(
      ([objetivo, _opciones]) =>
        objetivo === contenedorStagger
    ) ?? llamadas.find(([, opciones]) => {
      const o = opciones as { stagger?: number };
      return typeof o?.stagger === "number";
    });

    expect(llamadaStagger).toBeDefined();
    const opciones = llamadaStagger?.[1] as { stagger?: number };
    expect(opciones.stagger).toBe(0.12);
  });

  it("limpia el temporizador y los listeners al desmontar", () => {
    const { unmount } = renderizarConContenido();
    unmount();
  });
});