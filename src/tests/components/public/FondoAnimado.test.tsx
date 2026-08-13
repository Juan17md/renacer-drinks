import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { FondoAnimado } from "@/components/public/FondoAnimado";

vi.mock("three", () => {
  const clase = () => ({});
  return {
    Scene: clase,
    PerspectiveCamera: class {
      position = { z: 0 };
      aspect = 1;
      updateProjectionMatrix() {}
    },
    WebGLRenderer: class {
      setPixelRatio() {}
      setSize() {}
      render() {}
      dispose() {}
    },
    Points: class {
      geometry = {
        getAttribute: () => ({ array: [], needsUpdate: false }),
      };
      rotation = { y: 0 };
    },
    PointsMaterial: class {
      dispose() {}
    },
    BufferGeometry: class {
      setAttribute() {}
      dispose() {}
    },
    Float32BufferAttribute: class {},
  };
});

describe("FondoAnimado", () => {
  it("respeta prefers-reduced-motion y no crea el lienzo animado", () => {
    const matchMediaOriginal = window.matchMedia;
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: (consulta: string) => ({
        matches: consulta.includes("prefers-reduced-motion"),
        media: consulta,
        onchange: null,
        addListener: () => undefined,
        removeListener: () => undefined,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        dispatchEvent: () => false,
      }),
    });

    render(<FondoAnimado />);

    expect(
      document.querySelector("canvas")
    ).not.toBeInTheDocument();
    window.matchMedia = matchMediaOriginal;
  });
});