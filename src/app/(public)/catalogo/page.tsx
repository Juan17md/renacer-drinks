import type { Metadata } from "next";
import { CatalogoCliente } from "@/components/catalogo/CatalogoCliente";
import { obtenerProductos } from "@/services/products";
import { obtenerCategorias } from "@/services/categories";
import { obtenerTasaBCV } from "@/lib/bcv";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Menú | Renacer Drinks & Coffe",
  description:
    "Explora el menú de Renacer Drinks & Coffe: bebidas frías y calientes con precios en USD y Bs. según la tasa BCV. Pide desde tu celular en la barra.",
};

export default async function PaginaCatalogo() {
  const [productos, categorias, tasa] = await Promise.all([
    obtenerProductos(),
    obtenerCategorias(),
    obtenerTasaBCV(),
  ]);

  return (
    <CatalogoCliente
      productos={productos}
      categorias={categorias}
      tasaBCV={tasa.promedio}
      fechaActualizacion={tasa.fechaActualizacion}
    />
  );
}