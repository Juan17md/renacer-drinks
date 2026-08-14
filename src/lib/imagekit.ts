import ImageKit from "imagekit";

export const imagekit = new ImageKit({
  publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
  urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!,
});

export interface CredencialesSubida {
  signature: string;
  token: string;
  expire: number;
}

export async function autenticarImageKit(): Promise<CredencialesSubida> {
  const respuesta = await fetch("/api/imagekit-auth");

  if (!respuesta.ok) {
    throw new Error("No se pudo autenticar la subida de imágenes");
  }

  return respuesta.json();
}