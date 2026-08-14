import { describe, it, expect } from "vitest";
import {
  formatearUSD,
  formatearBs,
  convertirUSDaBs,
  generarSlug,
  obtenerFechaLocalISO,
  precioOfertaANumero,
} from "@/lib/utils";

describe("formatearUSD", () => {
  it("formatea un monto en dólares con 2 decimales", () => {
    expect(formatearUSD(4.5)).toBe("$4.50");
    expect(formatearUSD(10)).toBe("$10.00");
  });

  it("formatea montos grandes con separador de miles", () => {
    expect(formatearUSD(1250.75)).toBe("$1,250.75");
  });
});

describe("formatearBs", () => {
  it("formatea un monto en bolívares con 2 decimales", () => {
    expect(formatearBs(7643.5)).toBe("Bs. 7.643,50");
  });

  it("formatea montos grandes correctamente", () => {
    expect(formatearBs(1000000)).toBe("Bs. 1.000.000,00");
  });
});

describe("convertirUSDaBs", () => {
  it("convierte USD a Bs. multiplicando por la tasa", () => {
    expect(convertirUSDaBs(10, 764.35)).toBe(7643.5);
  });

  it("retorna 0 con tasa 0, negativa o no finita", () => {
    expect(convertirUSDaBs(10, 0)).toBe(0);
    expect(convertirUSDaBs(10, -1)).toBe(0);
    expect(convertirUSDaBs(10, NaN)).toBe(0);
  });
});

describe("generarSlug", () => {
  it("genera slug en minúsculas con guiones", () => {
    expect(generarSlug("Bebidas Frías")).toBe("bebidas-frias");
  });

  it("elimina acentos y caracteres especiales", () => {
    expect(generarSlug("Café Mocca Helado!")).toBe("cafe-mocca-helado");
  });

  it("limpia espacios múltiples", () => {
    expect(generarSlug("  Café   con  Leche  ")).toBe("cafe-con-leche");
  });
});

describe("obtenerFechaLocalISO", () => {
  it("retorna la fecha en formato YYYY-MM-DD", () => {
    expect(obtenerFechaLocalISO(new Date(2026, 7, 12))).toBe("2026-08-12");
    expect(obtenerFechaLocalISO(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  it("usa la fecha actual por defecto", () => {
    const hoy = new Date();
    const esperado = `${hoy.getFullYear()}-${String(
      hoy.getMonth() + 1
    ).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;
    expect(obtenerFechaLocalISO()).toBe(esperado);
  });
});

describe("precioOfertaANumero", () => {
  it("convierte precios con signo de dólar y decimales", () => {
    expect(precioOfertaANumero("$4.50")).toBe(4.5);
    expect(precioOfertaANumero("$0.50")).toBe(0.5);
  });

  it("convierte precios con coma decimal", () => {
    expect(precioOfertaANumero("5,60")).toBe(5.6);
  });

  it("convierte precios sin símbolo", () => {
    expect(precioOfertaANumero("10")).toBe(10);
  });

  it("retorna 0 para precios inválidos", () => {
    expect(precioOfertaANumero("gratis")).toBe(0);
    expect(precioOfertaANumero("")).toBe(0);
  });
});