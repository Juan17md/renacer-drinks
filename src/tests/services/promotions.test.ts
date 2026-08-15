import { describe, it, expect, vi, beforeEach } from "vitest";

const mocksFirestore = vi.hoisted(() => ({
  getDocs: vi.fn(),
}));

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(() => ({})),
  query: vi.fn(() => ({})),
  orderBy: vi.fn(() => ({})),
  getDocs: mocksFirestore.getDocs,
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/firebase", () => ({
  db: {},
}));

import {
  obtenerPromociones,
  obtenerPromocionesActivas,
} from "@/services/promotions";

function crearSnapshot(datos: Record<string, unknown>[], ids: string[]) {
  return {
    docs: datos.map((dato, indice) => ({
      id: ids[indice],
      data: () => dato,
    })),
  };
}

const promocionDatos = {
  titulo: "Happy Hours",
  horario: "Lunes a Sábado de 8AM a 12PM",
  descripcion: "Dos por el precio de uno en tus favoritas.",
  ofertas: [
    { nombre: "2 Merengadas", precio: "$4.50" },
    { nombre: "2 Especiales", precio: "$5.60" },
  ],
  activo: true,
  updatedAt: new Date("2026-08-14T00:00:00Z"),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("obtenerPromociones", () => {
  it("mapea los documentos de Firestore a promociones", async () => {
    mocksFirestore.getDocs.mockResolvedValue(
      crearSnapshot([promocionDatos], ["happy_hours"])
    );

    const promociones = await obtenerPromociones();

    expect(promociones).toHaveLength(1);
    expect(promociones[0]).toMatchObject({
      id: "happy_hours",
      titulo: "Happy Hours",
      horario: "Lunes a Sábado de 8AM a 12PM",
      activo: true,
    });
    expect(promociones[0].ofertas).toEqual([
      { nombre: "2 Merengadas", precio: "$4.50" },
      { nombre: "2 Especiales", precio: "$5.60" },
    ]);
    expect(promociones[0].updatedAt).toBe("2026-08-14T00:00:00.000Z");
  });

  it("usa activo=true por defecto cuando no viene el campo", async () => {
    const sinActivo: Record<string, unknown> = { ...promocionDatos };
    delete sinActivo.activo;
    mocksFirestore.getDocs.mockResolvedValue(
      crearSnapshot([sinActivo], ["happy_hours"])
    );

    const promociones = await obtenerPromociones();

    expect(promociones[0].activo).toBe(true);
  });

  it("retorna lista vacía si Firestore falla", async () => {
    mocksFirestore.getDocs.mockRejectedValue(new Error("error firestore"));

    const promociones = await obtenerPromociones();

    expect(promociones).toEqual([]);
  });
});

describe("obtenerPromocionesActivas", () => {
  it("filtra solo las promociones activas", async () => {
    mocksFirestore.getDocs.mockResolvedValue(
      crearSnapshot(
        [
          { ...promocionDatos, activo: true },
          { ...promocionDatos, activo: false },
        ],
        ["promo_1", "promo_2"]
      )
    );

    const promociones = await obtenerPromocionesActivas();

    expect(promociones).toHaveLength(1);
    expect(promociones[0].id).toBe("promo_1");
  });

  it("retorna vacío cuando no hay activas", async () => {
    mocksFirestore.getDocs.mockResolvedValue(
      crearSnapshot([{ ...promocionDatos, activo: false }], ["promo_1"])
    );

    const promociones = await obtenerPromocionesActivas();

    expect(promociones).toEqual([]);
  });
});