export default function CargandoDashboard() {
  return (
    <div className="space-y-8" aria-busy="true">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-brand-cream" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="h-40 animate-pulse rounded-2xl bg-brand-cream" />
        <div className="h-40 animate-pulse rounded-2xl bg-brand-cream" />
      </div>
    </div>
  );
}
