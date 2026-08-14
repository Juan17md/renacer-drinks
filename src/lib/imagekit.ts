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
