"use client";

import { useCallback, useEffect, useState } from "react";
import { Users, UserPlus, Pencil, ShieldBan, ShieldCheck, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { ROLES_USUARIO } from "@/services/usuarios";
import {
  crearUsuario,
  editarUsuario,
  eliminarUsuario,
  bloquearUsuario,
  obtenerTodosLosUsuarios,
} from "@/actions/usuarios";
import type { DatosUsuario, RolUsuario } from "@/types/usuario";

type UsuarioConId = DatosUsuario & { uid: string };

const ESTADO_INICIAL_CREAR = {
  email: "",
  nombre: "",
  rol: "operador" as RolUsuario,
  password: "",
};

function FormatearFecha({ fechaISO }: { fechaISO: string }) {
  if (!fechaISO) return "—";
  const fecha = new Date(fechaISO);
  if (Number.isNaN(fecha.getTime())) return fechaISO;
  return fecha.toLocaleDateString("es-VE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function PaginaUsuariosCliente() {
  const { datosUsuario } = useAuth();
  const [usuarios, setUsuarios] = useState<UsuarioConId[]>([]);
  const [cargando, setCargando] = useState(true);

  const [crearAbierto, setCrearAbierto] = useState(false);
  const [formularioCrear, setFormularioCrear] = useState(ESTADO_INICIAL_CREAR);
  const [creando, setCreando] = useState(false);

  const [editando, setEditando] = useState<UsuarioConId | null>(null);
  const [formularioEditar, setFormularioEditar] = useState({
    nombre: "",
    rol: "operador" as RolUsuario,
  });

  const [eliminando, setEliminando] = useState<UsuarioConId | null>(null);
  const [accionOcupada, setAccionOcupada] = useState(false);

  const cargarUsuarios = useCallback(async () => {
    const obtenidos = await obtenerTodosLosUsuarios();
    setUsuarios(obtenidos as UsuarioConId[]);
    setCargando(false);
  }, []);

  useEffect(() => {
    cargarUsuarios().catch(() => setCargando(false));
  }, [cargarUsuarios]);

  const manejarCrear = async () => {
    setCreando(true);
    const resultado = await crearUsuario(formularioCrear);
    if (resultado.ok) {
      toast.success("Usuario creado correctamente");
      setCrearAbierto(false);
      setFormularioCrear(ESTADO_INICIAL_CREAR);
      await cargarUsuarios();
    } else {
      toast.error(resultado.error);
    }
    setCreando(false);
  };

  const abrirEdicion = (usuario: UsuarioConId) => {
    setEditando(usuario);
    setFormularioEditar({ nombre: usuario.nombre, rol: usuario.rol });
  };

  const manejarEditar = async () => {
    if (!editando) return;
    setAccionOcupada(true);
    const resultado = await editarUsuario(editando.uid, formularioEditar);
    if (resultado.ok) {
      toast.success("Usuario actualizado correctamente");
      setEditando(null);
      await cargarUsuarios();
    } else {
      toast.error(resultado.error);
    }
    setAccionOcupada(false);
  };

  const manejarEliminar = async () => {
    if (!eliminando) return;
    setAccionOcupada(true);
    const resultado = await eliminarUsuario(eliminando.uid);
    if (resultado.ok) {
      toast.success("Usuario eliminado correctamente");
      setEliminando(null);
      await cargarUsuarios();
    } else {
      toast.error(resultado.error);
    }
    setAccionOcupada(false);
  };

  const manejarBloqueo = async (usuario: UsuarioConId) => {
    setAccionOcupada(true);
    const resultado = await bloquearUsuario(usuario.uid, !usuario.bloqueado);
    if (resultado.ok) {
      toast.success(
        usuario.bloqueado ? "Usuario desbloqueado" : "Usuario bloqueado"
      );
      await cargarUsuarios();
    } else {
      toast.error(resultado.error);
    }
    setAccionOcupada(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 font-heading text-2xl font-bold text-brand-coffee">
            <Users className="h-6 w-6 text-brand-rose-deep" aria-hidden="true" />
            Usuarios
          </h1>
          <p className="mt-1 text-base text-muted-foreground">
            Gestiona los usuarios activos del panel administrativo.
          </p>
        </div>
        <Button
          onClick={() => setCrearAbierto(true)}
          className="h-12 sm:self-end"
        >
          <UserPlus className="mr-2 h-4 w-4" aria-hidden="true" />
          Nuevo usuario
        </Button>
      </div>

      {cargando ? (
        <div className="flex items-center justify-center gap-3 rounded-2xl border border-border/60 bg-white py-16">
          <Loader2 className="h-6 w-6 animate-spin text-brand-rose-deep" aria-hidden="true" />
          <p className="text-base text-muted-foreground">Cargando usuarios...</p>
        </div>
      ) : usuarios.length === 0 ? (
        <div className="rounded-2xl border border-border/60 bg-white py-16 text-center">
          <p className="text-base text-muted-foreground">Aún no hay usuarios registrados.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border/60 bg-white">
          <table className="w-full text-left text-base">
            <thead>
              <tr className="border-b border-border/60 bg-brand-cream/60">
                <th scope="col" className="px-4 py-3 font-semibold text-brand-coffee">Nombre</th>
                <th scope="col" className="px-4 py-3 font-semibold text-brand-coffee">Email</th>
                <th scope="col" className="px-4 py-3 font-semibold text-brand-coffee">Rol</th>
                <th scope="col" className="px-4 py-3 font-semibold text-brand-coffee">Estado</th>
                <th scope="col" className="px-4 py-3 font-semibold text-brand-coffee">Creado</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold text-brand-coffee">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((usuario) => {
                const esYoMismo = usuario.uid === datosUsuario?.uid;
                return (
                  <tr key={usuario.uid} className="border-b border-border/40 last:border-b-0">
                    <td className="px-4 py-3 font-medium text-brand-coffee">{usuario.nombre}</td>
                    <td className="px-4 py-3 text-muted-foreground">{usuario.email}</td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={usuario.rol === "admin" ? "default" : "secondary"}
                        className={usuario.rol === "admin" ? "bg-brand-rose-deep" : undefined}
                      >
                        {usuario.rol === "admin" ? "Administrador" : "Operador"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {usuario.bloqueado ? (
                        <Badge variant="destructive">Bloqueado</Badge>
                      ) : (
                        <Badge variant="outline" className="text-emerald-700">Activo</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <FormatearFecha fechaISO={usuario.creadoEn} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9"
                          onClick={() => abrirEdicion(usuario)}
                          disabled={esYoMismo}
                          aria-label={`Editar a ${usuario.nombre}`}
                          title={esYoMismo ? "No puedes editar tu propio usuario" : "Editar"}
                        >
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-amber-700"
                          onClick={() => manejarBloqueo(usuario)}
                          disabled={esYoMismo || accionOcupada}
                          aria-label={
                            usuario.bloqueado
                              ? `Desbloquear a ${usuario.nombre}`
                              : `Bloquear a ${usuario.nombre}`
                          }
                          title={
                            esYoMismo
                              ? "No puedes bloquear tu propio usuario"
                              : usuario.bloqueado
                                ? "Desbloquear"
                                : "Bloquear"
                          }
                        >
                          {usuario.bloqueado ? (
                            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                          ) : (
                            <ShieldBan className="h-4 w-4" aria-hidden="true" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-destructive"
                          onClick={() => setEliminando(usuario)}
                          disabled={esYoMismo || accionOcupada}
                          aria-label={`Eliminar a ${usuario.nombre}`}
                          title={esYoMismo ? "No puedes eliminar tu propio usuario" : "Eliminar"}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={crearAbierto} onOpenChange={setCrearAbierto}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo usuario</DialogTitle>
            <DialogDescription>
              Crea un usuario con acceso al panel administrativo.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(evento) => {
              evento.preventDefault();
              manejarCrear();
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="usuario-nombre">Nombre</Label>
              <Input
                id="usuario-nombre"
                value={formularioCrear.nombre}
                onChange={(evento) =>
                  setFormularioCrear({ ...formularioCrear, nombre: evento.target.value })
                }
                placeholder="Nombre y apellido"
                required
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="usuario-email">Correo electrónico</Label>
              <Input
                id="usuario-email"
                type="email"
                value={formularioCrear.email}
                onChange={(evento) =>
                  setFormularioCrear({ ...formularioCrear, email: evento.target.value })
                }
                placeholder="correo@ejemplo.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="usuario-password">Contraseña</Label>
              <Input
                id="usuario-password"
                type="password"
                value={formularioCrear.password}
                onChange={(evento) =>
                  setFormularioCrear({ ...formularioCrear, password: evento.target.value })
                }
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="usuario-rol">Rol</Label>
              <Select
                value={formularioCrear.rol}
                onValueChange={(rol) =>
                  setFormularioCrear({ ...formularioCrear, rol: rol as RolUsuario })
                }
              >
                <SelectTrigger id="usuario-rol" className="w-full">
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES_USUARIO.map((rol) => (
                    <SelectItem key={rol.valor} value={rol.valor}>
                      {rol.etiqueta}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={creando}>
                {creando && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                )}
                Crear usuario
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editando !== null} onOpenChange={(abierto) => !abierto && setEditando(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar usuario</DialogTitle>
            <DialogDescription>
              {editando ? `Actualiza los datos de ${editando.email}.` : ""}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(evento) => {
              evento.preventDefault();
              manejarEditar();
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="editar-nombre">Nombre</Label>
              <Input
                id="editar-nombre"
                value={formularioEditar.nombre}
                onChange={(evento) =>
                  setFormularioEditar({ ...formularioEditar, nombre: evento.target.value })
                }
                required
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editar-rol">Rol</Label>
              <Select
                value={formularioEditar.rol}
                onValueChange={(rol) =>
                  setFormularioEditar({ ...formularioEditar, rol: rol as RolUsuario })
                }
              >
                <SelectTrigger id="editar-rol" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES_USUARIO.map((rol) => (
                    <SelectItem key={rol.valor} value={rol.valor}>
                      {rol.etiqueta}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={accionOcupada}>
                {accionOcupada && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                )}
                Guardar cambios
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={eliminando !== null} onOpenChange={(abierto) => !abierto && setEliminando(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              {eliminando
                ? `Se eliminará la cuenta de ${eliminando.nombre} (${eliminando.email}). El usuario perderá el acceso al panel de forma permanente.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={manejarEliminar}
              disabled={accionOcupada}
              className="bg-destructive hover:bg-destructive/90"
            >
              {accionOcupada && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              )}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}