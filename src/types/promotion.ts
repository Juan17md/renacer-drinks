export interface OfertaPromocion {
  nombre: string;
  precio: number;
  costo: number;
  esProteina?: boolean;
}

export interface Promocion {
  id: string;
  titulo: string;
  horario: string;
  descripcion: string;
  ofertas: OfertaPromocion[];
  activo: boolean;
  updatedAt: string;
}

export interface PromocionInput {
  titulo: string;
  horario: string;
  descripcion: string;
  ofertas: OfertaPromocion[];
  activo: boolean;
}