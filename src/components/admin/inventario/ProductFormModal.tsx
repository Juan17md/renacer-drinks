"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { IKContext, IKUpload } from "imagekitio-react";
import { Loader2, Upload, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { crearProducto, actualizarProducto } from "@/actions/products";
import type { Producto } from "@/types/product";
import type { Categoria } from "@/types/category";

interface ProductFormModalProps {
  abierto: boolean;
  onOpenChange: (abierto: boolean) => void;
  producto?: Producto | null;
  categorias: Categoria[];
}

const URL_ENDPOINT = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT ?? "";

export function ProductFormModal({
  abierto,
  onOpenChange,
  producto,
  categorias,
}: ProductFormModalProps) {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState("");
  const [categoria, setCategoria] = useState("");
  const [disponible, setDisponible] = useState(true);
  const [imagenUrl, setImagenUrl] = useState("");
  const [imagenId, setImagenId] = useState("");
  const [subiendo, setSubiendo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (abierto) {
      setNombre(producto?.name ?? "");
      setDescripcion(producto?.description ?? "");
      setPrecio(producto ? String(producto.price) : "");
      setCategoria(producto?.category ?? "");
      setDisponible(producto?.isAvailable ?? true);
      setImagenUrl(producto?.imageUrl ?? "");
      setImagenId(producto?.imageId ?? "");
      setError("");
    }
  }, [abierto, producto]);

  const manejarEnvio = async (evento: React.FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    setError("");

    const precioNumerico = Number(precio);
    if (!nombre.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }
    if (!precio || Number.isNaN(precioNumerico) || precioNumerico <= 0) {
      setError("Ingresa un precio válido en USD.");
      return;
    }
    if (!categoria) {
      setError("Selecciona una categoría.");
      return;
    }

    setGuardando(true);
    const datos = {
      name: nombre.trim(),
      description: descripcion.trim(),
      price: precioNumerico,
      category: categoria,
      isAvailable: disponible,
      imageUrl: imagenUrl,
      imageId: imagenId,
    };

    const resultado = producto
      ? await actualizarProducto(producto.id, datos)
      : await crearProducto(datos);

    setGuardando(false);

    if (resultado.ok) {
      toast.success(
        producto ? "Producto actualizado" : "Producto creado"
      );
      onOpenChange(false);
    } else {
      setError(resultado.error ?? "Error al guardar");
    }
  };

  const manejarExitoSubida = (respuesta: {
    url?: string;
    fileId?: string;
    name?: string;
  }) => {
    setImagenUrl(respuesta.url ?? "");
    setImagenId(respuesta.fileId ?? "");
    setSubiendo(false);
    toast.success("Imagen subida correctamente");
  };

  const manejarErrorSubida = () => {
    setSubiendo(false);
    toast.error("No se pudo subir la imagen");
  };

  return (
    <Dialog open={abierto} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading">
            {producto ? "Editar producto" : "Agregar producto"}
          </DialogTitle>
          <DialogDescription>
            Completa los datos del producto. La imagen se optimiza con
            ImageKit.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={manejarEnvio} className="space-y-5" noValidate>
          <div className="space-y-2">
            <Label htmlFor="producto-nombre">Nombre *</Label>
            <Input
              id="producto-nombre"
              value={nombre}
              onChange={(evento) => setNombre(evento.target.value)}
              placeholder="Ej. Café Mocca Helado"
              className="h-12 text-base"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="producto-descripcion">Descripción</Label>
            <Textarea
              id="producto-descripcion"
              value={descripcion}
              onChange={(evento) => setDescripcion(evento.target.value)}
              placeholder="Breve descripción del producto"
              rows={3}
              className="text-base"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="producto-precio">Precio (USD) *</Label>
              <Input
                id="producto-precio"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={precio}
                onChange={(evento) => setPrecio(evento.target.value)}
                placeholder="4.50"
                className="h-12 text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="producto-categoria">Categoría *</Label>
              <Select value={categoria} onValueChange={setCategoria}>
                <SelectTrigger id="producto-categoria" className="h-12 text-base">
                  <SelectValue placeholder="Selecciona..." />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((cat) => (
                    <SelectItem key={cat.id} value={cat.slug}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Imagen del producto</Label>
            <IKContext
              publicKey={process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY}
              urlEndpoint={URL_ENDPOINT}
              authenticationEndpoint="/api/imagekit-auth"
            >
              <div className="flex flex-col gap-3">
                {imagenUrl ? (
                  <div className="relative h-40 w-full overflow-hidden rounded-xl border border-border/60 bg-brand-rose-light">
                    <Image
                      src={imagenUrl}
                      alt="Vista previa del producto"
                      fill
                      sizes="(max-width: 640px) 100vw, 448px"
                      className="object-cover"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      className="absolute right-2 top-2 h-9 w-9"
                      onClick={() => {
                        setImagenUrl("");
                        setImagenId("");
                      }}
                      aria-label="Quitar imagen"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex h-40 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/30 text-muted-foreground transition-colors hover:border-brand-rose hover:text-brand-rose-deep">
                    {subiendo ? (
                      <Loader2
                        className="h-6 w-6 animate-spin"
                        aria-hidden="true"
                      />
                    ) : (
                      <Upload className="h-6 w-6" aria-hidden="true" />
                    )}
                    <span className="text-sm font-medium">
                      {subiendo ? "Subiendo imagen..." : "Toca para subir imagen"}
                    </span>
                  </label>
                )}
                {!imagenUrl && (
                  <IKUpload
                    fileName={`producto-${Date.now()}`}
                    useUniqueFileName
                    onUploadStart={() => setSubiendo(true)}
                    onSuccess={manejarExitoSubida}
                    onError={manejarErrorSubida}
                    className="hidden"
                    accept="image/*"
                    aria-label="Subir imagen del producto"
                  />
                )}
              </div>
            </IKContext>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-brand-coffee">Disponible</p>
              <p className="text-xs text-muted-foreground">
                Los clientes podrán ver y pedir este producto
              </p>
            </div>
            <Switch
              checked={disponible}
              onCheckedChange={setDisponible}
              aria-label="Disponibilidad del producto"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </p>
          )}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="h-12"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={guardando || subiendo} className="h-12">
              {guardando && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              )}
              {producto ? "Guardar cambios" : "Crear producto"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}