import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const PUBLIC_PATHS = [
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/set-password',
  '/auth/callback',
  '/indsigt',
  '/kommuner',
  '/kontaktpersoner',
  '/foredrag',
  '/metode',
  '/om-kursskifte',
  '/vision',
  '/kontakt',
  '/privatlivspolitik',
  // Token-authenticated pages the municipality's sagsbehandler reaches from
  // an email link, with no login of their own — access is enforced by
  // knowing the unguessable token in the URL, not by a session.
  '/municipality',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // API routes enforce their own auth (session check, Bearer token for cron,
  // or are intentionally public) and must return a JSON 401 — never an HTML
  // redirect, which silently breaks fetch() callers and cron jobs alike. The
  // user/response computed by updateSession() below was never used on this
  // branch — every /api/ request was paying for a full Supabase Auth
  // round-trip (auth.getUser()) purely to throw the result away, doubling
  // up with the auth check each route handler already does itself. Skipping
  // it here halves the auth-service load from API traffic with no change in
  // behavior.
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  const isPublic =
    pathname === '/' ||
    PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))

  // Public pages don't gate on `user` either — skip the Supabase Auth
  // round-trip for them too, rather than paying for a getUser() call whose
  // result only matters on protected routes.
  if (isPublic) {
    return NextResponse.next()
  }

  const { response, user } = await updateSession(request)

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
