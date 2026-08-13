import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Renacer Drinks & Coffe",
    short_name: "Renacer",
    description:
      "Cafetería artesanal en Barquisimeto, Lara. Pide tu bebida favorita desde tu celular y retírala en la barra.",
    start_url: "/",
    display: "standalone",
    background_color: "#fff7f2",
    theme_color: "#e6396e",
    orientation: "portrait-primary",
    lang: "es",
    categories: ["food", "shopping", "lifestyle"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
