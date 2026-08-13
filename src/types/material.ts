export interface Material {
  id: string;
  nombre: string;
  unidad: string;
  cantidad: number;
  updatedAt: string;
}

export interface MaterialInput {
  nombre: string;
  unidad: string;
  cantidad: number;
}

export const UNIDADES_MEDIDA: string[] = [
  "kg",
  "g",
  "L",
  "ml",
  "und",
  "paquete",
  "caja",
  "bolsa",
  "botella",
  "lata",
];
