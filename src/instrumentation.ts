import * as Sentry from '@sentry/nextjs'

// Server/edge-side error reporting. No-ops entirely when SENTRY_DSN is unset
// (Sentry's documented behavior), so this is safe to ship before the team
// has a Sentry project — set SENTRY_DSN in the deployment env to activate it.
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs' || process.env.NEXT_RUNTIME === 'edge') {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: 0.1,
      environment: process.env.NODE_ENV,
    })
  }
}

export const onRequestError = Sentry.captureRequestError
