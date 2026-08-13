export default function CargandoInventario() {
  return (
    <div className="space-y-8" aria-busy="true">
      <div className="h-8 w-52 animate-pulse rounded-lg bg-brand-cream" />
      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((tarjeta) => (
          <div
            key={tarjeta}
            className="h-28 animate-pulse rounded-2xl bg-brand-cream"
          />
        ))}
      </div>
      <div className="h-96 animate-pulse rounded-2xl bg-brand-cream" />
    </div>
  );
}
