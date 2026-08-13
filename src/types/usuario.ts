export type RolUsuario = "admin" | "operador";

export interface DatosUsuario {
  uid: string;
  email: string;
  nombre: string;
  rol: RolUsuario;
  bloqueado: boolean;
  creadoEn: string;
}

export interface DatosNuevoUsuario {
  email: string;
  nombre: string;
  rol: RolUsuario;
  password: string;
}

export interface DatosEditarUsuario {
  nombre: string;
  rol: RolUsuario;
}