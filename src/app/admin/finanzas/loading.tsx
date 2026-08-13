export default function CargandoFinanzas() {
  return (
    <div className="space-y-8" aria-busy="true">
      <div className="h-8 w-40 animate-pulse rounded-lg bg-brand-cream" />
      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((tarjeta) => (
          <div
            key={tarjeta}
            className="h-32 animate-pulse rounded-2xl bg-brand-cream"
          />
        ))}
      </div>
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="h-80 animate-pulse rounded-2xl bg-brand-cream" />
        <div className="h-80 animate-pulse rounded-2xl bg-brand-cream" />
      </div>
    </div>
  );
}
