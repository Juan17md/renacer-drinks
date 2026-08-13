import { ProductCard } from "@/components/catalogo/ProductCard";
import type { ProductoPublico } from "@/types/product";

interface ProductGridProps {
  productos: ProductoPublico[];
  tasaBCV: number;
}

export function ProductGrid({ productos, tasaBCV }: ProductGridProps) {
  if (productos.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-white px-6 py-16 text-center">
        <p className="text-lg font-medium text-brand-coffee">
          No encontramos productos
        </p>
        <p className="mt-2 text-sm font-small text-muted-foreground">
          Prueba con otra búsqueda o categoría.
        </p>
      </div>
    );
  }

  return (
    <div
      className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      data-testid="product-grid"
    >
      {productos.map((producto) => (
        <ProductCard key={producto.id} producto={producto} tasaBCV={tasaBCV} />
      ))}
    </div>
  );
}