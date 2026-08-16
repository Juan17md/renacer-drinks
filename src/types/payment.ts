export interface DatoMetodoPago {
  etiqueta: string;
  valor: string;
}

export interface MetodoPagoConfig {
  id: string;
  label: string;
  activo: boolean;
  requiereComprobante: boolean;
  datos: DatoMetodoPago[];
}

export interface MetodoPagoDatosGuardado {
  label: string;
  activo: boolean;
  requiereComprobante: boolean;
  datos: DatoMetodoPago[];
}
