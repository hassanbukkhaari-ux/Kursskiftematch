import { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

interface Window {
  count: number
  resetAt: number
}

// In-memory store — works for single-instance deployments.
// For multi-instance production (Vercel serverless), replace with Upstash Redis.
const store = new Map<string, Window>()

export interface RateLimitConfig {
  windowMs: number
  max: number
}

export function rateLimit(
  identifier: string,
  config: RateLimitConfig
): { limited: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const existing = store.get(identifier)

  if (!existing || now > existing.resetAt) {
    const resetAt = now + config.windowMs
    store.set(identifier, { count: 1, resetAt })
    return { limited: false, remaining: config.max - 1, resetAt }
  }

  existing.count++
  const limited = existing.count > config.max
  const remaining = Math.max(0, config.max - existing.count)

  return { limited, remaining, resetAt: existing.resetAt }
}

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return 'unknown'
}

export function rateLimitResponse(): NextResponse {
  return NextResponse.json(
    { error: 'For mange forsøg — prøv igen om et øjeblik' },
    { status: 429 }
  )
}
