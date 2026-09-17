import { withAdminAuth } from '@/lib/api-response'
import type { NextRequest } from 'next/server'

// Temporary diagnostic route — throws deliberately so we can confirm
// SENTRY_DSN is actually wired up in production, without waiting for a
// real bug to happen. Admin-only so it can't be hit by anyone else.
// Delete this route once confirmed in Sentry.
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    throw new Error('Sentry test event — safe to ignore, confirms DSN wiring')
  })
}
