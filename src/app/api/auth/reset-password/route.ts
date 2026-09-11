import { createServiceClient } from '@/lib/supabase/server'
import { badRequest, ok, serverError } from '@/lib/api-response'
import type { NextRequest } from 'next/server'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kursskifte.dk'

export async function POST(request: NextRequest) {
  let body: { email?: string }
  try { body = await request.json() } catch { return badRequest('Invalid JSON') }

  const email = body.email?.trim().toLowerCase()
  if (!email) return badRequest('E-mail mangler')

  const svc = createServiceClient()

  // Verify the email is registered
  const { data: users, error: listError } = await svc.auth.admin.listUsers({ perPage: 1000 })
  if (listError) return serverError(listError.message)

  const exists = users.users.some(u => u.email?.toLowerCase() === email)
  if (!exists) {
    return badRequest('Denne e-mail er ikke registreret i systemet.')
  }

  // Generate a recovery token (does not send email itself)
  const { data: linkData, error: linkError } = await svc.auth.admin.generateLink({
    type: 'recovery',
    email,
  })
  if (linkError || !linkData) return serverError(linkError?.message ?? 'Kunne ikke generere nulstillingslink')

  // Build a direct link to our callback route with the token_hash
  // This bypasses Supabase's email templates and redirect chain entirely
  const tokenHash = (linkData as any).properties?.hashed_token
  if (!tokenHash) return serverError('Kunne ikke generere nulstillingstoken')

  const resetUrl = `${SITE_URL}/auth/callback?token_hash=${tokenHash}&type=recovery`

  // Send via Resend API
  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) return serverError('E-mail service er ikke konfigureret (RESEND_API_KEY mangler)')

  const resendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
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
    const body = await resendRes.json().catch(() => ({}))
    return serverError((body as any)?.message ?? 'Kunne ikke sende e-mail')
  }

  return ok({ sent: true })
}
