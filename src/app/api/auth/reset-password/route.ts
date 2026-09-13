import { createServiceClient } from '@/lib/supabase/server'
import { badRequest, ok, serverError } from '@/lib/api-response'
import { rateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit'
import type { NextRequest } from 'next/server'

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kursskifte.dk').replace(/\/$/, '')

// Always returned for a well-formed request, whether or not the e-mail is
// registered — the endpoint must never let a caller distinguish the two.
// Rate limited per IP for the same reason: an unlimited public endpoint that
// only sometimes sends an e-mail is a ready-made enumeration/abuse oracle.
const GENERIC_RESPONSE = { sent: true }

export async function POST(request: NextRequest) {
  const { limited } = rateLimit(`reset-password:${getClientIp(request)}`, { windowMs: 15 * 60 * 1000, max: 5 })
  if (limited) return rateLimitResponse()

  let body: { email?: string }
  try { body = await request.json() } catch { return badRequest('Invalid JSON') }

  const email = body.email?.trim().toLowerCase()
  if (!email) return badRequest('E-mail mangler')

  if (!process.env.RESEND_API_KEY) {
    console.error('[reset-password] RESEND_API_KEY is not set')
    return serverError('E-mail service er ikke konfigureret. Kontakt support.')
  }

  const svc = createServiceClient()

  // Generate recovery token — fails if the user does not exist. That failure
  // must look identical to success from the caller's side, so it's logged
  // internally and answered with the same generic response, never surfaced.
  const { data: linkData, error: linkError } = await svc.auth.admin.generateLink({
    type: 'recovery',
    email,
  })

  if (linkError) {
    console.error('[reset-password] generateLink error (not shown to caller):', linkError)
    return ok(GENERIC_RESPONSE)
  }

  const tokenHash = (linkData as any)?.properties?.hashed_token
  if (!tokenHash) {
    console.error('[reset-password] No hashed_token in generateLink response', linkData)
    return serverError('Kunne ikke generere nulstillingstoken.')
  }

  const resetUrl = `${SITE_URL}/auth/callback?token_hash=${tokenHash}&type=recovery`

  const resendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Kursskifte <noreply@kursskifte.dk>',
      to: email,
      subject: 'Nulstil din adgangskode — Kursskifte',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#1A1F1C">
          <p style="font-size:22px;font-weight:700;margin:0 0 8px">Nulstil din adgangskode</p>
          <p style="color:#6B7569;margin:0 0 24px">Vi har modtaget en anmodning om at nulstille adgangskoden til din Kursskifte-konto.</p>
          <a href="${resetUrl}" style="display:inline-block;background:#1C3829;color:#F6F3EE;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:600;font-size:14px">
            Vælg ny adgangskode
          </a>
          <p style="color:#6B7569;font-size:13px;margin:24px 0 0">Linket udløber om 1 time. Hvis du ikke har anmodet om dette, kan du ignorere denne e-mail.</p>
          <hr style="border:none;border-top:1px solid #E0DAD0;margin:24px 0"/>
          <p style="color:#C8C0B0;font-size:11px;margin:0">Kursskifte · kursskifte.dk</p>
        </div>
      `,
    }),
  })

  if (!resendRes.ok) {
    const resendBody = await resendRes.json().catch(() => ({}))
    console.error('[reset-password] Resend error:', resendBody)
    return serverError(`Kunne ikke sende e-mail: ${(resendBody as any)?.message ?? resendRes.status}`)
  }

  return ok(GENERIC_RESPONSE)
}
