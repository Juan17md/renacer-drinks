export default function CargandoCatalogo() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-20 pt-6 sm:px-6" aria-busy="true">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-brand-cream" />
      <div className="mt-8 space-y-8">
        {[1, 2, 3].map((grupo) => (
          <section key={grupo}>
            <div className="h-6 w-32 animate-pulse rounded-md bg-brand-cream" />
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((tarjeta) => (
                <div
                  key={tarjeta}
                  className="h-44 animate-pulse rounded-2xl bg-brand-cream"
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
