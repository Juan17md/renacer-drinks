import { describe, it, expect, vi, afterEach } from "vitest";
import { obtenerTasaBCV } from "@/lib/bcv";
import { convertirUSDaBs } from "@/lib/utils";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("obtenerTasaBCV", () => {
  it("retorna la tasa promedio y fecha de actualización de la API", async () => {
    const respuestaMock = {
      ok: true,
      status: 200,
      json: async () => ({
        promedio: 764.35,
        fechaActualizacion: "2026-08-12T20:00:00Z",
        moneda: "Bolívar",
        codigo: "VES",
      }),
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(respuestaMock));

    const tasa = await obtenerTasaBCV();

    expect(tasa.promedio).toBe(764.35);
    expect(tasa.fechaActualizacion).toBe("2026-08-12T20:00:00Z");
    expect(tasa.moneda).toBe("Bolívar");
  });

  it("retorna fallback (promedio 0) cuando la API falla por red", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("red caída")));

    const tasa = await obtenerTasaBCV();

    expect(tasa.promedio).toBe(0);
    expect(tasa.fechaActualizacion).toBeTruthy();
  });

  it("retorna fallback cuando la API responde con error HTTP", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500 })
    );

    const tasa = await obtenerTasaBCV();

    expect(tasa.promedio).toBe(0);
  });

  it("retorna fallback cuando el promedio es inválido", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ promedio: "no-numérico" }),
      })
    );

    const tasa = await obtenerTasaBCV();

    expect(tasa.promedio).toBe(0);
  });
});

describe("convertirUSDaBs", () => {
  it("convierte un monto USD a Bs. con la tasa dada", () => {
    const resultado = convertirUSDaBs(10, 764.35);
    expect(resultado).toBe(7643.5);
  });

  it("retorna 0 si la tasa es 0", () => {
    expect(convertirUSDaBs(10, 0)).toBe(0);
  });

  it("retorna 0 si la tasa es negativa", () => {
    expect(convertirUSDaBs(10, -5)).toBe(0);
  });

  it("retorna 0 si la tasa no es un número finito", () => {
    expect(convertirUSDaBs(10, NaN)).toBe(0);
    expect(convertirUSDaBs(10, Infinity)).toBe(0);
  });
});