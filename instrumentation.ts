export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const Sentry = await import("@sentry/nextjs");

    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      tracesSampleRate: 0.2,
      debug: false,
      environment: process.env.NEXT_PUBLIC_VERCEL_ENV || "development",
      enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
    });
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    const Sentry = await import("@sentry/nextjs");

    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      tracesSampleRate: 0.2,
      debug: false,
      environment: process.env.NEXT_PUBLIC_VERCEL_ENV || "development",
      enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
    });
  }
}

export async function onRequestError(
  err: unknown,
  request: { path: string; method: string; headers: Record<string, string | string[] | undefined> },
  context: { routerKind: string; routePath: string; routeType: string }
) {
  const Sentry = await import("@sentry/nextjs");
  Sentry.captureRequestError(err, request, context);
}