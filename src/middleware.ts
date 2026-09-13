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
  '/kontakt',
  '/privatlivspolitik',
  // Token-authenticated pages the municipality's sagsbehandler reaches from
  // an email link, with no login of their own — access is enforced by
  // knowing the unguessable token in the URL, not by a session.
  '/municipality',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const { response, user } = await updateSession(request)

  // API routes enforce their own auth (session check, Bearer token for cron,
  // or are intentionally public) and must return a JSON 401 — never an HTML
  // redirect, which silently breaks fetch() callers and cron jobs alike.
  if (pathname.startsWith('/api/')) {
    return response
  }

  const isPublic =
    pathname === '/' ||
    PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))

  if (!isPublic && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
