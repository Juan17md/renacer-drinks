import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act, cleanup } from "@testing-library/react";
import { useMediaQuery } from "@/hooks/useMediaQuery";

function mockearMatchMedia(consulta: string, matches: boolean) {
  const listeners: Array<(evento: MediaQueryListEvent) => void> = [];
  const mediaQuery = {
    matches,
    media: consulta,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn((_: string, fn: (evento: MediaQueryListEvent) => void) => {
      listeners.push(fn);
    }),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(() => false),
  };
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn(() => mediaQuery),
  });
  return { mediaQuery, listeners };
}

afterEach(() => {
  cleanup();
});

describe("useMediaQuery", () => {
  it("devuelve true cuando la consulta coincide", () => {
    mockearMatchMedia("(min-width: 768px)", true);
    const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));
    expect(result.current).toBe(true);
  });

  it("devuelve false cuando la consulta no coincide", () => {
    mockearMatchMedia("(min-width: 768px)", false);
    const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));
    expect(result.current).toBe(false);
  });

  it("actualiza el valor cuando cambia la consulta de medios", () => {
    const { mediaQuery, listeners } = mockearMatchMedia("(min-width: 768px)", false);
    const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"));
    expect(result.current).toBe(false);

    act(() => {
      mediaQuery.matches = true;
      listeners.forEach((listener) =>
        listener({ matches: true } as MediaQueryListEvent)
      );
    });
    expect(result.current).toBe(true);
  });
});