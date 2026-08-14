import { describe, it, expect, vi, afterEach } from "vitest";
import { autenticarImageKit } from "@/lib/imagekit-auth";

describe("autenticarImageKit", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("devuelve las credenciales de autenticación de ImageKit", async () => {
    const credenciales = {
      signature: "firma-de-prueba",
      token: "token-de-prueba",
      expire: 1723600000,
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(credenciales),
      })
    );

    const resultado = await autenticarImageKit();

    expect(fetch).toHaveBeenCalledWith("/api/imagekit-auth");
    expect(resultado).toEqual(credenciales);
  });

  it("lanza un error cuando la autenticación falla", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false })
    );

    await expect(autenticarImageKit()).rejects.toThrow(
      "No se pudo autenticar la subida de imágenes"
    );
  });
});
