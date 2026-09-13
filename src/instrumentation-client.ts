import * as Sentry from '@sentry/nextjs'

// Client-side error reporting. NEXT_PUBLIC_ prefix required since this runs
// in the browser bundle. No-ops entirely when unset.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
})

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
