"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { IKContext, IKUpload } from "imagekitio-react";
import {
  ShoppingBag,
  Send,
  Loader2,
  Wallet,
  Copy,
  Check,
  Upload,
} from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CartItem } from "@/components/cart/CartItem";
import { CartSummary } from "@/components/cart/CartSummary";
import { useCartStore } from "@/store/useCartStore";
import { convertirUSDaBs } from "@/lib/utils";
import { crearOrden } from "@/services/orders";
import { escucharMetodosPago } from "@/services/metodosPago";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import type { MetodoPagoConfig } from "@/types/payment";
import { cn } from "@/lib/utils";

const URL_ENDPOINT = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT ?? "";
const CONSULTA_ESCRITORIO = "(min-width: 768px)";

interface CartDrawerProps {
  abierto: boolean;
  onOpenChange: (abierto: boolean) => void;
  tasaBCV: number;
}

export function CartDrawer({ abierto, onOpenChange, tasaBCV }: CartDrawerProps) {
  const esEscritorio = useMediaQuery(CONSULTA_ESCRITORIO);
  const items = useCartStore((estado) => estado.items);
  const actualizarCantidad = useCartStore((estado) => estado.actualizarCantidad);
  const eliminarProducto = useCartStore((estado) => estado.eliminarProducto);
  const vaciarCarrito = useCartStore((estado) => estado.vaciarCarrito);

  const [nombreCliente, setNombreCliente] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [metodosPago, setMetodosPago] = useState<MetodoPagoConfig[]>([]);
  const [pagoVisible, setPagoVisible] = useState(false);
  const [metodoSeleccionado, setMetodoSeleccionado] =
    useState<MetodoPagoConfig | null>(null);
  const [comprobanteUrl, setComprobanteUrl] = useState("");
  const [subiendo, setSubiendo] = useState(false);
  const [copiado, setCopiado] = useState<string | null>(null);

  useEffect(() => {
    const desuscribir = escucharMetodosPago(
      (metodos) => setMetodosPago(metodos),
      () => toast.error("No se pudieron cargar los métodos de pago")
    );
    return desuscribir;
  }, []);

  const metodosActivos = metodosPago.filter((metodo) => metodo.activo);

  const totalUSD = items.reduce(
    (total, item) => total + item.producto.price * item.cantidad,
    0
  );
  const totalBs = convertirUSDaBs(totalUSD, tasaBCV);

  const manejarCopiar = async (valor: string, etiqueta: string) => {
    try {
      await navigator.clipboard.writeText(valor);
      setCopiado(etiqueta);
      setTimeout(() => setCopiado(null), 2000);
      toast.success(`${etiqueta} copiado`);
    } catch {
      toast.error("No se pudo copiar. Cópialo manualmente.");
    }
  };

  const manejarExitoSubida = (respuesta: { url?: string }) => {
    setComprobanteUrl(respuesta.url ?? "");
    setSubiendo(false);
    toast.success("Comprobante cargado correctamente");
  };

  const manejarErrorSubida = () => {
    setSubiendo(false);
    toast.error("No se pudo cargar el comprobante");
  };

  const manejarEnvio = async (evento: React.FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    setError("");

    if (!nombreCliente.trim()) {
      setError("Escribe tu nombre para entregarte tu pedido.");
      return;
    }
    if (!metodoSeleccionado) {
      setError("Selecciona un método de pago.");
      return;
    }
    if (metodoSeleccionado.requiereComprobante && !comprobanteUrl) {
      setError("Carga el comprobante de pago para enviar el pedido.");
      return;
    }

    setEnviando(true);
    try {
      const orden = await crearOrden({
        nombreCliente: nombreCliente.trim(),
        items: items.map((item) => ({
          productId: item.producto.id,
          nombre: item.producto.name,
          precio: item.producto.price,
          cantidad: item.cantidad,
          subtotal: item.producto.price * item.cantidad,
        })),
        totalUSD,
        totalBs,
        tasaBCV,
        metodoPago: metodoSeleccionado.id,
        comprobanteUrl:
          metodoSeleccionado.requiereComprobante ? comprobanteUrl : undefined,
        pagoVerificado: !metodoSeleccionado.requiereComprobante,
      });

      vaciarCarrito();
      setNombreCliente("");
      setMetodoSeleccionado(null);
      setComprobanteUrl("");
      onOpenChange(false);
      toast.success(
        `¡Pedido #${orden.numero} recibido! Espera tu aviso en la barra.`
      );
    } catch {
      setError("No se pudo enviar el pedido. Intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  };

  const botonListoParaEnviar = Boolean(
    metodoSeleccionado &&
      (!metodoSeleccionado.requiereComprobante || Boolean(comprobanteUrl))
  );

  return (
    <Drawer
      open={abierto}
      onOpenChange={onOpenChange}
      direction={esEscritorio ? "right" : "bottom"}
    >
      <DrawerContent className="pb-[env(safe-area-inset-bottom)]">
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2 font-heading">
            <ShoppingBag className="h-5 w-5 text-brand-rose-deep" aria-hidden="true" />
            Tu pedido
          </DrawerTitle>
          <DrawerDescription>
            Revisa tu pedido, paga y envíalo a la barra para prepararlo.
          </DrawerDescription>
        </DrawerHeader>

        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-4 px-6 py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-rose-light">
              <ShoppingBag className="h-8 w-8 text-brand-rose-deep" aria-hidden="true" />
            </div>
            <div>
              <p className="font-medium text-brand-coffee">
                Tu pedido está vacío
              </p>
              <p className="mt-1 text-sm font-small text-muted-foreground">
                Agrega tus bebidas favoritas desde el menú.
              </p>
            </div>
          </div>
        ) : (
          <form
            onSubmit={manejarEnvio}
            className="flex flex-col gap-5 overflow-y-auto px-6"
            noValidate
          >
            <ul className="space-y-4">
              {items.map((item) => (
                <CartItem
                  key={item.producto.id}
                  item={item}
                  onActualizarCantidad={actualizarCantidad}
                  onEliminar={eliminarProducto}
                />
              ))}
            </ul>
            <CartSummary totalUSD={totalUSD} totalBs={totalBs} tasaBCV={tasaBCV} />

            <div className="space-y-2">
              <Label htmlFor="carrito-nombre">Tu nombre *</Label>
              <Input
                id="carrito-nombre"
                value={nombreCliente}
                onChange={(evento) => setNombreCliente(evento.target.value)}
                placeholder="Ej. María"
                autoComplete="name"
                className="h-12 text-base"
                maxLength={40}
              />
              <p className="text-xs font-small text-muted-foreground">
                Lo usamos para avisarte cuando tu pedido esté listo.
              </p>
            </div>

            <div className="rounded-2xl border border-brand-rose/30 bg-brand-rose-light/40 p-4">
              <p className="flex items-center gap-2 font-medium text-brand-coffee">
                <Wallet className="h-4 w-4 text-brand-rose-deep" aria-hidden="true" />
                Método de pago
              </p>

              {(pagoVisible || metodoSeleccionado) && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {metodosActivos.map((metodo) => {
                    const seleccionado = metodoSeleccionado?.id === metodo.id;
                    return (
                      <button
                        key={metodo.id}
                        type="button"
                        onClick={() => {
                          setMetodoSeleccionado(metodo);
                          setComprobanteUrl("");
                          setPagoVisible(true);
                        }}
                        aria-pressed={seleccionado}
                        className={cn(
                          "h-10 rounded-full border px-4 text-base font-medium transition-colors",
                          seleccionado
                            ? "border-brand-rose-deep bg-brand-rose-deep text-white"
                            : "border-brand-rose/40 bg-white text-brand-coffee hover:border-brand-rose-deep"
                        )}
                      >
                        {metodo.label}
                      </button>
                    );
                  })}
                </div>
              )}

              {metodoSeleccionado && (
                <div className="mt-4 space-y-4">
                  {metodoSeleccionado.requiereComprobante ? (
                    <>
                      <ul className="space-y-2">
                        {metodoSeleccionado.datos.map((dato) => (
                          <li
                            key={dato.etiqueta}
                            className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-white px-3 py-2.5"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-small text-muted-foreground">
                                {dato.etiqueta}
                              </p>
                              <p className="truncate font-medium text-brand-coffee">
                                {dato.valor}
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-9 shrink-0"
                              onClick={() =>
                                manejarCopiar(dato.valor, dato.etiqueta)
                              }
                              aria-label={`Copiar ${dato.etiqueta}`}
                            >
                              {copiado === dato.etiqueta ? (
                                <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                              ) : (
                                <Copy className="h-4 w-4" aria-hidden="true" />
                              )}
                              {copiado === dato.etiqueta ? "Copiado" : "Copiar"}
                            </Button>
                          </li>
                        ))}
                      </ul>

                      <IKContext
                        publicKey={process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY}
                        urlEndpoint={URL_ENDPOINT}
                        authenticationEndpoint="/api/imagekit-auth"
                      >
                        <div className="space-y-2">
                          <Label>Comprobante de pago *</Label>
                          {comprobanteUrl ? (
                            <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-white p-2">
                              <Image
                                src={comprobanteUrl}
                                alt="Vista previa del comprobante"
                                width={64}
                                height={64}
                                className="h-16 w-16 rounded-lg object-cover"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="flex items-center gap-1.5 text-base font-medium text-emerald-700">
                                  <Check className="h-4 w-4" aria-hidden="true" />
                                  Comprobante cargado
                                </p>
                                <button
                                  type="button"
                                  onClick={() => setComprobanteUrl("")}
                                  className="text-sm font-small text-destructive underline"
                                >
                                  Quitar y cargar otro
                                </button>
                              </div>
                            </div>
                          ) : (
                            <label
                              htmlFor="comprobante-pago"
                              className={cn(
                                "flex h-20 w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border bg-white text-muted-foreground transition-colors hover:border-brand-rose hover:text-brand-rose-deep",
                                subiendo && "pointer-events-none opacity-60"
                              )}
                            >
                              {subiendo ? (
                                <Loader2
                                  className="h-5 w-5 animate-spin"
                                  aria-hidden="true"
                                />
                              ) : (
                                <Upload className="h-5 w-5" aria-hidden="true" />
                              )}
                              <span className="text-sm font-medium">
                                {subiendo
                                  ? "Cargando comprobante..."
                                  : "Toca para cargar la imagen (JPG, PNG o WebP, máx. 5MB)"}
                              </span>
                            </label>
                          )}
                          {!comprobanteUrl && (
                            <IKUpload
                              id="comprobante-pago"
                              fileName={`comprobante-${Date.now()}`}
                              useUniqueFileName
                              folder="/comprobantes"
                              onUploadStart={() => setSubiendo(true)}
                              onSuccess={manejarExitoSubida}
                              onError={manejarErrorSubida}
                              className="hidden"
                              accept="image/jpeg,image/png,image/webp"
                              aria-label="Subir comprobante de pago"
                            />
                          )}
                        </div>
                      </IKContext>
                    </>
                  ) : (
                    <p className="rounded-xl bg-white px-4 py-3 text-base text-brand-coffee">
                      Paga en el local y se lo comunicas al personal de la
                      barra. ¡Nos vemos!
                    </p>
                  )}
                </div>
              )}
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-lg bg-destructive/10 px-3 py-2 text-sm font-small text-destructive"
              >
                {error}
              </p>
            )}

            <DrawerFooter className="px-0 pb-[env(safe-area-inset-bottom)]">
              {botonListoParaEnviar ? (
                <Button
                  type="submit"
                  className="h-14 w-full text-base"
                  disabled={enviando}
                >
                  {enviando ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
                  ) : (
                    <Send className="mr-2 h-5 w-5" aria-hidden="true" />
                  )}
                  Enviar pedido
                </Button>
              ) : metodoSeleccionado ? (
                <Button
                  type="button"
                  className="h-14 w-full text-base"
                  disabled
                >
                  <Upload className="mr-2 h-5 w-5" aria-hidden="true" />
                  Cargar comprobante
                </Button>
              ) : (
                <Button
                  type="button"
                  className="h-14 w-full text-base"
                  onClick={() => setPagoVisible(true)}
                  disabled={enviando || metodosActivos.length === 0}
                >
                  <Wallet className="mr-2 h-5 w-5" aria-hidden="true" />
                  Pagar
                </Button>
              )}
            </DrawerFooter>
          </form>
        )}
      </DrawerContent>
    </Drawer>
  );
}
