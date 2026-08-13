import { describe, it, expect, vi, beforeEach } from "vitest";

const { firestoreMock } = vi.hoisted(() => ({
  firestoreMock: {
    collection: vi.fn(),
    getDocs: vi.fn(),
    query: vi.fn(),
    orderBy: vi.fn(),
  },
}));

vi.mock("firebase/firestore", () => firestoreMock);

vi.mock("@/lib/firebase", () => ({ db: {} }));

import { obtenerMateriales } from "@/services/materials";

describe("services/materials", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    firestoreMock.collection.mockReturnValue("coleccion");
    firestoreMock.query.mockReturnValue("consulta");
    firestoreMock.orderBy.mockReturnValue("ordenado");
  });

  it("mapea los materiales con nombre, unidad y cantidad", async () => {
    firestoreMock.getDocs.mockResolvedValue({
      docs: [
        {
          id: "mat_1",
          data: () => ({
            nombre: "Leche entera",
            unidad: "L",
            cantidad: 12,
            updatedAt: new Date("2026-08-13T10:00:00Z"),
          }),
        },
      ],
    });

    const materiales = await obtenerMateriales();

    expect(materiales).toHaveLength(1);
    expect(materiales[0]).toMatchObject({
      id: "mat_1",
      nombre: "Leche entera",
      unidad: "L",
      cantidad: 12,
    });
    expect(firestoreMock.query).toHaveBeenCalled();
  });

  it("devuelve lista vacía si falla la consulta", async () => {
    firestoreMock.getDocs.mockRejectedValue(new Error("firestore caído"));

    const materiales = await obtenerMateriales();

    expect(materiales).toEqual([]);
  });
});