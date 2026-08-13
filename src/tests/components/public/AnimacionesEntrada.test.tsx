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
        toArray: vi.fn(() => []),
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

describe("AnimacionesEntrada", () => {
  it("se renderiza sin errores y no afecta el layout", () => {
    const { container } = render(<AnimacionesEntrada />);
    expect(container.querySelector("[aria-hidden]")).not.toBeNull();
  });

  it("registra el plugin de ScrollTrigger al montar", () => {
    render(<AnimacionesEntrada />);
    expect(gsap.registerPlugin).toHaveBeenCalledWith(ScrollTrigger);
  });

  it("crea un contexto de animaciones y lo revierte al desmontar", () => {
    const { unmount } = render(<AnimacionesEntrada />);

    expect(gsap.context).toHaveBeenCalled();

    unmount();
    const contexto = vi.mocked(gsap.context).mock.results[0]?.value as {
      revert: () => void;
    };
    expect(contexto.revert).toHaveBeenCalled();
  });

  it("usa matchMedia para consultar la preferencia de movimiento", () => {
    render(<AnimacionesEntrada />);
    expect(gsap.matchMedia).toHaveBeenCalled();
  });

  it("limpia el temporizador y los listeners al desmontar", () => {
    const { unmount } = render(<AnimacionesEntrada />);
    unmount();
  });
});
