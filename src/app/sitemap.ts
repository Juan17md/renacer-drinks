import type { MetadataRoute } from "next";

const baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "https://renacer-drinks.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const fechaActualizacion = new Date();

  return [
    {
      url: baseUrl,
      lastModified: fechaActualizacion,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/catalogo`,
      lastModified: fechaActualizacion,
      changeFrequency: "weekly",
      priority: 0.9,
    },
  ];
}
