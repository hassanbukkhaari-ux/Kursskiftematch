import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs/config'

const securityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  {
    // Report-only first: collect violations before enforcing.
    key: 'Content-Security-Policy-Report-Only',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https://*.supabase.co",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
]

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }]
  },
  // Stale URLs still indexed by Google from a previous (non-Next.js, likely
  // ASP.NET — hence the PascalCase path) version of kursskifte.dk. A 404
  // would eventually get them dropped from search results too, but a
  // permanent redirect fixes the broken link immediately for anyone who
  // still has it bookmarked or finds it via search, and gets Google to
  // update its index toward the real page faster than a bare 404 would.
  async redirects() {
    return [
      { source: '/home', destination: '/', permanent: true },
      { source: '/Auth/Login', destination: '/login', permanent: true },
      { source: '/auth/login', destination: '/login', permanent: true },
      // bromaking.html was the old site's professional-recruitment page;
      // /kontaktpersoner is its direct modern equivalent (see
      // ARCHITECTURE_SEPARATION_PLAN.md). It was previously unmatched by
      // any route, so middleware.ts's auth guard bounced it to /login with
      // a temporary redirect — a stale, unauthenticated-feeling dead end
      // for anyone still linking to it.
      { source: '/Bromaking', destination: '/kontaktpersoner', permanent: true },
      { source: '/bromaking', destination: '/kontaktpersoner', permanent: true },
    ]
  },
}

// Wraps the config to upload source maps to Sentry on build — silently
// skipped (no build failure) when SENTRY_AUTH_TOKEN/org/project aren't
// configured, which is the default until the team sets up a Sentry project.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
})
